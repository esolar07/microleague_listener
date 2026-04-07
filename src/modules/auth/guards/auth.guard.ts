import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/modules/user/user.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Missing token");
    }

    try {
      const payload = this.jwtService.verify(token);
      const walletAddress = payload.address;

      if (!walletAddress) {
        throw new UnauthorizedException("Invalid token payload");
      }

      const user = await this.userService.createOrUpdate({ walletAddress });
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Authentication failed: ${error.message}`,
      );
    }
  }
}
