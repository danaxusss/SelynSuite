import { Global, Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';

/**
 * Cross-cutting concerns shared by every bounded context:
 * audit log, in-process event bus (later), Money helpers (Phase 3),
 * date utilities. Marked @Global so consumers don't need to re-import.
 */
@Global()
@Module({
  imports: [AuditModule],
  exports: [AuditModule],
})
export class SharedModule {}
