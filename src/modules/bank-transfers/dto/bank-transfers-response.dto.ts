import { ApiProperty } from '@nestjs/swagger';

// Define the BankTransfer schema for Swagger documentation
class BankTransferSchema {
  @ApiProperty({ example: 'cmn7e5z5h000weafsq3nhgx5u' })
  id: string;

  @ApiProperty({ example: 'BT-2026-001' })
  transferId: string;

  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  walletAddress: string;

  @ApiProperty({ example: 1000.50 })
  amount: number;

  @ApiProperty({ example: 'John Doe' })
  senderName: string;

  @ApiProperty({ example: 'Bank of America' })
  bankName: string;

  @ApiProperty({ example: 'TXN123456789' })
  transactionRef: string;

  @ApiProperty({ example: 'PAY987654321' })
  paymentRef: string;

  @ApiProperty({ example: '2026-03-26T10:00:00.000Z' })
  submittedDate: Date;

  @ApiProperty({ example: 'Pending', enum: ['Pending', 'Verified', 'Rejected'] })
  status: string;

  @ApiProperty({ example: 'https://example.com/proof.jpg' })
  proofUrl: string;

  @ApiProperty({ example: 'Additional notes' })
  notes: string;

  @ApiProperty({ example: 'Verification note', required: false })
  verificationNote?: string;

  @ApiProperty({ example: 'admin-id', required: false })
  verifiedBy?: string;

  @ApiProperty({ example: '2026-03-26T11:00:00.000Z', required: false })
  verifiedAt?: Date;

  @ApiProperty({ example: 'admin-id', required: false })
  rejectedBy?: string;

  @ApiProperty({ example: '2026-03-26T11:00:00.000Z', required: false })
  rejectedAt?: Date;

  @ApiProperty({ example: '2026-03-26T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-26T10:00:00.000Z' })
  updatedAt: Date;
}

export class BankTransferResponseDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Bank transfer submitted successfully' })
  message: string;

  @ApiProperty({ type: BankTransferSchema })
  data: BankTransferSchema;
}

export class BankTransferListResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Bank transfers retrieved successfully' })
  message: string;

  @ApiProperty({ type: [BankTransferSchema] })
  data: BankTransferSchema[];

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