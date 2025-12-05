import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Purchase } from '../purchase/purchase.entity';


@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  item: string;

  @Column({ nullable: true })
  description: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'uuid', nullable: true, name: 'purchase_id' })
  purchaseId?: string;

  @ManyToOne(() => Purchase, { nullable: true })
  @JoinColumn({ name: 'purchase_id' })
  purchase?: Purchase;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
