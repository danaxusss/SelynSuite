import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Secret, TOTP } from 'otpauth';

export interface TotpEnrollment {
  /** Base32 secret to persist (encrypted by caller before write — Phase 9). */
  secret: string;
  /** otpauth:// URI for QR code rendering on the Web. */
  uri: string;
}

/**
 * TOTP (RFC 6238) wrapper. The application wraps `secret` with crypto-at-rest
 * before persisting in `User.totpSecret`. Rotation via re-enrollment.
 *
 * Window of ±1 step (30s) tolerated to absorb clock skew.
 */
@Injectable()
export class TotpService {
  private readonly issuer: string;

  constructor(config: ConfigService) {
    this.issuer = config.get<string>('AUTH_TOTP_ISSUER') ?? 'Selyn';
  }

  enroll(label: string): TotpEnrollment {
    const secret = new Secret({ size: 20 });
    const totp = new TOTP({
      issuer: this.issuer,
      label,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });
    return { secret: secret.base32, uri: totp.toString() };
  }

  verify(secret: string, code: string): boolean {
    const totp = new TOTP({
      issuer: this.issuer,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  /** Used by the Web for the QR data. Format: otpauth://totp/... */
  uriFor(label: string, secret: string): string {
    return new TOTP({
      issuer: this.issuer,
      label,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    }).toString();
  }
}
