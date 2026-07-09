import { Module } from '@nestjs/common';
import {
  CAPABILITIES,
  type Capability,
} from '../core/interfaces/capability.interface';
import { LlmModule } from '../infrastructure/llm/llm.module';
import { AgentController } from './agent.controller';
import { AgentOrchestrator } from './application/agent-orchestrator';
import { ClassificationCapability } from './application/capabilities/classification.capability';
import { CodeDebuggingCapability } from './application/capabilities/code-debugging.capability';
import { CodeGenerationCapability } from './application/capabilities/code-generation.capability';
import { LogicalReasoningCapability } from './application/capabilities/logical-reasoning.capability';
import { MathCapability } from './application/capabilities/math.capability';
import { NamedEntityRecognitionCapability } from './application/capabilities/ner.capability';
import { QaCapability } from './application/capabilities/qa.capability';
import { SummarizationCapability } from './application/capabilities/summarization.capability';
import { TaskRouter } from './application/task-router';
import { VerificationEngine } from './application/verification-engine';

@Module({
  imports: [LlmModule],
  controllers: [AgentController],
  providers: [
    QaCapability,
    SummarizationCapability,
    ClassificationCapability,
    MathCapability,
    NamedEntityRecognitionCapability,
    CodeDebuggingCapability,
    CodeGenerationCapability,
    LogicalReasoningCapability,
    {
      provide: CAPABILITIES,
      useFactory: (
        classification: ClassificationCapability,
        ner: NamedEntityRecognitionCapability,
        debug: CodeDebuggingCapability,
        codegen: CodeGenerationCapability,
        reasoning: LogicalReasoningCapability,
        math: MathCapability,
        summarization: SummarizationCapability,
        qa: QaCapability,
      ): Capability[] => [
        classification,
        ner,
        debug,
        codegen,
        reasoning,
        math,
        summarization,
        qa,
      ],
      inject: [
        ClassificationCapability,
        NamedEntityRecognitionCapability,
        CodeDebuggingCapability,
        CodeGenerationCapability,
        LogicalReasoningCapability,
        MathCapability,
        SummarizationCapability,
        QaCapability,
      ],
    },
    TaskRouter,
    VerificationEngine,
    AgentOrchestrator,
  ],
  exports: [AgentOrchestrator],
})
export class AgentModule {}
