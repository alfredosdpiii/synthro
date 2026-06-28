import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { loadEditorBundle } from './editor-bundle.mjs';
import { renderExercise, runtimeScript } from './interactions.mjs';

export async function renderLessonHtml(lesson) {
  const editorBundle = await loadEditorBundle();
  const exercises = lesson.exercises.map((exercise, index) => renderExercise(exercise, index)).join('\n');
  const atlasRows = lesson.contributions
    .slice(0, 8)
    .map(item => `<tr><td>${escapeHtml(item.repo)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.role)}</td></tr>`)
    .join('');
  const roadmap = lesson.roadmap
    .map(node => `<li><strong>${escapeHtml(node.title)}</strong><span>${escapeHtml(node.level)}</span></li>`)
    .join('');
  const evidence = lesson.evidence
    .slice(0, 6)
    .map(item => `<article><b>${escapeHtml(item.metadata?.filename ?? item.kind)}</b><pre>${escapeHtml(item.excerpt || 'No excerpt available.')}</pre></article>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="lavish-live-reload" content="root" />
  <title>${escapeHtml(lesson.title)}</title>
  <style>
${styles()}
  </style>
</head>
<body>
  <main class="deck" data-lavish-live-reload-root>
    <section class="hero">
      <div>
        <p class="eyebrow">Synthro interactive lesson</p>
        <h1>${escapeHtml(lesson.title)}</h1>
        <p class="lede">${escapeHtml(lesson.subtitle)}</p>
      </div>
      <div class="progress-card">
        <span data-progress-label>0% mastery</span>
        <div class="progress"><i data-progress-fill></i></div>
        <small>Progress stays local in this browser and can be shared with agents through Synthro MCP.</small>
      </div>
    </section>

    <section class="panel-grid">
      <article>
        <p class="eyebrow">Contribution atlas</p>
        <table><thead><tr><th>Repo</th><th>Signal</th><th>Role</th></tr></thead><tbody>${atlasRows}</tbody></table>
      </article>
      <article>
        <p class="eyebrow">Roadmap</p>
        <ol class="roadmap">${roadmap}</ol>
      </article>
    </section>

    <section class="evidence">
      <p class="eyebrow">Evidence anchors</p>
      <div class="evidence-grid">${evidence}</div>
    </section>

    <section class="interactions">
      <p class="eyebrow">Practice studio</p>
      <h2>Move from watching to doing</h2>
      ${exercises}
    </section>
  </main>
  <script>
${editorBundle}
  </script>
  <script>
${runtimeScript(lesson)}
  </script>
</body>
</html>`;
}

export async function writeLessonHtml(lesson, outPath) {
  const html = await renderLessonHtml(lesson);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html);
  return outPath;
}

