// auth/user.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { BuyerStatus, User } from "@prisma/client";
import { CreateUserDTO } from "./dto/create-user.dto";
import { FilterBuyersDto } from "./dto/filter-buyers.dto";
import { UpdateBuyerDto } from "./dto/update-buyer.dto";

function normalizeWalletAddress(walletAddress?: string | null): string | null {
  if (!walletAddress) return null;
  const trimmed = String(walletAddress).trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(data: any): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findOne(where: any): Promise<User | null> {
    return this.prisma.user.findFirst({ where });
  }

  async findUserByAddress(address: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { walletAddress: address.toLowerCase() }
    });
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) return null;

    return this.prisma.user.findUnique({
      where: { walletAddress: normalized }
    });
  }

  async createOrUpdate(createUserDto: CreateUserDTO): Promise<User> {
    const normalizedWallet = normalizeWalletAddress(createUserDto.walletAddress);
    
    if (!normalizedWallet) {
      throw new Error("Invalid wallet address");
    }

    return this.prisma.user.upsert({
      where: { walletAddress: normalizedWallet },
      update: {
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        country: createUserDto.country,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
      },
      create: {
        userId: normalizedWallet, // Using wallet as userId for now
        walletAddress: normalizedWallet,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        country: createUserDto.country,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        joinDate: new Date(),
      },
    });
  }

  async findAll(filters: FilterBuyersDto): Promise<{
    data: User[];
    pagination: {
      totalCount: number;
      totalPages: number;
      page: number;
      limit: number;
    };
    stats: any;
  }> {
    const { search, status, page = 1, limit = 10 } = filters;
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status && status !== BuyerStatus.All) {
      where.status = status;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinDate: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const stats = await this.getStats();

    return {
      data,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
        limit,
      },
      stats,
    };
  }

  async update(id: string, updateBuyerDto: UpdateBuyerDto): Promise<User> {
    try {
      // Handle referredById separately if it exists
      const { referredById, ...updateData } = updateBuyerDto;
      
      const updatePayload: any = updateData;
      
      if (referredById) {
        updatePayload.referredBy = {
          connect: { id: referredById }
        };
      }

      return await this.prisma.user.update({
        where: { id },
        data: updatePayload,
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async getTopBuyers(limit: number = 5): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { status: BuyerStatus.Active },
      orderBy: { tokensPurchased: 'desc' },
      take: limit,
    });
  }

  async getStats(): Promise<any> {
    const [totalBuyers, activeBuyers, aggregates] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: BuyerStatus.Active } }),
      this.prisma.user.aggregate({
        _sum: {
          amountSpent: true,
          tokensPurchased: true,
          claimed: true,
          unclaimed: true,
          referralEarnings: true,
        },
        _avg: {
          amountSpent: true,
        },
      }),
    ]);

    return {
      totalBuyers,
      activeBuyers,
      totalVolume: aggregates._sum.amountSpent || 0,
      totalTokensPurchased: aggregates._sum.tokensPurchased || 0,
      totalClaimed: aggregates._sum.claimed || 0,
      totalUnclaimed: aggregates._sum.unclaimed || 0,
      totalReferrals: aggregates._sum.referralEarnings || 0,
      avgPurchase: aggregates._avg.amountSpent || 0,
    };
  }

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async updateUser(userId: string, updateData: any): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async addReferral(user: User, data: { referralId: string }): Promise<User | null> {
    if (user?.referredById) {
      // Already referred by someone, skip
      return user;
    }

    const referrer = await this.prisma.user.findUnique({
      where: { id: data.referralId }
    });
    
    if (!referrer) {
      throw new NotFoundException("Referrer not found");
    }

    // Update current user with referrer
    return this.prisma.user.update({
      where: { id: user.id },
      data: { referredById: referrer.id },
    });
  }

  async updateByWalletAddress(walletAddress: string, updateBuyerDto: UpdateBuyerDto): Promise<User> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) {
      throw new Error("Invalid wallet address");
    }

    try {
      const { referredById, ...updateData } = updateBuyerDto;
      
      const updatePayload: any = updateData;
      
      if (referredById) {
        updatePayload.referredBy = {
          connect: { id: referredById }
        };
      }

      return await this.prisma.user.update({
        where: { walletAddress: normalized },
        data: updatePayload,
      });
    } catch (error) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
  }

  async updateLastActivity(walletAddress: string): Promise<User> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) {
      throw new Error("Invalid wallet address");
    }

    try {
      return await this.prisma.user.update({
        where: { walletAddress: normalized },
        data: { lastActivity: new Date() },
      });
    } catch (error) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
  }

  async incrementReferrals(walletAddress: string): Promise<User> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) {
      throw new Error("Invalid wallet address");
    }

    try {
      return await this.prisma.user.update({
        where: { walletAddress: normalized },
        data: { 
          referralEarnings: { increment: 1 } // You might want to adjust this logic
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
  }
}