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
