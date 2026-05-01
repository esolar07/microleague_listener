import { IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePrivateSaleSubmissionDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  contact: string;

  @IsString()
  country: string;

  @IsString()
  walletAddress: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  proofFileName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
