import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CategoryFilterDto {
  @ApiPropertyOptional({
    description: 'Free text search across category name and description',
    example: 'electronics',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Return categories with createdAt on or after this date',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'fromDate must be a valid date string' })
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Return categories with createdAt on or before this date',
    example: '2024-12-31',
  })
  @IsDateString({}, { message: 'toDate must be a valid date string' })
  @IsOptional()
  toDate?: string;
}



