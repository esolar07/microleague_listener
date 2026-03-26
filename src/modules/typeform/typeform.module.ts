import { Module } from "@nestjs/common";
import { TypeformService } from "./typeform.service";
import { TypeformController } from "./typeform.controller";
import { CommonModule } from "../common/modules/common.module";
import { JwtService } from "@nestjs/jwt";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [CommonModule, EmailModule],
  controllers: [TypeformController],
  providers: [TypeformService, JwtService],
})
export class TypeformModule {}
