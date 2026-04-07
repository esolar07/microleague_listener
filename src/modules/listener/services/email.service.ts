// email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
  private readonly MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
  private readonly MAILGUN_FROM =
    process.env.MAILGUN_FROM ||
    `MicroLeague <noreply@${process.env.MAILGUN_DOMAIN}>`;
  private readonly MAILGUN_BASE_URL =
    process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net/v3';

  async sendSAFTCertificate(
    to: string,
    walletAddress: string,
    txHash: string,
    amount: number,
    tokens: number,
    txRef: string,
    pdfPath: string,
    vesting?: { cliffSeconds: number; durationSeconds: number; releaseIntervalSeconds: number },
  ): Promise<boolean> {
    try {
      if (!this.MAILGUN_API_KEY || !this.MAILGUN_DOMAIN) {
        this.logger.warn(
          'Mailgun configuration missing. Email will not be sent.',
        );
        return false;
      }

      const subject = `Your SAFT Certificate - MicroLeague Presale Purchase`;
      const html = this.getSAFTEmailHTML(
        walletAddress,
        txHash,
        amount,
        tokens,
        txRef,
        vesting,
      );
      const text = this.getSAFTEmailText(
        walletAddress,
        txHash,
        amount,
        tokens,
        txRef,
        vesting,
      );

      const form = new FormData();
      form.append('from', this.MAILGUN_FROM);
      form.append('to', to);
      form.append('subject', subject);
      form.append('html', html);
      form.append('text', text);
      form.append('o:tag', 'saft-certificate');

      // Add PDF attachment if it exists
      if (fs.existsSync(pdfPath)) {
        form.append('attachment', fs.createReadStream(pdfPath), {
          filename: `SAFT_Certificate_${txRef}.pdf`,
          contentType: 'application/pdf',
        });
      }

      const url = `${this.MAILGUN_BASE_URL}/${this.MAILGUN_DOMAIN}/messages`;
      const authHeader = Buffer.from(
        `api:${this.MAILGUN_API_KEY}`,
      ).toString('base64');

      // Use form-data's submit-compatible approach with Node http/https
      const result = await this.postForm(url, form, authHeader);

      if (result.statusCode >= 400) {
        this.logger.error(
          `Mailgun API error: ${result.statusCode} - ${result.body}`,
        );
        return false;
      }

      this.logger.log(
        `SAFT certificate email sent to ${to} for transaction ${txHash}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send SAFT certificate email: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /** Post a form-data payload using Node's built-in http(s) module. */
  private postForm(
    url: string,
    form: FormData,
    authHeader: string,
  ): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const transport = parsed.protocol === 'https:' ? https : http;

      const req = transport.request(
        {
          method: 'POST',
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers: {
            ...form.getHeaders(),
            Authorization: `Basic ${authHeader}`,
          },
        },
        (res) => {
          const chunks: any[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () =>
            resolve({
              statusCode: res.statusCode,
              body: Buffer.concat(chunks).toString(),
            }),
          );
        },
      );

      req.on('error', reject);
      form.pipe(req);
    });
  }

  private fmtDur(s: number): string {
    if (s === 0) return 'None';
    const d = Math.floor(s / 86400);
    if (d >= 365) return `${Math.round(d / 365)} year${d >= 730 ? 's' : ''}`;
    if (d >= 30) return `${Math.round(d / 30)} month${d >= 60 ? 's' : ''}`;
    if (d > 0) return `${d} day${d > 1 ? 's' : ''}`;
    const h = Math.floor(s / 3600);
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${Math.floor(s / 60)} min`;
  }

  private getSAFTEmailHTML(
    walletAddress: string,
    txHash: string,
    amount: number,
    tokens: number,
    txRef: string,
    vesting?: { cliffSeconds: number; durationSeconds: number; releaseIntervalSeconds: number },
  ): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const cliff = this.fmtDur(vesting?.cliffSeconds ?? 0);
    const duration = this.fmtDur(vesting?.durationSeconds ?? 0);
    const release = this.fmtDur(vesting?.releaseIntervalSeconds ?? 0);
    const numReleases = (vesting?.releaseIntervalSeconds && vesting?.durationSeconds)
      ? Math.floor(vesting.durationSeconds / vesting.releaseIntervalSeconds) : 0;
    const unlockPct = numReleases > 0 ? Math.round(100 / numReleases) : 100;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .details { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
    .detail-label { color: #666; font-weight: 600; }
    .detail-value { color: #333; font-weight: 500; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SAFT Certificate</h1>
      <p>Simple Agreement for Future Tokens</p>
    </div>
    <div class="content">
      <h2>Thank You for Your Purchase!</h2>
      <p>Your MicroLeague Coin (MLC) purchase has been successfully processed. Your SAFT certificate is attached to this email.</p>
      <div class="details">
        <div class="detail-row"><span class="detail-label">Transaction Reference:</span><span class="detail-value">${txRef}</span></div>
        <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${date}</span></div>
        <div class="detail-row"><span class="detail-label">Wallet Address:</span><span class="detail-value" style="font-family:monospace;font-size:12px">${walletAddress}</span></div>
        <div class="detail-row"><span class="detail-label">Transaction Hash:</span><span class="detail-value" style="font-family:monospace;font-size:12px">${txHash}</span></div>
        <div class="detail-row"><span class="detail-label">Amount Paid:</span><span class="detail-value">$${amount.toFixed(2)} USD</span></div>
        <div class="detail-row"><span class="detail-label">Tokens Allocated:</span><span class="detail-value" style="color:#667eea;font-weight:700">${tokens.toLocaleString()} MLC</span></div>
        <div class="detail-row"><span class="detail-label">Price per Token:</span><span class="detail-value">$0.01</span></div>
      </div>
      <h3>Vesting Schedule</h3>
      <ul>
        <li><strong>Cliff Period:</strong> ${cliff}</li>
        <li><strong>Vesting Duration:</strong> ${duration}</li>
        <li><strong>Release Schedule:</strong> Every ${release}</li>
        <li><strong>First Unlock:</strong> ${unlockPct}% after cliff period</li>
      </ul>
      <p>Your tokens are secured in audited smart contracts and will vest according to the schedule above.</p>
      <p style="text-align:center"><a href="https://app.microleague.com/dashboard" class="button">View Your Dashboard</a></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} MicroLeague Technologies Ltd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getSAFTEmailText(
    walletAddress: string,
    txHash: string,
    amount: number,
    tokens: number,
    txRef: string,
    vesting?: { cliffSeconds: number; durationSeconds: number; releaseIntervalSeconds: number },
  ): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const cliff = this.fmtDur(vesting?.cliffSeconds ?? 0);
    const duration = this.fmtDur(vesting?.durationSeconds ?? 0);
    const release = this.fmtDur(vesting?.releaseIntervalSeconds ?? 0);
    const numReleases = (vesting?.releaseIntervalSeconds && vesting?.durationSeconds)
      ? Math.floor(vesting.durationSeconds / vesting.releaseIntervalSeconds) : 0;
    const unlockPct = numReleases > 0 ? Math.round(100 / numReleases) : 100;

    return `SAFT Certificate - MicroLeague Presale Purchase

Thank you for your purchase!

Your MicroLeague Coin (MLC) purchase has been successfully processed.
Your SAFT certificate is attached to this email.

Transaction Details:
-------------------
Transaction Reference: ${txRef}
Date: ${date}
Wallet Address: ${walletAddress}
Transaction Hash: ${txHash}
Amount Paid: $${amount.toFixed(2)} USD
Tokens Allocated: ${tokens.toLocaleString()} MLC
Price per Token: $0.01

Vesting Schedule:
- Cliff Period: ${cliff}
- Vesting Duration: ${duration}
- Release Schedule: Every ${release}
- First Unlock: ${unlockPct}% after cliff period

View your dashboard: https://app.microleague.com/dashboard

This is an automated message. Please do not reply to this email.
(c) ${new Date().getFullYear()} MicroLeague Technologies Ltd. All rights reserved.`;
  }
}