function styles() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@500;700;800&display=swap');
:root {
  color-scheme: dark;
  --bg: #0b0d0c;
  --panel: #141713;
  --panel-2: #1d211b;
  --ink: #f2f0e8;
  --muted: #a8ad9e;
  --line: #394032;
  --accent: #d8ff69;
  --accent-2: #ff7a4f;
  --blue: #81d6ff;
  --shadow: 0 24px 80px rgba(0,0,0,.35);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background:
    radial-gradient(circle at 18% 12%, rgba(216,255,105,.18), transparent 26rem),
    radial-gradient(circle at 86% 6%, rgba(255,122,79,.12), transparent 22rem),
    linear-gradient(135deg, #090a09, #10130f 52%, #080908);
  color: var(--ink);
  font-family: Manrope, sans-serif;
}
.deck { width: min(1420px, calc(100vw - 40px)); margin: 0 auto; padding: 48px 0 96px; }
.hero { min-height: 76vh; display: grid; grid-template-columns: 1.25fr .75fr; gap: 48px; align-items: center; }
.eyebrow { margin: 0 0 14px; color: var(--accent); font: 600 13px/1 IBM Plex Mono, monospace; text-transform: uppercase; letter-spacing: .18em; }
h1 { margin: 0; font: 400 clamp(72px, 11vw, 164px)/.82 Instrument Serif, serif; letter-spacing: -.06em; }
h2 { margin: 0 0 28px; font: 400 64px/.9 Instrument Serif, serif; }
h3 { margin: 0 0 12px; font: 800 28px/1 Manrope, sans-serif; }
.lede { max-width: 780px; color: var(--muted); font-size: 24px; line-height: 1.45; }
.progress-card, .panel-grid article, .exercise, .evidence article {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015));
  border-radius: 28px;
  box-shadow: var(--shadow);
}
.progress-card { padding: 28px; }
.progress-card span { display: block; margin-bottom: 14px; font: 700 24px Manrope, sans-serif; }
.progress { height: 14px; overflow: hidden; border-radius: 99px; background: #272d22; }
.progress i { display: block; width: 0%; height: 100%; background: linear-gradient(90deg, var(--accent), var(--blue)); transition: width .4s ease; }
small { display: block; color: var(--muted); margin-top: 16px; line-height: 1.5; }
.panel-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 28px; margin: 24px 0; }
.panel-grid article, .evidence { padding: 28px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 14px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
th { color: var(--muted); font: 600 12px IBM Plex Mono, monospace; text-transform: uppercase; }
.roadmap { display: grid; gap: 12px; margin: 0; padding-left: 22px; }
.roadmap li { padding: 12px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,.03); }
.roadmap span { float: right; color: var(--accent); font: 500 12px IBM Plex Mono, monospace; }
.evidence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.evidence article { padding: 18px; min-width: 0; }
pre { margin: 12px 0 0; padding: 16px; overflow: auto; border-radius: 16px; background: #070807; color: #d7ded0; font: 13px/1.5 IBM Plex Mono, monospace; }
.interactions { margin-top: 48px; }
.exercise { margin: 22px 0; padding: 26px; position: relative; }
.exercise-kicker { color: var(--blue); font: 600 12px IBM Plex Mono, monospace; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 10px; }
.choice-grid, .contrast-grid, .trace-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
.choice, .contrast-card, .trace-grid button, .sortable li, .blank-label {
  display: block; padding: 14px 16px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,.035);
}
.solution-steps { display: grid; gap: 14px; padding: 0; margin: 18px 0; list-style: none; counter-reset: step; }
.solution-steps li { position: relative; padding: 18px 18px 18px 64px; border: 1px solid var(--line); border-radius: 18px; background: rgba(216,255,105,.045); }
.solution-steps li::before { counter-increment: step; content: counter(step); position: absolute; left: 18px; top: 18px; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: var(--accent); color: #10130f; font: 800 14px Manrope, sans-serif; }
.solution-steps strong { display: block; color: var(--accent); font: 700 12px IBM Plex Mono, monospace; text-transform: uppercase; letter-spacing: .12em; }
.solution-steps span { display: block; margin-top: 6px; }
.solution-steps em { display: block; margin-top: 8px; color: var(--muted); font-style: normal; }
.transfer-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
.transfer-strip p { margin: 0; padding: 14px; border: 1px dashed var(--line); border-radius: 16px; color: var(--muted); }
.checkpoint { color: var(--accent); font-weight: 800; }
.trace-grid button.selected { border-color: var(--accent); color: var(--accent); }
select, input, textarea, button {
  font: inherit; color: var(--ink); background: #080908; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px;
}
button { cursor: pointer; background: var(--accent); color: #10130f; border: 0; font-weight: 800; }
.exercise-actions { display: flex; gap: 12px; margin: 16px 0; }
.exercise-feedback { display: block; min-height: 28px; color: var(--accent); font-weight: 700; }
.evidence-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.evidence-strip span { border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 6px 10px; font: 11px IBM Plex Mono, monospace; }
.editor-shell, .code-textarea { min-height: 190px; border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: #070807; }
.code-textarea, .editor-fallback { width: 100%; color: #f2f0e8; padding: 18px; font: 14px/1.6 IBM Plex Mono, monospace; }
.editor-fallback { min-height: 190px; border: 0; resize: vertical; }
.free-answer { width: 100%; min-height: 110px; margin-top: 12px; }
.cm-editor { min-height: 190px; font: 14px/1.6 IBM Plex Mono, monospace; }
[data-status="correct"] { border-color: rgba(216,255,105,.7); }
[data-status="retry"] { border-color: rgba(255,122,79,.7); }
@media (max-width: 900px) {
  .hero, .panel-grid, .evidence-grid, .choice-grid, .contrast-grid, .trace-grid, .transfer-strip { grid-template-columns: 1fr; }
  h1 { font-size: 78px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
