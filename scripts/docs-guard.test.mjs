// Runs the docs-check guard's own shell (release.yml) in scratch git repos: a docs-only or test-only
// change deploys the site, a packages/ change waits for the next release.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

const release = () => parse(readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'));
const runOf = (step) => String(step?.run ?? '');
const docsGuard = () => release().jobs['docs-check'].steps.find((s) => s.id === 'released');

// Runs the guard's own shell in a scratch repo: a docs-only change deploys, a packages/ change skips.
const runGuard = (repo) => {
  const output = join(repo, 'github-output');
  writeFileSync(output, '');
  // Stricter than GitHub's default `bash -e`, so a pipeline that fails on no tags is caught.
  const stdout = execFileSync('bash', ['-eo', 'pipefail', '-c', runOf(docsGuard())], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_OUTPUT: output },
  });
  return { stdout, output: readFileSync(output, 'utf8') };
};

const scratchRepo = () => {
  const repo = mkdtempSync(join(tmpdir(), 'bit-docs-guard-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
  const commit = (file, text) => {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), text);
    git('add', '-A');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', 'commit', '-qm', file);
  };
  git('init', '-q');
  return { repo, git, commit };
};

test('release: the docs guard script deploys after a docs change and waits after a packages/ change', () => {
  const { repo, git, commit } = scratchRepo();
  try {
    commit('packages/react/a.ts', '1');
    const none = runGuard(repo);
    assert.match(none.output, /^deploy=false$/m, 'no release tag yet');
    assert.ok(none.stdout.includes('::notice::no release tag yet'), none.stdout);
    git('tag', 'v0.1.0');
    commit('packages/react/a.ts', '2');
    git('tag', 'v0.2.0-rc.1'); // a pre-release never counts as the latest release
    commit('apps/gallery/page.tsx', 'docs');
    const changed = runGuard(repo);
    assert.match(changed.output, /^deploy=false$/m, 'packages/ changed since v0.1.0');
    assert.ok(changed.stdout.includes('::notice::packages/ changed since v0.1.0; docs deploy waits for the next release'));
    git('tag', 'v0.2.0', 'HEAD~1');
    assert.match(runGuard(repo).output, /^deploy=true$/m, 'only docs changed since v0.2.0');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('release: the docs guard script ignores test-only changes under packages/ but not src changes', () => {
  const { repo, git, commit } = scratchRepo();
  try {
    commit('packages/react/src/Button.tsx', '1');
    git('tag', 'v0.1.0');
    const testOnly = [
      'packages/react/src/Button.test.tsx',
      'packages/core/src/__tests__/tokens.test.ts',
      'packages/react/src/test/setup.ts',
      'packages/react/vitest.config.ts',
      'packages/react/scripts/verify-dist.mjs',
      'packages/react/scripts/expected-exports.mjs',
    ];
    for (const file of testOnly) {
      commit(file, 'changed');
      assert.match(runGuard(repo).output, /^deploy=true$/m, `${file} is test-only: docs still deploy`);
    }
    commit('packages/react/scripts/build-css.mjs', 'x');
    assert.match(runGuard(repo).output, /^deploy=false$/m, 'another packages/ script still skips');
    git('tag', 'v0.1.1');
    commit('packages/react/src/Button.tsx', '2');
    const skipped = runGuard(repo);
    assert.match(skipped.output, /^deploy=false$/m, 'a src change still skips');
    assert.ok(skipped.stdout.includes('::notice::packages/ changed since v0.1.1'), skipped.stdout);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
