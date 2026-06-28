const CATEGORY_CONCEPTS = {
  testing: ['Test intent', 'Failure prediction', 'Regression protection'],
  delivery: ['Shipping discipline', 'CI feedback', 'Release safety'],
  documentation: ['Reader empathy', 'Contribution clarity', 'Change explanation'],
  dependencies: ['Dependency hygiene', 'Upgrade risk', 'Lockfile literacy'],
  interface: ['Interface polish', 'Visual feedback', 'Interaction constraints'],
  implementation: ['Code structure', 'Small diffs', 'Local reasoning']
};

export function inferConcepts(pack) {
  const categories = Object.keys(pack.summary.categories);
  const languages = Object.keys(pack.summary.languages);
  const concepts = [];

  concepts.push({
    id: 'repo-reading',
    name: 'Read the contribution surface',
    level: 'foundation',
    prereqs: [],
    evidenceIds: pack.evidence.slice(0, 3).map(item => item.id)
  });

  for (const category of categories) {
    for (const name of CATEGORY_CONCEPTS[category] ?? CATEGORY_CONCEPTS.implementation) {
      concepts.push({
        id: slug(name),
        name,
        level: category === 'implementation' ? 'foundation' : 'practice',
        prereqs: ['repo-reading'],
        evidenceIds: pack.evidence
          .filter(item => item.metadata?.category === category)
          .slice(0, 3)
          .map(item => item.id)
      });
    }
  }

  for (const language of languages.slice(0, 3)) {
    concepts.push({
      id: slug(`${language} fluency`),
      name: `${language} fluency`,
      level: 'practice',
      prereqs: ['repo-reading'],
      evidenceIds: pack.evidence
        .filter(item => item.metadata?.language === language)
        .slice(0, 3)
        .map(item => item.id)
    });
  }

  concepts.push({
    id: 'contribution-judgment',
    name: 'Contribution judgment',
    level: 'transfer',
    prereqs: concepts.filter(item => item.level === 'practice').slice(0, 4).map(item => item.id),
    evidenceIds: pack.evidence.slice(0, 5).map(item => item.id)
  });

  const unique = new Map();
  for (const concept of concepts) {
    if (!unique.has(concept.id)) unique.set(concept.id, concept);
  }

  return [...unique.values()];
}

export function buildRoadmap(concepts) {
  return concepts.map((concept, index) => ({
    id: concept.id,
    title: concept.name,
    level: concept.level,
    order: index + 1,
    prereqs: concept.prereqs,
    mastery: index === 0 ? 0.2 : 0
  }));
}

export function buildObjectives(pack, concepts) {
  return concepts.slice(0, 8).map(concept => ({
    id: `obj-${concept.id}`,
    conceptId: concept.id,
    skill: concept.name,
    outcome: `Apply ${concept.name.toLowerCase()} using evidence from ${describeSource(pack.source)}.`,
    check: `Learner can identify, explain, and transfer ${concept.name.toLowerCase()}.`
  }));
}

function describeSource(source) {
  if (source.type === 'github-user') return `@${source.username}`;
  if (source.type === 'repo-user') return `${source.username} in ${source.repo}`;
  if (source.type === 'pr') return `${source.owner}/${source.repo}#${source.number}`;
  return 'the sample contribution set';
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
