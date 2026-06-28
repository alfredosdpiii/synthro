import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePullRequestLocator } from '../src/collect/github.mjs';
import { buildEvidencePack, redactSecrets } from '../src/analyze/evidence.mjs';
import { buildObjectives, buildRoadmap, inferConcepts } from '../src/analyze/concepts.mjs';
import { planInteractions } from '../src/plan/interaction-planner.mjs';
import { judgeExercise } from '../src/judge/rubric-judge.mjs';
import { renderLessonHtml } from '../src/render/html.mjs';

test('parses GitHub PR locators', () => {
  assert.deepEqual(parsePullRequestLocator('https://github.com/a/b/pull/123'), {
    owner: 'a',
    repo: 'b',
    number: 123
  });
  assert.deepEqual(parsePullRequestLocator('a/b/pull/456'), {
    owner: 'a',
    repo: 'b',
    number: 456
  });
});

test('redacts likely secrets', () => {
  const text = redactSecrets('api_key = "super-secret-value" and token: abc123');
  assert.match(text, /\[REDACTED]/);
  assert.doesNotMatch(text, /super-secret-value/);
});

test('builds evidence, concepts, and interactions from fixture', async () => {
  const raw = JSON.parse(await readFile('test/fixtures/sample-pack.json', 'utf8'));
  const pack = buildEvidencePack(raw);
  const concepts = inferConcepts(pack);
  const roadmap = buildRoadmap(concepts);
  const objectives = buildObjectives(pack, concepts);
  const exercises = planInteractions(pack, concepts, objectives);

  assert.equal(pack.summary.evidenceCount >= 3, true);
  assert.equal(concepts.length > 4, true);
  assert.equal(roadmap.length, concepts.length);
  assert.equal(objectives.length > 0, true);
  assert.equal(new Set(exercises.map(item => item.type)).size >= 6, true);
});

test('judges code, order, and contrast exercises', async () => {
  const raw = JSON.parse(await readFile('test/fixtures/sample-pack.json', 'utf8'));
  const pack = buildEvidencePack(raw);
  const concepts = inferConcepts(pack);
  const exercises = planInteractions(pack, concepts, buildObjectives(pack, concepts));

  const code = exercises.find(item => item.type === 'code-blanks');
  assert.equal(judgeExercise(code, { 'blank-1': 'false' }).status, 'correct');
  assert.equal(judgeExercise(code, { 'blank-1': 'true' }).status, 'retry');

  const parsons = exercises.find(item => item.type === 'parsons');
  assert.equal(judgeExercise(parsons, { order: parsons.expectedOrder }).status, 'correct');

  const contrast = exercises.find(item => item.type === 'contrast');
  const classifications = Object.fromEntries(contrast.cards.map(card => [card.id, card.expected]));
  assert.equal(judgeExercise(contrast, { classifications }).status, 'correct');
});

test('renders interactive HTML lesson', async () => {
  const raw = JSON.parse(await readFile('test/fixtures/sample-pack.json', 'utf8'));
  const pack = buildEvidencePack(raw);
  const concepts = inferConcepts(pack);
  const lesson = {
    lessonId: pack.lessonId,
    title: 'Test Lesson',
    subtitle: 'A test lesson.',
    source: pack.source,
    summary: pack.summary,
    contributions: pack.contributions,
    evidence: pack.evidence,
    concepts,
    roadmap: buildRoadmap(concepts),
    objectives: buildObjectives(pack, concepts),
    exercises: planInteractions(pack, concepts, buildObjectives(pack, concepts))
  };
  const html = await renderLessonHtml(lesson);
  assert.match(html, /window\.SYNTHRO_LESSON/);
  assert.match(html, /window\.SynthroRuntime = \{ handleButton, selectNode \}/);
  assert.match(html, /onclick="window\.SynthroRuntime\?\.handleButton\(this, event\)"/);
  assert.match(html, /data-exercise-type="code-blanks"/);
  assert.match(html, /solution-steps/);
  assert.match(html, /Near transfer/);
  assert.match(html, /data-exercise-type="review-simulator"/);
});
