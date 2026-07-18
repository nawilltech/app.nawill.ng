import { Module } from '@nestjs/common';
import { DevMailboxService } from './dev-mailbox.service';

@Module({
  providers: [DevMailboxService],
  exports: [DevMailboxService],
})
export class NotificationsModule {}
