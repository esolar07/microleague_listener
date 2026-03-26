import { Module } from "@nestjs/common";
import { PurchaseService } from "./purchase.service";
import { PurchaseController } from "./purchase.controller";
import { CommonModule } from "../common/modules/common.module";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [CommonModule],
  controllers: [PurchaseController],
  providers: [PurchaseService, JwtService],
})
export class PurchaseModule {}
