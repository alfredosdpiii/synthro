export function judgeCodeBlank(exercise, answers) {
  const results = [];
  for (const blank of exercise.blanks ?? []) {
    const answer = normalize(answers?.[blank.id] ?? answers?.answer ?? '');
    const expected = normalize(blank.expected ?? '');
    const regexMatch = (blank.acceptRegex ?? []).some(pattern => new RegExp(pattern, 'i').test(answer));
    const exact = answer === expected;
    const hasRequired = (blank.requiredTokens ?? []).every(token => answer.includes(normalize(token)));
    const hasForbidden = (blank.forbiddenTokens ?? []).some(token => answer.includes(normalize(token)));
    const syntaxOk = lightweightSyntaxCheck(answer);
    const correct = (exact || regexMatch || hasRequired) && !hasForbidden && syntaxOk.ok;

    results.push({
      blankId: blank.id,
      correct,
      score: correct ? 1 : regexMatch || hasRequired ? 0.6 : 0,
      feedback: correct ? blank.feedback ?? 'Correct.' : missedFeedback(blank, syntaxOk),
      hints: correct ? [] : blank.hints ?? []
    });
  }

  const score = results.length ? average(results.map(item => item.score)) : 0;
  return {
    exerciseId: exercise.id,
    status: score >= 0.99 ? 'correct' : score >= 0.5 ? 'partial' : 'retry',
    score,
    results
  };
}

export function lightweightSyntaxCheck(answer) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  for (const char of answer) {
    if (pairs[char]) stack.push(pairs[char]);
    else if (Object.values(pairs).includes(char) && stack.pop() !== char) {
      return { ok: false, reason: 'Unbalanced delimiters.' };
    }
  }
  return stack.length === 0 ? { ok: true } : { ok: false, reason: 'Unclosed delimiter.' };
}

function missedFeedback(blank, syntaxOk) {
  if (!syntaxOk.ok) return syntaxOk.reason;
  if (blank.forbiddenTokens?.length) {
    return `Avoid ${blank.forbiddenTokens.join(', ')} here. ${blank.feedback ?? ''}`.trim();
  }
  return `Not quite. ${blank.feedback ?? 'Use the hint ladder and try again.'}`;
}

function normalize(value) {
  return String(value).trim().replace(/\s+/g, ' ').replace(/;$/, '').toLowerCase();
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
