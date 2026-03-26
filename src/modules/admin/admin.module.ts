import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AdminGuard } from "../auth/guards/admin.guard";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { AdminService } from "./admin.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, JwtService, UserService],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}