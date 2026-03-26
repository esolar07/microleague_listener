import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from './modules/common/modules/common.module';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { EmailModule } from './modules/email/email.module';
import { PurchaseModule } from './modules/purchase/purchase.module';
import { TypeformModule } from './modules/typeform/typeform.module';
import { BankTransfersModule } from './modules/bank-transfers/bank-transfers.module';
import { BankTransfersService } from './modules/bank-transfers/bank-transfers.service';
import { ListenerModule } from './modules/listener/listener.module';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { TransportOptions } from 'nodemailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      cache: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: 'live.smtp.mailtrap.io',
        port: 2525,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'api',
          pass: '81c9e998ef14c7c4cea9b57767b66e6d',
        },
      } as TransportOptions,
      defaults: {
        from: '"No Reply" <no-reply@mail.temoc.io>',
      },
      template: {
        dir: process.cwd() + '/static/email-templates/',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    CommonModule,
    AuthModule,
    UserModule,
    AdminModule,
    TransactionsModule,
    ClaimsModule,
    ListenerModule,
    EmailModule,
    PurchaseModule,
    TypeformModule,
    BankTransfersModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, BankTransfersService],
})
export class AppModule { }
