import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage } from "mongoose";
import { DB_COLLECTIONS } from "src/constants/collections";
import { PresaleTxsDocument } from "./entities/presale.entity";
import { TypeformDocument } from "../typeform/entities/typeform.entity";
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
    @InjectModel(DB_COLLECTIONS.PRE_SALES_TXS)
    public presaleTxsModel: Model<PresaleTxsDocument>,
    @InjectModel(DB_COLLECTIONS.TYPEFORM)
    private readonly typeformModel: Model<TypeformDocument>
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

    const matchStage: any = {};
    const skip = (page - 1) * limit;

    // Build match stage based on query parameters
    if (address) matchStage.address = { $regex: address, $options: "i" };
    if (contract) matchStage.contract = { $regex: contract, $options: "i" };
    if (tokenAddress) matchStage.tokenAddress = { $regex: tokenAddress, $options: "i" };
    if (type) matchStage.type = type;
    if (stage !== undefined) matchStage.stage = stage;
    
    // Date range filter
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = Math.floor(new Date(startDate).getTime() / 1000);
      if (endDate) matchStage.timestamp.$lte = Math.floor(new Date(endDate).getTime() / 1000);
    }
    
    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      matchStage.amount = {};
      if (minAmount !== undefined) matchStage.amount.$gte = minAmount;
      if (maxAmount !== undefined) matchStage.amount.$lte = maxAmount;
    }
    
    // Search across multiple fields
    if (search) {
      matchStage.$or = [
        { txHash: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "address",
          foreignField: "walletAddress",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          txHash: 1,
          contract: 1,
          address: 1,
          tokenAddress: 1,
          type: 1,
          amount: 1,
          stage: 1,
          tokens: 1,
          timestamp: 1,
          createdAt: 1,
          updatedAt: 1,
          usdAmount: 1,
          quote: 1,
          email: {
            $ifNull: ["$email", "$userInfo.email"],
          },
        },
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    const data = await this.presaleTxsModel.aggregate(pipeline);
    const total = await this.presaleTxsModel.countDocuments(matchStage);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTxHash(txHash: string): Promise<{ data: TransactionDto }> {
    const transaction = await this.presaleTxsModel.findOne({ txHash });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }

    // Lookup user email if available
    const pipeline: PipelineStage[] = [
      { $match: { txHash } },
      {
        $lookup: {
          from: "users",
          localField: "address",
          foreignField: "walletAddress",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          txHash: 1,
          contract: 1,
          address: 1,
          tokenAddress: 1,
          type: 1,
          amount: 1,
          stage: 1,
          tokens: 1,
          timestamp: 1,
          createdAt: 1,
          updatedAt: 1,
          usdAmount: 1,
          quote: 1,
          typeformId: 1,
          email: {
            $ifNull: ["$email", "$userInfo.email"],
          },
        },
      },
    ];

    const [result] = await this.presaleTxsModel.aggregate(pipeline);
    
    if (!result) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }

    return { data: result };
  }
  async getTransactionStats(): Promise<TransactionStatsDto> {
    // Get total transactions count
    const totalTransactions = await this.presaleTxsModel.countDocuments();

    // Get total tokens sold
    const tokensResult = await this.presaleTxsModel.aggregate([
      {
        $group: {
          _id: null,
          totalTokensSold: { $sum: "$tokens" },
          totalAmount: { $sum: "$amount" },
          totalUsdAmount: { $sum: "$usdAmount" },
          averageTransactionSize: { $avg: "$usdAmount" },
          largestTransaction: { $max: "$usdAmount" },
        },
      },
    ]);

    // Get transactions by type
    const byTypeResult = await this.presaleTxsModel.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    const transactionsByType: Record<string, number> = {};
    byTypeResult.forEach(item => {
      transactionsByType[item._id] = item.count;
    });

    // Get transactions by stage
    const byStageResult = await this.presaleTxsModel.aggregate([
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
        },
      },
    ]);

    const transactionsByStage: Record<number, number> = {};
    byStageResult.forEach(item => {
      transactionsByStage[item._id] = item.count;
    });

    // Get daily transactions for last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    
    const dailyTransactions = await this.presaleTxsModel.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $toDate: { $multiply: ["$timestamp", 1000] } } 
            }
          },
          count: { $sum: 1 },
          volume: { $sum: "$usdAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statsResult = tokensResult[0] || {
      totalTokensSold: 0,
      totalAmount: 0,
      totalUsdAmount: 0,
      averageTransactionSize: 0,
      largestTransaction: 0,
    };

    return {
      totalTransactions,
      totalTokensSold: statsResult.totalTokensSold,
      totalAmount: statsResult.totalAmount,
      totalUsdAmount: statsResult.totalUsdAmount,
      averageTransactionSize: statsResult.averageTransactionSize,
      largestTransaction: statsResult.largestTransaction,
      transactionsByType,
      transactionsByStage,
      dailyTransactions: dailyTransactions.map(item => ({
        date: item._id,
        count: item.count,
        volume: item.volume
      }))
    };
  }

  async deleteTransaction(txHash: string): Promise<{ success: boolean; message: string }> {
    const result = await this.presaleTxsModel.deleteOne({ txHash });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Transaction with hash ${txHash} not found`);
    }

    return {
      success: true,
      message: `Transaction ${txHash} deleted successfully`
    };
  }
}