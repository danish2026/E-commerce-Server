import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

export interface ApiStatusResponse {
  message: string;
  version: string;
  status: string;
}

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly authService: AuthService) {}

  async onModuleInit() {
    // Seed default users on application startup
    try {
      await this.authService.seedDefaultUsers();
      console.log('\n📋 Default User Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Super Admin:');
      console.log('  Email: superadmin@example.com');
      console.log('  Password: Super@123');
      console.log('\nSales Manager:');
      console.log('  Email: salesmanager@example.com');
      console.log('  Password: Manager@123');
      console.log('\nSales Man:');
      console.log('  Email: salesman@example.com');
      console.log('  Password: Sales@123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      console.error('Error seeding default users:', error);
    }
  }

  getHello(): ApiStatusResponse {
    return {
      message: 'Welcome to the E-commerce API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
