import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const entry = `
import { basicSetup, EditorView } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

window.SynthroEditor = {
  createCodeEditor(target, value) {
    const view = new EditorView({
      doc: value,
      extensions: [basicSetup, javascript({ jsx: true, typescript: true }), EditorView.lineWrapping],
      parent: target
    });
    return {
      getValue: () => view.state.doc.toString(),
      setValue: next => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } })
    };
  }
};
`;

const result = await build({
  stdin: {
    contents: entry,
    resolveDir: process.cwd(),
    sourcefile: 'synthro-editor-entry.js',
    loader: 'js'
  },
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
  platform: 'browser'
});

await writeFile(resolve('src/render/editor-bundle.generated.js'), result.outputFiles[0].text);
