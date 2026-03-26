import { Module, forwardRef } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { QueueModule } from '../common/modules/queue.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_COLLECTIONS } from 'src/constants/collections';
import { NotificationSchema } from './entities/notification.entity';
import { UserModule } from '../user/user.module';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    QueueModule,
    MongooseModule.forFeature([{ name: DB_COLLECTIONS.NOTIFICATION, schema: NotificationSchema }]),
    forwardRef(() => UserModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessor, NotificationGateway, JwtService],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
