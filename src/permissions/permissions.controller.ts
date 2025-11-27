import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BulkCreatePermissionDto } from './dto/bulk-create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // Permission endpoints
  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all permissions',
    type: [Permission],
  })
  findAllPermissions(): Promise<Permission[]> {
    return this.permissionsService.findAllPermissions();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: Permission,
  })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create permissions for a module' })
  @ApiResponse({
    status: 201,
    description: 'Permissions created successfully',
    type: [Permission],
  })
  @ApiResponse({ status: 409, description: 'Some permissions already exist' })
  bulkCreatePermissions(
    @Body() bulkCreatePermissionDto: BulkCreatePermissionDto,
  ): Promise<Permission[]> {
    return this.permissionsService.bulkCreatePermissions(bulkCreatePermissionDto);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get all unique modules from permissions' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of unique module names',
    type: [String],
  })
  getModules(): Promise<string[]> {
    return this.permissionsService.getModules();
  }

  // Role endpoints
  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all roles',
    type: [Role],
  })
  findAllRoles(): Promise<Role[]> {
    return this.permissionsService.findAllRoles();
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: Role,
  })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.permissionsService.createRole(createRoleDto);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns role with permissions',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOneRole(@Param('id') id: string): Promise<Role> {
    return this.permissionsService.findOneRole(id);
  }

  // RolePermission endpoints
  @Get('role-permissions')
  @ApiOperation({ summary: 'Get all role-permission relationships' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all role-permission relationships',
    type: [RolePermission],
  })
  findAllRolePermissions(): Promise<RolePermission[]> {
    return this.permissionsService.findAllRolePermissions();
  }

  @Post('role-permissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiResponse({
    status: 201,
    description: 'Role permissions created successfully',
    type: [RolePermission],
  })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @ApiResponse({ status: 409, description: 'Role-permission relationship already exists' })
  createRolePermission(
    @Body() createRolePermissionDto: CreateRolePermissionDto,
  ): Promise<RolePermission[]> {
    return this.permissionsService.createRolePermission(createRolePermissionDto);
  }

  @Get('role-permissions/role/:roleId')
  @ApiOperation({ summary: 'Get all permissions for a specific role' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of permissions for the role',
    type: [RolePermission],
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findRolePermissionsByRole(@Param('roleId') roleId: string): Promise<RolePermission[]> {
    return this.permissionsService.findRolePermissionsByRole(roleId);
  }
}

