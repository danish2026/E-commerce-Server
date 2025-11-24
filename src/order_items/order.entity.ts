import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentType } from '../common/enums/payment-type.enum';
import { OrderItem } from './order_item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ type: 'varchar', name: 'customer_name', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', name: 'customer_phone', nullable: true })
  customerPhone: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'gst_total' })
  gstTotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'grand_total' })
  grandTotal: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
    name: 'payment_type',
  })
  paymentType: PaymentType;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  orderItems: OrderItem[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}


