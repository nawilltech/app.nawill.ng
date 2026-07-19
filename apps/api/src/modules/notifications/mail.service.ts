import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DevMailboxService } from './dev-mailbox.service';

/**
 * Real email delivery via Gmail SMTP (an App Password, not the account password —
 * see docs/TECHNICAL.md §5), sitting alongside DevMailboxService rather than
 * replacing it: every send is still recorded in the in-memory dev mailbox (so e2e
 * tests keep reading `getLastFor` exactly as before), and real delivery only runs
 * on top of that when GMAIL_USER/GMAIL_APP_PASSWORD are configured. Same
 * config-gated shape as PaystackAccountVerificationProvider (§7.8) — every
 * environment works with zero setup, real delivery is opt-in.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(
    private readonly config: ConfigService,
    private readonly devMailbox: DevMailboxService,
  ) {
    const user = this.config.get<string>('GMAIL_USER');
    const appPassword = this.config.get<string>('GMAIL_APP_PASSWORD');
    const fromConfig = this.config.get<string>('MAIL_FROM');

    // Gmail SMTP rejects a "From" address that isn't the authenticated account (no arbitrary
    // sender spoofing) — so a MAIL_FROM that's just a display name ("Nawill Technology Ltd")
    // gets combined with the real address ("Nawill Technology Ltd <user@gmail.com>"); a
    // MAIL_FROM that's already a full email address is used as-is.
    const isEmail = fromConfig ? /.+@.+\..+/.test(fromConfig) : false;
    this.from = isEmail ? fromConfig! : fromConfig && user ? `${fromConfig} <${user}>` : user || 'noreply@nawill.ng';

    this.transporter =
      user && appPassword
        ? nodemailer.createTransport({ service: 'gmail', auth: { user, pass: appPassword } })
        : null;
  }

  async send(to: string, subject: string, body: { text: string; html?: string }): Promise<void> {
    this.devMailbox.send(to, subject, body.text);

    if (!this.transporter) return;

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text: body.text, html: body.html });
    } catch (err) {
      // Email delivery is never allowed to fail the request it was triggered from
      // (signup, forgot-password, ...) — log and move on.
      this.logger.error({ msg: 'Gmail SMTP send failed', to, subject, err });
    }
  }
}
