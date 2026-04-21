// src/queue/job.processor.ts

import {
  Processor,
  //OnQueueActive,
  //OnQueueCompleted,
  //OnQueueFailed,
  // Process,
} from '@nestjs/bull';
// import { Job } from 'bull';
import { QUEUE_EMAIL_SERVICE } from 'src/constants/queue.constants';
import { MailerService } from '@nestjs-modules/mailer';
// import { APP_NAME, EMAIL_TEMPLATE_DIR } from 'src/constants/general.constants';
// import { InternalServerErrorException } from '@nestjs/common';
// import { last } from 'rxjs';

@Processor(QUEUE_EMAIL_SERVICE)
export class EmailQueueProcessor {
  constructor(private readonly mailerService: MailerService) {}
}
