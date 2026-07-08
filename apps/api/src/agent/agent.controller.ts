import { Body, Controller, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AgentResult } from '../core/domain/task';
import { AgentOrchestrator } from './application/agent-orchestrator';
import {
  type AgentTaskRequestDto,
  agentTaskRequestSchema,
} from './dto/agent-task.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly orchestrator: AgentOrchestrator) {}

  @Post('tasks')
  async createTask(
    @Body(new ZodValidationPipe(agentTaskRequestSchema))
    body: AgentTaskRequestDto,
  ): Promise<AgentResult> {
    return this.orchestrator.run(body);
  }
}
