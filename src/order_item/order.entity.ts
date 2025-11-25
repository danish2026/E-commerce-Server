import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order_item.entity';
import { PaymentType } from '../common/enums/payment-type.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({ type: 'varchar', nullable: true, name: 'customer_name' })
  customerName: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'customer_phone' })
  customerPhone: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, name: 'gst_total' })
  gstTotal: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, nullable: true })
  discount: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, name: 'grand_total' })
  grandTotal: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
    name: 'payment_type',
  })
  paymentType: PaymentType;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems: OrderItem[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: string;
}

