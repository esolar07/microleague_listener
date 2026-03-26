import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        console.log(process.env.DATABASE_URL, 'process.env.DATABASE_URL');

        super({
            accelerateUrl: process.env.DATABASE_URL,
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully');
        } catch (error) {
            this.logger.error('❌ Database connection failed:', error);
            this.logger.warn('⚠️  Application will continue without database connection');
            // Don't throw error to allow app to start without DB connection
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}