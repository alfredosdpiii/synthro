const API_ROOT = 'https://api.github.com';

export function parsePullRequestLocator(locator) {
  const input = String(locator ?? '').trim();
  const urlMatch = input.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  const shortMatch = input.match(/^([^/\s]+)\/([^/\s]+)\/pull\/(\d+)$/i);
  const match = urlMatch ?? shortMatch;
  if (!match) {
    throw new Error(`Expected GitHub PR URL or owner/repo/pull/number, got: ${locator}`);
  }
  return { owner: match[1], repo: match[2], number: Number(match[3]) };
}

export async function githubJson(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_ROOT}${path}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'synthro'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers, ...options });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub request failed ${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

export async function collectPullRequest(locator) {
  const { owner, repo, number } = parsePullRequestLocator(locator);
  const base = `/repos/${owner}/${repo}`;
  const [pull, files, commits, reviews, comments, reviewComments] = await Promise.all([
    githubJson(`${base}/pulls/${number}`),
    githubJson(`${base}/pulls/${number}/files?per_page=100`),
    githubJson(`${base}/pulls/${number}/commits?per_page=100`),
    githubJson(`${base}/pulls/${number}/reviews?per_page=100`),
    githubJson(`${base}/issues/${number}/comments?per_page=100`),
    githubJson(`${base}/pulls/${number}/comments?per_page=100`)
  ]);

  return {
    source: {
      type: 'pr',
      locator,
      owner,
      repo,
      number,
      url: pull.html_url,
      fetchedAt: new Date().toISOString()
    },
    pull,
    files,
    commits,
    reviews,
    comments,
    reviewComments
  };
}

export async function collectGitHubUser(username, options = {}) {
  const limit = options.limit ?? 12;
  const encoded = encodeURIComponent(`author:${username} type:pr`);
  const search = await githubJson(`/search/issues?q=${encoded}&sort=updated&order=desc&per_page=${limit}`);
  const pullRefs = search.items.map(item => {
    const parsed = parsePullRequestLocator(item.html_url);
    return {
      ...parsed,
      title: item.title,
      url: item.html_url,
      state: item.state,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      labels: item.labels?.map(label => label.name) ?? []
    };
  });

  const details = [];
  for (const ref of pullRefs.slice(0, Math.min(limit, 6))) {
    try {
      const files = await githubJson(`/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}/files?per_page=30`);
      details.push({ ...ref, files });
    } catch {
      details.push({ ...ref, files: [] });
    }
  }

  return {
    source: {
      type: 'github-user',
      username,
      locator: username,
      fetchedAt: new Date().toISOString()
    },
    pullRefs,
    details
  };
}

export async function collectRepoUser(repoLocator, username, options = {}) {
  const limit = options.limit ?? 12;
  const repoMatch = String(repoLocator).match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!repoMatch) {
    throw new Error(`Expected repo as owner/repo, got: ${repoLocator}`);
  }
  const [, owner, repo] = repoMatch;
  const encoded = encodeURIComponent(`repo:${owner}/${repo} author:${username} type:pr`);
  const [repoInfo, search] = await Promise.all([
    githubJson(`/repos/${owner}/${repo}`),
    githubJson(`/search/issues?q=${encoded}&sort=updated&order=desc&per_page=${limit}`)
  ]);

  const pullRefs = search.items.map(item => ({
    ...parsePullRequestLocator(item.html_url),
    title: item.title,
    url: item.html_url,
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    labels: item.labels?.map(label => label.name) ?? []
  }));

  const details = [];
  for (const ref of pullRefs.slice(0, Math.min(limit, 6))) {
    try {
      const files = await githubJson(`/repos/${owner}/${repo}/pulls/${ref.number}/files?per_page=50`);
      details.push({ ...ref, files });
    } catch {
      details.push({ ...ref, files: [] });
    }
  }

  return {
    source: {
      type: 'repo-user',
      repo: `${owner}/${repo}`,
      username,
      locator: `${owner}/${repo}:${username}`,
      fetchedAt: new Date().toISOString()
    },
    repoInfo,
    pullRefs,
    details
  };
}
