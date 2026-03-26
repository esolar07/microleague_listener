import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import * as jwksClient from "jwks-rsa";
import { jwtConstants } from "src/constants/jwt.constant";
import { UserService } from "src/modules/user/user.service";

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  private client: jwksClient.JwksClient;
  constructor(private readonly userService: UserService) {
    this.client = jwksClient({
      jwksUri: jwtConstants.jwksUri,
      rateLimit: true,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    // If no authorization header, just continue without setting user
    if (!authorization) {
      return true;
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return true;
    }

    try {
      // Parse token parts
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        return true; // Invalid token format, continue without user
      }

      // Decode header
      const header = JSON.parse(
        Buffer.from(tokenParts[0], "base64url").toString()
      );

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64url").toString()
      );

      const kid = header?.kid;
      if (!kid) {
        return true; // Missing kid, continue without user
      }

      const authUser = payload?.verified_credentials?.find(
        (item: { address: any }) => item.address
      );

      const user = await this.userService.createOrUpdate({
        email: payload?.email,
        walletAddress: authUser?.address,
      });

      console.log('OptionalAuth - User authenticated:', user?._id || user?.email);
      request.user = user;
      return true;
    } catch (error) {
      // On any error, just continue without user (don't throw)
      console.log("Optional auth failed (continuing):", error.message);
      return true;
    }
  }
}
