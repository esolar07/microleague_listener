import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpStatus,
  Query,
  Patch,
  Delete,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AddReferralDTO } from "./dto/create-user.dto";
import { UserDocument } from "./entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { AuthUser } from "src/decorators/user.decorator";
import {
  ApiCreateBuyer,
  ApiGetAllBuyers,
  ApiGetBuyer,
  ApiUpdateBuyer,
  ApiDeleteBuyer,
  ApiGetBuyerStats,
  ApiGetTopBuyer,
} from "./decorators/buyers.decorator";
import { ApiTags } from "@nestjs/swagger";
import { CreateBuyerDto } from "./dto/create-buyer.dto";
import { FilterBuyersDto } from "./dto/filter-buyers.dto";
import { UpdateBuyerDto } from "./dto/update-buyer.dto";
import { AdminGuard } from "../auth/guards/admin.guard";

@ApiTags("user")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post("add-referral")
  async createUser(
    @AuthUser() user: UserDocument,
    @Body() data: AddReferralDTO,
  ) {
    return this.userService.addReferral(user, data);
  }

  @Get("address/:address")
  async findUserByAddress(
    @Param("address") address: string,
  ): Promise<UserDocument | null> {
    return this.userService.findUserByAddress(address);
  }

  @UseGuards(AdminGuard)
  @Post()
  @ApiCreateBuyer()
  async create(@Body() createBuyerDto: CreateBuyerDto) {
    const buyer = await this.userService.create(createBuyerDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: "Buyer created successfully",
      data: buyer,
    };
  }

  @UseGuards(AdminGuard)
  @Get()
  @ApiGetAllBuyers()
  async findAll(@Query() filters: FilterBuyersDto) {
    const result = await this.userService.findAll(filters);
    return {
      statusCode: HttpStatus.OK,
      message: "Buyers retrieved successfully",
      data: result.data,
      pagination: result.pagination,
      stats: result.stats,
    };
  }

  @UseGuards(AdminGuard)
  @Get("stats")
  @ApiGetBuyerStats()
  async getStats() {
    const stats = await this.userService.getStats();
    return {
      statusCode: HttpStatus.OK,
      message: "Statistics retrieved successfully",
      data: stats,
    };
  }

  @UseGuards(AdminGuard)
  @Get("top")
  @ApiGetTopBuyer()
  async getTopBuyers(@Query("limit") limit?: number) {
    const topLimit = limit ? Number(limit) : 5;
    const topBuyers = await this.userService.getTopBuyers(topLimit);
    return {
      statusCode: HttpStatus.OK,
      message: "Top buyers retrieved successfully",
      data: topBuyers,
    };
  }

  @Get(":id")
  @ApiGetBuyer()
  async findOne(@Param("id") id: string) {
    const buyer = await this.userService.findOne({ _id: id });
    return {
      statusCode: HttpStatus.OK,
      message: "Buyer retrieved successfully",
      data: buyer,
    };
  }

  @Patch(":id")
  @ApiUpdateBuyer()
  async update(
    @Param("id") id: string,
    @Body() updateBuyerDto: UpdateBuyerDto,
  ) {
    const buyer = await this.userService.update(id, updateBuyerDto);
    return {
      statusCode: HttpStatus.OK,
      message: "Buyer updated successfully",
      data: buyer,
    };
  }

  @Delete(":id")
  @ApiDeleteBuyer()
  async remove(@Param("id") id: string) {
    await this.userService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: "Buyer deleted successfully",
    };
  }
}
