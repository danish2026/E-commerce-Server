import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginatedProductResponse } from './dto/paginated-product-response.dto';
import { Product } from './product.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }

    // Validate that category exists
    try {
      await this.categoriesService.findOne(createProductDto.categoryId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          `Category with ID ${createProductDto.categoryId} does not exist`,
        );
      }
      throw error;
    }

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  private buildQuery(filter: ProductFilterDto) {
    const { search, categoryId, expiringWithinDays } = filter;
    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.sku) LIKE :search OR LOWER(product.brand) LIKE :search)',
        { search: loweredSearch },
      );
    }

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (expiringWithinDays) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const warningDate = new Date(today);
      warningDate.setDate(today.getDate() + expiringWithinDays);
      
      query.andWhere('product.expiryDate IS NOT NULL');
      query.andWhere('product.expiryDate <= :warningDate', { 
        warningDate: warningDate.toISOString().split('T')[0] 
      });
      query.andWhere('product.expiryDate >= :today', { 
        today: today.toISOString().split('T')[0] 
      });
    }

    return query;
  }

  async findAll(filter: ProductFilterDto = {} as ProductFilterDto): Promise<PaginatedProductResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query for count
    const countQuery = this.buildQuery(filter);
    const total = await countQuery.getCount();

    // Build query for data with pagination
    const dataQuery = this.buildQuery(filter)
      .orderBy('product.createdAt', 'DESC');
    
    const skip = (page - 1) * limit;
    const data = await dataQuery.skip(skip).take(limit).getMany();

    // Add expiry warnings to products
    const dataWithExpiryWarnings = data.map(product => {
      const expiryCheck = this.checkExpiryDate(product.expiryDate);
      return {
        ...product,
        expiryWarning: expiryCheck ? {
          isExpiringSoon: expiryCheck.isExpiringSoon,
          daysRemaining: expiryCheck.daysRemaining,
          isExpired: expiryCheck.isExpired,
          message: expiryCheck.isExpired
            ? `Product expired ${Math.abs(expiryCheck.daysRemaining!)} day(s) ago`
            : expiryCheck.isExpiringSoon
            ? `Product expiring in ${expiryCheck.daysRemaining} day(s)`
            : null,
        } : null,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: dataWithExpiryWarnings as any,
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

  async findOne(id: string): Promise<Product & { expiryWarning?: any }> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Add expiry warning if applicable
    const expiryCheck = this.checkExpiryDate(product.expiryDate);
    if (expiryCheck) {
      return {
        ...product,
        expiryWarning: {
          isExpiringSoon: expiryCheck.isExpiringSoon,
          daysRemaining: expiryCheck.daysRemaining,
          isExpired: expiryCheck.isExpired,
          message: expiryCheck.isExpired
            ? `Product expired ${Math.abs(expiryCheck.daysRemaining!)} day(s) ago`
            : expiryCheck.isExpiringSoon
            ? `Product expiring in ${expiryCheck.daysRemaining} day(s)`
            : null,
        },
      };
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // If SKU is being updated, check for conflicts
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException(
          `Product with SKU ${updateProductDto.sku} already exists`,
        );
      }
    }

    // Validate that category exists if being updated
    if (updateProductDto.categoryId) {
      try {
        await this.categoriesService.findOne(updateProductDto.categoryId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException(
            `Category with ID ${updateProductDto.categoryId} does not exist`,
          );
        }
        throw error;
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  /**
   * Check if a product is expiring soon and return days remaining
   * @param expiryDate - The expiry date string
   * @param warningDays - Number of days before expiry to show warning (default: 30)
   * @returns Object with isExpiringSoon flag and daysRemaining, or null if no expiry date
   */
  private checkExpiryDate(expiryDate: string | null, warningDays: number = 30): {
    isExpiringSoon: boolean;
    daysRemaining: number | null;
    isExpired: boolean;
  } | null {
    if (!expiryDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining < 0;
    const isExpiringSoon = !isExpired && daysRemaining <= warningDays;

    return {
      isExpiringSoon,
      daysRemaining,
      isExpired,
    };
  }

  /**
   * Reduce stock for a product with validation
   * @param productId - The ID of the product
   * @param quantity - The quantity to reduce
   * @param criticalExpiryDays - Number of days before expiry to block the operation (default: 7)
   * @throws BadRequestException if insufficient stock is available or product is expired/expiring within critical days
   */
  async reduceStock(productId: string, quantity: number, criticalExpiryDays: number = 7): Promise<Product & { expiryWarning?: any }> {
    const product = await this.findOne(productId);

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${product.stock} item(s) available in stock.`,
      );
    }

    // Check expiry date
    const expiryCheck = this.checkExpiryDate(product.expiryDate, 30);
    if (expiryCheck) {
      if (expiryCheck.isExpired) {
        throw new BadRequestException(
          `Product has expired on ${product.expiryDate}. Cannot reduce stock.`,
        );
      }
      // Block if expiring within critical days (default 7 days)
      if (expiryCheck.daysRemaining !== null && expiryCheck.daysRemaining <= criticalExpiryDays) {
        throw new BadRequestException(
          `Product is expiring soon. Only ${expiryCheck.daysRemaining} day(s) remaining before expiry (${product.expiryDate}). Cannot reduce stock.`,
        );
      }
    }

    product.stock -= quantity;
    const savedProduct = await this.productRepository.save(product);
    
    // Include expiry warning in response if product is expiring soon (but not critical)
    if (expiryCheck && expiryCheck.isExpiringSoon && expiryCheck.daysRemaining !== null && expiryCheck.daysRemaining > criticalExpiryDays) {
      return {
        ...savedProduct,
        expiryWarning: {
          isExpiringSoon: true,
          daysRemaining: expiryCheck.daysRemaining,
          isExpired: false,
          message: `Warning: Product is expiring in ${expiryCheck.daysRemaining} day(s) (${product.expiryDate}).`,
        },
      };
    }

    return savedProduct;
  }

  /**
   * Increase stock for a product (e.g., when items are purchased)
   * @param productId - The ID of the product
   * @param quantity - The quantity to add
   */
  async increaseStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.findOne(productId);
    product.stock += quantity;
    return this.productRepository.save(product);
  }

  /**
   * Get products that are expiring soon or expired
   * @param warningDays - Number of days before expiry to show warning (default: 30)
   * @param includeExpired - Whether to include expired products (default: true)
   * @returns Array of products with expiry warnings
   */
  async findExpiringProducts(
    warningDays: number = 30,
    includeExpired: boolean = true,
  ): Promise<(Product & { expiryWarning: any })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const warningDate = new Date(today);
    warningDate.setDate(today.getDate() + warningDays);

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.expiryDate IS NOT NULL');

    if (includeExpired) {
      query.andWhere('product.expiryDate <= :warningDate', { warningDate: warningDate.toISOString().split('T')[0] });
    } else {
      query.andWhere('product.expiryDate <= :warningDate AND product.expiryDate >= :today', {
        warningDate: warningDate.toISOString().split('T')[0],
        today: today.toISOString().split('T')[0],
      });
    }

    query.orderBy('product.expiryDate', 'ASC');

    const products = await query.getMany();

    return products.map(product => {
      const expiryCheck = this.checkExpiryDate(product.expiryDate, warningDays);
      return {
        ...product,
        expiryWarning: expiryCheck ? {
          isExpiringSoon: expiryCheck.isExpiringSoon,
          daysRemaining: expiryCheck.daysRemaining,
          isExpired: expiryCheck.isExpired,
          message: expiryCheck.isExpired
            ? `Product expired ${Math.abs(expiryCheck.daysRemaining!)} day(s) ago`
            : expiryCheck.isExpiringSoon
            ? `Product expiring in ${expiryCheck.daysRemaining} day(s)`
            : null,
        } : null,
      };
    });
  }
}
