// auth.module.ts
import { Module } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { jwtConstants } from "src/constants/jwt.constant";
import { CommonModule } from "../common/modules/common.module";
import { AdminService } from "../admin/admin.service";
@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      // secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expire },
      secret: jwtConstants.publicKey,
      verifyOptions: {
        algorithms: ["RS256"],
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    UserService,
    AuthService,
    JwtService,
    AdminService,
  ],
  exports: [AuthService, JwtService, UserService, AdminService],
})
export class AuthModule {}
