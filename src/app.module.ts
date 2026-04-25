import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { BankTransfersModule } from './modules/bank-transfers/bank-transfers.module';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ListenerModule } from './modules/listener/listener.module';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { TransportOptions } from 'nodemailer';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
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
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    AdminModule,
    BankTransfersModule,
    TransactionsModule,
    ListenerModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }