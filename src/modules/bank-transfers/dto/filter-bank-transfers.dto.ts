import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BankTransferStatus } from '../entities/bank-transfer.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterBankTransfersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BankTransferStatus)
  status?: BankTransferStatus;
}