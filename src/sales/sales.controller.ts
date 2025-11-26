import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor() {}

  /**
   * Get all sales - SUPER_ADMIN can access
   */
  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all sales (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all sales' })
  findAll() {
    // TODO: Implement sales service
    return { message: 'Sales list - to be implemented' };
  }

  /**
   * Get sale by ID - SUPER_ADMIN can access
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get sale by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Sale details' })
  findOne(@Param('id') id: string) {
    // TODO: Implement sales service
    return { message: `Sale ${id} - to be implemented` };
  }

  /**
   * Create new sale - SUPER_ADMIN can access
   */
  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new sale (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  create(@Body() createSaleDto: any) {
    // TODO: Implement sales service
    return { message: 'Sale created - to be implemented' };
  }

  /**
   * Update sale - SUPER_ADMIN can access
   */
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update sale (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully' })
  update(@Param('id') id: string, @Body() updateSaleDto: any) {
    // TODO: Implement sales service
    return { message: `Sale ${id} updated - to be implemented` };
  }

  /**
   * Delete sale - Only SUPER_ADMIN can access
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete sale (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully' })
  remove(@Param('id') id: string) {
    // TODO: Implement sales service
    return { message: `Sale ${id} deleted - to be implemented` };
  }
}

