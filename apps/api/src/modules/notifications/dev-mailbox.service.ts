import { Injectable, Logger } from '@nestjs/common';

export interface SentEmail {
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}

/**
 * Stand-in for a real email provider (Resend/SES/Zoho — see docs/ARCHITECTURE.md
 * tech stack table). No provider is wired up in this build, so password-reset links
 * and 2FA email codes are "sent" here: logged, and kept in memory so tests can read
 * the last message for an address the same way they use MockPaymentProcessorAdapter.
 */
@Injectable()
export class DevMailboxService {
  private readonly logger = new Logger(DevMailboxService.name);
  private readonly sent = new Map<string, SentEmail[]>();

  send(to: string, subject: string, body: string): void {
    this.logger.log({ msg: 'dev-mailbox: email sent', to, subject, body });
    const inbox = this.sent.get(to) ?? [];
    inbox.push({ to, subject, body, sentAt: new Date() });
    this.sent.set(to, inbox);
  }

  getLastFor(to: string): SentEmail | undefined {
    const inbox = this.sent.get(to);
    return inbox?.[inbox.length - 1];
  }
}
