import { IsNumberString, IsOptional } from "class-validator";
import { SortOrder } from "mongoose";

export class PaginationDto {
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  sort?: string | { [key: string]: SortOrder } | [string, SortOrder][];
  //
}

// src/common/dto/pagination-meta.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  page: number;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  limit: number;

  @ApiProperty({ example: 125 })
  @Type(() => Number)
  total: number;

  @ApiProperty({ example: 7 })
  @Type(() => Number)
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
