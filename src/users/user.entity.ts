import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'varchar',
    length: 255,
    unique: true, 
    nullable: false 
  })
  email!: string;

  @Column({ 
    type: 'varchar',
    length: 255,
    nullable: false 
  })
  password!: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  permissionsRoleId?: string;

  @Column({ nullable: true })
  permissionsRoleName?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.SALES_MAN,
    nullable: false,
  })
  role!: Role;

  @Column({ 
    type: 'boolean',
    default: true,
    nullable: false 
  })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}




