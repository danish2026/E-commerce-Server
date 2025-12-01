import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DashbordService } from './dashbord.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Dashbord } from './dashbord.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashbordController {
  constructor(private readonly dashbordService: DashbordService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: Dashbord, description: 'Dashboard statistics retrieved successfully' })
  getDashboardStats(): Promise<Dashbord> {
    return this.dashbordService.getDashboardStats();
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today statistics' })
  @ApiResponse({ status: 200, description: 'Today statistics retrieved successfully' })
  getTodayStats(): Promise<{ revenue: number; orders: number }> {
    return this.dashbordService.getTodayStats();
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly statistics' })
  @ApiResponse({ status: 200, description: 'Monthly statistics retrieved successfully' })
  getMonthlyStats(): Promise<{ revenue: number; orders: number }> {
    return this.dashbordService.getMonthlyStats();
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get statistics for a specific date range' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-05-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-05-31' })
  @ApiResponse({ status: 200, description: 'Date range statistics retrieved successfully' })
  getDateRangeStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Dashbord> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query params are required.');
    }

    return this.dashbordService.getDateRangeStats(startDate, endDate);
  }
}