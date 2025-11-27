import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../order.entity';

export class RevenueStats {
  @ApiProperty({ description: 'Total revenue (all time)', example: 125000.50 })
  total: number;

  @ApiProperty({ description: 'Monthly revenue', example: 15000.75 })
  monthly: number;

  @ApiProperty({ description: "Today's revenue", example: 1250.25 })
  today: number;
}

export class OrderStats {
  @ApiProperty({ description: 'Total orders count', example: 1250 })
  total: number;

  @ApiProperty({ description: 'Monthly orders count', example: 150 })
  monthly: number;

  @ApiProperty({ description: "Today's orders count", example: 12 })
  today: number;
}

export class MonthlyTrendItem {
  @ApiProperty({ description: 'Month name', example: 'Jan' })
  month: string;

  @ApiProperty({ description: 'Revenue for the month', example: 12000 })
  revenue: number;
}

export class RecentOrder {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number', example: 'ORD-2024-001' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe', nullable: true })
  customerName: string | null;

  @ApiProperty({ description: 'Grand total', example: 1250.50 })
  grandTotal: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: string;
}

export class DashboardStatsResponse {
  @ApiProperty({ type: RevenueStats, description: 'Revenue statistics' })
  revenue: RevenueStats;

  @ApiProperty({ type: OrderStats, description: 'Order statistics' })
  orders: OrderStats;

  @ApiProperty({ type: [RecentOrder], description: 'Recent orders (last 5)' })
  recentOrders: RecentOrder[];

  @ApiProperty({ type: [MonthlyTrendItem], description: 'Monthly revenue trend (last 12 months)' })
  monthlyTrend: MonthlyTrendItem[];
}


