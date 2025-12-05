import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItemFilterDto } from './dto/order-item-filter.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedOrderItemResponse } from './dto/paginated-order-item-response.dto';

@ApiTags('order-item')
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
  @ApiOperation({ summary: 'Get all order items with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of order items',
    type: PaginatedOrderItemResponse,
  })
  findAll(@Query() filterDto: OrderItemFilterDto) {
    return this.orderItemService.findAll(filterDto);
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
