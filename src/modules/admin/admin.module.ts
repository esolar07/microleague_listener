import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/modules/common.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [CommonModule],
  controllers: [AdminController],
  providers: [AdminService, JwtService],
})
export class AdminModule {}
