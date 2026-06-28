export const SOURCE_TYPES = Object.freeze({
  SAMPLE: 'sample',
  GITHUB_USER: 'github-user',
  REPO_USER: 'repo-user',
  PR: 'pr'
});

export const EXERCISE_TYPES = Object.freeze({
  DIAGNOSTIC: 'diagnostic',
  WORKED_EXAMPLE: 'worked-example',
  FADED_EXAMPLE: 'faded-example',
  CODE_BLANKS: 'code-blanks',
  PARSONS: 'parsons',
  TRACE_FLOW: 'trace-flow',
  PREDICT_FAILURE: 'predict-failure',
  REVIEW_SIM: 'review-simulator',
  CONTRAST: 'contrast',
  DEBUG_LAB: 'debugging-lab',
  SELF_EXPLANATION: 'self-explanation',
  TRANSFER: 'transfer-mission',
  SPACED_REVIEW: 'spaced-review'
});

export function makeLessonId(source) {
  const raw = `${source.type}:${source.locator ?? source.username ?? source.repo ?? 'sample'}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export function assertSource(source) {
  if (!source || typeof source !== 'object') {
    throw new TypeError('source must be an object');
  }
  if (!Object.values(SOURCE_TYPES).includes(source.type)) {
    throw new Error(`Unsupported source type: ${source.type}`);
  }
}
