import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CreatePurchaseItemDto } from './dto/create-purchase-item.dto';
import { UpdatePurchaseItemDto } from './dto/update-purchase-item.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseItem } from './purchase-item.entity';
import { PurchaseItemService } from './purchase-item.service';
import { PurchaseItemFilterDto } from './dto/purchase-item-filter.dto';
import { PaginatedPurchaseItemResponse } from './dto/paginated-purchase-item-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('purchase-item')
@Controller('purchase-item')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseItemController {
  constructor(private readonly purchaseItemService: PurchaseItemService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create purchase item (Super Admin only)' })
  create(@Body() createPurchaseItemDto: CreatePurchaseItemDto) {
    return this.purchaseItemService.create(createPurchaseItemDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all purchase items with pagination and filters (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of purchase items',
    type: PaginatedPurchaseItemResponse,
  })
  findAll(@Query() filterDto: PurchaseItemFilterDto) {
    return this.purchaseItemService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a purchase item by id (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns a purchase item by id',
    type: PurchaseItem,
  })
  findOne(@Param('id') id: string) {
    return this.purchaseItemService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a purchase item by id (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns an updated purchase item by id',
    type: PurchaseItem,
  })
  update(@Param('id') id: string, @Body() updatePurchaseItemDto: UpdatePurchaseItemDto) {
    return this.purchaseItemService.update(id, updatePurchaseItemDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a purchase item by id (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns a deleted purchase item by id',
    type: PurchaseItem,
  })
  remove(@Param('id') id: string) {
    return this.purchaseItemService.remove(id);
  }
}
