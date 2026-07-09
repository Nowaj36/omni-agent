import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '../../config/config.service';
import {
  OpenAiChatCompletionProvider,
  OpenAiChatCompletionTarget,
} from '../llm/openai-chat-completion.provider';

@Injectable()
export class LocalLlmProvider extends OpenAiChatCompletionProvider {
  constructor(
    private readonly config: ConfigService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  protected get target(): OpenAiChatCompletionTarget {
    const { baseUrl, model } = this.config.localLlm;
    return { providerName: 'Local LLM', baseUrl, model };
  }
}
