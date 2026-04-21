import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateBankTransferDto {
  @IsString()
  walletAddress: string;

  @IsNumber()
  amount: number;

  @IsString()
  senderName: string;

  @IsString()
  bankName: string;

  @IsString()
  transactionRef: string;

  @IsString()
  paymentRef: string;

  @IsDateString()
  submittedDate: string;

  @IsString()
  proofUrl: string;

  @IsOptional()
  @IsString()
  notes?: string;
}