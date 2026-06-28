import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export async function loadEditorBundle() {
  try {
    return await readFile(join(here, 'editor-bundle.generated.js'), 'utf8');
  } catch {
    return fallbackEditorBundle();
  }
}

export function fallbackEditorBundle() {
  return `
window.SynthroEditor = {
  createCodeEditor(target, value) {
    const textarea = document.createElement('textarea');
    textarea.className = 'code-textarea';
    textarea.spellcheck = false;
    textarea.value = value;
    target.replaceChildren(textarea);
    return {
      getValue: () => textarea.value,
      setValue: next => { textarea.value = next; }
    };
  }
};
`;
}
