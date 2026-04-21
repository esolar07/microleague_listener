import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BankTransferStatus } from '@prisma/client';

export class VerifyBankTransferDto {
  @IsEnum(BankTransferStatus)
  status: BankTransferStatus;

  @IsOptional()
  @IsString()
  verificationNote?: string;
}