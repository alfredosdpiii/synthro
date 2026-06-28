import { EXERCISE_TYPES } from '../schemas.mjs';
import { judgeCodeBlank } from './code-judge.mjs';

export function judgeExercise(exercise, answer) {
  switch (exercise.type) {
    case EXERCISE_TYPES.CODE_BLANKS:
      return judgeCodeBlank(exercise, answer);
    case EXERCISE_TYPES.PARSONS:
      return judgeOrder(exercise, answer);
    case EXERCISE_TYPES.CONTRAST:
      return judgeClassifications(exercise, answer);
    case EXERCISE_TYPES.SELF_EXPLANATION:
    case EXERCISE_TYPES.TRANSFER:
      return judgeRubricText(exercise, answer);
    default:
      return judgeExpected(exercise, answer);
  }
}

export function judgeExpected(exercise, answer) {
  const normalized = normalize(answer?.value ?? answer);
  const expected = normalize(exercise.expected);
  const correct = normalized === expected || (exercise.acceptRegex ?? []).some(pattern => new RegExp(pattern, 'i').test(normalized));
  return {
    exerciseId: exercise.id,
    status: correct ? 'correct' : 'retry',
    score: correct ? 1 : 0,
    feedback: correct ? exercise.feedback ?? 'Correct.' : `Not quite. ${exercise.feedback ?? 'Try again with the evidence anchor.'}`
  };
}

export function judgeOrder(exercise, answer) {
  const submitted = answer?.order ?? answer ?? [];
  const expected = exercise.expectedOrder ?? [];
  const correctPositions = submitted.filter((item, index) => item === expected[index]).length;
  const score = expected.length ? correctPositions / expected.length : 0;
  return {
    exerciseId: exercise.id,
    status: score === 1 ? 'correct' : score >= 0.5 ? 'partial' : 'retry',
    score,
    feedback: score === 1 ? exercise.feedback ?? 'Correct order.' : 'Some steps are out of order. Context and proof usually come before implementation.'
  };
}

export function judgeClassifications(exercise, answer) {
  const values = answer?.classifications ?? answer ?? {};
  const cards = exercise.cards ?? [];
  const correct = cards.filter(card => normalize(values[card.id]) === normalize(card.expected)).length;
  const score = cards.length ? correct / cards.length : 0;
  return {
    exerciseId: exercise.id,
    status: score === 1 ? 'correct' : score >= 0.5 ? 'partial' : 'retry',
    score,
    feedback: score === 1 ? 'Correct classifications.' : 'Compare the purpose of each move, not just the words used.'
  };
}

export function judgeRubricText(exercise, answer) {
  const text = normalize(answer?.text ?? answer);
  const required = exercise.requiredTokens ?? exercise.transferCriteria ?? [];
  const hits = required.filter(token => text.includes(normalize(token))).length;
  const score = required.length ? hits / required.length : text.length > 30 ? 0.8 : 0.2;
  return {
    exerciseId: exercise.id,
    status: score >= 0.8 ? 'correct' : score >= 0.4 ? 'partial' : 'retry',
    score,
    feedback: score >= 0.8 ? exercise.feedback ?? 'Strong explanation.' : `Add the missing criteria: ${required.join(', ')}.`
  };
}

function normalize(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}
