import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getLessonState, nextReviewItems, recordAnswer, saveLesson, synthesizeFeedback } from '../src/store/progress-store.mjs';

test('stores lessons and synthesizes feedback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'synthro-'));
  try {
    const lesson = {
      lessonId: 'lesson-1',
      title: 'Lesson',
      source: { type: 'sample' },
      objectives: [],
      roadmap: [],
      exercises: [
        { id: 'a', type: 'diagnostic', title: 'A', prompt: 'A?' },
        { id: 'b', type: 'spaced-review', title: 'B', prompt: 'B?' }
      ]
    };
    await saveLesson(lesson, root);
    await recordAnswer({ lessonId: 'lesson-1', exerciseId: 'a', answer: 'x', result: { score: 0.4, status: 'retry' } }, root);
    const state = await getLessonState('lesson-1', root);
    assert.equal(state.summary.attempts, 1);
    const feedback = await synthesizeFeedback('lesson-1', root);
    assert.match(feedback.summary, /need review/);
    const review = await nextReviewItems('lesson-1', root);
    assert.equal(review.length >= 1, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
