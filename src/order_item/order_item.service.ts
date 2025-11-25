import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order_item.dto';
import { UpdateOrderItemDto } from './dto/update-order_item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { PaginatedOrderResponse } from './dto/paginated-order-response.dto';
import { OrderItem } from './order_item.entity';
import { Order } from './order.entity';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/product.entity';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productsService: ProductsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new order with order items
   * This method handles all calculations including:
   * - Quantity * unit price per item
   * - GST calculation per item
   * - Subtotal, discount, and grand total
   */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate all products exist and have sufficient stock
    const productsMap = new Map<string, Product>();
    
    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      productsMap.set(item.productId, product);
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order entity
      const order = this.orderRepository.create({
        orderNumber,
        customerName: createOrderDto.customerName || null,
        customerPhone: createOrderDto.customerPhone || null,
        discount: createOrderDto.discount || 0,
        paymentType: createOrderDto.paymentType,
        subtotal: 0,
        gstTotal: 0,
        grandTotal: 0,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items and calculate totals
      let subtotal = 0;
      let gstTotal = 0;

      const orderItems: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = productsMap.get(itemDto.productId)!;

        // Validate stock availability (within transaction)
        const productInTx = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
        });

        if (!productInTx) {
          throw new NotFoundException(`Product with ID ${itemDto.productId} not found`);
        }

        if (productInTx.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Only ${productInTx.stock} item(s) available.`,
          );
        }

        // Validate expiry date
        if (productInTx.expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiry = new Date(productInTx.expiryDate);
          expiry.setHours(0, 0, 0, 0);
          const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining < 0) {
            throw new BadRequestException(
              `Product ${product.name} has expired on ${productInTx.expiryDate}. Cannot create order.`,
            );
          }
          if (daysRemaining <= 7) {
            throw new BadRequestException(
              `Product ${product.name} is expiring soon. Only ${daysRemaining} day(s) remaining. Cannot create order.`,
            );
          }
        }

        // Reduce stock within transaction
        productInTx.stock -= itemDto.quantity;
        await queryRunner.manager.save(Product, productInTx);

        // Calculate unit price (using selling price from product)
        const unitPrice = product.sellingPrice;

        // Calculate item total (quantity * unit price)
        const itemSubtotal = itemDto.quantity * unitPrice;

        // Calculate GST amount for this item
        const gstAmount = (itemSubtotal * product.gstPercentage) / 100;

        // Calculate total price including GST for this item
        const totalPrice = itemSubtotal + gstAmount;

        // Create order item
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice: unitPrice,
          gstPercentage: product.gstPercentage,
          gstAmount: Math.round(gstAmount * 100) / 100,
          totalPrice: Math.round(totalPrice * 100) / 100,
        });

        const savedOrderItem = await queryRunner.manager.save(OrderItem, orderItem);
        orderItems.push(savedOrderItem);

        // Accumulate totals
        subtotal += itemSubtotal;
        gstTotal += gstAmount;
      }

      // Apply discount
      const discountAmount = createOrderDto.discount || 0;
      const grandTotal = subtotal + gstTotal - discountAmount;

      // Update order with calculated totals
      savedOrder.subtotal = Math.round(subtotal * 100) / 100;
      savedOrder.gstTotal = Math.round(gstTotal * 100) / 100;
      savedOrder.discount = discountAmount;
      savedOrder.grandTotal = Math.round(grandTotal * 100) / 100;

      const finalOrder = await queryRunner.manager.save(Order, savedOrder);

      await queryRunner.commitTransaction();

      // Fetch order with relations for response
      return this.findOne(finalOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Build query with filters
   */
  private buildQuery(filter: OrderFilterDto) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.category', 'category');

    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      query.andWhere(
        '(LOWER(order.orderNumber) LIKE :search OR ' +
          'LOWER(order.customerName) LIKE :search OR ' +
          'LOWER(order.customerPhone) LIKE :search)',
        { search: `%${searchLower}%` },
      );
    }

    // Date range filters
    if (filter.fromDate) {
      query.andWhere('order.createdAt >= :fromDate', { fromDate: filter.fromDate });
    }
    if (filter.toDate) {
      query.andWhere('order.createdAt <= :toDate', { toDate: filter.toDate });
    }

    // Payment type filter
    if (filter.paymentType) {
      query.andWhere('order.paymentType = :paymentType', { paymentType: filter.paymentType });
    }

    return query;
  }

  /**
   * Find all orders with pagination
   */
  async findAll(filter: OrderFilterDto = {} as OrderFilterDto): Promise<PaginatedOrderResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query for count
    const countQuery = this.buildQuery(filter);
    const total = await countQuery.getCount();

    // Build query for data with pagination
    const dataQuery = this.buildQuery(filter)
      .orderBy('order.createdAt', 'DESC');
    
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

  /**
   * Find one order by ID with all relations
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems', 'orderItems.product', 'orderItems.product.category'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Update an entire order
   */
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update basic order fields if provided
      if (updateOrderDto.customerName !== undefined) {
        order.customerName = updateOrderDto.customerName;
      }
      if (updateOrderDto.customerPhone !== undefined) {
        order.customerPhone = updateOrderDto.customerPhone;
      }
      if (updateOrderDto.discount !== undefined) {
        order.discount = updateOrderDto.discount;
      }
      if (updateOrderDto.paymentType !== undefined) {
        order.paymentType = updateOrderDto.paymentType;
      }

      // If items are being updated, replace all order items
      if (updateOrderDto.items && updateOrderDto.items.length > 0) {
        // Validate all products exist and have sufficient stock
        const productsMap = new Map<string, Product>();
        
        for (const item of updateOrderDto.items) {
          const product = await this.productsService.findOne(item.productId);
          productsMap.set(item.productId, product);
        }

        // Return stock for existing items
        for (const existingItem of order.orderItems) {
          const productInTx = await queryRunner.manager.findOne(Product, {
            where: { id: existingItem.productId },
          });
          if (productInTx) {
            productInTx.stock += existingItem.quantity;
            await queryRunner.manager.save(Product, productInTx);
          }
        }

        // Delete existing order items
        await queryRunner.manager.remove(OrderItem, order.orderItems);

        // Create new order items
        let subtotal = 0;
        let gstTotal = 0;
        const orderItems: OrderItem[] = [];

        for (const itemDto of updateOrderDto.items) {
          const product = productsMap.get(itemDto.productId)!;

          // Validate stock availability (within transaction)
          const productInTx = await queryRunner.manager.findOne(Product, {
            where: { id: itemDto.productId },
          });

          if (!productInTx) {
            throw new NotFoundException(`Product with ID ${itemDto.productId} not found`);
          }

          if (productInTx.stock < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}. Only ${productInTx.stock} item(s) available.`,
            );
          }

          // Validate expiry date
          if (productInTx.expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(productInTx.expiryDate);
            expiry.setHours(0, 0, 0, 0);
            const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining < 0) {
              throw new BadRequestException(
                `Product ${product.name} has expired on ${productInTx.expiryDate}. Cannot update order.`,
              );
            }
            if (daysRemaining <= 7) {
              throw new BadRequestException(
                `Product ${product.name} is expiring soon. Only ${daysRemaining} day(s) remaining. Cannot update order.`,
              );
            }
          }

          // Reduce stock within transaction
          productInTx.stock -= itemDto.quantity;
          await queryRunner.manager.save(Product, productInTx);

          // Calculate unit price (using selling price from product)
          const unitPrice = product.sellingPrice;

          // Calculate item total (quantity * unit price)
          const itemSubtotal = itemDto.quantity * unitPrice;

          // Calculate GST amount for this item
          const gstAmount = (itemSubtotal * product.gstPercentage) / 100;

          // Calculate total price including GST for this item
          const totalPrice = itemSubtotal + gstAmount;

          // Create order item
          const orderItem = this.orderItemRepository.create({
            orderId: order.id,
            productId: product.id,
            quantity: itemDto.quantity,
            unitPrice: unitPrice,
            gstPercentage: product.gstPercentage,
            gstAmount: Math.round(gstAmount * 100) / 100,
            totalPrice: Math.round(totalPrice * 100) / 100,
          });

          const savedOrderItem = await queryRunner.manager.save(OrderItem, orderItem);
          orderItems.push(savedOrderItem);

          // Accumulate totals
          subtotal += itemSubtotal;
          gstTotal += gstAmount;
        }

        // Update order totals
        const discountAmount = order.discount || 0;
        const grandTotal = subtotal + gstTotal - discountAmount;

        order.subtotal = Math.round(subtotal * 100) / 100;
        order.gstTotal = Math.round(gstTotal * 100) / 100;
        order.grandTotal = Math.round(grandTotal * 100) / 100;
      } else {
        // If items are not being updated, just recalculate totals with existing items
        const discountAmount = order.discount || 0;
        const grandTotal = Number(order.subtotal) + Number(order.gstTotal) - discountAmount;
        order.grandTotal = Math.round(grandTotal * 100) / 100;
      }

      const finalOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();

      // Fetch order with relations for response
      return this.findOne(finalOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find order item by ID
   */
  async findOneItem(id: string): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['product', 'product.category', 'order'],
    });

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }

    return orderItem;
  }

  /**
   * Find all order items
   */
  async findAllItems(): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      relations: ['product', 'product.category', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update order item
   */
  async updateItem(id: string, updateOrderItemDto: UpdateOrderItemDto): Promise<OrderItem> {
    const orderItem = await this.findOneItem(id);

    // If quantity is being updated, we need to recalculate totals
    if (updateOrderItemDto.quantity !== undefined) {
      const product = await this.productsService.findOne(orderItem.productId);
      
      // Calculate differences
      const quantityDiff = updateOrderItemDto.quantity - orderItem.quantity;
      
      if (quantityDiff > 0) {
        // Increasing quantity - reduce stock
        await this.productsService.reduceStock(orderItem.productId, quantityDiff);
      } else if (quantityDiff < 0) {
        // Decreasing quantity - increase stock
        await this.productsService.increaseStock(orderItem.productId, Math.abs(quantityDiff));
      }

      // Recalculate item totals
      const itemSubtotal = updateOrderItemDto.quantity * product.sellingPrice;
      const gstAmount = (itemSubtotal * product.gstPercentage) / 100;
      const totalPrice = itemSubtotal + gstAmount;

      orderItem.quantity = updateOrderItemDto.quantity;
      orderItem.unitPrice = product.sellingPrice;
      orderItem.gstPercentage = product.gstPercentage;
      orderItem.gstAmount = Math.round(gstAmount * 100) / 100;
      orderItem.totalPrice = Math.round(totalPrice * 100) / 100;

      // Update order totals
      await this.recalculateOrderTotals(orderItem.orderId);

      return this.orderItemRepository.save(orderItem);
    }

    Object.assign(orderItem, updateOrderItemDto);
    return this.orderItemRepository.save(orderItem);
  }

  /**
   * Recalculate order totals after item changes
   */
  private async recalculateOrderTotals(orderId: string): Promise<void> {
    const order = await this.findOne(orderId);
    
    let subtotal = 0;
    let gstTotal = 0;

    for (const item of order.orderItems) {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      gstTotal += item.gstAmount;
    }

    const discountAmount = order.discount || 0;
    const grandTotal = subtotal + gstTotal - discountAmount;

    order.subtotal = Math.round(subtotal * 100) / 100;
    order.gstTotal = Math.round(gstTotal * 100) / 100;
    order.grandTotal = Math.round(grandTotal * 100) / 100;

    await this.orderRepository.save(order);
  }

  /**
   * Remove order item
   */
  async removeItem(id: string): Promise<void> {
    const orderItem = await this.findOneItem(id);
    const orderId = orderItem.orderId;

    // Return stock
    await this.productsService.increaseStock(orderItem.productId, orderItem.quantity);

    // Remove item
    await this.orderItemRepository.remove(orderItem);

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);
  }

  /**
   * Remove entire order
   */
  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    // Return all stock for each item
    for (const item of order.orderItems) {
      await this.productsService.increaseStock(item.productId, item.quantity);
    }

    await this.orderRepository.remove(order);
  }
}
