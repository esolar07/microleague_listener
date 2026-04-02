// auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/auth.guard';
import { AuthUser } from 'src/decorators/user.decorator';
import { UserService } from '../user/user.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getAuthUser(@AuthUser() user: any) {
    return user;
    // return this.userService.findOne({
    //     address: { $regex: new RegExp(authUser?.address, "i") },
    // });
  }


}
