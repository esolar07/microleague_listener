import { PartialType } from "@nestjs/mapped-types";
import { CreateBuyerDto } from "./create-buyer.dto";
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BuyerStatus } from "@prisma/client";

export class UpdateBuyerDto extends PartialType(CreateBuyerDto) {
  // Numeric fields
  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  tokensPurchased?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  amountSpent?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  claimed?: number;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  unclaimed?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  referralEarnings?: number;

  // Status
  @ApiPropertyOptional({ enum: BuyerStatus })
  @IsOptional()
  @IsEnum(BuyerStatus)
  status?: BuyerStatus;

  // Strings
  @ApiPropertyOptional({
    example: "0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9",
  })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiPropertyOptional({ example: "abc123-user-id" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "John" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: "+923001234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "https://example.com/image.jpg" })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ example: "Pakistan" })
  @IsOptional()
  @IsString()
  country?: string;

  // Ref fields
  @ApiPropertyOptional({ example: "clx123abc456def789" })
  @IsOptional()
  @IsString()
  referredById?: string;
}
