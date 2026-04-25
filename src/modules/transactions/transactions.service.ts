import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import {
  TransactionsResponseDto,
  TransactionStatsDto,
} from "./dto/transactions-response.dto";
import { TransactionsQueryDto } from "./dto/transactions-query.dto";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TransactionsQueryDto): Promise<TransactionsResponseDto> {
    const {
      limit = 10,
      page = 1,
      address,
      contract,
      tokenAddress,
      type,
      stage,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = "timestamp",
      sortOrder = "desc",
    } = query;

    const where: any = {};
    const skip = (page - 1) * limit;

    if (address) where.address = { contains: address, mode: "insensitive" };
    if (contract) where.contract = { contains: contract, mode: "insensitive" };
    if (tokenAddress) where.tokenAddress = { contains: tokenAddress, mode: "insensitive" };
    if (type) where.type = type;
    if (stage !== undefined) where.stage = stage;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = Math.floor(new Date(startDate).getTime() / 1000);
      if (endDate) where.timestamp.lte = Math.floor(new Date(endDate).getTime() / 1000);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }

    if (search) {
      where.OR = [
        { txHash: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      this.prisma.presaleTx.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.presaleTx.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTxHash(txHash: string): Promise<{ data: any }> {
    const transaction = await this.prisma.presaleTx.findUnique({ where: { txHash } });
    if (!transaction) throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    return { data: transaction };
  }

  async getTransactionStats(): Promise<TransactionStatsDto> {
    const totalTransactions = await this.prisma.presaleTx.count();

    const aggregates = await this.prisma.presaleTx.aggregate({
      _sum: { tokens: true, amount: true, usdAmount: true },
      _avg: { usdAmount: true },
      _max: { usdAmount: true },
    });

    const byType = await this.prisma.presaleTx.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    const transactionsByType: Record<string, number> = {};
    byType.forEach((item) => { transactionsByType[item.type] = item._count.type; });

    const byStage = await this.prisma.presaleTx.groupBy({
      by: ["stage"],
      _count: { stage: true },
    });

    const transactionsByStage: Record<number, number> = {};
    byStage.forEach((item) => { transactionsByStage[item.stage] = item._count.stage; });

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const dailyTxs = await this.prisma.presaleTx.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { timestamp: true, usdAmount: true },
    });

    const dailyMap = new Map<string, { count: number; volume: number }>();
    dailyTxs.forEach((tx) => {
      const date = new Date(tx.timestamp * 1000).toISOString().split("T")[0];
      const existing = dailyMap.get(date) || { count: 0, volume: 0 };
      dailyMap.set(date, { count: existing.count + 1, volume: existing.volume + tx.usdAmount });
    });

    const dailyTransactions = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, count: stats.count, volume: stats.volume }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTransactions,
      totalTokensSold: aggregates._sum.tokens ?? 0,
      totalAmount: aggregates._sum.amount ?? 0,
      totalUsdAmount: aggregates._sum.usdAmount ?? 0,
      averageTransactionSize: aggregates._avg.usdAmount ?? 0,
      largestTransaction: aggregates._max.usdAmount ?? 0,
      transactionsByType,
      transactionsByStage,
      dailyTransactions,
    };
  }

  async deleteTransaction(txHash: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.presaleTx.delete({ where: { txHash } });
      return { success: true, message: `Transaction ${txHash} deleted successfully` };
    } catch {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }
  }

  async getUserTokens(identifier: string): Promise<{ identifier: string; totalTokens: number }> {
    // Try presaleUser first, then fall back to summing transactions
    const user = await this.prisma.presaleUser.findFirst({
      where: { walletAddress: identifier.toLowerCase() },
    });

    if (user) {
      return { identifier, totalTokens: user.tokensPurchased ?? 0 };
    }

    const result = await this.prisma.presaleTx.aggregate({
      where: { address: identifier.toLowerCase() },
      _sum: { tokens: true },
    });

    return { identifier, totalTokens: result._sum.tokens ?? 0 };
  }
}
