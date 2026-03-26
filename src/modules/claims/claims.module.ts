import { Module } from "@nestjs/common";
import { ClaimsService } from "./claims.service";
import { ClaimsController } from "./claims.controller";
import { CommonModule } from "../common/modules/common.module";
import { JwtService } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [CommonModule, AuthModule],
    controllers: [ClaimsController],
    providers: [ClaimsService, JwtService],
})
export class ClaimsModule {}
