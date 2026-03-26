import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'microleague-listener',
    };
  }

  @Get('database')
  async getDatabaseHealth() {
    try {
      // Try a simple query to test database connection
      await this.prisma.user.count();
      return {
        status: 'connected',
        database: 'postgresql',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'disconnected',
        database: 'postgresql',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}