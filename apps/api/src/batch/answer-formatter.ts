import {
  CodeDebuggingOutput,
  NamedEntity,
  TaskOutput,
} from '../core/domain/task';

function formatEntities(entities: readonly NamedEntity[]): string {
  if (entities.length === 0) {
    return 'No entities found.';
  }
  return entities.map((entity) => `${entity.text} (${entity.type})`).join(', ');
}

function formatDebugging(output: CodeDebuggingOutput): string {
  if (output.issues.length === 0) {
    return output.fixedCode;
  }
  const issues = output.issues.map((issue) => `- ${issue.message}`).join('\n');
  return `Issues found:\n${issues}\n\nFixed code:\n${output.fixedCode}`;
}

export function formatAnswer(output: TaskOutput): string {
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
    return formatDebugging(output);
  }
  if ('code' in output) {
    return output.code;
  }
  return output.answer;
}
