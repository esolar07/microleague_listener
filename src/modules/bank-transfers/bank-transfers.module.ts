import { Module } from "@nestjs/common";
import { BankTransfersController } from "./bank-transfers.controller";
import { BankTransfersService } from "./bank-transfers.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BankTransfersController],
  providers: [BankTransfersService],
  exports: [BankTransfersService],
})
export class BankTransfersModule {}
