import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../products/product.entity';

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
}
