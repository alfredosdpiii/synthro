import { makeLessonId } from '../schemas.mjs';

const SECRET_PATTERNS = [
  /(ghp|github_pat|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /(api[_-]?key|token|secret|password)\s*[:=]\s*['"]?[^'"\s]+/gi,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g
];

export function redactSecrets(value) {
  if (value == null) return value;
  let text = String(value);
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, match => {
      const label = match.includes('=') || match.includes(':') ? match.split(/[:=]/)[0] : 'secret';
      return `${label}: [REDACTED]`;
    });
  }
  return text;
}

export function detectLanguage(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase();
  return (
    {
      js: 'JavaScript',
      jsx: 'React',
      ts: 'TypeScript',
      tsx: 'React TypeScript',
      py: 'Python',
      rs: 'Rust',
      go: 'Go',
      ex: 'Elixir',
      exs: 'Elixir',
      rb: 'Ruby',
      java: 'Java',
      css: 'CSS',
      html: 'HTML',
      md: 'Markdown',
      yml: 'YAML',
      yaml: 'YAML',
      json: 'JSON'
    }[ext] ?? 'Code'
  );
}

export function classifyFile(filename = '') {
  const lower = filename.toLowerCase();
  if (lower.includes('test') || lower.includes('spec')) return 'testing';
  if (lower.includes('.github') || lower.includes('ci') || lower.includes('workflow')) return 'delivery';
  if (lower.includes('readme') || lower.includes('docs') || lower.endsWith('.md')) return 'documentation';
  if (lower.includes('package') || lower.includes('lock')) return 'dependencies';
  if (lower.includes('style') || lower.endsWith('.css')) return 'interface';
  return 'implementation';
}

function summarizePatch(patch = '') {
  const lines = redactSecrets(patch).split('\n');
  return lines
    .filter(line => line.startsWith('+') || line.startsWith('-') || line.startsWith('@@'))
    .slice(0, 28)
    .join('\n');
}

function evidenceFromFile(file, contribution) {
  return {
    id: `${contribution.id}:${file.filename}`,
    kind: 'file-change',
    anchor: `${contribution.url ?? contribution.id}#${file.filename}`,
    excerpt: summarizePatch(file.patch ?? ''),
    confidence: 0.86,
    metadata: {
      filename: file.filename,
      language: detectLanguage(file.filename),
      category: classifyFile(file.filename),
      additions: file.additions ?? 0,
      deletions: file.deletions ?? 0,
      status: file.status ?? 'modified',
      contributionId: contribution.id
    }
  };
}

function normalizePullRef(ref, index = 0) {
  return {
    id: ref.url ?? `${ref.owner}/${ref.repo}#${ref.number ?? index}`,
    repo: `${ref.owner}/${ref.repo}`,
    title: ref.title ?? `Pull request ${ref.number}`,
    url: ref.url,
    role: 'author',
    date: ref.updatedAt ?? ref.updated_at ?? ref.createdAt ?? ref.created_at,
    labels: ref.labels ?? []
  };
}

export function buildEvidencePack(raw, localContext = null) {
  const source = raw.source ?? { type: 'sample', locator: 'sample' };
  const lessonId = makeLessonId(source);
  const contributions = [];
  const evidence = [];

  if (source.type === 'pr') {
    const contribution = {
      id: raw.pull.html_url,
      repo: `${source.owner}/${source.repo}`,
      title: raw.pull.title,
      url: raw.pull.html_url,
      role: 'case-study',
      date: raw.pull.updated_at,
      labels: raw.pull.labels?.map(label => label.name) ?? []
    };
    contributions.push(contribution);
    for (const file of raw.files ?? []) {
      evidence.push(evidenceFromFile(file, contribution));
    }
    for (const review of raw.reviews ?? []) {
      if (!review.body) continue;
      evidence.push({
        id: `${review.html_url}:review`,
        kind: 'review',
        anchor: review.html_url,
        excerpt: redactSecrets(review.body).slice(0, 1000),
        confidence: 0.78,
        metadata: { state: review.state, author: review.user?.login }
      });
    }
  } else {
    const details = raw.details ?? [];
    for (const [index, ref] of details.entries()) {
      const contribution = normalizePullRef(ref, index);
      contributions.push(contribution);
      for (const file of ref.files ?? []) {
        evidence.push(evidenceFromFile(file, contribution));
      }
    }
    for (const [index, ref] of (raw.pullRefs ?? []).entries()) {
      if (!contributions.some(item => item.url === ref.url)) {
        contributions.push(normalizePullRef(ref, index));
      }
    }
  }

  const languages = tally(evidence.map(item => item.metadata?.language).filter(Boolean));
  const categories = tally(evidence.map(item => item.metadata?.category).filter(Boolean));

  return {
    lessonId,
    source,
    localContext,
    contributions,
    evidence,
    summary: {
      contributionCount: contributions.length,
      evidenceCount: evidence.length,
      languages,
      categories,
      topLanguage: Object.keys(languages)[0] ?? 'Code',
      topCategory: Object.keys(categories)[0] ?? 'implementation'
    }
  };
}

function tally(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1]));
}
