import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../user/entities/user.entity';
import { DB_COLLECTIONS } from 'src/constants/collections';
import { AdminSchema } from 'src/modules/admin/entities/admin.entity';
import { ClaimRequestSchema } from 'src/modules/claims/entities/claims.entity';
import { PresaleTxsSchema } from 'src/modules/transactions/entities/presale.entity';
import { PurchaseSchema } from 'src/modules/purchase/entities/purchase.entity';
import { TypeformSchema } from 'src/modules/typeform/entities/typeform.entity';
import { ProgressSchema } from 'src/modules/admin/entities/progress.entity';
import { BankTransferSchema } from 'src/modules/bank-transfers/entities/bank-transfer.entity';
import { StateSchema } from 'src/modules/listener/entity/listener.state.entity';
import { NotificationSchema } from 'src/modules/notifications/entities/notification.entity';
import { FailedEventSchema } from 'src/modules/listener/entities/failed-event.entity';

const models = [
  { name: DB_COLLECTIONS.USERS, schema: UserSchema },
  { name: DB_COLLECTIONS.ADMIN, schema: AdminSchema },
  { name: DB_COLLECTIONS.CLAIM_REQUEST, schema: ClaimRequestSchema },
  { name: DB_COLLECTIONS.PRE_SALES_TXS, schema: PresaleTxsSchema },
  { name: DB_COLLECTIONS.PURCHASE, schema: PurchaseSchema },
  { name: DB_COLLECTIONS.TYPEFORM, schema: TypeformSchema },
  { name: DB_COLLECTIONS.PROGRESS, schema: ProgressSchema },
  { name: DB_COLLECTIONS.BANK_TRANSFER, schema: BankTransferSchema },
  { name: DB_COLLECTIONS.STATE, schema: StateSchema },
  { name: DB_COLLECTIONS.NOTIFICATION, schema: NotificationSchema },
  { name: DB_COLLECTIONS.FAILED_EVENTS, schema: FailedEventSchema },
];
@Module({
  imports: [MongooseModule.forFeature(models)],
  exports: [MongooseModule.forFeature(models)],
})
export class DatabaseModule {}
