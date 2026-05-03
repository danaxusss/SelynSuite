import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Public } from '../identity/auth/public.decorator';

@Controller({ path: 'health', version: '1' })
@Public()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check(): ReturnType<HealthCheckService['check']> {
    return this.health.check([() => this.prismaHealth.pingCheck('database', this.prisma)]);
  }
}
