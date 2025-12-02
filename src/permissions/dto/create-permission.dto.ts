import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Module name (e.g., users, products)' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ description: 'Action name (e.g., create, view, edit, delete)' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsString()
  @IsOptional()
  description?: string;
}






