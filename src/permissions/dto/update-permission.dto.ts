import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: 'Module name (e.g., users, products)' })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({ description: 'Action name (e.g., create, view, edit, delete)' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsString()
  @IsOptional()
  description?: string;
}

