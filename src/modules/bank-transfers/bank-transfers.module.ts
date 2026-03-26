import { Module } from "@nestjs/common";
import { BankTransfersController } from "./bank-transfers.controller";
import { BankTransfersService } from "./bank-transfers.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";

@Module({
  imports: [PrismaModule],
  controllers: [BankTransfersController],
  providers: [BankTransfersService, JwtService, UserService],
  exports: [BankTransfersService],
})
export class BankTransfersModule {}
