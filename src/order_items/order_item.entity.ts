import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.orderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'gst_percentage' })
  gstPercentage: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'gst_amount' })
  gstAmount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
