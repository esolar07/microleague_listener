import { IsOptional, IsString, IsIn } from 'class-validator';
import { BankTransferStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterBankTransfersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsIn(['All', 'Pending', 'Verified', 'Rejected'])
  status?: 'All' | BankTransferStatus;
}