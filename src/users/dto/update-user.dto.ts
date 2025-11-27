import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number (stored but not used in User entity)',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    example: Role.SALES_MAN,
  })
  @IsEnum(Role, { message: 'Invalid role. Must be one of: SUPER_ADMIN, SALES_MANAGER, SALES_MAN' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Role ID from permissions service to resolve fine-grained permissions',
  })
  @IsString()
  @IsOptional()
  permissionsRoleId?: string;

  @ApiPropertyOptional({
    description: 'Role name from permissions service to help with UI display',
  })
  @IsString()
  @IsOptional()
  permissionsRoleName?: string;
}

