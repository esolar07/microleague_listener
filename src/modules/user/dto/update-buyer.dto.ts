import { PartialType } from "@nestjs/mapped-types";
import { CreateBuyerDto } from "./create-buyer.dto";
import { IsOptional, IsNumber, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateBuyerDto extends PartialType(CreateBuyerDto) {
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

  @ApiPropertyOptional({ example: "0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9" })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiPropertyOptional({ example: "clx123abc456def789" })
  @IsOptional()
  @IsString()
  referredById?: string;
}
