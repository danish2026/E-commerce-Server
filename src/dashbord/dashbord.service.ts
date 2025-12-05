// // import { Injectable } from '@nestjs/common';
// // import { CreateDashbordDto } from './dto/create-dashbord.dto';
// // import { UpdateDashbordDto } from './dto/update-dashbord.dto';

// // @Injectable()
// // export class DashbordService {
// //   create(createDashbordDto: CreateDashbordDto) {
// //     return 'This action adds a new dashbord';
// //   }

// //   findAll() {
// //     return `This action returns all dashbord`;
// //   }

// //   findOne(id: number) {
// //     return `This action returns a #${id} dashbord`;
// //   }

// //   update(id: number, updateDashbordDto: UpdateDashbordDto) {
// //     return `This action updates a #${id} dashbord`;
// //   }

// //   remove(id: number) {
// //     return `This action removes a #${id} dashbord`;
// //   }
// // }

// import { Injectable } from '@nestjs/common';
// import { Dashbord } from './dashbord.entity';
// import { OrderItem } from 'src/order-item/order-item.entity';

// @Injectable()
// export class DashbordService {
//   orderItemRepo: any;
  
//   async getDashboardStats(): Promise<Dashbord> {
//     const todayStats = await this.getTodayStats();
//     const monthlyStats = await this.getMonthlyStats();
//     const orderItems = await this.orderItemRepo.find({
//       relations: ['product', 'order'],})

//     const dashboard = new Dashbord();
//     dashboard.todayRevenue = todayStats.revenue;
//     dashboard.todayOrders = todayStats.orders;
//     dashboard.monthlyRevenue = monthlyStats.revenue;
//     dashboard.monthlyOrders = monthlyStats.orders;

//     return dashboard;
//   }

//   async getTodayStats(): Promise<{ revenue: number; orders: number }> {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     // TODO: Replace with actual database query
//     // Example:
//     // const orders = await this.orderRepository.find({
//     //   where: {
//     //     createdAt: Between(today, tomorrow),
//     //     status: 'completed'
//     //   }
//     // });
//     // const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    
//     return {
//       revenue: 1000.50,
//       orders: 5
//     };
//   }

//   async getMonthlyStats(): Promise<{ revenue: number; orders: number }> {
//     const now = new Date();
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

//     // TODO: Replace with actual database query
//     // Example:
//     // const orders = await this.orderRepository.find({
//     //   where: {
//     //     createdAt: Between(firstDayOfMonth, lastDayOfMonth),
//     //     status: 'completed'
//     //   }
//     // });
//     // const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    
//     return {
//       revenue: 25000.75,
//       orders: 40
//     };
//   }

//   async getDateRangeStats(startDate: string, endDate: string): Promise<Dashbord> {
//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     // TODO: Replace with actual database query based on date range
    
//     const dashboard = new Dashbord();
//     dashboard.todayRevenue = 1000.50;
//     dashboard.todayOrders = 5;
//     dashboard.monthlyRevenue = 25000.75;
//     dashboard.monthlyOrders = 40;
//     dashboard.OrderItem = OrderItem;
//     return dashboard;
//   }
// }


// import { Injectable } from '@nestjs/common';
// import { Dashbord } from './dashbord.entity';
// import { OrderItem } from 'src/order-item/order-item.entity';

// @Injectable()
// export class DashbordService {
//   orderItemRepo: any;
  
//   async getDashboardStats(): Promise<Dashbord> {
//     const todayStats = await this.getTodayStats();
//     const monthlyStats = await this.getMonthlyStats();
//     const orderItems = await this.orderRepository.find()({
//       relations: ['product', 'order'],
//     });

//     const dashboard = new Dashbord();
//     dashboard.todayRevenue = todayStats.revenue;
//     dashboard.todayOrders = todayStats.orders;
//     dashboard.monthlyRevenue = monthlyStats.revenue;
//     dashboard.monthlyOrders = monthlyStats.orders;
//     dashboard.orderItems = orderItems; // Add this line

//     return dashboard;
//   }

