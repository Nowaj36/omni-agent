import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LoggerService } from '../common/logger/logger.service';
import { ConfigService } from '../config/config.service';

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(LoggerService));
  app.enableShutdownHooks();
  return app;
}

export async function startApp(): Promise<void> {
  const app = await createApp();
  const config = app.get(ConfigService);

  await app.listen(config.port);
  app
    .get(LoggerService)
    .log(`API listening on port ${config.port}`, 'Bootstrap');
}
