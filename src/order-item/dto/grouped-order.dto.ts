import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from '../order-item.entity';
import { PaymentType } from '../../common/enums/payment-type.enum';

export class GroupedOrder {
  @ApiProperty({ description: 'Order identifier (first item ID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Order number (derived from first item ID)', example: '123E4567' })
  orderNumber: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe', nullable: true })
  customerName?: string | null;

  @ApiProperty({ description: 'Customer phone number', example: '+91-9876543210', nullable: true })
  customerPhone?: string | null;

  @ApiProperty({ description: 'Payment type', enum: PaymentType, example: PaymentType.CASH })
  paymentType?: PaymentType | null;

  @ApiProperty({ description: 'Total subtotal (sum of all items before GST)', example: 1000.00 })
  subtotal: number;

  @ApiProperty({ description: 'Total GST amount', example: 180.00 })
  gstTotal: number;

  @ApiProperty({ description: 'Total discount amount', example: 50.00 })
  discount: number;

  @ApiProperty({ description: 'Grand total (sum of all items)', example: 1130.00 })
  grandTotal: number;

  @ApiProperty({ description: 'Number of items in the order', example: 3 })
  itemCount: number;

  @ApiProperty({ description: 'Order creation date', example: '2024-01-01T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Order items (only included when expanded)', type: [OrderItem], required: false })
  items?: OrderItem[];
}

export class PaginatedGroupedOrderResponse {
  @ApiProperty({ type: [GroupedOrder], description: 'Array of grouped orders' })
  data: GroupedOrder[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

