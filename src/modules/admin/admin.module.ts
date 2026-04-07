import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { PrismaModule } from "src/prisma/prisma.module";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AdminService } from "./admin.service";
import { ListenerModule } from "../listener/listener.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, ListenerModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
