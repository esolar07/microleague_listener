import { Module } from '@nestjs/common';
import { PrivateSaleSubmissionsController } from './private-sale-submissions.controller';
import { PrivateSaleSubmissionsService } from './private-sale-submissions.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmailQueueModule } from '../queue/email/email.queue.module';

@Module({
  imports: [PrismaModule, AuthModule, EmailQueueModule],
  controllers: [PrivateSaleSubmissionsController],
  providers: [PrivateSaleSubmissionsService],
  exports: [PrivateSaleSubmissionsService],
})
export class PrivateSaleSubmissionsModule {}