//   async getTodayStats(): Promise<{ revenue: number; orders: number }> {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     // TODO: Replace with actual database query
    
//     return {
//       revenue: 1000.50,
//       orders: 5
//     };
//   }

//   async getMonthlyStats(): Promise<{ revenue: number; orders: number }> {
//     const now = new Date();
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

//     // TODO: Replace with actual database query
    
//     return {
//       revenue: 25000.75,
//       orders: 40
//     };
//   }

//   async getDateRangeStats(startDate: string, endDate: string): Promise<Dashbord> {
//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     // Fetch orderItems for the date range
//     const orderItems = await this.orderItemRepo.find({
//       relations: ['product', 'order'],
//       // Add where clause for date range filtering when implementing
//     });

//     const dashboard = new Dashbord();
//     dashboard.todayRevenue = 1000.50;
//     dashboard.todayOrders = 5;
//     dashboard.monthlyRevenue = 25000.75;
//     dashboard.monthlyOrders = 40;
//     dashboard.orderItems = orderItems; // Changed from OrderItem to orderItems

//     return dashboard;
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Dashbord } from './dashbord.entity';
import { OrderItem } from 'src/billing/order-item.entity';

@Injectable()
export class DashbordService {
  getDashboardData() {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getDashboardStats(): Promise<Dashbord> {
    const [todayStats, monthlyStats, totalStats, orderItems] = await Promise.all([
      this.getTodayStats(),
      this.getMonthlyStats(),
      this.getTotalStats(),
      this.orderItemRepository.find({
        relations: ['product'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    const dashboard = new Dashbord();
    dashboard.todayRevenue = todayStats.revenue;
    dashboard.todayOrders = todayStats.orders;
    dashboard.monthlyRevenue = monthlyStats.revenue;
    dashboard.monthlyOrders = monthlyStats.orders;
    dashboard.totalRevenue = totalStats.revenue;
    dashboard.totalOrders = totalStats.orders;
    dashboard.orderItems = orderItems;

    return dashboard;
  }

  async getTodayStats(): Promise<{ revenue: number; orders: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getStatsBetween(today, tomorrow);
  }

  async getMonthlyStats(): Promise<{ revenue: number; orders: number }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.getStatsBetween(firstDayOfMonth, lastDayOfMonth);
  }

  async getDateRangeStats(startDate: string, endDate: string): Promise<Dashbord> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    end.setHours(23, 59, 59, 999);

    const [rangeStats, orderItems] = await Promise.all([
      this.getStatsBetween(start, end),
      this.orderItemRepository.find({
        where: { createdAt: Between(start, end) },
        relations: ['product'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    const dashboard = new Dashbord();
    dashboard.todayRevenue = rangeStats.revenue;
    dashboard.todayOrders = rangeStats.orders;
    dashboard.monthlyRevenue = rangeStats.revenue;
    dashboard.monthlyOrders = rangeStats.orders;
    dashboard.totalRevenue = rangeStats.revenue;
    dashboard.totalOrders = rangeStats.orders;
    dashboard.dateRangeRevenue = rangeStats.revenue;
    dashboard.dateRangeOrders = rangeStats.orders;
    dashboard.orderItems = orderItems;

    return dashboard;
  }

  private async getTotalStats(): Promise<{ revenue: number; orders: number }> {
    return this.getStatsBetween();
  }

  private async getStatsBetween(
    start?: Date,
    end?: Date,
  ): Promise<{ revenue: number; orders: number }> {
    const qb = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select(
        'COALESCE(SUM(orderItem.totalAmount - COALESCE(orderItem.discount, 0)), 0)',
        'revenue',
      )
      .addSelect('COUNT(orderItem.id)', 'orders');

    if (start) {
      qb.andWhere('orderItem.createdAt >= :start', { start });
    }

    if (end) {
      qb.andWhere('orderItem.createdAt <= :end', { end });
    }

    const raw = await qb.getRawOne<{ revenue: string; orders: string }>();

    return {
      revenue: Number(raw?.revenue ?? 0),
      orders: Number(raw?.orders ?? 0),
    };
  }
}
