import { ApiProperty } from '@nestjs/swagger';
import { BankTransfer, BankTransferStatus } from '../entities/bank-transfer.entity';

export class BankTransferResponseDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Bank transfer submitted successfully' })
  message: string;

  @ApiProperty({ type: BankTransfer })
  data: BankTransfer;
}

export class BankTransferListResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Bank transfers retrieved successfully' })
  message: string;

  @ApiProperty({ type: [BankTransfer] })
  data: BankTransfer[];

  @ApiProperty({
    example: {
      totalCount: 165,
      totalPages: 17,
      page: 1,
      limit: 10
    }
  })
  pagination: {
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
  };

  @ApiProperty({
    example: {
      pending: 12,
      verified: 145,
      rejected: 8,
      totalAmount: 425000
    }
  })
  stats: {
    pending: number;
    verified: number;
    rejected: number;
    totalAmount: number;
  };
}

export class BankTransferStatsResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Stats retrieved successfully' })
  message: string;

  @ApiProperty({
    example: {
      pending: 12,
      verified: 145,
      rejected: 8,
      totalAmount: 425000
    }
  })
  data: {
    pending: number;
    verified: number;
    rejected: number;
    totalAmount: number;
  };
}