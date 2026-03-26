// auth/user.service.ts
import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminDocument } from './entities/admin.entity';
import { DB_COLLECTIONS } from 'src/constants/collections';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(DB_COLLECTIONS.ADMIN)
    readonly adminModel: Model<AdminDocument>,
  ) {}

  async create(data): Promise<AdminDocument> {
    // Check if admin with same address already exists
    const existingAdmin = await this.adminModel.findOne({
      address: data.address.toLowerCase(),
    }).exec();

    if (existingAdmin) {
      throw new ConflictException('Admin with this address already exists');
    }

    return this.adminModel.create({
      ...data,
      address: data.address.toLowerCase(),
      superAdmin: false, // New admins are not super admin by default
    });
  }

  async findOne(clause: { [key: string]: unknown }): Promise<AdminDocument | undefined> {
    return this.adminModel.findOne(clause).exec();
  }

  async findAdminById(id: string): Promise<AdminDocument> {
    const admin = await this.adminModel.findById(id).exec();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  async findAll(): Promise<AdminDocument[]> {
    return this.adminModel.find().sort({ createdAt: -1 }).exec();
  }

  async delete(id: string): Promise<void> {
    const admin = await this.findAdminById(id);
    if (admin.superAdmin) {
      throw new ForbiddenException('Cannot delete super admin');
    }
    await this.adminModel.findByIdAndDelete(id).exec();
  }

  async isSuperAdmin(address: string): Promise<boolean> {
    const admin = await this.findOne({ address: address.toLowerCase() });
    return admin?.superAdmin === true;
  }
}
