import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Transactional email transport. Local dev uses MailHog (SMTP on :1025);
 * production uses Postmark or Resend over SMTP — same interface.
 *
 * Cardinal Rule R10: never log the body of an email containing PII. Only
 * the destination domain and the message id are logged.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = formatFrom(
      config.get<string>('EMAIL_FROM') ?? 'no-reply@selyn.local',
      config.get<string>('EMAIL_FROM_NAME') ?? 'Selyn',
    );
    this.transporter = createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'localhost',
      port: Number(config.get<string>('SMTP_PORT') ?? 1025),
      secure: false,
      auth: smtpAuth(config),
    });
  }

  async send(msg: OutboundEmail): Promise<{ id: string }> {
    const result = (await this.transporter.sendMail({
      from: this.from,
      ...msg,
    })) as { messageId?: string };
    const id = result.messageId ?? 'unknown';
    this.logger.log(`mail sent: id=${id} to-domain=${domainOf(msg.to)} subject="${msg.subject}"`);
    return { id };
  }
}

function formatFrom(addr: string, name: string): string {
  return `"${name.replace(/"/g, '')}" <${addr}>`;
}

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1) : 'unknown';
}

function smtpAuth(config: ConfigService): { user: string; pass: string } | undefined {
  const user = config.get<string>('SMTP_USER');
  const pass = config.get<string>('SMTP_PASS');
  if (!user || !pass) return undefined;
  return { user, pass };
}
