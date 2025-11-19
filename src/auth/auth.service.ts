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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Only allow login with specific email: danish@gmail.com
    const ALLOWED_EMAIL = 'danish@gmail.com';
    const ALLOWED_PASSWORD = 'dani@123';

    // Check if the email matches the allowed email
    if (loginDto.email !== ALLOWED_EMAIL) {
      throw new UnauthorizedException('Invalid email or password. Only authorized users can login.');
    }

    // Check if the password matches the allowed password
    if (loginDto.password !== ALLOWED_PASSWORD) {
      throw new UnauthorizedException('Invalid email or password. Only authorized users can login.');
    }

    // Find or create the allowed user
    let user = await this.usersService.findByEmail(ALLOWED_EMAIL);
    
    if (!user) {
      // Create the user if it doesn't exist
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(ALLOWED_PASSWORD, saltRounds);
      
      user = await this.usersService.create({
        email: ALLOWED_EMAIL,
        password: hashedPassword,
        isActive: true,
      });
    } else {
      // Verify password matches (in case it was changed in DB)
      const isPasswordValid = await bcrypt.compare(
        ALLOWED_PASSWORD,
        user.password,
      );

      if (!isPasswordValid) {
        // Update password if it doesn't match (in case DB was modified)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(ALLOWED_PASSWORD, saltRounds);
        user = await this.usersService.update(user.id, {
          password: hashedPassword,
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = {
      sub: user.id,
      email: user.email,
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

    // Create new user
    const newUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      isActive: true,
    });

    // Generate JWT token
    const payload = {
      sub: newUser.id,
      email: newUser.email,
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
}


