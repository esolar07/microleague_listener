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
    const transfer = await this.bankTransfersService.create(createBankTransferDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Bank transfer submitted successfully',
      data: transfer,
    };
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiGetAllBankTransfers()
  async findAll(@Query() filters: FilterBankTransfersDto) {
    const result = await this.bankTransfersService.findAll(filters);
    return {
      statusCode: HttpStatus.OK,
      message: 'Bank transfers retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      stats: result.stats,
    };
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiGetBankTransferStats()
  async getStats() {
    const stats = await this.bankTransfersService.getStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  @ApiGetBankTransfer()
  async findOne(@Param('id') id: string) {
    const transfer = await this.bankTransfersService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Bank transfer retrieved successfully',
      data: transfer,
    };
  }

  @Patch(':id')
  @ApiUpdateBankTransfer()
  async update(
    @Param('id') id: string,
    @Body() updateBankTransferDto: UpdateBankTransferDto,
  ) {
    const transfer = await this.bankTransfersService.update(id, updateBankTransferDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Bank transfer updated successfully',
      data: transfer,
    };
  }

  @Post(':id/verify')
  @ApiVerifyBankTransfer()
  async verify(
    @Param('id') id: string,
    @Body() verifyBankTransferDto: VerifyBankTransferDto,
  ) {
    const adminId = 'admin-user-id'; // Replace with actual admin ID from request
    const transfer = await this.bankTransfersService.verify(id, verifyBankTransferDto, adminId);
    
    const message = verifyBankTransferDto.status === 'Verified' 
      ? `Bank transfer ${id} has been approved and tokens allocated`
      : `Bank transfer ${id} has been rejected`;

    return {
      statusCode: HttpStatus.OK,
      message,
      data: transfer,
    };
  }

  @Delete(':id')
  @ApiDeleteBankTransfer()
  async remove(@Param('id') id: string) {
    await this.bankTransfersService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Bank transfer deleted successfully',
    };
  }
}