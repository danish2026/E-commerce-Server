import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BulkCreatePermissionDto } from './dto/bulk-create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { PermissionFilterDto } from './dto/permission-filter.dto';
import { PaginatedPermissionResponse } from './dto/paginated-permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  // Permission methods
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // Check if permission already exists
    const existingPermission = await this.permissionRepository.findOne({
      where: {
        module: createPermissionDto.module,
        action: createPermissionDto.action,
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Permission with module "${createPermissionDto.module}" and action "${createPermissionDto.action}" already exists`,
      );
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async bulkCreatePermissions(
    bulkCreatePermissionDto: BulkCreatePermissionDto,
  ): Promise<Permission[]> {
    const { module, actions } = bulkCreatePermissionDto;
    const permissions: Permission[] = [];

    for (const action of actions) {
      // Check if permission already exists
      const existingPermission = await this.permissionRepository.findOne({
        where: { module, action },
      });

      if (!existingPermission) {
        const permission = this.permissionRepository.create({
          module,
          action,
          description: `${action} permission for ${module} module`,
        });
        permissions.push(permission);
      }
    }

    if (permissions.length === 0) {
      throw new ConflictException(
        `All permissions for module "${module}" with the specified actions already exist`,
      );
    }

    return this.permissionRepository.save(permissions);
  }

  private buildQuery(filter: PermissionFilterDto) {
    const { search, module, action } = filter;
    const query = this.permissionRepository.createQueryBuilder('permission');

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(permission.module) LIKE :search OR LOWER(permission.action) LIKE :search OR LOWER(permission.description) LIKE :search)',
        { search: loweredSearch },
      );
    }

    if (module) {
      query.andWhere('permission.module = :module', { module });
    }

    if (action) {
      query.andWhere('permission.action = :action', { action });
    }

    return query;
  }

  async findAllPermissions(filter: PermissionFilterDto = {} as PermissionFilterDto): Promise<PaginatedPermissionResponse> {
    const { page = 1, limit = 10 } = filter;
    
    // Build base query for count
    const countQuery = this.buildQuery(filter);
    const total = await countQuery.getCount();

    // Build query for data with pagination
    const dataQuery = this.buildQuery(filter)
      .orderBy('permission.module', 'ASC')
      .addOrderBy('permission.action', 'ASC');
    
    const skip = (page - 1) * limit;
    const data = await dataQuery.skip(skip).take(limit).getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async findOnePermission(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async getModules(): Promise<string[]> {
    const permissions = await this.permissionRepository.find({
      select: ['module'],
    });
    const uniqueModules = Array.from(new Set(permissions.map((p) => p.module)));
    return uniqueModules.sort();
  }

  // Role methods
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role with name "${createRoleDto.name}" already exists`,
      );
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOneRole(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  // RolePermission methods
  async createRolePermission(
    createRolePermissionDto: CreateRolePermissionDto,
  ): Promise<RolePermission[]> {
    const { roleId, permissionIds } = createRolePermissionDto;

    // Verify role exists
    const role = await this.findOneRole(roleId);

    // Verify all permissions exist
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Permissions with IDs ${missingIds.join(', ')} not found`,
      );
    }

    // Check for existing role-permission relationships
    const existingRolePermissions = await this.rolePermissionRepository.find({
      where: {
        roleId,
        permissionId: In(permissionIds),
      },
    });

    if (existingRolePermissions.length > 0) {
      const existingPermissionIds = existingRolePermissions.map(
        (rp) => rp.permissionId,
      );
      throw new ConflictException(
        `Role already has permissions with IDs: ${existingPermissionIds.join(', ')}`,
      );
    }

    // Create new role-permission relationships
    const rolePermissions = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      }),
    );

    return this.rolePermissionRepository.save(rolePermissions);
  }

  async findAllRolePermissions(): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      relations: ['role', 'permission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findRolePermissionsByRole(roleId: string): Promise<RolePermission[]> {
    // Verify role exists
    await this.findOneRole(roleId);

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
      order: { createdAt: 'DESC' },
    });

    // Log for debugging
    console.log(`[PermissionsService] Found ${rolePermissions.length} role-permissions for role ${roleId}`);
    rolePermissions.forEach((rp, index) => {
      console.log(`[PermissionsService] RolePermission ${index + 1}:`, {
        id: rp.id,
        roleId: rp.roleId,
        permissionId: rp.permissionId,
        hasPermission: !!rp.permission,
        permission: rp.permission ? {
          id: rp.permission.id,
          module: rp.permission.module,
          action: rp.permission.action,
        } : null,
      });
    });

    return rolePermissions;
  }
}

