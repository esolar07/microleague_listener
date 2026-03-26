import { Controller, Post, Body, Get, UseGuards, Delete, Param, ForbiddenException } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dto/create-admin.dto";

import { AuthUser } from "src/decorators/user.decorator";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("admin")
export class AdminController {
  constructor(private readonly userService: AdminService) {}

  @UseGuards(AdminGuard)
  @Post()
  async create(@Body() createAdminDto: CreateAdminDto, @AuthUser() user: any) {
    const authUser = user?.verified_credentials?.find((item) => item.address);
    if (!authUser?.address) {
      throw new ForbiddenException("Unauthorized");
    }

    // Check if current user is super admin
    const isSuperAdmin = await this.userService.isSuperAdmin(authUser.address);
    if (!isSuperAdmin) {
      throw new ForbiddenException("Only super admin can create new admins");
    }

    return this.userService.create(createAdminDto);
  }

  @UseGuards(AdminGuard)
  @Get("me")
  async getAdminByAddress(@AuthUser() user: any) {
    return this.userService.findOne({
      address: { $regex: new RegExp(user?.address, "i") },
    });
  }

  @UseGuards(AdminGuard)
  @Get()
  async getAllAdmins(@AuthUser() user: any) {
    const authUser = user?.verified_credentials?.find((item) => item.address);
    if (!authUser?.address) {
      throw new ForbiddenException("Unauthorized");
    }

    // Check if current user is super admin
    const isSuperAdmin = await this.userService.isSuperAdmin(authUser.address);
    if (!isSuperAdmin) {
      throw new ForbiddenException("Only super admin can view all admins");
    }

    return this.userService.findAll();
  }

  @UseGuards(AdminGuard)
  @Delete(":id")
  async deleteAdmin(@Param("id") id: string, @AuthUser() user: any) {
    const authUser = user?.verified_credentials?.find((item) => item.address);
    if (!authUser?.address) {
      throw new ForbiddenException("Unauthorized");
    }

    // Check if current user is super admin
    const isSuperAdmin = await this.userService.isSuperAdmin(authUser.address);
    if (!isSuperAdmin) {
      throw new ForbiddenException("Only super admin can delete admins");
    }

    await this.userService.delete(id);
    return { message: "Admin deleted successfully" };
  }
}
