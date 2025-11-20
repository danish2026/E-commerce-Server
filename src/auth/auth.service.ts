import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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
      },
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

    return {
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
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
        console.log(`✅ Created default user: ${userData.email} (${userData.role})`);
      } else {
        // If user exists but password might be wrong, update it
        const isPasswordValid = await bcrypt.compare(userData.password, existingUser.password);
        if (!isPasswordValid) {
          // Update password if it doesn't match
          await this.usersService.update(existingUser.id, {
            password: userData.password, // Plain password - will be hashed by UsersService.update()
          });
          console.log(`🔄 Updated password for: ${userData.email} (${userData.role})`);
        }
      }
    }
  }
}


