import type { NamedEntity, TaskOutput } from './types';

function formatEntities(entities: readonly NamedEntity[]): string {
  if (entities.length === 0) {
    return 'No entities found.';
  }
  return entities.map((entity) => `${entity.text} (${entity.type})`).join(', ');
}

// Mirrors apps/api/src/batch/answer-formatter.ts so downloaded batch results
// match the backend's own results.json format.
export function formatAnswerPlain(output: TaskOutput): string {
  if ('summary' in output) {
    return output.summary;
  }
  if ('label' in output) {
    return output.label;
  }
  if ('result' in output) {
    return output.result;
  }
  if ('entities' in output) {
    return formatEntities(output.entities);
  }
  if ('fixedCode' in output) {
    if (output.issues.length === 0) {
      return output.fixedCode;
    }
    const issues = output.issues
      .map((issue) => `- ${issue.message}`)
      .join('\n');
    return `Issues found:\n${issues}\n\nFixed code:\n${output.fixedCode}`;
  }
  if ('code' in output) {
    return output.code;
  }
  return output.answer;
}

// Markdown-friendly rendering for the playground: code outputs become fenced
// blocks with their language, structured outputs become readable markdown.
export function formatAnswerMarkdown(output: TaskOutput): string {
  if ('entities' in output) {
    if (output.entities.length === 0) {
      return 'No entities found.';
    }
    return output.entities
      .map((entity) => `- **${entity.text}** — \`${entity.type}\``)
      .join('\n');
  }
  if ('fixedCode' in output) {
    const code = `\`\`\`${output.language}\n${output.fixedCode}\n\`\`\``;
    if (output.issues.length === 0) {
      return code;
    }
    const issues = output.issues
      .map((issue) => `- ${issue.message}`)
      .join('\n');
    return `**Issues found**\n\n${issues}\n\n**Fixed code**\n\n${code}`;
  }
  if ('code' in output) {
    return `\`\`\`${output.language}\n${output.code}\n\`\`\``;
  }
  return formatAnswerPlain(output);
}
