import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
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
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@ApiTags('Bank Transfers')
@Controller('bank-transfers')
export class BankTransfersController {
  constructor(private readonly bankTransfersService: BankTransfersService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload proof file to Cloudinary.
   * Body: { walletAddress, fileBase64, mimeType, fileName }
   */
  @Post('upload-proof')
  async uploadProof(@Body() body: { walletAddress?: string; fileBase64: string; mimeType?: string; fileName?: string }) {
    if (!body.fileBase64) throw new BadRequestException('No file data provided');

    const walletAddress = (body.walletAddress || 'unknown').toLowerCase();
    const timestamp = Date.now();
    const buffer = Buffer.from(body.fileBase64, 'base64');

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bank-transfer-proofs',
          public_id: `${walletAddress}_${timestamp}`,
          resource_type: 'auto',
          tags: ['bank-transfer', 'proof', walletAddress],
        },
        (err, r) => { if (err) reject(err); else resolve(r); }
      );
      Readable.from(buffer).pipe(stream);
    });

    return { success: true, url: result.secure_url };
  }

  @Post()
  @ApiCreateBankTransfer()
  async create(@Body() createBankTransferDto: CreateBankTransferDto) {
    return await this.bankTransfersService.create(createBankTransferDto);
  }

  @Get()
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