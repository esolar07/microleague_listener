import { IsOptional, IsNumber, IsString, Min, IsNotEmpty, IsEnum, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PresaleTxType } from "../entities/presale.entity";
import { Type } from "class-transformer";

export class TransactionsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;



  @ApiProperty({
    description: "Filter by wallet address",
    example: "0x9ed422636822d4db66c26acd856bf0ce25ae6fa5",
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: "Filter by contract address",
    example: "0xc34306070026bda6e3f1ad363daf99dc73f6ef3e",
    required: false
  })
  @IsOptional()
  @IsString()
  contract?: string;

  @ApiProperty({
    description: "Filter by token address",
    example: "0xc34306070026bda6e3f1ad363daf99dc73f6ef3e",
    required: false
  })
  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @ApiProperty({
    description: "Filter by transaction type",
    enum: PresaleTxType,
    required: false
  })
  @IsOptional()
  @IsEnum(PresaleTxType)
  type?: PresaleTxType;

  @ApiProperty({
    description: "Filter by stage",
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  stage?: number;

  @ApiProperty({
    description: "Start date for filtering (YYYY-MM-DD)",
    example: "2025-12-01",
    required: false
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: "End date for filtering (YYYY-MM-DD)",
    example: "2025-12-31",
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: "Minimum amount filter",
    example: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiProperty({
    description: "Maximum amount filter",
    example: 100,
    required: false
  })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({
    description: "Search across txHash, address, and email",
    example: "0x9ed4",
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Field to sort by (timestamp, amount, usdAmount, tokens)",
    example: "timestamp",
    required: false
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @ApiProperty({
    description: "Sort order (asc or desc)",
    enum: ['asc', 'desc'],
    example: "desc",
    required: false
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ExportTransactionsQueryDto extends TransactionsQueryDto {
  @ApiProperty({
    description: "Include all records (ignores pagination)",
    example: true,
    required: false
  })
  @IsOptional()
  @IsNumber()
  all?: boolean = false;
}