import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface HealthStatus {
  readonly status: 'ok';
  readonly environment: string;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService) {}

  check(): HealthStatus {
    return {
      status: 'ok',
      environment: this.config.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
