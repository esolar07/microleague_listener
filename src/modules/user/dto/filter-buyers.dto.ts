import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BuyerStatus } from '../entities/user.entity';

export class FilterBuyersDto extends PaginationDto {
  @ApiPropertyOptional({ example: '0x742d35f8a9b3c4e1d2f6a8e7c9b5d4a3f2e1d0c9' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BuyerStatus })
  @IsOptional()
  @IsEnum(BuyerStatus)
  status?: BuyerStatus;

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
}