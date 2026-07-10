import { CompletionRequest } from '../../core/interfaces/llm-provider.interface';

const UNCERTAINTY_PATTERN =
  /\b(i (do not|don't|cannot|can't) (know|determine|answer|help)|not sure|unsure|cannot determine|can't determine|unable to (determine|answer|classify|extract)|no idea)\b/i;

// Matches a value that is only a stand-in, never a real answer.
const PLACEHOLDER_PATTERN =
  /^(n\/a|none|null|undefined|todo|tbd|xxx+|\.{2,}|-+|\?+|your answer( here)?|placeholder|lorem ipsum\b.*)$/i;

const MIN_PLAIN_TEXT_LENGTH = 3;

const PARSE_FAILED = Symbol('PARSE_FAILED');

/**
 * Deterministic, LLM-free usability check for a completion. Returns a short
 * reason when the response is unusable or low-confidence, or undefined when
 * it can be returned to the caller as-is.
 */
export function lowConfidenceReason(
  request: CompletionRequest,
  text: string,
): string | undefined {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 'empty response';
  }
  if (UNCERTAINTY_PATTERN.test(trimmed)) {
    return 'explicit uncertainty';
  }
  if (request.jsonOutput) {
    return structuredIssue(trimmed);
  }
  if (PLACEHOLDER_PATTERN.test(trimmed)) {
    return 'placeholder response';
  }
  if (trimmed.length < MIN_PLAIN_TEXT_LENGTH) {
    return 'extremely short response';
  }
  return undefined;
}

function structuredIssue(text: string): string | undefined {
  const parsed = parseJson(stripCodeFences(text));
  if (parsed === PARSE_FAILED) {
    return 'malformed JSON';
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return 'not a JSON object';
  }
  if (Object.keys(parsed).length === 0) {
    return 'JSON object with no fields';
  }
  const issue = fieldIssue(collectStrings(parsed));
  return issue;
}

function fieldIssue(values: readonly string[]): string | undefined {
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 'empty field value';
    }
    if (PLACEHOLDER_PATTERN.test(trimmed)) {
      return 'placeholder field value';
    }
  }
  return undefined;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return PARSE_FAILED;
  }
}
