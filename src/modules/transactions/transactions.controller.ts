import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import {
  ApiGetTransactions,
  ApiGetTransactionByHash,
  ApiGetTransactionsByAddress,
  ApiGetTransactionStats,
  ApiDeleteTransaction,
} from "./decorators/transactions.decorator";
import {
  TransactionsResponseDto,
  TransactionDto,
  TransactionStatsDto,
} from "./dto/transactions-response.dto";
import {
  TransactionsQueryDto,
} from "./dto/transactions-query.dto";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@ApiTags("Transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiGetTransactions()
  async getTransactions(
    @Query() query: TransactionsQueryDto
  ): Promise<TransactionsResponseDto> {
    try {
      return await this.transactionsService.findAll(query);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }
  @Get("stats/summary")
  @ApiGetTransactionStats()
  @UseGuards(AdminGuard)
  async getTransactionStats(): Promise<TransactionStatsDto> {
    return await this.transactionsService.getTransactionStats();
  }

  @Get(":txHash")
  @ApiGetTransactionByHash()
  async getTransactionByHash(
    @Param("txHash") txHash: string
  ): Promise<{ data: TransactionDto }> {
    return await this.transactionsService.findByTxHash(txHash);
  }

  @Get("address/:address")
  @ApiGetTransactionsByAddress()
  async getTransactionsByAddress(
    @Param("address") address: string,
    @Query() query: TransactionsQueryDto
  ): Promise<TransactionsResponseDto> {
    query.address = address;
    return await this.transactionsService.findAll(query);
  }

  @Delete(":txHash")
  @ApiDeleteTransaction()
  // @UseGuards(AdminAuthGuard)
  async deleteTransaction(
    @Param("txHash") txHash: string
  ): Promise<{ success: boolean; message: string }> {
    return await this.transactionsService.deleteTransaction(txHash);
  }

  @Get("user/tokens")
  async getUserTokens(
    @Query("identifier") identifier: string
  ): Promise<{ identifier: string; totalTokens: number }> {
    return await this.transactionsService.getUserTokens(identifier);
  }
}