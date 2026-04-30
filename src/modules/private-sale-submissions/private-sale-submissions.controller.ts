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
  Request,
} from '@nestjs/common';
import { PrivateSaleSubmissionsService } from './private-sale-submissions.service';
import { CreatePrivateSaleSubmissionDto } from './dto/create-private-sale-submission.dto';
import { FilterPrivateSaleSubmissionsDto } from './dto/filter-private-sale-submissions.dto';
import { VerifyPrivateSaleSubmissionDto } from './dto/verify-private-sale-submission.dto';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@ApiTags('Private Sale Submissions')
@Controller('private-sale-submissions')
export class PrivateSaleSubmissionsController {
  constructor(private readonly service: PrivateSaleSubmissionsService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  @Post('upload-proof')
  async uploadProof(
    @Body() body: { walletAddress?: string; fileBase64: string; mimeType?: string; fileName?: string },
  ) {
    if (!body.fileBase64) throw new BadRequestException('No file data provided');

    const walletAddress = (body.walletAddress || 'unknown').toLowerCase();
    const timestamp = Date.now();
    const buffer = Buffer.from(body.fileBase64, 'base64');

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'private-sale-proofs',
          public_id: `${walletAddress}_${timestamp}`,
          resource_type: 'auto',
          tags: ['private-sale', 'proof', walletAddress],
        },
        (err, r) => { if (err) reject(err); else resolve(r); },
      );
      Readable.from(buffer).pipe(stream);
    });

    return { success: true, url: result.secure_url };
  }

  @Post()
  async create(@Body() dto: CreatePrivateSaleSubmissionDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() filters: FilterPrivateSaleSubmissionsDto) {
    return this.service.findAll(filters);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  async getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/verify')
  @UseGuards(AdminGuard)
  async verify(
    @Param('id') id: string,
    @Body() dto: VerifyPrivateSaleSubmissionDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || 'unknown';
    return this.service.verify(id, dto, adminId);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { message: 'Submission deleted successfully' };
  }
}
