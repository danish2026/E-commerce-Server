import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { OrderItemFilterDto } from './dto/order-item-filter.dto';
import { PaginatedOrderItemResponse } from './dto/paginated-order-item-response.dto';
import { PaginatedGroupedOrderResponse, GroupedOrder } from './dto/grouped-order.dto';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(createOrderItemDto: CreateOrderItemDto) {
    const { productId, quantity, discount = 0 } = createOrderItemDto;

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Validate stock availability
    const currentStock = Number(product.stock) || 0;
    const requestedQuantity = Number(quantity) || 0;
    
    if (requestedQuantity > currentStock) {
      throw new BadRequestException(
        `Insufficient stock for product "${product.name}". Available: ${currentStock} item(s), Requested: ${requestedQuantity} item(s).`
      );
    }

    const unitPrice = Number(product.sellingPrice);
    const gstPercentage = Number(product.gstPercentage);
    const baseSubtotal = unitPrice * quantity;
    const itemDiscount = Math.max(0, Number(discount) || 0);
    const discountedSubtotal = Math.max(0, baseSubtotal - itemDiscount);
    const gstAmount = (discountedSubtotal * gstPercentage) / 100;
    const totalAmount = discountedSubtotal + gstAmount;

    const orderItem = this.orderItemRepository.create({
      productId,
      quantity,
      unitPrice,
      gstPercentage,
      gstAmount,
      totalAmount,
      discount: itemDiscount,
    });

    const saved = await this.orderItemRepository.save(orderItem);
    return saved;
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    const { items, customerName, customerPhone, discounts = [], paymentType } = createOrderDto;
    const createdItems: OrderItem[] = [];
    let grandTotal = 0;

    // Calculate total discount from all discount entries
    const totalOrderDiscount = discounts.reduce((sum, discount) => sum + Math.max(0, Number(discount.amount) || 0), 0);

    // First pass: validate all products exist and check stock availability
    const baseSubtotals: number[] = [];
    const productStockMap = new Map<string, { stock: number; requested: number; name: string }>();
    
    for (const itemDto of items) {
      const { productId, quantity } = itemDto;
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Track requested quantity per product for validation
      const requestedQuantity = Number(quantity) || 0;
      if (productStockMap.has(productId)) {
        const existing = productStockMap.get(productId)!;
        existing.requested += requestedQuantity;
      } else {
        productStockMap.set(productId, {
          stock: Number(product.stock) || 0,
          requested: requestedQuantity,
          name: product.name,
        });
      }

      const unitPrice = Number(product.sellingPrice);
      const baseSubtotal = unitPrice * quantity;
      baseSubtotals.push(baseSubtotal);
    }

    // Validate stock availability for all products
    for (const [productId, stockInfo] of productStockMap.entries()) {
      if (stockInfo.requested > stockInfo.stock) {
        throw new BadRequestException(
          `Insufficient stock for product "${stockInfo.name}". Available: ${stockInfo.stock} item(s), Requested: ${stockInfo.requested} item(s).`
        );
      }
    }

    // Calculate total base subtotal for proportional discount distribution
    const totalBaseSubtotal = baseSubtotals.reduce((sum, amount) => sum + amount, 0);

    // Second pass: create order items with item discounts and proportional order-level discounts
    for (let i = 0; i < items.length; i++) {
      const itemDto = items[i];
      const { productId, quantity, discount: itemDiscount = 0 } = itemDto;
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const unitPrice = Number(product.sellingPrice);
      const gstPercentage = Number(product.gstPercentage);
      const baseSubtotal = baseSubtotals[i];
      const itemDiscountValue = Math.max(0, Number(itemDiscount) || 0);
      
      // Calculate proportional order-level discount for this item based on base subtotal
      const itemProportionalDiscount = totalBaseSubtotal > 0 
        ? (baseSubtotal / totalBaseSubtotal) * totalOrderDiscount 
        : 0;
      
      // Apply both item discount and proportional order discount
      const totalDiscountForItem = itemDiscountValue + itemProportionalDiscount;
      const discountedSubtotal = Math.max(0, baseSubtotal - totalDiscountForItem);
      const gstAmount = (discountedSubtotal * gstPercentage) / 100;
      const totalAmount = discountedSubtotal + gstAmount;

      const orderItem = this.orderItemRepository.create({
        productId,
        quantity,
        unitPrice,
        gstPercentage,
        gstAmount,
        totalAmount,
        customerName: customerName ?? null,
        customerPhone: customerPhone ?? null,
        discount: totalDiscountForItem,
        paymentType: paymentType ?? null,
      });

      const savedItem = await this.orderItemRepository.save(orderItem);
      createdItems.push(savedItem);
      grandTotal += totalAmount;

      // Reduce product stock after successfully creating order item
      const orderQuantity = Number(quantity) || 0;
      product.stock = Number(product.stock) - orderQuantity;
      await this.productRepository.save(product);
    }

    return {
      items: createdItems,
      grandTotal,
    };
  }

  private buildQuery(filter: OrderItemFilterDto) {
    const { search, fromDate, toDate, minSubtotal, maxSubtotal } = filter;
    const query = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoinAndSelect('orderItem.product', 'product');

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(CAST(orderItem.id AS VARCHAR)) LIKE :search OR (orderItem.customerName IS NOT NULL AND LOWER(orderItem.customerName) LIKE :search) OR (orderItem.customerPhone IS NOT NULL AND LOWER(orderItem.customerPhone) LIKE :search))',
        { search: loweredSearch },
      );
    }

    if (fromDate) {
      query.andWhere('orderItem.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      // Add time to include the entire day
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      query.andWhere('orderItem.createdAt <= :toDate', { toDate: toDateEnd });
    }

    if (minSubtotal !== undefined) {
      query.andWhere('orderItem.totalAmount >= :minSubtotal', { minSubtotal });
    }

    if (maxSubtotal !== undefined) {
      query.andWhere('orderItem.totalAmount <= :maxSubtotal', { maxSubtotal });
    }

    return query;
  }

  async findAll(filter: OrderItemFilterDto = {} as OrderItemFilterDto): Promise<PaginatedOrderItemResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query for count
    const countQuery = this.buildQuery(filter);
    const total = await countQuery.getCount();

    // Build query for data with pagination
    const dataQuery = this.buildQuery(filter)
      .orderBy('orderItem.createdAt', 'DESC');
    
    const skip = (page - 1) * limit;
    const data = await dataQuery.skip(skip).take(limit).getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  findOne(id: string) {
    return this.orderItemRepository.findOne({ where: { id } });
  }

  async update(id: string, updateOrderItemDto: UpdateOrderItemDto) {
    const orderItem = await this.orderItemRepository.findOne({ where: { id } });
    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }

    if (updateOrderItemDto.quantity) {
      orderItem.quantity = updateOrderItemDto.quantity;
      // Recalculate totals
      const unitPrice = Number(orderItem.unitPrice);
      const gstPercentage = Number(orderItem.gstPercentage);
      orderItem.gstAmount = (unitPrice * orderItem.quantity * gstPercentage) / 100;
      orderItem.totalAmount = (unitPrice * orderItem.quantity) + orderItem.gstAmount;
    }

    if (updateOrderItemDto.productId) {
      const product = await this.productRepository.findOne({ where: { id: updateOrderItemDto.productId } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${updateOrderItemDto.productId} not found`);
      }
      orderItem.productId = updateOrderItemDto.productId;
      orderItem.unitPrice = Number(product.sellingPrice);
      orderItem.gstPercentage = Number(product.gstPercentage);

      // Recalculate with new product details
      const unitPrice = Number(orderItem.unitPrice);
      const gstPercentage = Number(orderItem.gstPercentage);
      orderItem.gstAmount = (unitPrice * orderItem.quantity * gstPercentage) / 100;
      orderItem.totalAmount = (unitPrice * orderItem.quantity) + orderItem.gstAmount;
    }

    // Update optional customer/payment fields if provided
    if (typeof updateOrderItemDto.customerName !== 'undefined') {
      orderItem.customerName = updateOrderItemDto.customerName as any;
    }

    if (typeof updateOrderItemDto.customerPhone !== 'undefined') {
      orderItem.customerPhone = updateOrderItemDto.customerPhone as any;
    }

    if (typeof updateOrderItemDto.discount !== 'undefined') {
      orderItem.discount = updateOrderItemDto.discount as any;
    }

    if (typeof updateOrderItemDto.paymentType !== 'undefined') {
      orderItem.paymentType = updateOrderItemDto.paymentType as any;
    }

    await this.orderItemRepository.save(orderItem);
    return await this.orderItemRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    const result = await this.orderItemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }
    return { message: 'Order item deleted successfully' };
  }

  /**
   * Delete all items in an order group
   */
  async removeOrderGroup(
    customerName: string | null,
    customerPhone: string | null,
    paymentType: string | null,
    createdAt: string,
  ): Promise<{ message: string; deletedCount: number }> {
    const items = await this.findItemsByOrderGroup(
      customerName,
      customerPhone,
      paymentType,
      createdAt,
    );

    if (items.length === 0) {
      throw new NotFoundException('No order items found for this order group');
    }

    const itemIds = items.map((item) => item.id);
    const result = await this.orderItemRepository.delete(itemIds);

    return {
      message: 'Order group deleted successfully',
      deletedCount: result.affected || 0,
    };
  }

  /**
   * Groups order items by order (same customerName, customerPhone, paymentType, and createdAt within 5 seconds)
   */
  async findAllGrouped(filter: OrderItemFilterDto = {} as OrderItemFilterDto): Promise<PaginatedGroupedOrderResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query
    const baseQuery = this.buildQuery(filter);
    
    // Get all matching items ordered by createdAt DESC
    const allItems = await baseQuery
      .orderBy('orderItem.createdAt', 'DESC')
      .getMany();

    // Group items by order key (customerName, customerPhone, paymentType, createdAt within 5 seconds)
    const orderGroups = new Map<string, OrderItem[]>();
    
    for (const item of allItems) {
      // Create a key based on customer info, payment type, and time window (5 seconds)
      const createdAt = new Date(item.createdAt);
      const timeWindow = Math.floor(createdAt.getTime() / 5000) * 5000; // Round to nearest 5 seconds
      
      const orderKey = JSON.stringify({
        customerName: item.customerName || null,
        customerPhone: item.customerPhone || null,
        paymentType: item.paymentType || null,
        timeWindow: timeWindow,
      });

      if (!orderGroups.has(orderKey)) {
        orderGroups.set(orderKey, []);
      }
      orderGroups.get(orderKey)!.push(item);
    }

    // Convert groups to GroupedOrder objects
    const groupedOrders: GroupedOrder[] = Array.from(orderGroups.values()).map((items) => {
      const firstItem = items[0];
      const subtotal = items.reduce((sum, item) => {
        const itemSubtotal = Number(item.totalAmount || 0) - Number(item.gstAmount || 0);
        return sum + itemSubtotal;
      }, 0);
      const gstTotal = items.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0);
      const discount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
      const grandTotal = items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

      const orderId = firstItem.id;
      const orderNumber = orderId.length >= 8 
        ? orderId.substring(0, 8).toUpperCase().replace(/-/g, '')
        : orderId.toUpperCase().replace(/-/g, '');

      return {
        id: orderId,
        orderNumber,
        customerName: firstItem.customerName,
        customerPhone: firstItem.customerPhone,
        paymentType: firstItem.paymentType,
        subtotal,
        gstTotal,
        discount,
        grandTotal,
        itemCount: items.length,
        createdAt: firstItem.createdAt,
      };
    });

    // Sort grouped orders by createdAt DESC
    groupedOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const total = groupedOrders.length;
    const skip = (page - 1) * limit;
    const paginatedOrders = groupedOrders.slice(skip, skip + limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: paginatedOrders,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Get all items for a specific order group
   */
  async findItemsByOrderGroup(
    customerName: string | null,
    customerPhone: string | null,
    paymentType: string | null,
    createdAt: string,
  ): Promise<OrderItem[]> {
    try {
      const createdAtDate = new Date(createdAt);
      
      // Use a wider time window (10 seconds) to account for any timing differences
      const timeWindowStart = new Date(Math.floor(createdAtDate.getTime() / 10000) * 10000 - 5000); // 5 seconds before
      const timeWindowEnd = new Date(Math.floor(createdAtDate.getTime() / 10000) * 10000 + 15000); // 15 seconds after

      const query = this.orderItemRepository
        .createQueryBuilder('orderItem')
        .leftJoinAndSelect('orderItem.product', 'product')
        .where('orderItem.createdAt >= :timeWindowStart', { timeWindowStart })
        .andWhere('orderItem.createdAt <= :timeWindowEnd', { timeWindowEnd })
        .orderBy('orderItem.createdAt', 'DESC');

      if (customerName === null) {
        query.andWhere('(orderItem.customerName IS NULL OR orderItem.customerName = :emptyString)', { emptyString: '' });
      } else {
        query.andWhere('orderItem.customerName = :customerName', { customerName });
      }

      if (customerPhone === null) {
        query.andWhere('(orderItem.customerPhone IS NULL OR orderItem.customerPhone = :emptyString)', { emptyString: '' });
      } else {
        query.andWhere('orderItem.customerPhone = :customerPhone', { customerPhone });
      }

      if (paymentType === null) {
        query.andWhere('orderItem.paymentType IS NULL');
      } else {
        query.andWhere('orderItem.paymentType = :paymentType', { paymentType });
      }

      const items = await query.getMany();
      
      // If no items found with exact match, try a broader search by time only
      if (items.length === 0) {
        const fallbackQuery = this.orderItemRepository
          .createQueryBuilder('orderItem')
          .leftJoinAndSelect('orderItem.product', 'product')
          .where('orderItem.createdAt >= :timeWindowStart', { timeWindowStart })
          .andWhere('orderItem.createdAt <= :timeWindowEnd', { timeWindowEnd })
          .orderBy('orderItem.createdAt', 'DESC')
          .limit(50); // Limit to prevent too many results
        
        return await fallbackQuery.getMany();
      }

      return items;
    } catch (error) {
      console.error('Error in findItemsByOrderGroup:', error);
      throw error;
    }
  }
}
