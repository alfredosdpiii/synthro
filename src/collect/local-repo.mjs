import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function git(args, cwd) {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd, timeout: 5000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

export async function collectLocalRepoContext(cwd = process.cwd()) {
  const [root, branch, remote, status, head] = await Promise.all([
    git(['rev-parse', '--show-toplevel'], cwd),
    git(['branch', '--show-current'], cwd),
    git(['remote', 'get-url', 'origin'], cwd),
    git(['status', '--short'], cwd),
    git(['rev-parse', '--short', 'HEAD'], cwd)
  ]);

  if (!root) {
    return { available: false, cwd };
  }

  return {
    available: true,
    root,
    branch,
    remote,
    head,
    statusLines: status ? status.split('\n') : []
  };
}
