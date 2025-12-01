import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(createOrderItemDto: CreateOrderItemDto) {
    const { productId, quantity } = createOrderItemDto;

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const unitPrice = Number(product.sellingPrice);
    const gstPercentage = Number(product.gstPercentage);
    const gstAmount = (unitPrice * quantity * gstPercentage) / 100;
    const totalAmount = (unitPrice * quantity) + gstAmount;

    const orderItem = this.orderItemRepository.create({
      productId,
      quantity,
      unitPrice,
      gstPercentage,
      gstAmount,
      totalAmount,
    });

    return await this.orderItemRepository.save(orderItem);
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;
    const createdItems: OrderItem[] = [];
    let grandTotal = 0;

    for (const itemDto of items) {
      const { productId, quantity } = itemDto;
      const product = await this.productRepository.findOne({ where: { id: productId } });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const unitPrice = Number(product.sellingPrice);
      const gstPercentage = Number(product.gstPercentage);
      const gstAmount = (unitPrice * quantity * gstPercentage) / 100;
      const totalAmount = (unitPrice * quantity) + gstAmount;

      const orderItem = this.orderItemRepository.create({
        productId,
        quantity,
        unitPrice,
        gstPercentage,
        gstAmount,
        totalAmount,
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

  findAll() {
    return this.orderItemRepository.find();
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

    return await this.orderItemRepository.save(orderItem);
  }

  async remove(id: string) {
    const result = await this.orderItemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }
    return { message: 'Order item deleted successfully' };
  }
}
