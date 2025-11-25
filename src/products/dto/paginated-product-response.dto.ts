import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product.entity';
import { PaginationMeta } from '../../common/dto/pagination.dto';

export class PaginatedProductResponse {
  @ApiProperty({ type: [Product], description: 'Array of products' })
  data: Product[];

  @ApiProperty({ type: PaginationMeta, description: 'Pagination metadata' })
  meta: PaginationMeta;
}




