import { IsOptional, IsString, IsIn } from 'class-validator';
import { PrivateSaleSubmissionStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterPrivateSaleSubmissionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsIn(['All', 'Pending', 'Approved', 'Rejected'])
  status?: 'All' | PrivateSaleSubmissionStatus;
}
