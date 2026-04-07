import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./guards/auth.guard";
import { AuthUser } from "src/decorators/user.decorator";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Frontend requests a nonce for the wallet to sign.
   */
  @Post("nonce")
  async getNonce(@Body("walletAddress") walletAddress: string) {
    if (!walletAddress) {
      throw new BadRequestException("walletAddress is required");
    }
    const { nonce, message } = await this.authService.generateNonce(walletAddress);
    return { nonce, message };
  }

  /**
   * Step 2: Frontend sends the signed message back. Backend verifies and returns a JWT.
   */
  @Post("verify")
  async verify(
    @Body("walletAddress") walletAddress: string,
    @Body("signature") signature: string,
    @Body("message") message: string,
  ) {
    if (!walletAddress || !signature || !message) {
      throw new BadRequestException("walletAddress, signature, and message are required");
    }

    try {
      const result = await this.authService.verifySignature(walletAddress, signature, message);
      return result;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * Returns the authenticated user (requires valid JWT).
   */
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getAuthUser(@AuthUser() user: any) {
    return user;
  }
}
