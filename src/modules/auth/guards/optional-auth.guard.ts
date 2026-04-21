import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/modules/user/user.service";

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      return true;
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return true;
    }

    try {
      const payload = this.jwtService.verify(token);
      const walletAddress = payload.address;

      if (!walletAddress) {
        return true;
      }

      const user = await this.userService.createOrUpdate({ walletAddress });
      request.user = user;
      return true;
    } catch (error) {
      // On any error, continue without user
      console.log("Optional auth failed (continuing):", error.message);
      return true;
    }
  }
}
