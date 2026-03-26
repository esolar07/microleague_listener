import { Processor, Process } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import { queueNames } from "src/constants/queue.constants";
import * as nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

export interface EmailJobData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string;
}

@Processor(queueNames.email)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const TOKEN =
      process.env.MAILTRAP_TOKEN || "ed49bbc7cb4e5cb4cd165c01ec6f248c";
    this.transporter = nodemailer.createTransport(
      MailtrapTransport({
        token: TOKEN,
      })
    );
  }

  @Process("send-email")
  async handleSendEmail(job: Job<EmailJobData>) {
    const { to, subject, text, html, cc } = job.data;

    try {
      this.logger.log(`Processing email job ${job.id} to ${to}`);

      const emailOptions: nodemailer.SendMailOptions = {
        from: '"FGF Team" <no-reply@mail.fairgradeforests.com>',
        to,
        subject,
        text,
        html,
      };

      // if (cc) {
      //   emailOptions.cc = cc;
      // } else {
      //   emailOptions.cc = 'Pierre.elias@fairgradeforests.com';
      // }

      const result = await this.transporter.sendMail(emailOptions);

      this.logger.log(
        `Email sent successfully to ${to} with subject "${subject}" (Job ${job.id})`
      );

      return {
        success: true,
        messageId: result.messageId,
        jobId: job.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} (Job ${job.id}): ${error.message}`,
        error.stack
      );
      throw error; // Re-throw to mark job as failed
    }
  }
}
