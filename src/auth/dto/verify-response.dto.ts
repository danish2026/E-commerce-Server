import { ApiProperty } from '@nestjs/swagger';

export class VerifyResponseDto {
  @ApiProperty({
    description: 'User information extracted from the authenticated token',
  })
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    permissionsRoleId?: string;
    permissionsRoleName?: string;
  };

  @ApiProperty({
    description: 'Permissions attached to the user via role-permission mappings',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        module: { type: 'string' },
        action: { type: 'string' },
        description: { type: 'string', nullable: true },
      },
    },
  })
  permissions: {
    id: string;
    module: string;
    action: string;
    description?: string | null;
  }[];
}


