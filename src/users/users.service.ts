import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(userData.password, saltRounds);
    }
    
    // Validate role if provided
    if (userData.role) {
      const validRoles = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_MAN'];
      if (!validRoles.includes(userData.role)) {
        throw new BadRequestException(
          `Invalid role. Must be one of: ${validRoles.join(', ')}`
        );
      }
    }
    
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Check if email is being changed and if it conflicts with another user
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(
          `Email "${updateData.email}" is already in use by another user`
        );
      }
    }
    
    // Hash password if provided
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }
    
    // Validate role if provided (handle both string and enum)
    if (updateData.role !== undefined) {
      const roleValue = typeof updateData.role === 'string' ? updateData.role : updateData.role;
      const validRoles = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_MAN'];
      if (!validRoles.includes(roleValue)) {
        throw new BadRequestException(
          `Invalid role "${roleValue}". Must be one of: ${validRoles.join(', ')}`
        );
      }
      // Ensure role is set as enum value
      updateData.role = roleValue as any;
    }
    
    // Remove any fields that don't exist on User entity (like phone)
    const { phone, ...cleanUpdateData } = updateData as any;
    
    Object.assign(user, cleanUpdateData);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'permissionsRoleId',
        'permissionsRoleName',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
  }
}




