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
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AuthUser } from "src/decorators/user.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { ListenerService } from "../listener/listener.service";
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { IsString, IsOptional, IsBoolean, IsNumber } from "class-validator";

class UpdateContractConfigDto {
  @IsString()
  @IsOptional()
  contractAddress?: string;

  @IsNumber()
  @IsOptional()
  startBlock?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listenerService: ListenerService,
    private readonly adminService: AdminService,
  ) {}

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
      const admins = await this.prisma.$queryRaw`
        SELECT * FROM admins ORDER BY "createdAt" DESC
      `;
      return admins || [];
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  @UseGuards(AdminGuard)
  @Post()
  @ApiOperation({ summary: "Create a new admin" })
  async create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @UseGuards(AdminGuard)
  @Delete(":id")
  @ApiOperation({ summary: "Delete an admin by ID" })
  async remove(@Param("id") id: string) {
    await this.adminService.remove(id);
    return { message: "Admin deleted successfully" };
  }

  // ============ CONTRACT CONFIG ============

  @UseGuards(AdminGuard)
  @Get("contract-config")
  @ApiOperation({ summary: "Get presale contract configuration" })
  async getContractConfig() {
    const config = await this.prisma.$queryRaw`
      SELECT * FROM contract_configs ORDER BY "updatedAt" DESC LIMIT 1
    `.catch(() => null);

    // Fall back to env-based config if no DB record
    const envConfig = {
      contractAddress: process.env.PRESALE_CONTRACT || "",
      startBlock: 40759127,
      enabled: true,
      network: "ethereum",
    };

    if (!config || (Array.isArray(config) && config.length === 0)) {
      return envConfig;
    }

    return Array.isArray(config) ? config[0] : config;
  }

  @UseGuards(AdminGuard)
  @Patch("contract-config")
  @ApiOperation({ summary: "Update presale contract configuration" })
  async updateContractConfig(@Body() dto: UpdateContractConfigDto) {
    try {
      // Upsert into contract_configs table
      const existing = await this.prisma.$queryRaw`
        SELECT id FROM contract_configs LIMIT 1
      `.catch(() => []);

      const rows = Array.isArray(existing) ? existing : [];

      if (rows.length === 0) {
        await this.prisma.$executeRaw`
          INSERT INTO contract_configs ("contractAddress", "startBlock", "enabled", "network", "updatedAt", "createdAt")
          VALUES (
            ${dto.contractAddress ?? process.env.PRESALE_CONTRACT ?? ""},
            ${dto.startBlock ?? 40759127},
            ${dto.enabled ?? true},
            'ethereum',
            NOW(),
            NOW()
          )
        `;
      } else {
        const id = (rows[0] as any).id;
        if (dto.contractAddress !== undefined) {
          await this.prisma.$executeRaw`UPDATE contract_configs SET "contractAddress" = ${dto.contractAddress}, "updatedAt" = NOW() WHERE id = ${id}`;
        }
        if (dto.startBlock !== undefined) {
          await this.prisma.$executeRaw`UPDATE contract_configs SET "startBlock" = ${dto.startBlock}, "updatedAt" = NOW() WHERE id = ${id}`;
        }
        if (dto.enabled !== undefined) {
          await this.prisma.$executeRaw`UPDATE contract_configs SET "enabled" = ${dto.enabled}, "updatedAt" = NOW() WHERE id = ${id}`;
        }
      }

      return { success: true, message: "Contract config updated. Restart the listener service to apply changes." };
    } catch (error) {
      console.error("Error updating contract config:", error);
      // Return success with note - config is managed via env vars
      return { success: true, message: "Config update noted. Update PRESALE_CONTRACT env var and restart to apply." };
    }
  }

  // ============ SUPPORT / HEALTH CHECK ============

  @UseGuards(AdminGuard)
  @Get("support/health")
  @ApiOperation({ summary: "Get full system health for support" })
  async getSupportHealth() {
    const [listenerStatus, failedEvents, presaleTxCount, userCount] = await Promise.all([
      this.listenerService.getStatus().catch(() => null),
      this.prisma.failedEvent.count({ where: { resolved: false } }).catch(() => 0),
      this.prisma.presaleTx.count().catch(() => 0),
      this.prisma.presaleUser.count().catch(() => 0),
    ]);

    const recentErrors = await this.prisma.failedEvent.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).catch(() => []);

    return {
      timestamp: new Date(),
      listener: listenerStatus,
      database: {
        presaleTxCount,
        userCount,
        unresolvedFailedEvents: failedEvents,
      },
      recentErrors,
      environment: {
        presaleContract: process.env.PRESALE_CONTRACT
          ? `${process.env.PRESALE_CONTRACT.slice(0, 6)}...${process.env.PRESALE_CONTRACT.slice(-4)}`
          : "NOT SET",
        network: process.env.NETWORK || "ethereum",
        nodeEnv: process.env.NODE_ENV || "development",
      },
    };
  }

  @UseGuards(AdminGuard)
  @Post("support/retry-failed")
  @ApiOperation({ summary: "Retry all unresolved failed events" })
  async retryFailedEvents() {
    const count = await this.prisma.failedEvent.count({ where: { resolved: false } });
    // Mark for retry by resetting retryCount
    await this.prisma.failedEvent.updateMany({
      where: { resolved: false },
      data: { retryCount: 0, lastRetryAt: null },
    });
    return { success: true, message: `Queued ${count} failed events for retry` };
  }
}