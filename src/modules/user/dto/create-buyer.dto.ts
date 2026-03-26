import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BuyerStatus } from '../entities/user.entity';

export class CreateBuyerDto {
  @ApiProperty({ example: '0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  tokensPurchased: number;

  @ApiProperty({ example: 12500 })
  @IsNumber()
  amountSpent: number;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  claimed: number;

  @ApiProperty({ example: 175000 })
  @IsNumber()
  unclaimed: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  referrals: number;

  @ApiProperty({ example: '2025-11-10T00:00:00.000Z' })
  @IsDateString()
  joinDate: string;

  @ApiPropertyOptional({ example: '2025-11-22T14:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  lastActivity?: string;

  @ApiPropertyOptional({ enum: BuyerStatus })
  @IsOptional()
  @IsEnum(BuyerStatus)
  status?: BuyerStatus;
}