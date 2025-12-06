import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';


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

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  buyer: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
