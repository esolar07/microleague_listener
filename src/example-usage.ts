import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class ExampleService {
  constructor(private prisma: PrismaService) {}

  // Example: Get all presale users
  async getAllPresaleUsers() {
    return this.prisma.presaleUser.findMany({
      include: {
        presaleTxs: true,
        vestingSchedules: true,
      },
    });
  }

  // Example: Create a new presale transaction
  async createPresaleTx(data: {
    txHash: string;
    contract: string;
    address: string;
    tokenAddress: string;
    amount: number;
    stage: number;
    tokens: number;
    timestamp: number;
    usdAmount: number;
    quote: string;
  }) {
    return this.prisma.presaleTx.create({
      data,
    });
  }

  // Example: Get user with their transactions
  async getUserWithTransactions(walletAddress: string) {
    return this.prisma.presaleUser.findUnique({
      where: { walletAddress },
      include: {
        presaleTxs: {
          orderBy: { createdAt: 'desc' },
        },
        vestingSchedules: true,
      },
    });
  }

  // Example: Update user token balance
  async updateUserBalance(walletAddress: string, tokens: number, amount: number) {
    return this.prisma.presaleUser.update({
      where: { walletAddress },
      data: {
        tokensPurchased: { increment: tokens },
        unclaimed: { increment: tokens },
        amountSpent: { increment: amount },
        lastActivity: new Date(),
      },
    });
  }

  // Example: Get recent activities
  async getRecentActivities(limit = 10) {
    return this.prisma.recentActivity.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  }
}
