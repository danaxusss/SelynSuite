import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { PaieModule } from './modules/paie/paie.module';
import { SharedModule } from './modules/shared/shared.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { EmailModule } from './infra/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // Cardinal Rule R10 — never log PII. Strip sensitive fields globally.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.cin',
            '*.rib',
            '*.iban',
            '*.salaire',
            '*.salaireBase',
            '*.netAPayer',
            '*.brut',
          ],
          censor: '[REDACTED]',
        },
        ...(process.env.NODE_ENV !== 'production' && {
          transport: { target: 'pino-pretty', options: { singleLine: true } },
        }),
      },
    }),
    PrismaModule,
    EmailModule,
    SharedModule,
    HealthModule,
    IdentityModule,
    PaieModule,
  ],
})
export class AppModule {}
