// pdf.service.ts
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
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
            Author: 'MicroLeague Sports Inc.',
          },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const date = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
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
        const numReleases =
          vesting?.releaseIntervalSeconds && vesting?.durationSeconds
            ? Math.floor(vesting.durationSeconds / vesting.releaseIntervalSeconds)
            : 0;
        const unlockPctNum = numReleases > 0 ? 100 / numReleases : 100;
        const unlockPct =
          unlockPctNum >= 1 ? `${Math.round(unlockPctNum)}%` : `${unlockPctNum.toFixed(4)}%`;

        // REPLACE YOUR ENTIRE CURRENT HEADER SECTION WITH THIS:

        // ── Modern Centered Hero Header ──
        const headerHeight = 220;

        // White background
        doc.rect(0, 0, this.PAGE_W, headerHeight).fill('#ffffff');

        // Logo
        const logoPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'assets',
          'microleague_coin.png',
        );

        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, this.PAGE_W / 2 - 70, 18, {
            width: 140,
          });
        } else {
          doc.font('Helvetica-Bold').fontSize(28).fillColor('#667eea').text('MicroLeague', 0, 38, {
            width: this.PAGE_W,
            align: 'center',
          });

          doc.font('Helvetica').fontSize(12).fillColor('#5e6d82').text('COIN', 0, 72, {
            width: this.PAGE_W,
            align: 'center',
          });
        }

        // Main Certificate Title
        doc
          .font('Helvetica-Bold')
          .fontSize(30)
          .fillColor('#667eea')
          .text('SAFT Certificate', 0, 100, {
            width: this.PAGE_W,
            align: 'center',
          });

        // Subtitle
        doc
          .font('Helvetica')
          .fontSize(16)
          .fillColor('#546e7a')
          .text('Simple Agreement for Future Tokens', 0, 145, {
            width: this.PAGE_W,
            align: 'center',
          });

        // Badge
        const badgeW = 220;
        const badgeH = 34;
        const badgeX = (this.PAGE_W - badgeW) / 2;
        const badgeY = 178;

        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 17).fill('#667eea');

        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#ffffff')
          .text('BLOCKCHAIN SECURED', badgeX, badgeY + 10, {
            width: badgeW,
            align: 'center',
          });

        // Optional subtle bottom divider
        doc
          .moveTo(this.MARGIN, headerHeight + 8)
          .lineTo(this.PAGE_W - this.MARGIN, headerHeight + 8)
          .strokeColor('#d8e2ef')
          .lineWidth(1)
          .stroke();

        doc.save();
        doc.restore();

        // ── Title ──
        doc.y = 245;
        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor('#2c3e50')
          .text('SAFT CERTIFICATE', this.MARGIN, doc.y, { width: this.CONTENT_W, align: 'center' });
        doc.y += 24;
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor('#8892a6')
          .text('Simple Agreement for Future Tokens', this.MARGIN, doc.y, {
            width: this.CONTENT_W,
            align: 'center',
          });

        // ── Title underline ──
        doc.y += 18;
        this.line(doc, doc.y, '#d8e2ef');

        // ── Summary block ──
        doc.y += 18;
        const summaryTop = doc.y;
        const summaryHeight = 68;
        doc
          .roundedRect(this.MARGIN, summaryTop, this.CONTENT_W, summaryHeight, 12)
          .fill('#f4f7ff')
          .strokeColor('#d8e2ef')
          .lineWidth(1)
          .stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#2c3e50')
          .text('CERTIFICATE OF PURCHASE', this.MARGIN + 14, summaryTop + 12, {
            width: this.CONTENT_W - 28,
          });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#5e6d82')
          .text(
            'This document certifies the purchase of MicroLeague Coin (MLC) tokens under the terms of the MicroLeague Presale Phase 1.',
            this.MARGIN + 14,
            summaryTop + 30,
            { width: this.CONTENT_W - 28, align: 'left' },
          );

        doc.y = summaryTop + summaryHeight + 18;

        const shortHash = `${txHash.slice(0, 22)}...${txHash.slice(-8)}`;
        const shortWallet = `${walletAddress.slice(0, 22)}...${walletAddress.slice(-8)}`;

        const leftRows: [string, string][] = [
          ['Purchaser Wallet', shortWallet],
          ['Transaction Hash', shortHash],
          ['Purchaser Email', email || 'Not provided'],
          ['Date of Purchase', date],
        ];
        const rightRows: [string, string][] = [
          ['Amount Paid', `$${usdAmount.toFixed(2)} USD`],
          ['Tokens Allocated', `${tokens.toLocaleString()} MLC`],
          ['Price per Token', `$${pricePerToken.toFixed(4)}`],
        ];

        const detailsTop = doc.y;
        const detailCardHeight = Math.max(leftRows.length, rightRows.length) * 30 + 26;
        doc
          .roundedRect(this.MARGIN, detailsTop, this.CONTENT_W, detailCardHeight, 12)
          .fill('#ffffff')
          .strokeColor('#e3ebff')
          .lineWidth(1)
          .stroke();
        doc
          .roundedRect(this.MARGIN + 6, detailsTop + 8, 5, detailCardHeight - 16, 3)
          .fill('#667eea');

        const rowH = 30;
        const colLeft = this.MARGIN + 22;
        const colRight = this.MARGIN + 248;
        const colW = 185;

        let leftY = detailsTop + 14;
        leftRows.forEach(([label, value]) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(8.5)
            .fillColor('#4b5a77')
            .text(label, colLeft, leftY, { width: colW });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#1f2a44')
            .text(value, colLeft, leftY + 11, { width: colW });
          leftY += rowH;
        });

        let rightY = detailsTop + 14;
        rightRows.forEach(([label, value]) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(8.5)
            .fillColor('#4b5a77')
            .text(label, colRight, rightY, { width: colW });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#1f2a44')
            .text(value, colRight, rightY + 11, { width: colW });
          rightY += rowH;
        });

        doc.y = detailsTop + detailCardHeight + 18;
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#2c3e50')
          .text('VESTING SCHEDULE', this.MARGIN, doc.y);
        doc.y += 6;
        this.line(doc, doc.y, '#d8e2ef');
        doc.y += 12;

        const schedule: [string, string][] = [
          ['Cliff Period', `${cliffDisplay} from purchase date`],
          ['Vesting Duration', `${durationDisplay} total`],
          ['Release Schedule', `Every ${releaseDisplay}`],
          ['First Unlock', `${unlockPct} after cliff period`],
          ['Subsequent Unlocks', `${unlockPct} every ${releaseDisplay}`],
        ];

        const scheduleTop = doc.y;
        const scheduleLineH = 20;
        const scheduleHeight = schedule.length * scheduleLineH + 24;
        doc
          .roundedRect(this.MARGIN, scheduleTop, this.CONTENT_W, scheduleHeight, 12)
          .fill('#f4f7ff')
          .strokeColor('#d8e2ef')
          .lineWidth(1)
          .stroke();
        doc.y = scheduleTop + 14;

        schedule.forEach(([label, detail]) => {
          const y = doc.y;
          doc
            .font('Helvetica-Bold')
            .fontSize(9)
            .fillColor('#4b5a77')
            .text(`•  ${label}: `, this.MARGIN + 14, y, { continued: true })
            .font('Helvetica')
            .fillColor('#1f2a44')
            .text(detail);
          doc.y = y + scheduleLineH;
        });

        doc.y = scheduleTop + scheduleHeight + 18;
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#2c3e50')
          .text('TERMS AND CONDITIONS', this.MARGIN, doc.y);
        doc.y += 6;
        this.line(doc, doc.y, '#d8e2ef');
        doc.y += 12;

        const terms = [
          'This SAFT certificate represents a Simple Agreement for Future Tokens for MicroLeague Coin (MLC).',
          'Tokens are subject to the vesting schedule outlined above.',
          'Token allocation is recorded on the blockchain and can be verified using the transaction hash.',
          'This certificate is non-transferable.',
          'All token allocations are subject to the MicroLeague Presale Agreement terms.',
          'Questions? Contact esolar@egghealthhub.com.',
        ];

        terms.forEach((t) => {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#5e6d82')
            .text(`•  ${t}`, this.MARGIN + 12, doc.y, { width: this.CONTENT_W - 20 });
          doc.y += 14;
        });

        doc.y += 6;
        this.line(doc, doc.y, '#d8e2ef');
        doc.y += 10;
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#9aa3b3')
          .text(
            'MicroLeague Sports Inc  •  esolar@egghealthhub.com  •  microleague.com',
            this.MARGIN,
            doc.y,
            { width: this.CONTENT_W, align: 'center' },
          )
          .text(
            `Generated: ${new Date().toLocaleString()}  •  This is an electronically generated document.`,
            { width: this.CONTENT_W, align: 'center' },
          );

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
    doc
      .moveTo(this.MARGIN, y)
      .lineTo(this.PAGE_W - this.MARGIN, y)
      .lineWidth(0.5)
      .strokeColor(color)
      .stroke();
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
