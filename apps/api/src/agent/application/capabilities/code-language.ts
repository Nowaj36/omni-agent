import { z } from 'zod';
import { CODE_LANGUAGES, CodeLanguage } from '../../../core/domain/task';

export const plainSourceCode = z
  .string()
  .min(1)
  .refine((code) => !code.trimStart().startsWith('```'), {
    message: 'code must be plain source without a markdown fence',
  });

export function namedLanguages(input: string): CodeLanguage[] {
  return CODE_LANGUAGES.filter((language) =>
    new RegExp(`\\b${language}\\b`, 'i').test(input),
  );
}
