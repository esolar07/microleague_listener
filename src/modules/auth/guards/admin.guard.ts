import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as jwksClient from "jwks-rsa";
import { jwtConstants } from "src/constants/jwt.constant";
import { AdminService } from "src/modules/admin/admin.service";

@Injectable()
export class AdminGuard implements CanActivate {
  private jwksClient: jwksClient.JwksClient;

  constructor(
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService
  ) {
    // Initialize JWKS client with Dynamic's JWKS endpoint
    this.jwksClient = jwksClient({
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
      // Get the signing key from JWKS
      const signingKey = await this.getSigningKey(token);

      // Verify JWT using the key from JWKS
      const decoded = this.jwtService.verify(token, {
        secret: signingKey,
        algorithms: ["RS256"],
      });

      if (!decoded) {
        throw new UnauthorizedException("Invalid token");
      }
      const authUser = decoded?.verified_credentials?.find(
        (item: { address: any }) => item.address
      );

      const admin = await this.adminService.adminModel.findOne({
        address: authUser?.address.toLowerCase(),
      });

      // const admin = await this.adminService.adminModel.findOne({
      //   address: { $regex: new RegExp(authUser?.address, "i") },
      // });
      if (!admin) {
        throw new UnauthorizedException("Not an admin");
      }

      // Attach admin info to the request for further processing if needed
      request.user = admin;

      return true; // Allow access
    } catch (error) {
      throw new UnauthorizedException("Unauthorized");
    }
  }

  private async getSigningKey(token: string): Promise<string> {
    try {
      // Decode the token header to get the key ID (kid)
      const decodedHeader = this.jwtService.decode(token, {
        complete: true,
      }) as any;
      const kid = decodedHeader?.header?.kid;

      if (!kid) {
        throw new Error("Token does not have a key ID (kid)");
      }

      // Get the signing key from JWKS
      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      console.log("Error getting signing key:", error);
      throw new UnauthorizedException("Unable to verify token signature");
    }
  }
}
