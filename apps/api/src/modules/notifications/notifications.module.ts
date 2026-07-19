import { Module } from '@nestjs/common';
import { DevMailboxService } from './dev-mailbox.service';
import { MailService } from './mail.service';

@Module({
  providers: [DevMailboxService, MailService],
  exports: [DevMailboxService, MailService],
})
export class NotificationsModule {}
