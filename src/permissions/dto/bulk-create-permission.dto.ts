import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCreatePermissionDto {
  @ApiProperty({ description: 'Module name (e.g., users, products)' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ description: 'Array of action names', example: ['create', 'view', 'edit', 'delete'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  actions: string[]; 
} 

