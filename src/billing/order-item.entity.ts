import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { PaymentType } from '../common/enums/payment-type.enum';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'product_id' })
    productId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, name: 'unit_price' })
    unitPrice: number;

    @Column({ type: 'numeric', precision: 5, scale: 2, name: 'gst_percentage' })
    gstPercentage: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, name: 'gst_amount' })
    gstAmount: number;

    @Column({ type: 'numeric', precision: 10, scale: 2, name: 'total_amount' })
    totalAmount: number;

    @Column({ type: 'varchar', length: 255, name: 'customer_name', nullable: true })
    customerName?: string | null;

    @Column({ type: 'varchar', length: 50, name: 'customer_phone', nullable: true })
    customerPhone?: string | null;

    @Column({ type: 'numeric', precision: 10, scale: 2, name: 'discount', nullable: true })
    discount?: number | null;

    @Column({ type: 'enum', enum: PaymentType, name: 'payment_type', nullable: true })
    paymentType?: PaymentType | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
