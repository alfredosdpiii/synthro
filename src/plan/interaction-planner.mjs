import { EXERCISE_TYPES } from '../schemas.mjs';

export function planInteractions(pack, concepts, objectives) {
  const primary = pack.evidence[0] ?? fallbackEvidence(pack);
  const secondary = pack.evidence[1] ?? primary;
  const category = primary.metadata?.category ?? 'implementation';
  const language = primary.metadata?.language ?? pack.summary.topLanguage ?? 'JavaScript';
  const conceptName = concepts[1]?.name ?? 'Code structure';

  return [
    {
      id: 'diagnostic-1',
      type: EXERCISE_TYPES.DIAGNOSTIC,
      title: 'Prerequisite check',
      research: 'Active recall + mastery learning',
      sourceEvidence: [primary.id],
      prompt: `Before seeing the answer: what skill matters most for understanding this ${category} contribution?`,
      choices: ['Counting commits', conceptName, 'Memorizing file names', 'Skipping tests'],
      expected: conceptName,
      feedback: `The key prerequisite is ${conceptName.toLowerCase()}, because the lesson is built from concrete contribution evidence.`
    },
    {
      id: 'worked-1',
      type: EXERCISE_TYPES.WORKED_EXAMPLE,
      title: 'Expert move lens',
      research: 'Worked examples + solution-step transfer',
      sourceEvidence: [primary.id],
      prompt: 'Study the solved contribution path, then recall the first solution step before transfer.',
      steps: [
        {
          label: 'Orient',
          text: 'Read the file path and infer the responsibility.',
          why: 'The path narrows the mental model before code details compete for attention.'
        },
        {
          label: 'Localize',
          text: 'Inspect the smallest changed region and surrounding code.',
          why: 'Worked examples teach the sequence of solution steps, not just the final answer.'
        },
        {
          label: 'Prove',
          text: 'Name the test or review signal that would prove the change is safe.',
          why: 'Transfer improves when learners connect the solved step to a reusable proof strategy.'
        }
      ],
      checkpoint: 'Which subgoal comes before editing?',
      choices: [
        'Read the file path and infer the responsibility.',
        'Open a PR immediately.',
        'Rewrite the whole module.',
        'Count how many commits the author made.'
      ],
      expected: 'Read the file path and infer the responsibility.',
      nearTransferPrompt: `Apply the same solution steps to another change in ${primary.metadata?.filename ?? 'this area'}.`,
      farTransferPrompt: 'Apply the same orient-localize-prove sequence in a different repo before drafting a PR.'
    },
    {
      id: 'faded-1',
      type: EXERCISE_TYPES.FADED_EXAMPLE,
      title: 'Faded completion',
      research: 'Worked example fading',
      sourceEvidence: [primary.id],
      prompt: 'Complete the missing reasoning step after seeing the expert example.',
      scaffold: `When a PR changes ${primary.metadata?.filename ?? 'a file'}, first inspect ____ before judging the implementation.`,
      expected: 'the surrounding context',
      acceptRegex: ['surrounding context', 'nearby code', 'the context', 'call site'],
      hints: ['Do not jump straight to the changed line.', 'Look around the diff before judging it.']
    },
    {
      id: 'code-blank-1',
      type: EXERCISE_TYPES.CODE_BLANKS,
      title: 'Code editor rep',
      research: 'Generation effect + deliberate practice',
      sourceEvidence: [primary.id],
      language,
      prompt: 'Fill the blank so the guard communicates intent before the risky operation.',
      scaffold: `function canShip(change) {\n  if (!change.tests || change.tests.length === 0) {\n    return ____;\n  }\n  return change.risk !== 'high';\n}`,
      blanks: [
        {
          id: 'blank-1',
          expected: 'false',
          acceptRegex: ['false'],
          requiredTokens: ['false'],
          forbiddenTokens: ['true'],
          feedback: 'A risky change without tests should not ship.',
          hints: ['The function returns a boolean.', 'No tests means block the ship path.']
        }
      ]
    },
    {
      id: 'parsons-1',
      type: EXERCISE_TYPES.PARSONS,
      title: 'Order the contribution',
      research: 'Faded Parsons problems',
      sourceEvidence: [primary.id, secondary.id],
      prompt: 'Reorder the steps into a contribution workflow.',
      items: ['Open PR', 'Read surrounding code', 'Write or update test', 'Make focused change', 'Respond to review'],
      expectedOrder: ['Read surrounding code', 'Write or update test', 'Make focused change', 'Open PR', 'Respond to review'],
      feedback: 'Strong contributors understand context and proof before asking for review.'
    },
    {
      id: 'trace-1',
      type: EXERCISE_TYPES.TRACE_FLOW,
      title: 'Trace the flow',
      research: 'Dual coding + cognitive load',
      sourceEvidence: [primary.id],
      prompt: 'Click the node that should be understood before changing implementation behavior.',
      nodes: ['Input', 'Validation', 'Core change', 'Test signal', 'Review'],
      edges: [['Input', 'Validation'], ['Validation', 'Core change'], ['Core change', 'Test signal'], ['Test signal', 'Review']],
      expected: 'Validation',
      feedback: 'Validation defines the safe boundary for the implementation.'
    },
    {
      id: 'failure-1',
      type: EXERCISE_TYPES.PREDICT_FAILURE,
      title: 'Predict the failure',
      research: 'Retrieval practice + transfer',
      sourceEvidence: [primary.id],
      prompt: 'If this contribution skipped the proof step, what would most likely fail later?',
      choices: ['The changelog alphabetizes itself', 'A regression test or review check', 'The author avatar', 'The repository star count'],
      expected: 'A regression test or review check',
      feedback: 'Good contributors predict proof surfaces, not vanity metrics.'
    },
    {
      id: 'review-1',
      type: EXERCISE_TYPES.REVIEW_SIM,
      title: 'Review simulator',
      research: 'Cognitive apprenticeship + self-explanation',
      sourceEvidence: [primary.id],
      prompt: 'Choose the highest-signal review comment.',
      choices: [
        'Looks fine.',
        'Why did you do this?',
        `Can we add a focused test around ${primary.metadata?.filename ?? 'this path'} so the behavior is locked?`,
        'Nit: rename everything.'
      ],
      expected: `Can we add a focused test around ${primary.metadata?.filename ?? 'this path'} so the behavior is locked?`,
      feedback: 'High-signal review comments are specific, evidence-bound, and oriented toward proof.'
    },
    {
      id: 'contrast-1',
      type: EXERCISE_TYPES.CONTRAST,
      title: 'Contrast the pattern',
      research: 'Interleaving',
      sourceEvidence: [primary.id, secondary.id],
      prompt: 'Classify each move as context, proof, implementation, or review.',
      cards: [
        { id: 'read-path', text: 'Inspect neighboring files before editing', expected: 'context' },
        { id: 'add-test', text: 'Add a failing regression test', expected: 'proof' },
        { id: 'patch-code', text: 'Change the production branch', expected: 'implementation' },
        { id: 'ask-scope', text: 'Ask whether the PR should split scope', expected: 'review' }
      ],
      labels: ['context', 'proof', 'implementation', 'review']
    },
    {
      id: 'explain-1',
      type: EXERCISE_TYPES.SELF_EXPLANATION,
      title: 'Explain the expert move',
      research: 'Self-explanation',
      sourceEvidence: [primary.id],
      prompt: `In two sentences, explain why ${conceptName.toLowerCase()} matters for this contribution.`,
      requiredTokens: conceptName.toLowerCase().split(/\s+/).slice(0, 2),
      feedback: 'A strong explanation connects the code evidence to the engineering goal.'
    },
    {
      id: 'transfer-1',
      type: EXERCISE_TYPES.TRANSFER,
      title: 'Transfer mission',
      research: 'Transfer of test-enhanced learning',
      sourceEvidence: [primary.id],
      prompt: 'Plan a similar contribution in this repo. Name the target file, proof signal, and review risk.',
      transferCriteria: ['target file', 'proof signal', 'review risk'],
      feedback: 'Transfer is the point: use the studied pattern in a new contribution.'
    },
    {
      id: 'review-later-1',
      type: EXERCISE_TYPES.SPACED_REVIEW,
      title: 'Spaced review',
      research: 'Spacing + retrieval',
      sourceEvidence: [primary.id],
      prompt: `Later, recall the first move before contributing like this engineer.`,
      expected: 'Read the contribution surface',
      feedback: 'Revisiting the same move later makes the skill more durable.'
    }
  ];
}

function fallbackEvidence(pack) {
  return {
    id: `${pack.lessonId}:fallback`,
    kind: 'inference',
    anchor: 'sample',
    excerpt: 'No file evidence was available; Synthro generated a conservative teaching scaffold.',
    confidence: 0.3,
    metadata: { filename: 'unknown.js', language: 'JavaScript', category: 'implementation' }
  };
}
