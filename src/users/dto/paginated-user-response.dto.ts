import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';
import { PaginationMeta } from '../../common/dto/pagination.dto';

export class PaginatedUserResponse {
  @ApiProperty({ type: [User], description: 'Array of users' })
  data: User[];

  @ApiProperty({ type: PaginationMeta, description: 'Pagination metadata' })
  meta: PaginationMeta;
}

