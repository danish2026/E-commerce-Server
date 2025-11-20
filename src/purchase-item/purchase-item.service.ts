import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePurchaseItemDto } from './dto/create-purchase-item.dto';
import { UpdatePurchaseItemDto } from './dto/update-purchase-item.dto';
import { Repository } from 'typeorm';
import { PurchaseItem } from './purchase-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PurchaseItemFilterDto } from './dto/purchase-item-filter.dto';
import { PaginatedPurchaseItemResponse } from './dto/paginated-purchase-item-response.dto';

@Injectable()
export class PurchaseItemService {
  constructor(
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepository: Repository<PurchaseItem>,
  ) {}

  async create(createPurchaseItemDto: CreatePurchaseItemDto): Promise<PurchaseItem> {
    const purchaseItem = this.purchaseItemRepository.create({
      ...createPurchaseItemDto,
      total: createPurchaseItemDto.price * createPurchaseItemDto.quantity,
    });
    return this.purchaseItemRepository.save(purchaseItem);
  }

  private buildQuery(filter: PurchaseItemFilterDto) {
    const { search, fromDate, toDate } = filter;
    const query = this.purchaseItemRepository.createQueryBuilder('purchaseItem');

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(purchaseItem.item) LIKE :search OR LOWER(purchaseItem.description) LIKE :search)',
        { search: loweredSearch },
      );
    }

    if (fromDate) {
      query.andWhere('purchaseItem.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('purchaseItem.createdAt <= :toDate', { toDate });
    }

    return query;
  }

  async findAll(filter: PurchaseItemFilterDto = {} as PurchaseItemFilterDto): Promise<PaginatedPurchaseItemResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query for count
    const countQuery = this.buildQuery(filter);
    const total = await countQuery.getCount();

    // Build query for data with pagination
    const dataQuery = this.buildQuery(filter)
      .orderBy('purchaseItem.createdAt', 'DESC');
    
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

  async findOne(id: string): Promise<PurchaseItem> {
    const purchaseItem = await this.purchaseItemRepository.findOne({
      where: { id },
    });
    if (!purchaseItem) {
      throw new NotFoundException(`Purchase item with ID ${id} not found`);
    }
    return purchaseItem;
  }

  async update(id: string, updatePurchaseItemDto: UpdatePurchaseItemDto): Promise<PurchaseItem> {
    const purchaseItem = await this.findOne(id);
    
    // Recalculate total if price or quantity is updated
    if (updatePurchaseItemDto.price !== undefined || updatePurchaseItemDto.quantity !== undefined) {
      const finalPrice = updatePurchaseItemDto.price ?? purchaseItem.price;
      const finalQuantity = updatePurchaseItemDto.quantity ?? purchaseItem.quantity;
      purchaseItem.total = finalPrice * finalQuantity;
    }
    
    Object.assign(purchaseItem, updatePurchaseItemDto);
    return this.purchaseItemRepository.save(purchaseItem);
  }

  async remove(id: string): Promise<void> {
    const purchaseItem = await this.findOne(id);
    await this.purchaseItemRepository.remove(purchaseItem);
  }
}
