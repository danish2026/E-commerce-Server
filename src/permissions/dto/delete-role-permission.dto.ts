import { IsString, IsNotEmpty, IsArray, ArrayMinSize, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteRolePermissionDto {
  @ApiProperty({ description: 'Role ID' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roleId: string;

  @ApiProperty({ description: 'Array of permission IDs to remove', example: ['uuid1', 'uuid2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

