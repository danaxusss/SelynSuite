import { Global, Module } from '@nestjs/common';

// Cross-cutting concerns shared by every bounded context:
// audit log writer, in-process event bus, Money helpers, date utilities.
// Marked @Global so consumers don't need to re-import.
@Global()
@Module({
  providers: [],
  exports: [],
})
export class SharedModule {}
