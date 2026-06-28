#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectGitHubUser, collectPullRequest, collectRepoUser } from '../src/collect/github.mjs';
import { collectLocalRepoContext } from '../src/collect/local-repo.mjs';
import { buildEvidencePack } from '../src/analyze/evidence.mjs';
import { buildObjectives, buildRoadmap, inferConcepts } from '../src/analyze/concepts.mjs';
import { planInteractions } from '../src/plan/interaction-planner.mjs';
import { writeLessonHtml } from '../src/render/html.mjs';
import { saveLesson } from '../src/store/progress-store.mjs';

const args = process.argv.slice(2);
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

if (args.length === 0 || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

const command = args[0];
const outPath = resolve(valueAfter('--out') ?? 'dist/synthro-lesson.html');
const shouldOpen = args.includes('--open');
const noOpen = args.includes('--no-open');

try {
  const raw = await collect(command, args.slice(1));
  const localContext = await collectLocalRepoContext(process.cwd());
  const pack = buildEvidencePack(raw, localContext);
  const concepts = inferConcepts(pack);
  const roadmap = buildRoadmap(concepts);
  const objectives = buildObjectives(pack, concepts);
  const exercises = planInteractions(pack, concepts, objectives);
  const lesson = {
    lessonId: pack.lessonId,
    title: titleFor(pack),
    subtitle: subtitleFor(pack),
    source: pack.source,
    summary: pack.summary,
    contributions: pack.contributions,
    evidence: pack.evidence,
    concepts,
    roadmap,
    objectives,
    exercises
  };

  await writeLessonHtml(lesson, outPath);
  await saveLesson(lesson);
  console.log(`Synthro lesson written to ${outPath}`);
  console.log(`Lesson id: ${lesson.lessonId}`);
  if (shouldOpen && !noOpen) openLavish(outPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function collect(commandName, rest) {
  if (commandName === 'sample') {
    return JSON.parse(await readFile(resolve(projectRoot, 'test/fixtures/sample-pack.json'), 'utf8'));
  }
  if (commandName === 'pr') {
    if (!rest[0]) throw new Error('Missing PR locator.');
    return collectPullRequest(rest[0]);
  }
  if (commandName === 'github-user') {
    if (!rest[0]) throw new Error('Missing GitHub username.');
    return collectGitHubUser(rest[0]);
  }
  if (commandName === 'repo-user') {
    if (!rest[0] || !rest[1]) throw new Error('Expected repo-user <owner/repo> <username>.');
    return collectRepoUser(rest[0], rest[1]);
  }
  throw new Error(`Unknown command: ${commandName}`);
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function titleFor(pack) {
  if (pack.source.type === 'github-user') return `Learn from @${pack.source.username}`;
  if (pack.source.type === 'repo-user') return `Contribute like ${pack.source.username}`;
  if (pack.source.type === 'pr') return `Learn from PR #${pack.source.number}`;
  return 'Synthro sample lesson';
}

function subtitleFor(pack) {
  const top = pack.summary.topCategory.replace('-', ' ');
  return `A research-backed, interactive roadmap built from ${pack.summary.evidenceCount} evidence anchors across ${pack.summary.contributionCount} contribution signal(s), focused on ${top}.`;
}

function openLavish(file) {
  const child = spawn('npx', ['-y', 'lavish-axi', file], {
    stdio: 'inherit',
    detached: false
  });
  child.on('error', error => {
    console.error(`Could not open Lavish: ${error.message}`);
  });
}

function printHelp() {
  console.log(`Synthro

Usage:
  node scripts/synthro.mjs sample [--out file] [--open]
  node scripts/synthro.mjs pr <github-pr-url|owner/repo/pull/number> [--out file] [--open]
  node scripts/synthro.mjs github-user <username> [--out file] [--open]
  node scripts/synthro.mjs repo-user <owner/repo> <username> [--out file] [--open]

Environment:
  GITHUB_TOKEN  Optional token for GitHub API rate limits.
`);
}
