import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { CommonModule } from "../common/modules/common.module";
import { JwtService } from "@nestjs/jwt";
import { AdminService } from "../admin/admin.service";

@Module({
  imports: [CommonModule],
  controllers: [UserController],
  providers: [UserService, JwtService, AdminService],
  exports: [UserService],
})
export class UserModule {}
