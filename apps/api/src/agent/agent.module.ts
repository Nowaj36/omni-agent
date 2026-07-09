import { Module } from '@nestjs/common';
import {
  CAPABILITIES,
  type Capability,
} from '../core/interfaces/capability.interface';
import { FireworksModule } from '../infrastructure/fireworks/fireworks.module';
import { AgentController } from './agent.controller';
import { AgentOrchestrator } from './application/agent-orchestrator';
import { ClassificationCapability } from './application/capabilities/classification.capability';
import { MathCapability } from './application/capabilities/math.capability';
import { NamedEntityRecognitionCapability } from './application/capabilities/ner.capability';
import { QaCapability } from './application/capabilities/qa.capability';
import { SummarizationCapability } from './application/capabilities/summarization.capability';
import { TaskRouter } from './application/task-router';
import { VerificationEngine } from './application/verification-engine';

@Module({
  imports: [FireworksModule],
  controllers: [AgentController],
  providers: [
    QaCapability,
    SummarizationCapability,
    ClassificationCapability,
    MathCapability,
    NamedEntityRecognitionCapability,
    {
      provide: CAPABILITIES,
      useFactory: (
        classification: ClassificationCapability,
        ner: NamedEntityRecognitionCapability,
        math: MathCapability,
        summarization: SummarizationCapability,
        qa: QaCapability,
      ): Capability[] => [classification, ner, math, summarization, qa],
      inject: [
        ClassificationCapability,
        NamedEntityRecognitionCapability,
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
