import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../permission.entity';
import { PaginationMeta } from '../../common/dto/pagination.dto';

export class PaginatedPermissionResponse {
  @ApiProperty({ type: [Permission], description: 'Array of permissions' })
  data: Permission[];

  @ApiProperty({ type: PaginationMeta, description: 'Pagination metadata' })
  meta: PaginationMeta;
}



