// pdf.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinaryV2 } from 'cloudinary';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly outputDir = process.env.PDF_OUTPUT_DIR || './pdfs';

  // Page constants
  private readonly PAGE_W = 595.28; // A4 width in points
  private readonly MARGIN = 50;
  private readonly CONTENT_W = 595.28 - 100; // PAGE_W - 2*MARGIN

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    cloudinaryV2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async generateSAFTCertificate(
    walletAddress: string,
    txHash: string,
    usdAmount: number,
    tokens: number,
    txRef: string,
    email?: string,
    vesting?: { cliffSeconds: number; durationSeconds: number; releaseIntervalSeconds: number },
  ): Promise<{ localPath: string; cloudinaryUrl?: string }> {
    const fileName = `SAFT_Certificate_${txRef}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: this.MARGIN,
          info: {
            Title: `SAFT Certificate - ${txRef}`,
            Author: 'MicroLeague Technologies Ltd',
          },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const date = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
        const pricePerToken = tokens > 0 ? usdAmount / tokens : 0.01;

        const fmtDur = (s: number): string => {
          if (s === 0) return 'None';
          const d = Math.floor(s / 86400);
          if (d >= 365) return `${Math.round(d / 365)} year${d >= 730 ? 's' : ''}`;
          if (d >= 30) return `${Math.round(d / 30)} month${d >= 60 ? 's' : ''}`;
          if (d > 0) return `${d} day${d > 1 ? 's' : ''}`;
          const h = Math.floor(s / 3600);
          if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
          return `${Math.floor(s / 60)} min`;
        };

        const cliffDisplay = fmtDur(vesting?.cliffSeconds ?? 0);
        const durationDisplay = fmtDur(vesting?.durationSeconds ?? 0);
        const releaseDisplay = fmtDur(vesting?.releaseIntervalSeconds ?? 0);
        const numReleases = (vesting?.releaseIntervalSeconds && vesting?.durationSeconds)
          ? Math.floor(vesting.durationSeconds / vesting.releaseIntervalSeconds)
          : 0;
        const unlockPct = numReleases > 0 ? Math.round(100 / numReleases) : 100;

        // ── Header band ──
        doc.rect(0, 0, this.PAGE_W, 100).fill('#667eea');
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
           .text('MicroLeague', this.MARGIN, 30, { width: 300 });
        doc.font('Helvetica').fontSize(11)
           .text('TECHNOLOGIES LTD', this.MARGIN, 55, { width: 300 });
        doc.font('Helvetica').fontSize(9).fillColor('#ffffffcc')
           .text(`Ref: ${txRef}`, 0, 35, { width: this.PAGE_W - this.MARGIN, align: 'right' })
           .text(date, 0, 48, { width: this.PAGE_W - this.MARGIN, align: 'right' });

        // ── Title ──
        doc.y = 112;
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#333333')
           .text('SAFT CERTIFICATE', this.MARGIN, doc.y, { width: this.CONTENT_W, align: 'center' });

        // ── Subtitle block (grouped together, no divider splitting them) ──
        doc.y += 30;
        doc.font('Helvetica').fontSize(10).fillColor('#888888')
           .text('Simple Agreement for Future Tokens', this.MARGIN, doc.y, { width: this.CONTENT_W, align: 'center' });

        // ── Thin divider ──
        doc.y += 18;
        this.line(doc, doc.y);

        doc.y += 10;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333')
           .text('CERTIFICATE OF PURCHASE', this.MARGIN, doc.y, { width: this.CONTENT_W, align: 'center' });
        doc.y += 16;
        doc.font('Helvetica').fontSize(9).fillColor('#555555')
           .text(
             'This document certifies the purchase of MicroLeague Coin (MLC) tokens under the terms of the MicroLeague Presale Phase 1.',
             this.MARGIN, doc.y, { width: this.CONTENT_W, align: 'center' },
           );

        // ── Details table ──
        doc.y += 22;
        this.line(doc, doc.y);
        doc.y += 8;

        const shortHash = `${txHash.slice(0, 22)}...${txHash.slice(-8)}`;
        const shortWallet = `${walletAddress.slice(0, 22)}...${walletAddress.slice(-8)}`;

        const rows: [string, string][] = [
          ['Purchaser Wallet', shortWallet],
          ['Transaction Hash', shortHash],
          ['Purchaser Email', email || 'Not provided'],
          ['Date of Purchase', date],
          ['Amount Paid', `$${usdAmount.toFixed(2)} USD`],
          ['Tokens Allocated', `${tokens.toLocaleString()} MLC`],
          ['Price per Token', `$${pricePerToken.toFixed(4)}`],
        ];

        const labelX = this.MARGIN;
        const valueX = this.MARGIN + 160;
        const valueW = this.CONTENT_W - 160;

        rows.forEach(([label, value]) => {
          const y = doc.y;
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666')
             .text(label, labelX, y, { width: 155 });
          doc.font('Helvetica').fontSize(9).fillColor('#222222')
             .text(value, valueX, y, { width: valueW });
          doc.y = y + 18;
          this.line(doc, doc.y - 4, '#f0f0f0');
        });

        // ── Vesting Schedule ──
        doc.y += 10;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333')
           .text('VESTING SCHEDULE', this.MARGIN, doc.y);
        doc.y += 4;
        this.line(doc, doc.y);
        doc.y += 8;

        const schedule: [string, string][] = [
          ['Cliff Period', `${cliffDisplay} from purchase date`],
          ['Vesting Duration', `${durationDisplay} total`],
          ['Release Schedule', `Every ${releaseDisplay}`],
          ['First Unlock', `${unlockPct}% after cliff period`],
          ['Subsequent Unlocks', `${unlockPct}% every ${releaseDisplay}`],
        ];

        schedule.forEach(([label, detail]) => {
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#555555')
             .text(`•  ${label}: `, this.MARGIN + 10, doc.y, { continued: true })
             .font('Helvetica').fillColor('#333333')
             .text(detail);
          doc.y += 2;
        });

        // ── Terms ──
        doc.y += 14;
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333')
           .text('TERMS AND CONDITIONS', this.MARGIN, doc.y);
        doc.y += 4;
        this.line(doc, doc.y);
        doc.y += 8;

        const terms = [
          'This SAFT certificate represents a Simple Agreement for Future Tokens for MicroLeague Coin (MLC).',
          'Tokens are subject to the vesting schedule outlined above.',
          'Token allocation is recorded on the blockchain and can be verified using the transaction hash.',
          'This certificate is non-transferable.',
          'All token allocations are subject to the MicroLeague Presale Agreement terms.',
          'Questions? Contact support@microleague.com.',
        ];

        terms.forEach((t) => {
          doc.font('Helvetica').fontSize(7.5).fillColor('#777777')
             .text(`•  ${t}`, this.MARGIN + 10, doc.y, { width: this.CONTENT_W - 20 });
          doc.y += 2;
        });

        // ── Footer ──
        doc.y += 20;
        this.line(doc, doc.y);
        doc.y += 10;
        doc.font('Helvetica').fontSize(7).fillColor('#aaaaaa')
           .text('MicroLeague Technologies Ltd  •  support@microleague.com  •  microleague.com', this.MARGIN, doc.y, { width: this.CONTENT_W, align: 'center' })
           .text(`Generated: ${new Date().toLocaleString()}  •  This is an electronically generated document.`, { width: this.CONTENT_W, align: 'center' });

        doc.end();

        stream.on('finish', async () => {
          this.logger.log(`SAFT certificate generated: ${filePath}`);
          let cloudinaryUrl: string | undefined;
          try {
            cloudinaryUrl = await this.uploadToCloudinary(filePath, txHash);
            this.logger.log(`Uploaded to Cloudinary: ${cloudinaryUrl}`);
          } catch (e) {
            this.logger.error(`Cloudinary upload failed: ${e.message}`);
          }
          resolve({ localPath: filePath, cloudinaryUrl });
        });

        stream.on('error', reject);
      } catch (error) {
        this.logger.error(`Error generating PDF: ${error.message}`, error.stack);
        reject(error);
      }
    });
  }

  private line(doc: PDFKit.PDFDocument, y: number, color = '#e0e0e0') {
    doc.moveTo(this.MARGIN, y)
       .lineTo(this.PAGE_W - this.MARGIN, y)
       .lineWidth(0.5).strokeColor(color).stroke();
  }

  private async uploadToCloudinary(filePath: string, txHash: string): Promise<string> {
    const result = await cloudinaryV2.uploader.upload(filePath, {
      folder: 'saft-certificates',
      public_id: `saft_${txHash}`,
      resource_type: 'raw',
      overwrite: true,
      access_mode: 'public',
    });
    return result.secure_url;
  }
}