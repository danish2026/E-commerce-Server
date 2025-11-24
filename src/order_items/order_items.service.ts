import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateOrderDto, OrderItemInputDto } from './dto/create-order_item.dto';
import { UpdateOrderDto } from './dto/update-order_item.dto';
import { Order } from './order.entity';
import { OrderItem } from './order_item.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    // Get the latest order by creation date
    const orders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      select: ['orderNumber'],
      take: 1,
    });
    const latestOrder = orders.length > 0 ? orders[0] : null;

    let lastSequence = 0;
    if (latestOrder?.orderNumber) {
      const match = latestOrder.orderNumber.match(/^INV-(\d+)$/);
      if (match && match[1]) {
        lastSequence = parseInt(match[1], 10);
      }
    }

    const nextSequence = lastSequence + 1;
    return `INV-${nextSequence.toString().padStart(4, '0')}`;
  }

  private calculateGrandTotal(subtotal: number, gstTotal: number, discount = 0): number {
    const nextTotal = subtotal + gstTotal - discount;
    return Number(nextTotal.toFixed(2));
  }

  private round2(value: number): number {
    return Number(value.toFixed(2));
  }

  private async buildOrderItems(
    items: OrderItemInputDto[],
  ): Promise<{ orderItems: OrderItem[]; subtotal: number; gstTotal: number }> {
    if (!items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['category'],
    });
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((product) => product.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
    }
    const productMap = new Map(products.map((product) => [product.id, product]));

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }
      const quantity = this.round2(Number(item.quantity));
      const unitPrice = this.round2(Number(product.sellingPrice));
      const gstPercentage = this.round2(Number(product.gstPercentage));
      const totalPrice = this.round2(quantity * unitPrice);
      const gstAmount = this.round2((totalPrice * gstPercentage) / 100);

      const orderItem = new OrderItem();
      orderItem.productId = product.id;
      orderItem.product = product;
      orderItem.quantity = quantity;
      orderItem.unitPrice = unitPrice;
      orderItem.gstPercentage = gstPercentage;
      orderItem.totalPrice = totalPrice;
      orderItem.gstAmount = gstAmount;
      return orderItem;
    });

    const subtotal = this.round2(
      orderItems.reduce((sum, current) => sum + Number(current.totalPrice), 0),
    );
    const gstTotal = this.round2(
      orderItems.reduce((sum, current) => sum + Number(current.gstAmount), 0),
    );

    return { orderItems, subtotal, gstTotal };
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const orderNumber = await this.generateOrderNumber();
        const { orderItems, subtotal, gstTotal } = await this.buildOrderItems(createOrderDto.items);
        const discount = createOrderDto.discount ?? 0;
        const grandTotal = this.calculateGrandTotal(subtotal, gstTotal, discount);

        const order = this.orderRepository.create({
          customerName: createOrderDto.customerName ?? null,
          customerPhone: createOrderDto.customerPhone ?? null,
          paymentType: createOrderDto.paymentType,
          discount,
          subtotal,
          gstTotal,
          grandTotal,
          orderNumber,
        });

        const savedOrder = await this.orderRepository.save(order);

        orderItems.forEach((item) => {
          item.order = savedOrder;
          item.orderId = savedOrder.id;
        });

        await this.orderItemRepository.save(orderItems);

        return this.findOne(savedOrder.id);
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }

        if (
          error.message &&
          error.message.includes('duplicate key value violates unique constraint') &&
          error.message.includes('order_number')
        ) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new BadRequestException(
              'Failed to generate unique order number. Please try again.',
            );
          }
          // Wait a bit before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 100 * retryCount));
          continue;
        }

        throw new BadRequestException(
          `Failed to create order: ${error.message || 'Unknown error'}`,
        );
      }
    }

    throw new BadRequestException('Failed to create order after multiple attempts');
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['orderItems', 'orderItems.product', 'orderItems.product.category'],
    });
  }

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

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.items) {
      // Delete existing order items
      if (order.orderItems && order.orderItems.length > 0) {
        await this.orderItemRepository.remove(order.orderItems);
      }

      const { orderItems, subtotal, gstTotal } = await this.buildOrderItems(updateOrderDto.items);
      // Set order reference on each order item
      orderItems.forEach((item) => {
        item.order = order;
        item.orderId = order.id;
      });
      
      // Save new order items
      await this.orderItemRepository.save(orderItems);
      
      order.subtotal = subtotal;
      order.gstTotal = gstTotal;
    }

    if (typeof updateOrderDto.discount === 'number') {
      order.discount = updateOrderDto.discount;
    }

    if (updateOrderDto.customerName !== undefined) {
      order.customerName = updateOrderDto.customerName ?? null;
    }

    if (updateOrderDto.customerPhone !== undefined) {
      order.customerPhone = updateOrderDto.customerPhone ?? null;
    }

    if (updateOrderDto.paymentType) {
      order.paymentType = updateOrderDto.paymentType;
    }

    order.grandTotal = this.calculateGrandTotal(order.subtotal, order.gstTotal, order.discount);

    await this.orderRepository.save(order);

    // Reload with relations
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }
}
