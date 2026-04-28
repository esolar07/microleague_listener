// saft.controller.ts
import { Controller, Get, Post, Param, Body, Res, NotFoundException, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';

@Controller('saft')
export class SaftController {
  private readonly logger = new Logger(SaftController.name);
  private readonly pdfDir = process.env.PDF_OUTPUT_DIR || './pdfs';

  constructor(
    private readonly pdfService: PdfService,
    private readonly emailService: EmailService,
  ) {}

  @Get('certificate/:txHash')
  async getCertificate(@Param('txHash') txHash: string, @Res() res: Response) {
    try {
      // Find PDF file by transaction hash
      const files = fs.readdirSync(this.pdfDir);
      const pdfFile = files.find(file => 
        file.includes(txHash) || file.toLowerCase().includes(txHash.toLowerCase())
      );

      if (!pdfFile) {
        // Try to find by partial match
        const partialMatch = files.find(file => 
          file.replace('SAFT_Certificate_', '').replace('.pdf', '').includes(txHash.substring(0, 10))
        );

        if (!partialMatch) {
          throw new NotFoundException(`SAFT certificate not found for transaction ${txHash}`);
        }

        return this.sendPdfFile(partialMatch, res);
      }

      return this.sendPdfFile(pdfFile, res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error retrieving SAFT certificate: ${error.message}`, error.stack);
      throw new NotFoundException(`SAFT certificate not found for transaction ${txHash}`);
    }
  }

  @Get('certificate/ref/:ref')
  async getCertificateByRef(@Param('ref') ref: string, @Res() res: Response) {
    try {
      const files = fs.readdirSync(this.pdfDir);
      const pdfFile = files.find(file => 
        file.includes(ref) || file.toLowerCase().includes(ref.toLowerCase())
      );

      if (!pdfFile) {
        throw new NotFoundException(`SAFT certificate not found for reference ${ref}`);
      }

      return this.sendPdfFile(pdfFile, res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error retrieving SAFT certificate by ref: ${error.message}`, error.stack);
      throw new NotFoundException(`SAFT certificate not found for reference ${ref}`);
    }
  }

  @Post('test')
  async sendTestCertificate(
    @Body()
    body: {
      email?: string;
      walletAddress?: string;
      usdAmount?: number;
      tokens?: number;
      sendEmail?: boolean;
      vesting?: { cliffSeconds: number; durationSeconds: number; releaseIntervalSeconds: number };
    },
  ) {
    const email = body.email || 'test@microleague.com';
    const wallet = body.walletAddress || '0xTEST000000000000000000000000000000000000';
    const usdAmount = body.usdAmount ?? 100;
    const tokens = body.tokens ?? 1_000_000;
    const txHash = `0xTEST${Date.now().toString(16).padStart(60, '0')}`;
    const txRef = `MLC-TEST-${Date.now().toString(36).toUpperCase()}`;
    const vesting = body.vesting ?? { cliffSeconds: 86400, durationSeconds: 10368000, releaseIntervalSeconds: 2592000 };

    const { localPath, cloudinaryUrl } = await this.pdfService.generateSAFTCertificate(
      wallet,
      txHash,
      usdAmount,
      tokens,
      txRef,
      email,
      vesting,
    );

    let emailSent = false;
    if (body.sendEmail !== false) {
      emailSent = await this.emailService.sendSAFTCertificate(
        email,
        wallet,
        txHash,
        usdAmount,
        tokens,
        txRef,
        localPath,
        vesting,
      );
    }

    return {
      success: true,
      txRef,
      localPath,
      cloudinaryUrl: cloudinaryUrl ?? null,
      emailSent,
      sentTo: body.sendEmail !== false ? email : null,
    };
  }

  @Get('list')
  async listCertificates() {
    try {
      const files = fs.readdirSync(this.pdfDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      return {
        count: pdfFiles.length,
        files: pdfFiles.map(file => {
          const stats = fs.statSync(path.join(this.pdfDir, file));
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        }),
      };
    } catch (error) {
      this.logger.error(`Error listing SAFT certificates: ${error.message}`);
      return { count: 0, files: [] };
    }
  }

  private sendPdfFile(filename: string, res: Response) {
    const filePath = path.join(this.pdfDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`PDF file not found: ${filename}`);
    }

    const stats = fs.statSync(filePath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}