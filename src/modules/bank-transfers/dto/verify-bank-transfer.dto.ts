import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BankTransferStatus } from '../entities/bank-transfer.entity';

export class VerifyBankTransferDto {
  @IsEnum([BankTransferStatus.VERIFIED, BankTransferStatus.REJECTED])
  status: BankTransferStatus.VERIFIED | BankTransferStatus.REJECTED;

  @IsOptional()
  @IsString()
  verificationNote?: string;
}