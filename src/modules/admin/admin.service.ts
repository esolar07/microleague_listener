import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { Admin } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    return this.prisma.admin.create({
      data: {
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        address: createAdminDto.address.toLowerCase(),
        superAdmin: createAdminDto.superAdmin || false,
      },
    });
  }

  async findAll(): Promise<Admin[]> {
    return this.prisma.admin.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async findByAddress(address: string): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with address ${address} not found`);
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    return this.prisma.admin.update({
      where: { id },
      data: {
        firstName: updateAdminDto.firstName,
        lastName: updateAdminDto.lastName,
        address: updateAdminDto.address?.toLowerCase(),
        superAdmin: updateAdminDto.superAdmin,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string): Promise<void> {
    const admin = await this.findOne(id);
    
    await this.prisma.admin.delete({
      where: { id },
    });
  }

  async isAdmin(address: string): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: { address: address.toLowerCase() },
    });

    return !!admin;
  }

  async isSuperAdmin(address: string): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: { address: address.toLowerCase() },
    });

    return admin?.superAdmin || false;
  }
}