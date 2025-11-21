import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseFilterDto } from './dto/purchase-filter.dto';
import { PaginatedPurchaseResponse } from './dto/paginated-purchase-response.dto';
import { Purchase } from './purchase.entity';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Calculate totalAmount if not provided
    // Formula: (amount * quantity) * (1 + gst / 100)
    const baseAmount = createPurchaseDto.amount * createPurchaseDto.quantity;
    const totalAmount = createPurchaseDto.totalAmount ?? baseAmount * (1 + createPurchaseDto.gst / 100);
    
    const purchase = this.purchaseRepository.create({
      ...createPurchaseDto,
      dueDate: new Date(createPurchaseDto.dueDate),
      // Note: totalAmount is not stored in the entity, but we calculate it for validation
    });
    return this.purchaseRepository.save(purchase);
  }

  private buildQuery(filter: PurchaseFilterDto) {
    const { search, fromDate, toDate, paymentStatus } = filter;
    const query = this.purchaseRepository.createQueryBuilder('purchase');

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(purchase.supplier) LIKE :search OR LOWER(purchase.buyer) LIKE :search)',
        { search: loweredSearch },
      );
    }

    if (fromDate) {
      query.andWhere('purchase.dueDate >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('purchase.dueDate <= :toDate', { toDate });
    }

    if (paymentStatus) {
      query.andWhere('purchase.paymentStatus = :paymentStatus', { paymentStatus });
    }

    return query;
  }

  async findAll(filter: PurchaseFilterDto = {} as PurchaseFilterDto): Promise<PaginatedPurchaseResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query for count
    const countQuery = this.buildQuery(filter);
    const total = await countQuery.getCount();

    // Build query for data with pagination
    const dataQuery = this.buildQuery(filter)
      .orderBy('purchase.createdAt', 'DESC');
    
    const skip = (page - 1) * limit;
    const data = await dataQuery.skip(skip).take(limit).getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
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
