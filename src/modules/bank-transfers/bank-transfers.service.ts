import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BankTransfer, BankTransferStatus } from '@prisma/client';
import { CreateBankTransferDto } from './dto/create-bank-transfer.dto';
import { UpdateBankTransferDto } from './dto/update-bank-transfer.dto';
import { VerifyBankTransferDto } from './dto/verify-bank-transfer.dto';
import { FilterBankTransfersDto } from './dto/filter-bank-transfers.dto';

@Injectable()
export class BankTransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBankTransferDto: CreateBankTransferDto): Promise<BankTransfer> {
    // Generate unique ID in BT-YYYY-XXX format
    const year = new Date().getFullYear();
    const count = await this.prisma.bankTransfer.count({
      where: {
        transferId: {
          startsWith: `BT-${year}-`
        }
      }
    });
    const transferId = `BT-${year}-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.bankTransfer.create({
      data: {
        transferId,
        walletAddress: createBankTransferDto.walletAddress,
        amount: createBankTransferDto.amount,
        senderName: createBankTransferDto.senderName,
        bankName: createBankTransferDto.bankName,
        transactionRef: createBankTransferDto.transactionRef,
        paymentRef: createBankTransferDto.paymentRef,
        submittedDate: new Date(createBankTransferDto.submittedDate),
        proofUrl: createBankTransferDto.proofUrl,
        notes: createBankTransferDto.notes || '',
      },
    });
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
    const search = filters.search;
    const status = filters.status;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const where: any = {};

    // walletAddress filter
    if (filters.walletAddress) {
      where.walletAddress = { equals: filters.walletAddress, mode: 'insensitive' };
    }

    // Search filter
    if (search) {
      where.OR = [
        { transferId: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { transactionRef: { contains: search, mode: 'insensitive' } },
        { paymentRef: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      where.status = status as BankTransferStatus;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.bankTransfer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedDate: 'desc' },
      }),
      this.prisma.bankTransfer.count({ where }),
    ]);

    const stats = await this.getStats();

    return {
      data,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
        limit,
      },
      stats,
    };
  }

  async findOne(transferId: string): Promise<BankTransfer> {
    // Try by transferId first, then by database id
    const transfer = await this.prisma.bankTransfer.findFirst({
      where: {
        OR: [
          { transferId },
          { id: transferId },
        ],
      },
    });
    
    if (!transfer) {
      throw new NotFoundException(`Bank transfer with ID ${transferId} not found`);
    }
    
    return transfer;
  }

  async update(transferId: string, updateBankTransferDto: UpdateBankTransferDto): Promise<BankTransfer> {
    try {
      // Find by transferId or id
      const existing = await this.findOne(transferId);
      const updateData: any = { ...updateBankTransferDto };
      return await this.prisma.bankTransfer.update({
        where: { id: existing.id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Bank transfer with ID ${transferId} not found`);
    }
  }

  async verify(
    transferId: string, 
    verifyBankTransferDto: VerifyBankTransferDto, 
    adminId: string
  ): Promise<BankTransfer> {
    const existing = await this.findOne(transferId);

    const updateData: any = {
      status: verifyBankTransferDto.status,
      verificationNote: verifyBankTransferDto.verificationNote,
    };

    if (verifyBankTransferDto.status === BankTransferStatus.Verified) {
      updateData.verifiedBy = adminId;
      updateData.verifiedAt = new Date();
    } else if (verifyBankTransferDto.status === BankTransferStatus.Rejected) {
      updateData.rejectedBy = adminId;
      updateData.rejectedAt = new Date();
    }

    return await this.prisma.bankTransfer.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  async remove(transferId: string): Promise<void> {
    const existing = await this.findOne(transferId);
    await this.prisma.bankTransfer.delete({
      where: { id: existing.id },
    });
  }

  async getStats(): Promise<any> {
    const [pending, verified, rejected, totalAmount] = await Promise.all([
      this.prisma.bankTransfer.count({ where: { status: BankTransferStatus.Pending } }),
      this.prisma.bankTransfer.count({ where: { status: BankTransferStatus.Verified } }),
      this.prisma.bankTransfer.count({ where: { status: BankTransferStatus.Rejected } }),
      this.prisma.bankTransfer.aggregate({
        _sum: { amount: true },
      }),
    ]);

    return {
      pending,
      verified,
      rejected,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
}