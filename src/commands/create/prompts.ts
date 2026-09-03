import prompts from 'prompts';
import { ProjectTemplate } from '../../core/scaffolding/index.js';

export async function promptForVariables(
  template: ProjectTemplate,
  initialValues: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...initialValues };
  if (!template.template_variables || template.template_variables.length === 0) {
    return result;
  }

  const questions: prompts.PromptObject[] = [];

  for (const v of template.template_variables) {
    if (result[v.name] === undefined || result[v.name] === '') {
      questions.push({
        type: 'text',
        name: v.name,
        message: `${v.description}${v.default ? ` (default: ${v.default})` : ''}`,
        initial: v.default || '',
        validate: val => (!v.required || val.length > 0 ? true : `${v.name} is required`),
      });
    }
  }

  if (questions.length > 0) {
    const answers = await prompts(questions);
    Object.assign(result, answers);
  }

  return result;
}
