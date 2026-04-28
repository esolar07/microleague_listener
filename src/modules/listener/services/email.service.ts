// email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import FormData from 'form-data';
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
        <title>SAFT Certificate</title>
      </head>

      <body style="margin:0; padding:0; background:#f5f7fa; font-family: Arial, sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fa;">
          <tr>
            <td align="center">


              <!-- Container -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff;">


                <!-- Header -->
                <tr>
                  <td align="center" style="padding:40px 20px; background:#ffffff; color:#333333;">

                    <!-- Logo -->
                    <img src="https://res.cloudinary.com/dp7lq9ug7/image/upload/v1777295629/microleague_coin_nmgjuh.png" alt="MicroLeague Coin Logo" width="150" style="display:block; margin:0 auto 20px; max-width:150px; height:auto;" />

                    <h1 style="margin:0; font-size:24px; color:#667eea;">SAFT Certificate</h1>
                    <p style="margin:8px 0 0; font-size:13px; color:#546e7a;">
      Simple Agreement for Future Tokens
                    </p>

                    <div style="margin-top:10px; font-size:11px; background:#667eea; color:#ffffff; display:inline-block; padding:5px 12px; border-radius:20px;">
      BLOCKCHAIN SECURED
                    </div>

                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:30px 20px;">

                    <p style="font-size:16px; font-weight:600; margin:0 0 10px;">Thank You for Your Purchase!</p>
                    <p style="font-size:14px; color:#546e7a; line-height:1.6;">
            Your MicroLeague Coin (MLC) purchase has been successfully processed and secured in audited smart contracts.
                    </p>

                    <!-- Section Title -->
                    <p style="font-size:15px; font-weight:bold; margin-top:25px;">Transaction Details</p>

                    <!-- Details Box -->
                    <table width="100%" cellpadding="10" cellspacing="0" style="background:#f5f7fa; border-left:4px solid #667eea; margin-top:10px;">

                      <tr>
                        <td style="font-size:12px; color:#777;">Reference ID</td>
                        <td style="font-size:13px;">${txRef}</td>
                      </tr>

                      <tr>
                        <td style="font-size:12px; color:#777;">Date</td>
                        <td style="font-size:13px;">${date}</td>
                      </tr>

                      <tr>
                        <td style="font-size:12px; color:#777;">Wallet Address</td>
                        <td style="font-size:12px; word-break:break-all;">${walletAddress}</td>
                      </tr>

                      <tr>
                        <td style="font-size:12px; color:#777;">Transaction Hash</td>
                        <td style="font-size:12px; word-break:break-all;">
                          <a href="https://etherscan.io/tx/${txHash}" target="_blank" style="color:#667eea; text-decoration:underline;">
    ${txHash}
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td style="font-size:12px; color:#777;">Amount Paid</td>
                        <td style="font-size:14px; font-weight:bold; color:#667eea;">
                $${amount.toFixed(2)} USD
                        </td>
                      </tr>

                      <tr>
                        <td style="font-size:12px; color:#777;">Tokens Allocated</td>
                        <td style="font-size:14px; font-weight:bold;">
                ${tokens.toLocaleString()} MLC
                        </td>
                      </tr>

                      <tr>
                        <td style="font-size:12px; color:#777;">Price per Token</td>
                        <td style="font-size:13px;">
                $${(amount / tokens).toFixed(4)} USD
                        </td>
                      </tr>

                    </table>

                    <!-- Vesting -->
                    <p style="font-size:15px; font-weight:bold; margin-top:25px;">Vesting Schedule</p>

                    <table width="100%" cellpadding="10" cellspacing="0" style="background:#f5f7fa; border-left:4px solid #764ba2;">

                      <tr>
                        <td width="50%" style="font-size:12px;">Cliff Period</td>
                        <td width="50%" style="font-size:13px; font-weight:bold;">${cliff}</td>
                      </tr>

                      <tr>
                        <td style="font-size:12px;">Total Duration</td>
                        <td style="font-size:13px; font-weight:bold;">${duration}</td>
                      </tr>

                      <tr>
                        <td style="font-size:12px;">Release Schedule</td>
                        <td style="font-size:13px; font-weight:bold;">Every ${release}</td>
                      </tr>

                      <tr>
                        <td style="font-size:12px;">First Unlock</td>
                        <td style="font-size:13px; font-weight:bold;">${unlockPct}%</td>
                      </tr>

                    </table>

                    <!-- Info -->
                    <p style="background:#e3f2fd; padding:12px; font-size:12px; color:#1565c0; margin-top:20px;">
            ℹ️ Your tokens are secured in audited smart contracts and will vest according to the schedule above.
                    </p>

                    <!-- Button (Gmail Safe) -->
                    <table align="center" cellpadding="0" cellspacing="0" style="margin-top:25px;">
                      <tr>
                        <td align="center" bgcolor="#667eea" style="border-radius:6px;">
                          <a href="https://app.microleague.com/dashboard" style="display:inline-block; padding:12px 25px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold;">
                  View Your Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding:20px; font-size:12px; color:#777; background:#f5f7fa;">
                    <p style="margin:0 0 8px;">
                      <a href="https://app.microleague.com/support" style="color:#667eea; text-decoration:none;">
              Support Center
                      </a>
                    </p>
                    <p style="margin:0 0 8px;">This is an automated message. Please do not reply.</p>
                    <p style="margin:0;">© ${new Date().getFullYear()} MicroLeague Technologies Ltd.</p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>


        </table>

      </body>
    </html>
`;
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
