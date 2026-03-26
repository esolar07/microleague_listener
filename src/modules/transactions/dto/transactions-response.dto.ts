import { ApiProperty } from "@nestjs/swagger";
import { PresaleTxType } from "../entities/presale.entity";

export class TransactionDto {
  @ApiProperty({ 
    description: "Transaction hash", 
    example: "0x248d82de2ba25254e3b66d645674ebb4f53d6f3957add04b5a5eb4af79560001" 
  })
  txHash: string;

  @ApiProperty({ 
    description: "Contract address", 
    example: "0xc34306070026bda6e3f1ad363daf99dc73f6ef3e" 
  })
  contract: string;

  @ApiProperty({ 
    description: "User wallet address", 
    example: "0x9ed422636822d4db66c26acd856bf0ce25ae6fa5" 
  })
  address: string;

  @ApiProperty({ 
    description: "User email", 
    example: "user@example.com", 
    required: false 
  })
  email?: string;

  @ApiProperty({ 
    description: "Token address", 
    example: "0xc34306070026bda6e3f1ad363daf99dc73f6ef3e" 
  })
  tokenAddress: string;

  @ApiProperty({ 
    description: "Transaction type", 
    enum: PresaleTxType,
    example: PresaleTxType.BLOCKCHAIN
  })
  type: PresaleTxType;

  @ApiProperty({ 
    description: "Amount invested in ETH", 
    example: 0.003551 
  })
  amount: number;

  @ApiProperty({ 
    description: "Presale stage", 
    example: 0 
  })
  stage: number;

  @ApiProperty({ 
    description: "Number of tokens purchased", 
    example: 10.001978 
  })
  tokens: number;

  @ApiProperty({ 
    description: "Transaction timestamp (Unix)", 
    example: 1763990352 
  })
  timestamp: number;

  @ApiProperty({ 
    description: "USD equivalent amount", 
    example: 10.001978 
  })
  usdAmount: number;

  @ApiProperty({ 
    description: "Quote currency (address or ETH)", 
    example: "0x0000000000000000000000000000000000000000" 
  })
  quote: string;

  @ApiProperty({ 
    description: "Typeform ID if applicable", 
    example: null, 
    required: false 
  })
  typeformId?: string;

  @ApiProperty({ 
    description: "Creation date", 
    example: "2025-12-04T09:29:10.319Z" 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: "Last update date", 
    example: "2025-12-04T09:29:10.319Z" 
  })
  updatedAt: Date;
}

export class TransactionsResponseDto {
  @ApiProperty({ 
    description: "List of transactions", 
    type: [TransactionDto] 
  })
  data: TransactionDto[];

  @ApiProperty({ 
    description: "Total number of transactions", 
    example: 100 
  })
  total: number;

  @ApiProperty({ 
    description: "Current page number", 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: "Number of items per page", 
    example: 10 
  })
  limit: number;

  @ApiProperty({ 
    description: "Total number of pages", 
    example: 10 
  })
  totalPages: number;
}

export class DailyTransactionDto {
  @ApiProperty({ 
    description: "Date (YYYY-MM-DD)", 
    example: "2025-12-04" 
  })
  date: string;

  @ApiProperty({ 
    description: "Number of transactions", 
    example: 7 
  })
  count: number;

  @ApiProperty({ 
    description: "Total volume in USD", 
    example: 70.012993 
  })
  volume: number;
}

export class TransactionStatsDto {
  @ApiProperty({ 
    description: "Total number of transactions", 
    example: 7 
  })
  totalTransactions: number;

  @ApiProperty({ 
    description: "Total tokens sold", 
    example: 70.012993 
  })
  totalTokensSold: number;

  @ApiProperty({ 
    description: "Total amount in ETH", 
    example: 0.006954 
  })
  totalAmount: number;

  @ApiProperty({ 
    description: "Total amount in USD", 
    example: 70.012993 
  })
  totalUsdAmount: number;

  @ApiProperty({ 
    description: "Average transaction size in USD", 
    example: 10.001856 
  })
  averageTransactionSize: number;

  @ApiProperty({ 
    description: "Largest transaction in USD", 
    example: 10.003096 
  })
  largestTransaction: number;

  @ApiProperty({ 
    description: "Transactions grouped by type", 
    example: { "blockchain": 7 } 
  })
  transactionsByType: Record<PresaleTxType, number>;

  @ApiProperty({ 
    description: "Transactions grouped by stage", 
    example: { 0: 7 } 
  })
  transactionsByStage: Record<number, number>;

  @ApiProperty({ 
    description: "Daily transactions for last 30 days", 
    type: [DailyTransactionDto] 
  })
  dailyTransactions: DailyTransactionDto[];
}

export class DeleteTransactionResponseDto {
  @ApiProperty({ 
    description: "Success status", 
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: "Response message", 
    example: "Transaction deleted successfully" 
  })
  message: string;
}