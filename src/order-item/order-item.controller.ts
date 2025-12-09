import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto, CreateOrderDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItemFilterDto } from './dto/order-item-filter.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedOrderItemResponse } from './dto/paginated-order-item-response.dto';
import { PaginatedGroupedOrderResponse } from './dto/grouped-order.dto';

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

  @Get('grouped')
  @ApiOperation({ summary: 'Get all orders grouped by order (customer, payment, time) with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of grouped orders',
    type: PaginatedGroupedOrderResponse,
  })
  findAllGrouped(@Query() filterDto: OrderItemFilterDto) {
    return this.orderItemService.findAllGrouped(filterDto);
  }

  @Get('grouped/items')
  @ApiOperation({ summary: 'Get all items for a specific order group' })
  @ApiResponse({
    status: 200,
    description: 'Returns all order items for the specified order group',
  })
  findItemsByOrderGroup(
    @Query('customerName') customerName?: string,
    @Query('customerPhone') customerPhone?: string,
    @Query('paymentType') paymentType?: string,
    @Query('createdAt') createdAt?: string,
  ) {
    const decodedCustomerName = customerName === 'null' || customerName === undefined ? null : decodeURIComponent(customerName);
    const decodedCustomerPhone = customerPhone === 'null' || customerPhone === undefined ? null : decodeURIComponent(customerPhone);
    const decodedPaymentType = paymentType === 'null' || paymentType === undefined ? null : decodeURIComponent(paymentType);
    const decodedCreatedAt = createdAt ? decodeURIComponent(createdAt) : new Date().toISOString();
    return this.orderItemService.findItemsByOrderGroup(
      decodedCustomerName,
      decodedCustomerPhone,
      decodedPaymentType,
      decodedCreatedAt,
    );
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

  @Delete('grouped/order')
  @ApiOperation({ summary: 'Delete all items in an order group' })
  @ApiResponse({
    status: 200,
    description: 'Returns success message and count of deleted items',
  })
  removeOrderGroup(
    @Query('customerName') customerName?: string,
    @Query('customerPhone') customerPhone?: string,
    @Query('paymentType') paymentType?: string,
    @Query('createdAt') createdAt?: string,
  ) {
    const decodedCustomerName = customerName === 'null' || customerName === undefined ? null : decodeURIComponent(customerName);
    const decodedCustomerPhone = customerPhone === 'null' || customerPhone === undefined ? null : decodeURIComponent(customerPhone);
    const decodedPaymentType = paymentType === 'null' || paymentType === undefined ? null : decodeURIComponent(paymentType);
    const decodedCreatedAt = createdAt ? decodeURIComponent(createdAt) : new Date().toISOString();
    return this.orderItemService.removeOrderGroup(
      decodedCustomerName,
      decodedCustomerPhone,
      decodedPaymentType,
      decodedCreatedAt,
    );
  }
}
