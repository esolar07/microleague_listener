import { Module } from "@nestjs/common";
import { EmailQueueService } from "./email.queue.service";
// import { BullModule } from '@nestjs/bull';
// import { QUEUE_EMAIL_SERVICE } from 'src/constants/queue.constants';
// import { EmailQueueProcessor } from './email.queue.processor';

@Module({
  imports: [
    /*  BullModule.registerQueueAsync({
      name: QUEUE_EMAIL_SERVICE,
      useFactory: async () => ({
        redis: {
          host: process.env.REDIS_URL || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || '',
        },
        limiter: {
          max: 3,
          duration: 3000,
        },
        defaultJobOptions: {
          //removeOnComplete: true,
          //removeOnFail: true,
          //delay: 15000,
        },
      }),
    }), */
  ],
  exports: [EmailQueueService],
  providers: [EmailQueueService],
})
export class EmailQueueModule {}
