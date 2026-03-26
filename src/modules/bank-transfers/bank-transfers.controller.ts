import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BankTransfersService } from './bank-transfers.service';
import { CreateBankTransferDto } from './dto/create-bank-transfer.dto';
import { UpdateBankTransferDto } from './dto/update-bank-transfer.dto';
import { VerifyBankTransferDto } from './dto/verify-bank-transfer.dto';
import { FilterBankTransfersDto } from './dto/filter-bank-transfers.dto';
import { 
  ApiCreateBankTransfer,
  ApiGetAllBankTransfers,
  ApiGetBankTransfer,
  ApiUpdateBankTransfer,
  ApiVerifyBankTransfer,
  ApiDeleteBankTransfer,
  ApiGetBankTransferStats
} from './decorators/bank-transfers.decorator';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Bank Transfers')
@Controller('bank-transfers')
export class BankTransfersController {
  constructor(private readonly bankTransfersService: BankTransfersService) {}
  
  @Post()
  @ApiCreateBankTransfer()
  @UseGuards(AdminGuard)
  async create(@Body() createBankTransferDto: CreateBankTransferDto) {
    return await this.bankTransfersService.create(createBankTransferDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiGetAllBankTransfers()
  async findAll(@Query() filters: FilterBankTransfersDto) {
    return await this.bankTransfersService.findAll(filters);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiGetBankTransferStats()
  async getStats() {
    return await this.bankTransfersService.getStats();
  }

  @Get(':transferId')
  @ApiGetBankTransfer()
  async findOne(@Param('transferId') transferId: string) {
    return await this.bankTransfersService.findOne(transferId);
  }

  @Patch(':transferId')
  @ApiUpdateBankTransfer()
  async update(
    @Param('transferId') transferId: string,
    @Body() updateBankTransferDto: UpdateBankTransferDto,
  ) {
    return await this.bankTransfersService.update(transferId, updateBankTransferDto);
  }

  @Post(':transferId/verify')
  @ApiVerifyBankTransfer()
  async verify(
    @Param('transferId') transferId: string,
    @Body() verifyBankTransferDto: VerifyBankTransferDto,
  ) {
    const adminId = 'admin-user-id'; // Replace with actual admin ID from request
    return await this.bankTransfersService.verify(transferId, verifyBankTransferDto, adminId);
  }

  @Delete(':transferId')
  @ApiDeleteBankTransfer()
  async remove(@Param('transferId') transferId: string) {
    await this.bankTransfersService.remove(transferId);
    return { message: 'Bank transfer deleted successfully' };
  }
}