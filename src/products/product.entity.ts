import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'varchar', nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'cost_price' })
  costPrice: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'selling_price' })
  sellingPrice: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  stock: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'gst_percentage' })
  gstPercentage: number;

  @Column({ type: 'date', name: 'expiry_date', nullable: true })
  expiryDate: string | null;

  @Column({ type: 'varchar', name: 'hsn_code', nullable: true })
  hsnCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  barcode: string | null;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: string;
}
