import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
} from "class-validator";
import { ObjectId } from "mongoose";

export class CreateClaimDto {
  @ApiProperty({
    description: "The address of the claimant",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: "The email address of the claimant",
    example: "examle@gmail.com",
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "The contract address related to the vesting claim",
    example: "0xabcdef1234567890abcdef1234567890abcdef12",
    required: false,
  })
  @IsOptional()
  @IsString()
  contract?: string;

  @ApiProperty({
    description: "The user ID of the claimant (for internal reference)",
    example: "60d5f1f62f9c2b4a321de768", // Example ObjectId as string
  })
  @IsOptional()
  userId: ObjectId;

  @ApiProperty({
    description: "Transaction hash of the vesting claim",
    example:
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionHash?: string;

  @ApiProperty({
    description: "The claimed amount of tokens",
    example: 1000,
  })
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty({
    description: "Timestamp of the claim in seconds",
    example: 1625254456,
  })
  @IsNumber()
  @IsOptional()
  timestamp: number;
}

export class UpdateClaimDto extends PartialType(CreateClaimDto) {}

export class GetBalanceDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vesting_period?: number;
}
