import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import type { UserPayload } from '../auth/decorators/user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users - Only SUPER_ADMIN can access
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users (Super Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all users' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Get current user profile - All authenticated users can access
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current user profile' })
  async getProfile(@CurrentUser() user: UserPayload) {
    const userData = await this.usersService.findOne(user.id);
    if (!userData) {
      return null;
    }
    const { password, ...userWithoutPassword } = userData;
    return userWithoutPassword;
  }

  /**
   * Get user by ID - SUPER_ADMIN and SALES_MANAGER can access
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Get user by ID (Super Admin & Sales Manager only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User details' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      return null;
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create new user - Only SUPER_ADMIN can access
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (Super Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user - Only SUPER_ADMIN can access
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user (Super Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    const user = await this.usersService.update(id, updateData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Delete user - Only SUPER_ADMIN can access
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }
}

