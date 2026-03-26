import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { queueNames } from 'src/constants/queue.constants';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        username: process.env.REDIS_USERNAME,
      },
    }),
    BullModule.registerQueue({
      name: queueNames.email,
    }),
    BullModule.registerQueue({
      name: queueNames.notification,
    }),
    BullModule.registerQueue({
      name: queueNames.poolCycle,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 86400, // 24 hours
        },
        removeOnFail: false,
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
