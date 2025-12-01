import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Controller('order-item')
export class OrderItemController {
  constructor(private readonly orderItemService: OrderItemService) { }

  @Post()
  create(@Body() createOrderItemDto: CreateOrderItemDto) {
    return this.orderItemService.create(createOrderItemDto);
  }

  @Post('create-order')
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderItemService.createOrder(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderItemService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderItemDto: UpdateOrderItemDto) {
    return this.orderItemService.update(id, updateOrderItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderItemService.remove(id);
  }
}
