import { DB_COLLECTIONS } from 'src/constants/collections';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankTransfer, BankTransferDocument, BankTransferStatus } from './entities/bank-transfer.entity';
import { CreateBankTransferDto } from './dto/create-bank-transfer.dto';
import { UpdateBankTransferDto } from './dto/update-bank-transfer.dto';
import { VerifyBankTransferDto } from './dto/verify-bank-transfer.dto';
import { FilterBankTransfersDto } from './dto/filter-bank-transfers.dto';
import { paginate } from '../../utils/pagination.util';

@Injectable()
export class BankTransfersService {
  constructor(
    @InjectModel(DB_COLLECTIONS.BANK_TRANSFER) private bankTransferModel: Model<BankTransferDocument>,
  ) {}

  async create(createBankTransferDto: CreateBankTransferDto): Promise<BankTransfer> {
    // Generate unique ID in BT-YYYY-XXX format
    const year = new Date().getFullYear();
    const count = await this.bankTransferModel.countDocuments({
      id: new RegExp(`BT-${year}-`)
    });
    const id = `BT-${year}-${String(count + 1).padStart(3, '0')}`;

    const createdTransfer = new this.bankTransferModel({
      ...createBankTransferDto,
      id,
      submittedDate: new Date(createBankTransferDto.submittedDate),
    });
    
    return createdTransfer.save();
  }

  async findAll(filters: FilterBankTransfersDto): Promise<{
    data: BankTransfer[];
    pagination: {
      totalCount: number;
      totalPages: number;
      page: number;
      limit: number;
    };
    stats: any;
  }> {
    const { search, status, ...paginationDto } = filters;
    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { id: { $regex: search, $options: 'i' } },
        { walletAddress: { $regex: search, $options: 'i' } },
        { transactionRef: { $regex: search, $options: 'i' } },
        { paymentRef: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== BankTransferStatus.ALL) { 
      query.status = status;
    }

    // Set default sort if not provided
    if (!paginationDto.sort) {
      paginationDto.sort = { submittedDate: -1 };
    }

    // Use your existing paginate utility
    const paginationResult = await paginate(
      this.bankTransferModel,
      query,
      paginationDto,
      [] // No populate fields needed
    );

    // Get stats using the public method
    const stats = await this.getStats();

    return {
      data: paginationResult.data,
      pagination: {
        totalCount: paginationResult.totalCount,
        totalPages: paginationResult.totalPages,
        page: paginationResult.page,
        limit: paginationResult.limit,
      },
      stats,
    };
  }

  async findOne(id: string): Promise<BankTransfer> {
    const transfer = await this.bankTransferModel.findOne({ id }).exec();
    if (!transfer) {
      throw new NotFoundException(`Bank transfer with ID ${id} not found`);
    }
    return transfer;
  }

  async update(id: string, updateBankTransferDto: UpdateBankTransferDto): Promise<BankTransfer> {
    const existingTransfer = await this.bankTransferModel
      .findOneAndUpdate({ id }, updateBankTransferDto, { new: true })
      .exec();
    
    if (!existingTransfer) {
      throw new NotFoundException(`Bank transfer with ID ${id} not found`);
    }
    
    return existingTransfer;
  }

  async verify(
    id: string, 
    verifyBankTransferDto: VerifyBankTransferDto, 
    adminId: string
  ): Promise<BankTransfer> {
    const updateData: any = {
      status: verifyBankTransferDto.status,
      verificationNote: verifyBankTransferDto.verificationNote,
    };

    if (verifyBankTransferDto.status === BankTransferStatus.VERIFIED) {
      updateData.verifiedBy = adminId;
      updateData.verifiedAt = new Date();
    } else if (verifyBankTransferDto.status === BankTransferStatus.REJECTED) {
      updateData.rejectedBy = adminId;
      updateData.rejectedAt = new Date();
    }

    const updatedTransfer = await this.bankTransferModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();

    if (!updatedTransfer) {
      throw new NotFoundException(`Bank transfer with ID ${id} not found`);
    }

    return updatedTransfer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.bankTransferModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Bank transfer with ID ${id} not found`);
    }
  }

  // Make this method public so it can be used by the controller
  async getStats(): Promise<any> {
    const stats = await this.bankTransferModel.aggregate([
      {
        $group: {
          _id: null,
          pending: {
            $sum: { $cond: [{ $eq: ['$status', BankTransferStatus.PENDING] }, 1, 0] }
          },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', BankTransferStatus.VERIFIED] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', BankTransferStatus.REJECTED] }, 1, 0] }
          },
          totalAmount: { $sum: '$amount' },
        }
      }
    ]);

    return stats[0] || { pending: 0, verified: 0, rejected: 0, totalAmount: 0 };
  }
}