import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { PrivateSaleSubmissionStatus } from '@prisma/client';

export class VerifyPrivateSaleSubmissionDto {
  @IsEnum(PrivateSaleSubmissionStatus)
  status: PrivateSaleSubmissionStatus;

  @IsOptional()
  @IsString()
  verificationNote?: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;

  @IsOptional()
  @IsString()
  allocatedTokens?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value) : undefined))
  @IsNumber()
  allocatedStageId?: number;
}
