import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id password hashing per ADR 0003 (NIST 800-63B style):
 *   - minimum 12 chars (enforced by callers via Zod schema)
 *   - hashed with Argon2id, not Argon2i / Argon2d
 *   - parameters chosen for ~50ms on a modern x86 server
 *
 * Cardinal Rule R10: never log raw passwords. The shape of this service
 * makes that obvious — neither hash() nor verify() returns or logs the
 * input.
 */
@Injectable()
export class PasswordService {
  private readonly options = {
    // OWASP-recommended Argon2id params (memoryCost in KiB).
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return hash(plain, this.options);
  }

  verify(stored: string, plain: string): Promise<boolean> {
    return verify(stored, plain).catch(() => false);
  }
}
