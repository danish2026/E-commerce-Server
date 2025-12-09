import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { OrderItemFilterDto } from './dto/order-item-filter.dto';
import { PaginatedOrderItemResponse } from './dto/paginated-order-item-response.dto';

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

    // First pass: calculate base subtotals (before discounts) for proportional distribution
    const baseSubtotals: number[] = [];
    for (const itemDto of items) {
      const { productId, quantity } = itemDto;
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const unitPrice = Number(product.sellingPrice);
      const baseSubtotal = unitPrice * quantity;
      baseSubtotals.push(baseSubtotal);
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
}
