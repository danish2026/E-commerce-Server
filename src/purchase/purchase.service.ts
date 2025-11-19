import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Purchase } from './purchase.entity';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    const purchase = this.purchaseRepository.create({
      ...createPurchaseDto,
      dueDate: new Date(createPurchaseDto.dueDate),
    });
    return this.purchaseRepository.save(purchase);
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id },
    });
    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return purchase;
  }

  async update(
    id: string,
    updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    const purchase = await this.findOne(id);
    
    const { dueDate, ...rest } = updatePurchaseDto;
    const updateData: Partial<Purchase> = { ...rest };
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }
    
    Object.assign(purchase, updateData);
    return this.purchaseRepository.save(purchase);
  }

  async remove(id: string): Promise<void> {
    const purchase = await this.findOne(id);
    await this.purchaseRepository.remove(purchase);
  }
}
