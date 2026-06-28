import { EXERCISE_TYPES } from '../schemas.mjs';

export function renderExercise(exercise, index) {
  const common = `data-exercise-id="${escapeHtml(exercise.id)}" data-exercise-type="${escapeHtml(exercise.type)}"`;
  const evidence = (exercise.sourceEvidence ?? []).map(id => `<span>${escapeHtml(id)}</span>`).join('');

  if (exercise.type === EXERCISE_TYPES.CODE_BLANKS) {
    return `
<section class="exercise code-exercise" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  <div class="editor-shell" data-scaffold="${escapeAttr(exercise.scaffold)}"></div>
  <label class="blank-label">Answer for blank <input class="blank-input" data-blank-id="${escapeAttr(exercise.blanks?.[0]?.id ?? 'blank-1')}" autocomplete="off" /></label>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge answer</button><button type="button" data-action="hint" onclick="window.SynthroRuntime?.handleButton(this, event)">Hint</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
  }

  if (exercise.type === EXERCISE_TYPES.WORKED_EXAMPLE) {
    const steps = (exercise.steps ?? [])
      .map(step => {
        const label = typeof step === 'string' ? 'Step' : step.label;
        const text = typeof step === 'string' ? step : step.text;
        const why = typeof step === 'string' ? '' : step.why;
        return `<li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(text)}</span>${why ? `<em>${escapeHtml(why)}</em>` : ''}</li>`;
      })
      .join('');
    const choices = (exercise.choices ?? [])
      .map(choice => `<label class="choice"><input type="radio" name="${escapeAttr(exercise.id)}" value="${escapeAttr(choice)}" /> ${escapeHtml(choice)}</label>`)
      .join('');
    return `
<section class="exercise worked-example" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  <ol class="solution-steps">${steps}</ol>
  <div class="transfer-strip">
    <p><strong>Near transfer:</strong> ${escapeHtml(exercise.nearTransferPrompt ?? '')}</p>
    <p><strong>Far transfer:</strong> ${escapeHtml(exercise.farTransferPrompt ?? '')}</p>
  </div>
  <p class="checkpoint">${escapeHtml(exercise.checkpoint ?? 'Recall the first solution step.')}</p>
  <div class="choice-grid">${choices}</div>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge recall</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
  }

  if (exercise.type === EXERCISE_TYPES.PARSONS) {
    const items = shuffleStable(exercise.items ?? []).map(item => `<li draggable="true">${escapeHtml(item)}</li>`).join('');
    return `
<section class="exercise" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  <ol class="sortable">${items}</ol>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge order</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
  }

  if (exercise.type === EXERCISE_TYPES.CONTRAST) {
    const cards = (exercise.cards ?? [])
      .map(
        card => `
<label class="contrast-card">${escapeHtml(card.text)}
  <select data-card-id="${escapeAttr(card.id)}">
    ${(exercise.labels ?? []).map(label => `<option>${escapeHtml(label)}</option>`).join('')}
  </select>
</label>`
      )
      .join('');
    return `
<section class="exercise" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  <div class="contrast-grid">${cards}</div>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge classification</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
  }

  if (exercise.choices?.length) {
    const choices = exercise.choices
      .map(choice => `<label class="choice"><input type="radio" name="${escapeAttr(exercise.id)}" value="${escapeAttr(choice)}" /> ${escapeHtml(choice)}</label>`)
      .join('');
    return `
<section class="exercise" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  <div class="choice-grid">${choices}</div>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge answer</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
  }

  if (exercise.nodes?.length) {
    return `
<section class="exercise" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  <div class="trace-grid">${exercise.nodes.map(node => `<button type="button" data-node="${escapeAttr(node)}" onclick="window.SynthroRuntime?.selectNode(this, event)">${escapeHtml(node)}</button>`).join('')}</div>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge node</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
  }

  const placeholder = exercise.scaffold ? `<pre>${escapeHtml(exercise.scaffold)}</pre>` : '';
  return `
<section class="exercise" ${common}>
  <div class="exercise-kicker">Rep ${index + 1} · ${escapeHtml(exercise.research)}</div>
  <h3>${escapeHtml(exercise.title)}</h3>
  <p>${escapeHtml(exercise.prompt)}</p>
  ${placeholder}
  <textarea class="free-answer" placeholder="Write your answer..."></textarea>
  <div class="exercise-actions"><button type="button" data-action="judge" onclick="window.SynthroRuntime?.handleButton(this, event)">Judge response</button></div>
  <output class="exercise-feedback"></output>
  <div class="evidence-strip">${evidence}</div>
</section>`;
}

