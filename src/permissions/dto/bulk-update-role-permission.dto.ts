import { IsArray, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateRolePermissionDto {
  @ApiProperty({ 
    description: 'Array of permission IDs to assign to the role. Empty array removes all permissions.', 
    example: ['uuid1', 'uuid2'] 
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

