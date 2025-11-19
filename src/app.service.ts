import { Injectable } from '@nestjs/common';

export interface ApiStatusResponse {
  message: string;
  version: string;
  status: string;
}

@Injectable()
export class AppService {
  getHello(): ApiStatusResponse {
    return {
      message: 'Welcome to the E-commerce API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
