import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AuthUser } from "src/decorators/user.decorator";
import { PrismaService } from "src/prisma/prisma.service";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(AdminGuard)
  @Get("me")
  async getMe(@AuthUser() user: any) {
    // Handle case where user might be undefined
    if (!user || !user.walletAddress) {
      throw new UnauthorizedException("User not authenticated or wallet address not found");
    }

    try {
      // Use direct Prisma query
      const admin = await this.prisma.$queryRaw`
        SELECT * FROM admins WHERE address = ${user.walletAddress.toLowerCase()} LIMIT 1
      `;
      
      if (!admin || (Array.isArray(admin) && admin.length === 0)) {
        throw new NotFoundException("Admin not found");
      }

      const adminData = Array.isArray(admin) ? admin[0] : admin;
      return adminData;
    } catch (error) {
      console.error("Error in getMe:", error);
      throw error;
    }
  }

  @Get("test")
  async testEndpoint() {
    // Test endpoint without authentication
    return { test: true };
  }

  @Get("by-address/:address")
  async getAdminByAddress(@Param("address") address: string) {
    // Test endpoint to get admin by address without authentication
    try {
      // Use direct Prisma query
      const admin = await this.prisma.$queryRaw`
        SELECT * FROM admins WHERE address = ${address.toLowerCase()} LIMIT 1
      `;
      
      if (!admin || (Array.isArray(admin) && admin.length === 0)) {
        throw new NotFoundException("Admin not found");
      }

      const adminData = Array.isArray(admin) ? admin[0] : admin;
      return adminData;
    } catch (error) {
      console.error("Error in getAdminByAddress:", error);
      throw error;
    }
  }

  @Get()
  async findAll() {
    try {
      // Use direct Prisma query
      const admins = await this.prisma.$queryRaw`
        SELECT * FROM admins ORDER BY "createdAt" DESC
      `;
      
      return admins || [];
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }
}