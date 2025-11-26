import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderItemService } from './order_item.service';
import { CreateOrderDto } from './dto/create-order_item.dto';
import { UpdateOrderItemDto } from './dto/update-order_item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { PaginatedOrderResponse } from './dto/paginated-order-response.dto';
import { DashboardStatsResponse } from './dto/dashboard-stats.dto';
import { Order } from './order.entity';
import { OrderItem } from './order_item.entity';

@ApiTags('orders')
@Controller('orders')
export class OrderItemController {
  constructor(private readonly orderItemService: OrderItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order with order items' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.orderItemService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of orders',
    type: PaginatedOrderResponse,
  })
  findAll(@Query() filterDto: OrderFilterDto): Promise<PaginatedOrderResponse> {
    return this.orderItemService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID with all order items' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string): Promise<Order> {
    return this.orderItemService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.orderItemService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order and return stock' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.orderItemService.remove(id);
  }

  @Get('items')
  @ApiOperation({ summary: 'Get all order items' })
  @ApiResponse({ status: 200, description: 'Returns list of all order items', type: [OrderItem] })
  findAllItems(): Promise<OrderItem[]> {
    return this.orderItemService.findAllItems();
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get order item by ID' })
  @ApiResponse({ status: 200, description: 'Order item found', type: OrderItem })
  @ApiResponse({ status: 404, description: 'Order item not found' })
  findOneItem(@Param('id') id: string): Promise<OrderItem> {
    return this.orderItemService.findOneItem(id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update an order item' })
  @ApiResponse({ status: 200, description: 'Order item updated successfully', type: OrderItem })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Order item not found' })
  updateItem(
    @Param('id') id: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    return this.orderItemService.updateItem(id, updateOrderItemDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order item and return stock' })
  @ApiResponse({ status: 204, description: 'Order item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order item not found' })
  removeItem(@Param('id') id: string): Promise<void> {
    return this.orderItemService.removeItem(id);
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns dashboard statistics including revenue, orders, and trends',
    type: DashboardStatsResponse,
  })
  getDashboardStats(): Promise<DashboardStatsResponse> {
    return this.orderItemService.getDashboardStats();
  }
}


