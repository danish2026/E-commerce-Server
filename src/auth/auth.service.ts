import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Map User Role enum to permissions module role name
   */
  private mapRoleEnumToRoleName(roleEnum: Role): string {
    const roleMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'SUPER_ADMIN',
      'SALES_MANAGER': 'SALES_MANAGER',
      'SALES_MAN': 'SALES_MAN',
    };
    return roleMap[roleEnum] || roleEnum;
  }

  /**
   * Normalize role strings so comparisons remain consistent regardless of casing/spacing
   */
  private normalizeRoleName(value: string): string {
    return value?.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_').trim();
  }

  /**
   * Convert a role ID into a mapped permission payload
   */
  private async getPermissionsByRoleId(roleId: string) {
    try {
      const rolePermissions = await this.permissionsService.findRolePermissionsByRole(roleId);
      return rolePermissions
        .map((rp) => {
          if (!rp.permission) {
            console.warn(`[AuthService] RolePermission ${rp.id} has no permission relation loaded`);
            return null;
          }
          return {
            id: rp.permission.id,
            module: rp.permission.module,
            action: rp.permission.action,
            description: rp.permission.description,
          };
        })
        .filter((permission): permission is NonNullable<typeof permission> => !!permission && !!permission.id);
    } catch (error) {
      console.error('[AuthService] Error fetching permissions by role ID:', error);
      return [];
    }
  }

  private async findRoleMatchByName(roleName: string) {
    const normalizedSearchName = this.normalizeRoleName(roleName);
    console.log(`[AuthService] Looking for role: ${roleName} (normalized: ${normalizedSearchName})`);

    const allRoles = await this.permissionsService.findAllRoles();
    console.log(`[AuthService] Available roles in permissions module:`, allRoles.map((r) => r.name));

    let userRole = allRoles.find(
      (role) => this.normalizeRoleName(role.name) === normalizedSearchName,
    );

    if (!userRole) {
      userRole = allRoles.find((role) => {
        const roleWords = this.normalizeRoleName(role.name).split('_');
        const searchWords = normalizedSearchName.split('_');
        return searchWords.every((word) =>
          roleWords.some((roleWord) => roleWord.includes(word) || word.includes(roleWord)),
        );
      });
    }

    if (!userRole) {
      console.warn(
        `[AuthService] Role "${roleName}" not found in permissions module. Available roles: ${allRoles
          .map((r) => r.name)
          .join(', ')}`,
      );
    }

    return userRole;
  }

  /**
   * Resolve permissions for a given role enum by looking up role-permission relationships
   */
  private async getPermissionsForRole(roleEnum: Role) {
    const roleName = this.mapRoleEnumToRoleName(roleEnum);
    const matchedRole = await this.findRoleMatchByName(roleName);
    if (!matchedRole) {
      return [];
    }
    console.log(`[AuthService] Found role: ${matchedRole.name} (ID: ${matchedRole.id})`);
    return this.getPermissionsByRoleId(matchedRole.id);
  }

  /**
   * Resolve permissions for a given user. Prefer explicit permission role mapping over enum.
   */
  private async getPermissionsForUser(user: User) {
    if (user.permissionsRoleId) {
      const permissions = await this.getPermissionsByRoleId(user.permissionsRoleId);
      if (permissions.length > 0) {
        return permissions;
      }
      console.warn(
        `[AuthService] No permissions linked to stored role ID ${user.permissionsRoleId} for user ${user.email}`,
      );
    }

    if (user.permissionsRoleName) {
      const matchedRole = await this.findRoleMatchByName(user.permissionsRoleName);
      if (matchedRole) {
        return this.getPermissionsByRoleId(matchedRole.id);
      }
    }

    return this.getPermissionsForRole(user.role);
  }

  /**
   * Fetch authenticated user details along with permissions for token validation scenarios
   */
  async getAuthenticatedUser(userId: string) {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions = await this.getPermissionsForUser(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissionsRoleId: user.permissionsRoleId,
        permissionsRoleName: user.permissionsRoleName,
      },
      permissions,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Fetch user's permissions based on their role
    const permissions = await this.getPermissionsForUser(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from user object before returning
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissionsRoleId: user.permissionsRoleId,
        permissionsRoleName: user.permissionsRoleName,
      },
      permissions, // Include permissions in login response
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create new user with default role SALES_MAN
    const newUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      isActive: true,
      role: Role.SALES_MAN, // Default role for new registrations
    });

    // Generate JWT token
    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from user object before returning
    const { password, ...userWithoutPassword } = newUser;

    // Fetch user's permissions for registration (same as login)
    const permissions = await this.getPermissionsForUser(newUser);

    return {
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        permissionsRoleId: newUser.permissionsRoleId,
        permissionsRoleName: newUser.permissionsRoleName,
      },
      permissions,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  /**
   * Seed default users for testing/development
   * Creates default users if they don't exist
   */
  async seedDefaultUsers(): Promise<void> {
    const defaultUsers = [
      {
        email: 'superadmin@example.com',
        password: 'Super@123',
        role: Role.SUPER_ADMIN,
        firstName: 'Super',
        lastName: 'Admin',
      },
      {
        email: 'salesmanager@example.com',
        password: 'Manager@123',
        role: Role.SALES_MANAGER,
        firstName: 'Sales',
        lastName: 'Manager',
      },
      {
        email: 'salesman@example.com',
        password: 'Sales@123',
        role: Role.SALES_MAN,
        firstName: 'Sales',
        lastName: 'Man',
      },
    ];

    for (const userData of defaultUsers) {
      const existingUser = await this.usersService.findByEmail(userData.email);
      if (!existingUser) {
        // Pass plain password - UsersService.create() will hash it
        await this.usersService.create({
          email: userData.email,
          password: userData.password, // Plain password - will be hashed by UsersService
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
        });
      } else {
        // If user exists but password might be wrong, update it
        const isPasswordValid = await bcrypt.compare(userData.password, existingUser.password);
        if (!isPasswordValid) {
          // Update password if it doesn't match
          await this.usersService.update(existingUser.id, {
            password: userData.password, // Plain password - will be hashed by UsersService.update()
          });
        }
      }
    }
  }
}


