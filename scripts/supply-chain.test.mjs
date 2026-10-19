// Repo-level supply-chain settings: npm runs no dependency's install script, the Dependabot
// config and the secret-file ignores (security.md C1, C7, D2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('npm: no dependency may run an install script, and the committed .npmrc holds nothing else', () => {
  // The one .npmrc the repo commits. Only ignore-scripts may be in it, so a registry token never is.
  const settings = readFileSync(new URL('../.npmrc', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  assert.deepEqual(settings, ['ignore-scripts=true']);
});

test('npm: the repo is one npm workspace, with no pnpm settings or files left behind', () => {
  const pkg = readJson('package.json');
  assert.deepEqual(pkg.workspaces, ['packages/*', 'apps/*']);
  assert.match(pkg.packageManager, /^npm@\d+\.\d+\.\d+$/);
  assert.equal(pkg.pnpm, undefined, 'pnpm settings in package.json would do nothing under npm');
  const tracked = execFileSync('git', ['ls-files', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'yarn.lock', 'package-lock.json'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
  assert.deepEqual(tracked.split('\n').filter(Boolean), ['package-lock.json'], 'package-lock.json is the one lockfile');
});

// --- dependabot.yml ------------------------------------------------------------------------
test('dependabot: weekly npm and github-actions updates, dev dependencies grouped, no automatic React major', () => {
  const config = parse(readFileSync(new URL('../.github/dependabot.yml', import.meta.url), 'utf8'));
  assert.equal(config.version, 2);
  const byEcosystem = Object.fromEntries(config.updates.map((u) => [u['package-ecosystem'], u]));
  assert.deepEqual(Object.keys(byEcosystem).sort(), ['github-actions', 'npm']);
  for (const update of config.updates) {
    assert.equal(update.directory, '/');
    assert.equal(update.schedule.interval, 'weekly');
  }
  const { npm } = byEcosystem;
  assert.deepEqual(Object.values(npm.groups).map((g) => g['dependency-type']), ['development']);
  const majorIgnored = new Set(
    npm.ignore.filter((i) => i['update-types']?.includes('version-update:semver-major')).map((i) => i['dependency-name']),
  );
  for (const peer of ['react', 'react-dom']) assert.ok(majorIgnored.has(peer), `${peer} majors are never automatic`);
  // TypeScript 7 drops the JS API tsup and typescript-eslint need; @types/node tracks the Node major CI runs.
  for (const tool of ['typescript', '@types/node']) assert.ok(majorIgnored.has(tool), `${tool} majors move by hand`);
  assert.ok(npm.ignore.every((i) => Array.isArray(i['update-types'])), 'only majors are ignored, never a whole package');
});

test('dependabot: every update waits 7 days after a release, so a hijacked version is usually pulled first', () => {
  const config = parse(readFileSync(new URL('../.github/dependabot.yml', import.meta.url), 'utf8'));
  for (const update of config.updates) assert.deepEqual(update.cooldown, { 'default-days': 7 }, update['package-ecosystem']);
});

test('gitignore: env files, keys, deploy and registry credentials are ignored; .env.example is not', () => {
  const ignored = (path) => {
    try {
      execFileSync('git', ['check-ignore', '-q', path], { cwd: new URL('..', import.meta.url) });
      return true;
    } catch (error) {
      // check-ignore exits 1 for "not ignored"; anything else is a git error worth seeing.
      if (error.status === 1) return false;
      throw error;
    }
  };
  for (const path of ['.env', '.env.local', 'apps/gallery/.env.production', 'key.pem', 'certs/server.key', '.vercel/project.json', 'packages/react/.npmrc', 'apps/gallery/.npmrc']) {
    assert.ok(ignored(path), path);
  }
  assert.equal(ignored('.env.example'), false, '.env.example stays committable');
  // The root .npmrc is committed on purpose; the test above keeps it to ignore-scripts.
  assert.equal(ignored('.npmrc'), false, 'the root .npmrc stays committable');
});
