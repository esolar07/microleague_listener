import { PartialType } from '@nestjs/mapped-types';
import { CreateBankTransferDto } from './create-bank-transfer.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BankTransferStatus } from '@prisma/client';

export class UpdateBankTransferDto extends PartialType(CreateBankTransferDto) {
  @IsOptional()
  @IsEnum(BankTransferStatus)
  status?: BankTransferStatus;

  @IsOptional()
  @IsString()
  verificationNote?: string;
}