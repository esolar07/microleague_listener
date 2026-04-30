import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrivateSaleSubmission, PrivateSaleSubmissionStatus } from '@prisma/client';
import { CreatePrivateSaleSubmissionDto } from './dto/create-private-sale-submission.dto';
import { FilterPrivateSaleSubmissionsDto } from './dto/filter-private-sale-submissions.dto';
import { VerifyPrivateSaleSubmissionDto } from './dto/verify-private-sale-submission.dto';
import { EmailQueueService } from '../queue/email/email.queue.service';

@Injectable()
export class PrivateSaleSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailQueueService,
  ) {}

  async create(dto: CreatePrivateSaleSubmissionDto): Promise<PrivateSaleSubmission> {
    const year = new Date().getFullYear();
    const count = await this.prisma.privateSaleSubmission.count({
      where: { submissionId: { startsWith: `PSS-${year}-` } },
    });
    const submissionId = `PSS-${year}-${String(count + 1).padStart(3, '0')}`;

    const submission = await this.prisma.privateSaleSubmission.create({
      data: {
        submissionId,
        fullName: dto.fullName,
        email: dto.email,
        contact: dto.contact,
        country: dto.country,
        walletAddress: dto.walletAddress,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionRef: dto.transactionRef,
        paymentReference: dto.paymentReference,
        proofUrl: dto.proofUrl,
        proofFileName: dto.proofFileName,
        notes: dto.notes || '',
      },
    });

    this.emailService.privateSaleConfirmation({
      email: submission.email,
      fullName: submission.fullName,
      submissionId: submission.submissionId,
      amount: submission.amount,
      paymentMethod: submission.paymentMethod,
    });

    return submission;
  }

  async findAll(filters: FilterPrivateSaleSubmissionsDto): Promise<{
    data: PrivateSaleSubmission[];
    pagination: { totalCount: number; totalPages: number; page: number; limit: number };
    stats: any;
  }> {
    const { search, status, walletAddress } = filters;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const where: any = {};

    if (walletAddress) {
      where.walletAddress = { equals: walletAddress, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { submissionId: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { transactionRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'All') {
      where.status = status as PrivateSaleSubmissionStatus;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.privateSaleSubmission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.privateSaleSubmission.count({ where }),
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

  async findOne(id: string): Promise<PrivateSaleSubmission> {
    const submission = await this.prisma.privateSaleSubmission.findFirst({
      where: { OR: [{ submissionId: id }, { id }] },
    });

    if (!submission) {
      throw new NotFoundException(`Private sale submission ${id} not found`);
    }

    return submission;
  }

  async verify(
    id: string,
    dto: VerifyPrivateSaleSubmissionDto,
    adminId: string,
  ): Promise<PrivateSaleSubmission> {
    const existing = await this.findOne(id);

    const updateData: any = {
      status: dto.status,
      verificationNote: dto.verificationNote,
    };

    if (dto.status === PrivateSaleSubmissionStatus.Approved) {
      updateData.verifiedBy = adminId;
      updateData.verifiedAt = new Date();
      if (dto.transactionHash) updateData.allocationTxHash = dto.transactionHash;
      if (dto.allocatedTokens) updateData.allocatedTokens = dto.allocatedTokens;
      if (dto.allocatedStageId !== undefined) updateData.allocatedStageId = dto.allocatedStageId;
    } else if (dto.status === PrivateSaleSubmissionStatus.Rejected) {
      updateData.rejectedBy = adminId;
      updateData.rejectedAt = new Date();
    }

    return this.prisma.privateSaleSubmission.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.prisma.privateSaleSubmission.delete({ where: { id: existing.id } });
  }

  async getStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  }> {
    const [pending, approved, rejected, totalAmount] = await Promise.all([
      this.prisma.privateSaleSubmission.count({ where: { status: PrivateSaleSubmissionStatus.Pending } }),
      this.prisma.privateSaleSubmission.count({ where: { status: PrivateSaleSubmissionStatus.Approved } }),
      this.prisma.privateSaleSubmission.count({ where: { status: PrivateSaleSubmissionStatus.Rejected } }),
      this.prisma.privateSaleSubmission.aggregate({ _sum: { amount: true } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
}
