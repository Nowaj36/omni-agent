import { Test } from '@nestjs/testing';
import { ConfigService } from '../config/config.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: ConfigService, useValue: { nodeEnv: 'test' } },
      ],
    }).compile();

    healthService = moduleRef.get(HealthService);
  });

  it('reports ok with environment and uptime', () => {
    const result = healthService.check();

    expect(result.status).toBe('ok');
    expect(result.environment).toBe('test');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });
});
