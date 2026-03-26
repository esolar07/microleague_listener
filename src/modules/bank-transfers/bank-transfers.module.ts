import { Module } from "@nestjs/common";
import { BankTransfersController } from "./bank-transfers.controller";
import { JwtService } from "@nestjs/jwt";
import { CommonModule } from "../common/modules/common.module";
import { BankTransfersService } from "./bank-transfers.service";
import { AdminService } from "../admin/admin.service";

@Module({
  imports: [CommonModule],
  controllers: [BankTransfersController],
  providers: [BankTransfersService,JwtService,AdminService],
})
export class BankTransfersModule {}
