// auth/user.service.ts
import { HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, QueryOptions } from "mongoose";
import { BuyerStatus, User, UserDocument } from "./entities/user.entity";
import { DB_COLLECTIONS } from "src/constants/collections";
import { AddReferralDTO, CreateUserDTO } from "./dto/create-user.dto";
import { FilterBuyersDto } from "./dto/filter-buyers.dto";
import { paginate } from "src/utils/pagination.util";
import { Types } from "mongoose";
import { UpdateBuyerDto } from "./dto/update-buyer.dto";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWalletAddress(walletAddress?: string | null): string | null {
  if (!walletAddress) return null;
  const trimmed = String(walletAddress).trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(DB_COLLECTIONS.USERS)
    readonly userModel: Model<UserDocument>,
  ) { }

  create(data): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async findOne(
    clause: QueryOptions<UserDocument>,
  ): Promise<UserDocument | undefined> {
    return this.userModel.findOne(clause).exec();
  }

  async findUserByAddress(address: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        "verifiedCredentials.address": address, // Assuming verifiedCredentials stores the address
      })
      .exec();
  }

  async findByWalletAddress(
    walletAddress: string,
  ): Promise<UserDocument | null> {
    const normalized = normalizeWalletAddress(walletAddress);
    if (!normalized) return null;

    const exact = await this.userModel
      .findOne({ walletAddress: normalized })
      .exec();
    if (exact) return exact;

    // Backwards-compat: handle legacy mixed-case values stored in DB
    return this.userModel
      .findOne({
        walletAddress: {
          $regex: `^${escapeRegExp(walletAddress)}$`,
          $options: "i",
        },
      })
      .exec();
  }

  async createOrUpdate(createUserDto: CreateUserDTO): Promise<User> {
    const normalizedWallet = normalizeWalletAddress(
      createUserDto.walletAddress,
    );
    const payload: any = { ...createUserDto, walletAddress: normalizedWallet };

    // Prefer exact lowercase match (our canonical format).
    let existing = normalizedWallet
      ? await this.userModel.findOne({ walletAddress: normalizedWallet }).exec()
      : null;

    // If not found, attempt case-insensitive match for any legacy mixed-case records.
    if (!existing && createUserDto.walletAddress) {
      existing = await this.userModel
        .findOne({
          walletAddress: {
            $regex: `^${escapeRegExp(String(createUserDto.walletAddress))}$`,
            $options: "i",
          },
        })
        .exec();
    }

    // Update existing record (also normalizes walletAddress on write).
    if (existing) {
      return this.userModel.findByIdAndUpdate(existing._id, payload, {
        new: true,
        runValidators: true,
      });
    }

    // Create new record.
    return this.userModel.create(payload);
  }

  async addReferral(
    user: UserDocument,
    data: AddReferralDTO,
  ): Promise<User | null> {
    if (user?.referredBy) {
      // Already referred by someone, skip
      return user;
    }

    const referrer = await this.userModel.findById(data.referralId);
    if (!referrer) {
      throw new NotFoundException("Referrer not found");
    }

    // Update current user with referrer
    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: user._id },
      { referredBy: referrer._id },
      { new: true },
    );

    // Add current user to referrer's referrals array
    await this.userModel.updateOne(
      { _id: referrer._id },
      { $addToSet: { referrals: user._id } }, // addToSet to avoid duplicates
    );

    return updatedUser;
  }

  async findAll(filters: FilterBuyersDto): Promise<{
    data: User[];
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

    // Search filter — wallet address, username, or name
    if (search) {
      query.$or = [
        { walletAddress: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status && status !== BuyerStatus.ALL) {
      query.status = status;
    }

    // Set default sort if not provided
    if (!paginationDto.sort) {
      paginationDto.sort = { joinDate: -1 };
    }

    // Use your existing paginate utility
    const paginationResult = await paginate(
      this.userModel,
      query,
      paginationDto,
      [], // No populate fields needed
    );

    // Get stats
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

  async update(id: string, updateBuyerDto: UpdateBuyerDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid buyer ID: ${id}`);
    }

    const existingUser = await this.userModel
      .findByIdAndUpdate(id, updateBuyerDto, { new: true })
      .exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return existingUser;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid user ID: ${id}`);
    }

    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // NEW METHOD: Get top buyers (Active only, sorted by tokens purchased)
  async getTopBuyers(limit: number = 5): Promise<User[]> {
    const topBuyers = await this.userModel
      .find({ status: BuyerStatus.ACTIVE }) // Only active buyers
      .sort({ tokensPurchased: -1 }) // Sort by tokens purchased (descending)
      .limit(limit) // Limit to top N buyers
      .exec();

    return topBuyers;
  }

  // Public method for stats
  async getStats(): Promise<any> {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: null,
          totalBuyers: { $sum: 1 },
          activeBuyers: {
            $sum: { $cond: [{ $eq: ["$status", BuyerStatus.ACTIVE] }, 1, 0] },
          },
          totalVolume: { $sum: "$amountSpent" },
          totalTokensPurchased: { $sum: "$tokensPurchased" },
          totalClaimed: { $sum: "$claimed" },
          totalUnclaimed: { $sum: "$unclaimed" },
          totalReferrals: { $sum: "$referrals" },
          avgPurchase: { $avg: "$amountSpent" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalBuyers: 0,
        activeBuyers: 0,
        totalVolume: 0,
        totalTokensPurchased: 0,
        totalClaimed: 0,
        totalUnclaimed: 0,
        totalReferrals: 0,
        avgPurchase: 0,
      }
    );
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async updateUser(userId: string, updateData: any) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );
  }


}
