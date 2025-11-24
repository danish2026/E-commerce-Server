import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginatedProductResponse } from './dto/paginated-product-response.dto';
import { Product } from './product.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or category does not exist' })
  @ApiResponse({ status: 409, description: 'Conflict - SKU already exists' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of products',
    type: PaginatedProductResponse,
  })
  findAll(@Query() filterDto: ProductFilterDto): Promise<PaginatedProductResponse> {
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Conflict - SKU already exists' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('alerts/expiring')
  @ApiOperation({ summary: 'Get products that are expiring soon or expired' })
  @ApiQuery({
    name: 'warningDays',
    required: false,
    type: Number,
    description: 'Number of days before expiry to show warning (default: 30)',
    example: 30,
  })
  @ApiQuery({
    name: 'includeExpired',
    required: false,
    type: String,
    description: 'Whether to include expired products (default: true). Use "true" or "1" to include, "false" or "0" to exclude',
    example: 'true',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of products with expiry warnings',
    type: [Product],
  })
  findExpiringProducts(
    @Query('warningDays') warningDays?: string,
    @Query('includeExpired') includeExpired?: string,
  ) {
    const warningDaysNum = warningDays ? parseInt(warningDays, 10) : 30;
    const includeExpiredBool = includeExpired !== undefined 
      ? includeExpired === 'true' || includeExpired === '1' 
      : true;
    return this.productsService.findExpiringProducts(warningDaysNum, includeExpiredBool);
  }
}
