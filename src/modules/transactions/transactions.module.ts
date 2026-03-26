import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";

@Module({
    imports: [],
    controllers: [TransactionsController],
    providers: [TransactionsService, JwtService, UserService],
})
export class TransactionsModule { }
