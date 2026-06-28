import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const DEFAULT_STORE = '.synthro/progress.json';

export function storePath(root = process.cwd()) {
  return resolve(root, process.env.SYNTHRO_STORE ?? DEFAULT_STORE);
}

export async function readStore(root = process.cwd()) {
  const file = storePath(root);
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return { lessons: {}, answers: {} };
  }
}

export async function writeStore(data, root = process.cwd()) {
  const file = storePath(root);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

export async function saveLesson(lesson, root = process.cwd()) {
  const data = await readStore(root);
  data.lessons[lesson.lessonId] = {
    lessonId: lesson.lessonId,
    title: lesson.title,
    source: lesson.source,
    objectives: lesson.objectives,
    roadmap: lesson.roadmap,
    exercises: lesson.exercises.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      prompt: item.prompt,
      research: item.research
    })),
    updatedAt: new Date().toISOString()
  };
  await writeStore(data, root);
  return data.lessons[lesson.lessonId];
}

export async function listLessons(root = process.cwd()) {
  const data = await readStore(root);
  return Object.values(data.lessons).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function getLessonState(lessonId, root = process.cwd()) {
  const data = await readStore(root);
  const lesson = data.lessons[lessonId];
  const answers = data.answers[lessonId] ?? [];
  if (!lesson) return null;
  return { lesson, answers, summary: summarizeAnswers(answers) };
}

export async function recordAnswer({ lessonId, exerciseId, answer, result }, root = process.cwd()) {
  const data = await readStore(root);
  data.answers[lessonId] ??= [];
  const entry = {
    lessonId,
    exerciseId,
    answer,
    result,
    recordedAt: new Date().toISOString()
  };
  data.answers[lessonId].push(entry);
  await writeStore(data, root);
  return entry;
}

export async function synthesizeFeedback(lessonId, root = process.cwd()) {
  const state = await getLessonState(lessonId, root);
  if (!state) return null;
  const weak = state.answers.filter(item => item.result?.score < 0.8);
  const strong = state.answers.filter(item => item.result?.score >= 0.8);
  return {
    lessonId,
    summary: `${strong.length} strong answers, ${weak.length} answers need review.`,
    strengths: strong.slice(0, 5).map(item => item.exerciseId),
    review: weak.slice(0, 5).map(item => ({
      exerciseId: item.exerciseId,
      feedback: item.result?.feedback ?? 'Review this answer.'
    })),
    nextAction: weak.length ? 'Generate a remediation mini-lesson for weak exercises.' : 'Generate a transfer challenge.'
  };
}

export async function nextReviewItems(lessonId, root = process.cwd()) {
  const state = await getLessonState(lessonId, root);
  if (!state) return [];
  const attemptsByExercise = new Map();
  for (const answer of state.answers) attemptsByExercise.set(answer.exerciseId, answer);
  return state.lesson.exercises
    .filter(exercise => {
      const attempt = attemptsByExercise.get(exercise.id);
      return !attempt || attempt.result?.score < 0.8 || exercise.type === 'spaced-review';
    })
    .slice(0, 8);
}

function summarizeAnswers(answers) {
  if (!answers.length) return { attempts: 0, averageScore: 0, mastered: 0 };
  const scores = answers.map(item => Number(item.result?.score ?? 0));
  return {
    attempts: answers.length,
    averageScore: scores.reduce((sum, value) => sum + value, 0) / scores.length,
    mastered: scores.filter(score => score >= 0.8).length
  };
}
