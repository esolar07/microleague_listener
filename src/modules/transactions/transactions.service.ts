import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PresaleTxs, PresaleTxType } from "@prisma/client";
import { 
  TransactionsResponseDto, 
  TransactionDto,
  TransactionStatsDto
} from "./dto/transactions-response.dto";
import { 
  TransactionsQueryDto,} from "./dto/transactions-query.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = query;

    const where: any = {};
    const skip = (page - 1) * limit;

    // Build where clause based on query parameters
    if (address) where.address = { contains: address, mode: 'insensitive' };
    if (contract) where.contract = { contains: contract, mode: 'insensitive' };
    if (tokenAddress) where.tokenAddress = { contains: tokenAddress, mode: 'insensitive' };
    if (type) where.type = type;
    if (stage !== undefined) where.stage = stage;
    
    // Date range filter (convert to timestamp)
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = Math.floor(new Date(startDate).getTime() / 1000);
      if (endDate) where.timestamp.lte = Math.floor(new Date(endDate).getTime() / 1000);
    }
    
    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { txHash: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      this.prisma.presaleTxs.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.presaleTxs.count({ where }),
    ]);

    // Transform data to match expected format
    const transformedData = data.map(tx => ({
      ...tx,
      email: tx.email || tx.user?.email || null,
    }));

    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTxHash(txHash: string): Promise<{ data: TransactionDto }> {
    const transaction = await this.prisma.presaleTxs.findUnique({
      where: { txHash },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }

    const result = {
      ...transaction,
      email: transaction.email || transaction.user?.email || null,
    };

    return { data: result };
  }

  async getTransactionStats(): Promise<TransactionStatsDto> {
    // Get total transactions count
    const totalTransactions = await this.prisma.presaleTxs.count();

    // Get aggregated stats
    const aggregates = await this.prisma.presaleTxs.aggregate({
      _sum: {
        tokens: true,
        amount: true,
        usdAmount: true,
      },
      _avg: {
        usdAmount: true,
      },
      _max: {
        usdAmount: true,
      },
    });

    // Get transactions by type
    const byType = await this.prisma.presaleTxs.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    const transactionsByType: Record<string, number> = {};
    byType.forEach(item => {
      transactionsByType[item.type] = item._count.type;
    });

    // Get transactions by stage
    const byStage = await this.prisma.presaleTxs.groupBy({
      by: ['stage'],
      _count: {
        stage: true,
      },
    });

    const transactionsByStage: Record<number, number> = {};
    byStage.forEach(item => {
      transactionsByStage[item.stage] = item._count.stage;
    });

    // Get daily transactions for last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    
    const dailyTxs = await this.prisma.presaleTxs.findMany({
      where: {
        timestamp: { gte: thirtyDaysAgo }
      },
      select: {
        timestamp: true,
        usdAmount: true,
      }
    });

    // Group by date
    const dailyMap = new Map<string, { count: number; volume: number }>();
    dailyTxs.forEach(tx => {
      const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { count: 0, volume: 0 };
      dailyMap.set(date, {
        count: existing.count + 1,
        volume: existing.volume + tx.usdAmount,
      });
    });

    const dailyTransactions = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        volume: stats.volume,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTransactions,
      totalTokensSold: aggregates._sum.tokens || 0,
      totalAmount: aggregates._sum.amount || 0,
      totalUsdAmount: aggregates._sum.usdAmount || 0,
      averageTransactionSize: aggregates._avg.usdAmount || 0,
      largestTransaction: aggregates._max.usdAmount || 0,
      transactionsByType,
      transactionsByStage,
      dailyTransactions,
    };
  }

  async deleteTransaction(txHash: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.presaleTxs.delete({
        where: { txHash }
      });

      return {
        success: true,
        message: `Transaction ${txHash} deleted successfully`
      };
    } catch (error) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }
  }

  async getUserTokens(identifier: string): Promise<{ identifier: string; totalTokens: number }> {
    // The identifier could be a wallet address or user ID
    // First try to find by wallet address, then by user ID
    let totalTokens = 0;

    // Try to find user by wallet address first
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress: identifier.toLowerCase() },
          { id: identifier },
          { userId: identifier },
        ]
      }
    });

    if (user) {
      // Get total tokens from user record
      totalTokens = user.tokensPurchased || 0;
    } else {
      // Fallback: calculate from transactions directly
      const result = await this.prisma.presaleTxs.aggregate({
        where: {
          address: identifier.toLowerCase(),
        },
        _sum: {
          tokens: true,
        },
      });
      
      totalTokens = result._sum.tokens || 0;
    }

    return {
      identifier,
      totalTokens,
    };
  }
}