export function runtimeScript(lesson) {
  return `
window.SYNTHRO_LESSON = ${JSON.stringify(lesson)};
const state = JSON.parse(localStorage.getItem('synthro:' + SYNTHRO_LESSON.lessonId) || '{"answers":{}}');

function saveState() {
  localStorage.setItem('synthro:' + SYNTHRO_LESSON.lessonId, JSON.stringify(state));
}

function normalize(value) {
  return String(value ?? '').trim().replace(/\\s+/g, ' ').toLowerCase();
}

function judge(exercise, answer) {
  if (exercise.type === 'code-blanks') {
    const blank = exercise.blanks[0];
    const value = normalize(answer[blank.id]);
    const expected = normalize(blank.expected);
    const regex = (blank.acceptRegex || []).some(pattern => new RegExp(pattern, 'i').test(value));
    const required = (blank.requiredTokens || []).every(token => value.includes(normalize(token)));
    const forbidden = (blank.forbiddenTokens || []).some(token => value.includes(normalize(token)));
    const correct = (value === expected || regex || required) && !forbidden;
    return { score: correct ? 1 : 0, status: correct ? 'correct' : 'retry', feedback: correct ? blank.feedback : 'Not quite. ' + (blank.hints?.[0] || 'Try the next hint.') };
  }
  if (exercise.type === 'parsons') {
    const expected = exercise.expectedOrder || [];
    const correct = answer.order.filter((item, index) => item === expected[index]).length;
    const score = expected.length ? correct / expected.length : 0;
    return { score, status: score === 1 ? 'correct' : score >= 0.5 ? 'partial' : 'retry', feedback: score === 1 ? exercise.feedback : 'Reorder so context and proof come before implementation.' };
  }
  if (exercise.type === 'contrast') {
    const cards = exercise.cards || [];
    const correct = cards.filter(card => normalize(answer.classifications[card.id]) === normalize(card.expected)).length;
    const score = cards.length ? correct / cards.length : 0;
    return { score, status: score === 1 ? 'correct' : score >= 0.5 ? 'partial' : 'retry', feedback: score === 1 ? 'Correct classifications.' : 'Classify by purpose, not phrasing.' };
  }
  if (exercise.requiredTokens || exercise.transferCriteria) {
    const text = normalize(answer.text);
    const required = exercise.requiredTokens || exercise.transferCriteria || [];
    const hits = required.filter(token => text.includes(normalize(token))).length;
    const score = required.length ? hits / required.length : text.length > 40 ? 0.8 : 0.2;
    return { score, status: score >= 0.8 ? 'correct' : score >= 0.4 ? 'partial' : 'retry', feedback: score >= 0.8 ? exercise.feedback : 'Add: ' + required.join(', ') };
  }
  const correct = normalize(answer.value) === normalize(exercise.expected);
  return { score: correct ? 1 : 0, status: correct ? 'correct' : 'retry', feedback: correct ? exercise.feedback : 'Not quite. Re-read the evidence anchor and try again.' };
}

function collectAnswer(section, exercise) {
  if (exercise.type === 'code-blanks') {
    const input = section.querySelector('.blank-input');
    return { [input?.dataset.blankId || 'blank-1']: input?.value || '' };
  }
  if (exercise.type === 'parsons') {
    return { order: [...section.querySelectorAll('.sortable li')].map(item => item.textContent.trim()) };
  }
  if (exercise.type === 'contrast') {
    return { classifications: Object.fromEntries([...section.querySelectorAll('[data-card-id]')].map(item => [item.dataset.cardId, item.value])) };
  }
  const checked = section.querySelector('input[type=radio]:checked');
  if (checked) return { value: checked.value };
  const selected = section.querySelector('[data-node].selected');
  if (selected) return { value: selected.dataset.node };
  const free = section.querySelector('.free-answer');
  return { text: free?.value || '' };
}

function queueToLavish(exercise, answer, result) {
  try {
    if (!window.lavish?.queuePrompt) return;
    window.lavish.queuePrompt({
      queueKey: 'synthro:' + exercise.id,
      prompt:
        'Synthro learner answer for ' +
        exercise.id +
        '. If the Synthro MCP server is available, call synthro_record_answer with this payload so Droid, Pi, and future agents can synthesize follow-up lessons.\\n' +
        JSON.stringify({ lessonId: SYNTHRO_LESSON.lessonId, exerciseId: exercise.id, answer, result }, null, 2)
    });
  } catch (error) {
    console.warn('Synthro could not queue the answer for Lavish.', error);
  }
}

function updateMastery() {
  const scores = Object.values(state.answers).map(item => item.result.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const fill = document.querySelector('[data-progress-fill]');
  const label = document.querySelector('[data-progress-label]');
  if (fill) fill.style.width = Math.round(avg * 100) + '%';
  if (label) label.textContent = Math.round(avg * 100) + '% mastery';
}

function initEditors() {
  for (const shell of document.querySelectorAll('.editor-shell')) {
    const scaffold = shell.dataset.scaffold || '';
    try {
      if (!window.SynthroEditor?.createCodeEditor) throw new Error('Code editor runtime unavailable');
      window.SynthroEditor.createCodeEditor(shell, scaffold);
    } catch (error) {
      console.warn('Synthro editor fallback activated.', error);
      const fallback = document.createElement('textarea');
      fallback.className = 'editor-fallback';
      fallback.value = scaffold;
      fallback.setAttribute('aria-label', 'Code scaffold');
      shell.replaceChildren(fallback);
    }
  }
}

function showFeedback(section, message) {
  const feedback = section?.querySelector('.exercise-feedback');
  if (feedback) feedback.textContent = message;
}

function selectNode(node, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  node.parentElement.querySelectorAll('[data-node]').forEach(item => item.classList.remove('selected'));
  node.classList.add('selected');
}

function handleButton(button, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const section = button?.closest('.exercise');
  try {
    if (!section) return;
    const exercise = SYNTHRO_LESSON.exercises.find(item => item.id === section.dataset.exerciseId);
    if (!exercise) {
      showFeedback(section, 'This exercise could not be found. Refresh the lesson and try again.');
      return;
    }
    if (button.dataset.action === 'hint') {
      const hint = exercise.blanks?.[0]?.hints?.[0] || 'Look at the evidence anchor.';
      showFeedback(section, hint);
      return;
    }
    const answer = collectAnswer(section, exercise);
    const result = judge(exercise, answer);
    state.answers[exercise.id] = { answer, result, at: new Date().toISOString() };
    saveState();
    updateMastery();
    section.dataset.status = result.status;
    showFeedback(section, result.feedback + ' Score: ' + Math.round(result.score * 100) + '%.');
    queueToLavish(exercise, answer, result);
  } catch (error) {
    console.error('Synthro failed to judge the answer.', error);
    showFeedback(section, 'Synthro hit a browser runtime error. Refresh the lesson and try again.');
  }
}

function initInteractions() {
  document.addEventListener('click', event => {
    const node = event.target.closest('[data-node]');
    if (node) selectNode(node, event);
    const button = event.target.closest('[data-action]');
    if (button) handleButton(button, event);
  });

  document.addEventListener('dragstart', event => {
    if (event.target.matches('.sortable li')) event.dataTransfer.setData('text/plain', event.target.textContent);
  });
  document.addEventListener('dragover', event => {
    if (event.target.matches('.sortable li')) event.preventDefault();
  });
  document.addEventListener('drop', event => {
    if (!event.target.matches('.sortable li')) return;
    event.preventDefault();
    const list = event.target.parentElement;
    const draggedText = event.dataTransfer.getData('text/plain');
    const dragged = [...list.children].find(item => item.textContent === draggedText);
    if (dragged && dragged !== event.target) list.insertBefore(dragged, event.target);
  });
}

window.SynthroRuntime = { handleButton, selectNode };
initInteractions();
updateMastery();
initEditors();
`;
}

function shuffleStable(items) {
  return [...items].sort((a, b) => (a.length % 3) - (b.length % 3));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('\n', '&#10;');
}
