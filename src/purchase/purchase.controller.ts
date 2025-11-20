import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseFilterDto } from './dto/purchase-filter.dto';
import { PaginatedPurchaseResponse } from './dto/paginated-purchase-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('purchase')
@Controller('purchase')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create a new purchase (Super Admin & Sales Manager only)' })
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchaseService.create(createPurchaseDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Get all purchases with pagination and filters (Super Admin & Sales Manager only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of purchases',
    type: PaginatedPurchaseResponse,
  })
  findAll(@Query() filterDto: PurchaseFilterDto) {
    return this.purchaseService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Get purchase by ID (Super Admin & Sales Manager only)' })
  findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update purchase (Super Admin & Sales Manager only)' })
  update(@Param('id') id: string, @Body() updatePurchaseDto: UpdatePurchaseDto) {
    return this.purchaseService.update(id, updatePurchaseDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Delete purchase (Super Admin & Sales Manager only)' })
  remove(@Param('id') id: string) {
    return this.purchaseService.remove(id);
  }
}
