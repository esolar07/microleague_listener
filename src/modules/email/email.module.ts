import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailController } from "./email.controller";
import { CommonModule } from "../common/modules/common.module";
import { EmailProcessor } from "./processors/email.processor";

@Module({
  imports: [CommonModule],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
