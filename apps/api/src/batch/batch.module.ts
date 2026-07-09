import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { BatchRunner } from './batch-runner';

@Module({
  imports: [AgentModule],
  providers: [BatchRunner],
  exports: [BatchRunner],
})
export class BatchModule {}
