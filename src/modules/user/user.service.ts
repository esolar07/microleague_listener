// user.service.ts — operates on PresaleUser (shared BE database)
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDTO } from "./dto/create-user.dto";
import { PresaleUser } from "@prisma/client";

function normalizeWalletAddress(walletAddress?: string | null): string | null {
  if (!walletAddress) return null;
  const trimmed = String(walletAddress).trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<PresaleUser> {
    return this.prisma.presaleUser.create({ data });
  }

  async findOne(where: any): Promise<PresaleUser | null> {
    return this.prisma.presaleUser.findFirst({ where });
  }

  async findUserByAddress(address: string): Promise<PresaleUser | null> {
    return this.prisma.presaleUser.findFirst({
      where: { walletAddress: address.toLowerCase() },
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<PresaleUser | null> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) return null;
    return this.prisma.presaleUser.findUnique({
      where: { walletAddress: normalized },
    });
  }

  async createOrUpdate(createUserDto: CreateUserDTO): Promise<PresaleUser> {
    const normalizedWallet = normalizeWalletAddress(createUserDto.walletAddress);
    if (!normalizedWallet) throw new Error("Invalid wallet address");

    return this.prisma.presaleUser.upsert({
      where: { walletAddress: normalizedWallet },
      update: {
        lastActivity: new Date(),
      },
      create: {
        walletAddress: normalizedWallet,
        joinDate: new Date(),
        lastActivity: new Date(),
      },
    });
  }

  async findAll(filters: any): Promise<{
    data: PresaleUser[];
    pagination: { totalCount: number; totalPages: number; page: number; limit: number };
    stats: any;
  }> {
    const { search, page = 1, limit = 10 } = filters;
    const where: any = { tokensPurchased: { gt: 0 } };

    if (search) {
      where.walletAddress = { contains: search, mode: "insensitive" };
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.presaleUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinDate: "desc" },
      }),
      this.prisma.presaleUser.count({ where }),
    ]);

    const stats = await this.getStats();

    return {
      data,
      pagination: { totalCount, totalPages: Math.ceil(totalCount / limit), page, limit },
      stats,
    };
  }

  async update(id: string, updateData: any): Promise<PresaleUser> {
    try {
      return await this.prisma.presaleUser.update({ where: { id }, data: updateData });
    } catch {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.presaleUser.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async getTopBuyers(limit: number = 5): Promise<PresaleUser[]> {
    return this.prisma.presaleUser.findMany({
      where: { tokensPurchased: { gt: 0 } },
      orderBy: { tokensPurchased: "desc" },
      take: limit,
    });
  }

  async getStats(): Promise<any> {
    const hasPurchased = { tokensPurchased: { gt: 0 } };
    const [totalBuyers, aggregates] = await Promise.all([
      this.prisma.presaleUser.count({ where: hasPurchased }),
      this.prisma.presaleUser.aggregate({
        where: hasPurchased,
        _sum: { amountSpent: true, tokensPurchased: true, claimed: true, unclaimed: true },
        _avg: { amountSpent: true },
      }),
    ]);

    return {
      totalBuyers,
      totalVolume: aggregates._sum.amountSpent ?? 0,
      totalTokensPurchased: aggregates._sum.tokensPurchased ?? 0,
      totalClaimed: aggregates._sum.claimed ?? 0,
      totalUnclaimed: aggregates._sum.unclaimed ?? 0,
      avgPurchase: aggregates._avg.amountSpent ?? 0,
    };
  }

  async findById(id: string): Promise<PresaleUser | null> {
    return this.prisma.presaleUser.findUnique({ where: { id } });
  }

  async updateUser(id: string, updateData: any): Promise<PresaleUser> {
    return this.prisma.presaleUser.update({ where: { id }, data: updateData });
  }

  async updateByWalletAddress(walletAddress: string, updateData: any): Promise<PresaleUser> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) throw new Error("Invalid wallet address");
    try {
      return await this.prisma.presaleUser.update({
        where: { walletAddress: normalized },
        data: updateData,
      });
    } catch {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
  }

  async updateLastActivity(walletAddress: string): Promise<PresaleUser> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) throw new Error("Invalid wallet address");
    try {
      return await this.prisma.presaleUser.update({
        where: { walletAddress: normalized },
        data: { lastActivity: new Date() },
      });
    } catch {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
  }

  // Stub kept for API compatibility — referral logic not in PresaleUser schema
  async addReferral(user: PresaleUser, _data: { referralId: string }): Promise<PresaleUser> {
    return user;
  }

  async incrementReferrals(walletAddress: string): Promise<PresaleUser> {
    return this.updateLastActivity(walletAddress);
  }
}
