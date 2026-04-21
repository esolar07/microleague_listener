import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "microleague-presale-jwt-secret-change-me",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [UserService, AuthService],
  exports: [AuthService, UserService, JwtModule],
})
export class AuthModule {}
