import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePurchaseItemDto } from './dto/create-purchase-item.dto';
import { UpdatePurchaseItemDto } from './dto/update-purchase-item.dto';
import { Repository } from 'typeorm';
import { PurchaseItem } from './purchase-item.entity';
import { Purchase } from '../purchase/purchase.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PurchaseItemFilterDto } from './dto/purchase-item-filter.dto';
import { PaginatedPurchaseItemResponse } from './dto/paginated-purchase-item-response.dto';

@Injectable()
export class PurchaseItemService {
  constructor(
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepository: Repository<PurchaseItem>,
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
  ) {}

  async create(createPurchaseItemDto: CreatePurchaseItemDto): Promise<PurchaseItem & { supplier?: string | null; buyer?: string | null }> {
    const { purchaseId, supplier, buyer, ...itemData } = createPurchaseItemDto;
    
    // If purchaseId is not provided but supplier and buyer are, try to find a matching purchase
    let finalPurchaseId = purchaseId;
    if (!finalPurchaseId && supplier && buyer) {
      const matchingPurchase = await this.purchaseRepository.findOne({
        where: { supplier, buyer },
        order: { createdAt: 'DESC' }, // Get the most recent one
      });
      if (matchingPurchase) {
        finalPurchaseId = matchingPurchase.id;
      }
    }
    
    const purchaseItem = this.purchaseItemRepository.create({
      ...itemData,
      total: createPurchaseItemDto.price * createPurchaseItemDto.quantity,
      ...(finalPurchaseId && { purchaseId: finalPurchaseId }),
    });
    const saved = await this.purchaseItemRepository.save(purchaseItem);
    
    // Reload with purchase relation to get supplier and buyer
    const itemWithPurchase = await this.purchaseItemRepository.findOne({
      where: { id: saved.id },
      relations: ['purchase'],
    });
    
    if (!itemWithPurchase) {
      throw new NotFoundException(`Purchase item with ID ${saved.id} not found after creation`);
    }
    
    const itemWithPurchaseTyped = itemWithPurchase as PurchaseItem & { purchase?: { supplier?: string; buyer?: string } };
    return {
      ...itemWithPurchaseTyped,
      supplier: itemWithPurchaseTyped.purchase?.supplier || null,
      buyer: itemWithPurchaseTyped.purchase?.buyer || null,
    };
  }

  private buildQuery(filter: PurchaseItemFilterDto) {
    const { search, fromDate, toDate } = filter;
    const query = this.purchaseItemRepository.createQueryBuilder('purchaseItem')
      .leftJoinAndSelect('purchaseItem.purchase', 'purchase');

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
    const purchaseItems = await dataQuery.skip(skip).take(limit).getMany();

    // Map purchase items to include supplier and buyer from purchase
    const data = purchaseItems.map(item => {
      const itemWithPurchase = item as PurchaseItem & { purchase?: { supplier?: string; buyer?: string } };
      return {
        ...item,
        supplier: itemWithPurchase.purchase?.supplier || null,
        buyer: itemWithPurchase.purchase?.buyer || null,
      };
    });

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

  async findOne(id: string): Promise<PurchaseItem & { supplier?: string | null; buyer?: string | null }> {
    const purchaseItem = await this.purchaseItemRepository.findOne({
      where: { id },
      relations: ['purchase'],
    });
    if (!purchaseItem) {
      throw new NotFoundException(`Purchase item with ID ${id} not found`);
    }
    const purchaseItemTyped = purchaseItem as PurchaseItem & { purchase?: { supplier?: string; buyer?: string } };
    return {
      ...purchaseItemTyped,
      supplier: purchaseItemTyped.purchase?.supplier || null,
      buyer: purchaseItemTyped.purchase?.buyer || null,
    };
  }

  async update(id: string, updatePurchaseItemDto: UpdatePurchaseItemDto): Promise<PurchaseItem & { supplier?: string | null; buyer?: string | null }> {
    const purchaseItem = await this.purchaseItemRepository.findOne({
      where: { id },
      relations: ['purchase'],
    });
    
    if (!purchaseItem) {
      throw new NotFoundException(`Purchase item with ID ${id} not found`);
    }
    
    const { supplier, buyer, purchaseId, ...itemData } = updatePurchaseItemDto;
    
    // If purchaseId is not provided but supplier and buyer are, try to find a matching purchase
    let finalPurchaseId = purchaseId;
    if (!finalPurchaseId && supplier && buyer) {
      const matchingPurchase = await this.purchaseRepository.findOne({
        where: { supplier, buyer },
        order: { createdAt: 'DESC' }, // Get the most recent one
      });
      if (matchingPurchase) {
        finalPurchaseId = matchingPurchase.id;
      }
    }
    
    // Recalculate total if price or quantity is updated
    if (updatePurchaseItemDto.price !== undefined || updatePurchaseItemDto.quantity !== undefined) {
      const finalPrice = updatePurchaseItemDto.price ?? purchaseItem.price;
      const finalQuantity = updatePurchaseItemDto.quantity ?? purchaseItem.quantity;
      purchaseItem.total = finalPrice * finalQuantity;
    }
    
    // Update purchaseId if found
    if (finalPurchaseId !== undefined) {
      purchaseItem.purchaseId = finalPurchaseId || undefined;
    }
    
    Object.assign(purchaseItem, itemData);
    const saved = await this.purchaseItemRepository.save(purchaseItem);
    
    // Reload with purchase relation to get supplier and buyer
    const updated = await this.purchaseItemRepository.findOne({
      where: { id: saved.id },
      relations: ['purchase'],
    });
    
    const updatedTyped = updated as PurchaseItem & { purchase?: { supplier?: string; buyer?: string } };
    return {
      ...updatedTyped,
      supplier: updatedTyped.purchase?.supplier || null,
      buyer: updatedTyped.purchase?.buyer || null,
    };
  }

  async remove(id: string): Promise<void> {
    const purchaseItem = await this.findOne(id);
    await this.purchaseItemRepository.remove(purchaseItem);
  }
}
