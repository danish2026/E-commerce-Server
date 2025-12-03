import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UserFilterDto {
  @ApiPropertyOptional({
    description: 'Free text search across user email, firstName, lastName, and phone',
    example: 'john',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (createdAt >= fromDate)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (createdAt <= toDate)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'PageSize must be an integer' })
  @Min(1, { message: 'PageSize must be at least 1' })
  @Max(100, { message: 'PageSize cannot exceed 100' })
  @IsOptional()
  pageSize?: number = 10;
}

