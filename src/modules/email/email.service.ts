import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { queueNames } from "src/constants/queue.constants";
import { EmailJobData } from "./processors/email.processor";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue(queueNames.email)
    private emailQueue: Queue<EmailJobData>
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    text?: string,
    html?: string,
    cc?: string
  ) {
    try {
      const job = await this.emailQueue.add(
        "send-email",
        {
          to,
          subject,
          text,
          html,
          cc,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      this.logger.log(
        `Email queued successfully to ${to} with subject "${subject}" (Job ID: ${job.id})`
      );

      return {
        success: true,
        jobId: job.id,
        message: `Email queued successfully to ${to}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue email to ${to}: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        message: `Failed to queue email: ${error.message}`,
      };
    }
  }

  async sendBulkEmails(emails: EmailJobData[]) {
    const jobs = emails.map((email) => ({
      name: "send-email",
      data: email,
      opts: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }));

    try {
      const addedJobs = await this.emailQueue.addBulk(jobs);
      this.logger.log(`Bulk emails queued: ${addedJobs.length} jobs`);

      return {
        success: true,
        jobIds: addedJobs.map((job) => job.id),
        count: addedJobs.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue bulk emails: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
