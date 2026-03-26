import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import * as jwksClient from "jwks-rsa";
import { jwtConstants } from "src/constants/jwt.constant";
import { UserService } from "src/modules/user/user.service";
@Injectable()
export class JwtAuthGuard implements CanActivate {
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
    if (!authorization) {
      throw new UnauthorizedException("Missing authorization header");
    }
    const token = authorization.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Missing token");
    }
    try {
      // Parse token parts manually for debugging
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        throw new UnauthorizedException("Invalid token format - not 3 parts");
      }
      // Decode header
      const header = JSON.parse(
        Buffer.from(tokenParts[0], "base64url").toString()
      );
      // Decode payload (without verification for debugging)
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64url").toString()
      );
      const kid = header?.kid;
      if (!kid) {
        throw new UnauthorizedException("Token missing kid in header");
      }
      const authUser = payload?.verified_credentials?.find(
        (item: { address: any }) => item.address
      );
      const user = await this.userService.createOrUpdate({
        email: payload?.email,
        walletAddress: authUser?.address,
      });
      request.user = user;
      return true;
    } catch (error) {
      console.error("=== JWT GUARD ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For any other error, wrap it
      throw new UnauthorizedException(
        `Authentication failed: ${error.message}`
      );
    }
  }
}