import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryFilterDto } from './dto/category-filter.dto';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  private buildQuery(filter: CategoryFilterDto) {
    const { search, fromDate, toDate } = filter;
    const query = this.categoryRepository.createQueryBuilder('category');

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(category.name) LIKE :search OR LOWER(category.description) LIKE :search)',
        { search: loweredSearch },
      );
    }

    if (fromDate) {
      query.andWhere('category.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('category.createdAt <= :toDate', { toDate });
    }

    return query;
  }

  async findAll(filter: CategoryFilterDto = {} as CategoryFilterDto): Promise<Category[]> {
    const query = this.buildQuery(filter)
      .orderBy('category.createdAt', 'DESC');
    
    return query.getMany();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
