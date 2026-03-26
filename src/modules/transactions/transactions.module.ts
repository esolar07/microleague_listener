import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { CommonModule } from "../common/modules/common.module";
import { JwtService } from "@nestjs/jwt";
import { AdminService } from "../admin/admin.service";
import { UserService } from "../user/user.service";

@Module({
    imports: [CommonModule],
    controllers: [TransactionsController],
    providers: [TransactionsService, JwtService, AdminService, UserService],
})
export class TransactionsModule { }
