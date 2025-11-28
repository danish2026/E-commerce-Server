import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BulkCreatePermissionDto } from './dto/bulk-create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';

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
  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({
      where: {
        module: createPermissionDto.module,
        action: createPermissionDto.action,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Permission ${createPermissionDto.module}.${createPermissionDto.action} already exists`,
      );
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async bulkCreatePermissions(
    bulkCreatePermissionDto: BulkCreatePermissionDto,
  ): Promise<Permission[]> {
    const permissions: Permission[] = [];
    const errors: string[] = [];

    for (const action of bulkCreatePermissionDto.actions) {
      try {
        const existing = await this.permissionRepository.findOne({
          where: {
            module: bulkCreatePermissionDto.module,
            action,
          },
        });

        if (existing) {
          errors.push(
            `Permission ${bulkCreatePermissionDto.module}.${action} already exists`,
          );
          continue;
        }

        const permission = this.permissionRepository.create({
          module: bulkCreatePermissionDto.module,
          action,
          description: bulkCreatePermissionDto.description,
        });
        permissions.push(await this.permissionRepository.save(permission));
      } catch (error) {
        errors.push(`Failed to create ${bulkCreatePermissionDto.module}.${action}`);
      }
    }

    if (permissions.length === 0 && errors.length > 0) {
      throw new ConflictException(errors.join('; '));
    }

    return permissions;
  }

  async getModules(): Promise<string[]> {
    const permissions = await this.permissionRepository.find({
      select: ['module'],
    });
    const uniqueModules = [...new Set(permissions.map((p) => p.module))];
    return uniqueModules.sort();
  }

  // Role methods
  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException(`Role ${createRoleDto.name} already exists`);
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
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
  async findAllRolePermissions(): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      relations: ['role', 'permission'],
      order: { createdAt: 'DESC' },
    });
  }

  async createRolePermission(
    createRolePermissionDto: CreateRolePermissionDto,
  ): Promise<RolePermission[]> {
    // Verify role exists
    const role = await this.roleRepository.findOne({
      where: { id: createRolePermissionDto.roleId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${createRolePermissionDto.roleId} not found`,
      );
    }

    // Verify permissions exist
    const permissions = await this.permissionRepository.find({
      where: { id: In(createRolePermissionDto.permissionIds) },
    });

    if (permissions.length !== createRolePermissionDto.permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Check for existing relationships
    const existing = await this.rolePermissionRepository.find({
      where: {
        roleId: createRolePermissionDto.roleId,
        permissionId: In(createRolePermissionDto.permissionIds),
      },
    });

    if (existing.length > 0) {
      throw new ConflictException(
        'One or more role-permission relationships already exist',
      );
    }

    // Create new relationships
    const rolePermissions = createRolePermissionDto.permissionIds.map(
      (permissionId) =>
        this.rolePermissionRepository.create({
          roleId: createRolePermissionDto.roleId,
          permissionId,
        }),
    );

    return this.rolePermissionRepository.save(rolePermissions);
  }

  async findRolePermissionsByRole(roleId: string): Promise<RolePermission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
      order: { createdAt: 'DESC' },
    });
  }
}
