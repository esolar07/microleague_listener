import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ClaimsService } from "./claims.service";
import { CreateClaimDto, UpdateClaimDto } from "./dto/claims.dto";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // @UseGuards(AdminAuthGuard)
  @Post("create")
  async createClaim(@Body() data: CreateClaimDto) {
    return this.claimsService.createClaim(data);
  }

  //   @UseGuards(AdminAuthGuard)
  @Get()
  async getProfile(
    @Query("limit") limit: number,
    @Query("page") page: number,
    @Query("email") email: string
  ): Promise<any> {
    try {
      const user = await this.claimsService.findAll(email, limit, page);
      return user;
    } catch (error) {
      console.log(error);
    }
  }

  @Get("user/:userId")
  async getClaimByUserId(
    @Param("userId") userId: string,
    @Query("limit") limit: number = 10, // Pagination limit, defaults to 10
    @Query("page") page: number = 1 // Pagination page, defaults to 1
  ) {
    const claims = await this.claimsService.findClaimByUserId(
      userId,
      limit,
      page
    );

    if (!claims) {
      throw new NotFoundException(`No claims found for userId: ${userId}`);
    }
    return claims;
  }

  @Put("claims/:id")
  async updateClaim(@Param("id") id: string, @Body() data: UpdateClaimDto) {
    return this.claimsService.updateClaim(id, data);
  }

  @Post("details")
  async getTokenDetails(@Body("wallets") wallets: string[]) {
    return await this.claimsService.getTokenDetails(wallets);
  }
}
