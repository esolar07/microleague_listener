import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";

export class ReprocessEventsDto {
  @ApiProperty({
    description: "Contract address to reprocess. If not provided, all contracts will be reprocessed",
    example: "0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9",
    required: false,
  })
  @IsOptional()
  @IsString()
  contractAddress?: string;

  @ApiProperty({
    description: "Start block number. If not provided, will use contract's startBlock from config",
    example: 9675395,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fromBlock?: number;

  @ApiProperty({
    description: "End block number. If not provided, will process up to latest block",
    example: 10000000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  toBlock?: number;

  @ApiProperty({
    description: "Specific event names to reprocess. If not provided, all enabled events will be processed",
    example: ["Bought", "Transfer"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventNames?: string[];

  @ApiProperty({
    description: "Whether to reset the last processed block before reprocessing",
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  resetLastProcessedBlock?: boolean;

  @ApiProperty({
    description: "Batch size for processing events",
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  batchSize?: number;
}


