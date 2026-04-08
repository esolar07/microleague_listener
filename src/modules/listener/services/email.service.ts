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
    process.env.MAILGUN_FROM || `MicroLeague <noreply@${process.env.MAILGUN_DOMAIN}>`;
  private readonly MAILGUN_BASE_URL = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net/v3';

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
        this.logger.warn('Mailgun configuration missing. Email will not be sent.');
        return false;
      }

      const subject = `Your SAFT Certificate - MicroLeague Presale Purchase`;
      const html = this.getSAFTEmailHTML(walletAddress, txHash, amount, tokens, txRef, vesting);
      const text = this.getSAFTEmailText(walletAddress, txHash, amount, tokens, txRef, vesting);

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
      const authHeader = Buffer.from(`api:${this.MAILGUN_API_KEY}`).toString('base64');

      // Use form-data's submit-compatible approach with Node http/https
      const result = await this.postForm(url, form, authHeader);

      if (result.statusCode >= 400) {
        this.logger.error(`Mailgun API error: ${result.statusCode} - ${result.body}`);
        return false;
      }

      this.logger.log(`SAFT certificate email sent to ${to} for transaction ${txHash}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SAFT certificate email: ${error.message}`, error.stack);
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
    const numReleases =
      vesting?.releaseIntervalSeconds && vesting?.durationSeconds
        ? Math.floor(vesting.durationSeconds / vesting.releaseIntervalSeconds)
        : 0;
    const unlockPct = numReleases > 0 ? Math.round(100 / numReleases) : 100;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.7; 
      color: #2c3e50; 
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      padding: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
      background: white;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
    .header h1 { 
      font-size: 32px; 
      margin-bottom: 8px;
      font-weight: 700;
      position: relative;
      z-index: 1;
    }
    .header p { 
      font-size: 14px; 
      opacity: 0.95;
      position: relative;
      z-index: 1;
      letter-spacing: 0.5px;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 12px;
      position: relative;
      z-index: 1;
      letter-spacing: 0.6px;
    }
    .content { 
      padding: 40px;
      background: white;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 12px;
    }
    .intro-text {
      color: #546e7a;
      margin-bottom: 30px;
      font-size: 14px;
      line-height: 1.8;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #2c3e50;
      margin-top: 30px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
      display: inline-block;
    }
    .details { 
      background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
      border-radius: 10px; 
      padding: 24px; 
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .detail-row { 
      display: flex; 
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    .detail-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .detail-label { 
      color: #546e7a; 
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .detail-value { 
      color: #2c3e50; 
      font-weight: 500;
      font-size: 14px;
    }
    .highlight-value {
      color: #667eea;
      font-weight: 700;
      font-size: 16px;
    }
    .highlight-amount {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
      font-size: 16px;
    }
    .monospace { 
      font-family: 'Courier New', monospace;
      font-size: 12px;
      word-break: break-all;
      background: rgba(0, 0, 0, 0.03);
      padding: 4px 8px;
      border-radius: 4px;
    }
    .vesting-container {
      background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
      border-radius: 10px;
      padding: 24px;
      margin: 20px 0;
      border-left: 4px solid #764ba2;
    }
    .vesting-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    .vesting-item {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e0e7ff;
    }
    .vesting-label {
      font-size: 12px;
      color: #546e7a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }
    .vesting-value{
      font-size: 15px;
      font-weight: 700;
      color: #764ba2;
    }
    .info-box {
      background: #e3f2fd;
      border-left: 4px solid #667eea;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #1565c0;
      line-height: 1.6;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 14px 36px; 
      text-decoration: none; 
      border-radius: 6px; 
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .footer { 
      text-align: center; 
      padding: 30px 40px;
      background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
      border-top: 1px solid #e0e7ff;
      color: #546e7a; 
      font-size: 12px;
      line-height: 1.8;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: #e0e7ff;
      margin: 20px 0;
    }
  </meta>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ SAFT Certificate</h1>
      <p>Simple Agreement for Future Tokens</p>
      <div class="badge">BLOCKCHAIN SECURED</div>
    </div>
    <div class="content">
      <div class="greeting">Thank You for Your Purchase!</div>
      <p class="intro-text">Your MicroLeague Coin (MLC) purchase has been successfully processed and secured in audited smart contracts. Your SAFT certificate is attached below.</p>
      
      <div class="section-title">Transaction Details</div>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Reference ID</span>
          <span class="detail-value">${txRef}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Wallet Address</span>
          <span class="detail-value monospace">${walletAddress}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction Hash</span>
          <span class="detail-value monospace">${txHash}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value">
            <span class="highlight-amount">$${amount.toFixed(2)}</span> <span style="color: #546e7a;">USD</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tokens Allocated</span>
          <span class="detail-value highlight-value">${tokens.toLocaleString()} MLC</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Price per Token</span>
          <span class="detail-value">$${(amount / tokens).toFixed(4)} USD</span>
        </div>
      </div>

      <div class="section-title">Vesting Schedule</div>
      <div class="vesting-container">
        <p style="color: #546e7a; font-size: 13px; margin-bottom: 12px;">Your tokens unlock progressively according to the schedule below:</p>
        <div class="vesting-grid">
          <div class="vesting-item">
            <div class="vesting-label">Cliff Period</div>
            <div class="vesting-value">${cliff}</div>
          </div>
          <div class="vesting-item">
            <div class="vesting-label">Total Duration</div>
            <div class="vesting-value">${duration}</div>
          </div>
          <div class="vesting-item">
            <div class="vesting-label">Release Schedule</div>
            <div class="vesting-value">Every ${release}</div>
          </div>
          <div class="vesting-item">
            <div class="vesting-label">First Unlock</div>
            <div class="vesting-value">${unlockPct}%</div>
          </div>
        </div>
      </div>

      <div class="info-box">
        ℹ️ Your tokens are secured in audited smart contracts and will vest according to the schedule above. You'll receive automatic notifications when tokens unlock.
      </div>

      <div class="cta-container">
        <a href="https://app.microleague.com/dashboard" class="button">View Your Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin-bottom: 12px;">Questions? Visit our <a href="https://app.microleague.com/support" class="footer-link">support center</a></p>
      <p style="margin-bottom: 12px;">This is an automated message. Please do not reply to this email.</p>
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
    const numReleases =
      vesting?.releaseIntervalSeconds && vesting?.durationSeconds
        ? Math.floor(vesting.durationSeconds / vesting.releaseIntervalSeconds)
        : 0;
    const unlockPct = numReleases > 0 ? Math.round(100 / numReleases) : 100;

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ SAFT CERTIFICATE - MICROLEAGUE PRESALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your purchase!

Your MicroLeague Coin (MLC) purchase has been successfully 
processed and secured in audited smart contracts.
Your SAFT certificate is attached to this email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSACTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference ID:           ${txRef}
Date:                   ${date}
Wallet Address:         ${walletAddress}
Transaction Hash:       ${txHash}
Amount Paid:            $${amount.toFixed(2)} USD
Tokens Allocated:       ${tokens.toLocaleString()} MLC
Price per Token:        $${(amount / tokens).toFixed(4)} USD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VESTING SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your tokens unlock progressively according to the schedule below:

  • Cliff Period:        ${cliff}
  • Total Duration:      ${duration}
  • Release Schedule:    Every ${release}
  • First Unlock:        ${unlockPct}% of tokens

Your tokens are secured in audited smart contracts and will vest 
according to the schedule above. You'll receive automatic 
notifications when tokens unlock.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View your dashboard:    https://app.microleague.com/dashboard
Questions?              https://app.microleague.com/support

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} MicroLeague Technologies Ltd. 
All rights reserved.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }
}
