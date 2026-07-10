import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '../../config/config.service';
import {
  OpenAiChatCompletionProvider,
  OpenAiChatCompletionTarget,
} from '../llm/openai-chat-completion.provider';

@Injectable()
export class FireworksProvider extends OpenAiChatCompletionProvider {
  constructor(
    private readonly config: ConfigService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  protected get target(): OpenAiChatCompletionTarget {
    const { apiKey, allowedModels, baseUrl } = this.config.fireworks;
    return {
      providerName: 'Fireworks',
      baseUrl,
      model: allowedModels[0],
      apiKey,
    };
  }
}
