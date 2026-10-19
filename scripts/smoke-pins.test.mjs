import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SMOKE_INSTALL_FLAGS, SMOKE_PACKAGE_MANAGERS, SMOKE_PINS, pinnedSpecs } from './smoke-pins.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const MANIFESTS = ['package.json', 'apps/gallery/package.json', 'packages/react/package.json'];
const FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'];

const parts = (version) => version.split('.').map(Number);
const atLeast = (version, base) => {
  const [a, b] = [parts(version), parts(base)];
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};
// The repo declares only caret ranges on a 1.0+ major, so that is all this needs to understand.
const satisfiesCaret = (version, range) => {
  const base = /^\^(\d+\.\d+\.\d+)$/.exec(range)?.[1];
  assert.ok(base && parts(base)[0] > 0, `unsupported range ${range}`);
  return parts(version)[0] === parts(base)[0] && atLeast(version, base);
};

const declaredRanges = (name) =>
  MANIFESTS.flatMap((file) => {
    const pkg = JSON.parse(read(file));
    return FIELDS.map((field) => pkg[field]?.[name]).filter(Boolean).map((range) => ({ file, range }));
  });

test('smoke pins: every pin is an exact version', () => {
  for (const [name, version] of Object.entries(SMOKE_PINS)) assert.match(version, /^\d+\.\d+\.\d+$/, name);
});

test('smoke pins: the tarball also installs with pnpm and Yarn 4, each at an exact version', () => {
  assert.deepEqual(Object.keys(SMOKE_PACKAGE_MANAGERS), ['pnpm', 'yarn']);
  for (const [name, version] of Object.entries(SMOKE_PACKAGE_MANAGERS)) assert.match(version, /^\d+\.\d+\.\d+$/, name);
  assert.equal(parts(SMOKE_PACKAGE_MANAGERS.yarn)[0], 4, 'yarn is Yarn 4 (Berry), whose Plug’n’Play install is the strict one');
});

test('smoke pins: every pin sits inside each range the repo declares for that package', () => {
  for (const [name, version] of Object.entries(SMOKE_PINS)) {
    const ranges = declaredRanges(name);
    assert.ok(ranges.length > 0, `${name} is pinned for the smoke test but no repo package.json declares it`);
    for (const { file, range } of ranges) assert.ok(satisfiesCaret(version, range), `${name}@${version} is outside ${range} in ${file}`);
  }
});

test('smoke pins: the range check rejects a pin from another major or below the range', () => {
  assert.equal(satisfiesCaret('7.3.6', '^7.1.0'), true);
  assert.equal(satisfiesCaret('8.0.0', '^7.1.0'), false);
  assert.equal(satisfiesCaret('7.0.9', '^7.1.0'), false);
});

test('smoke pins: installs never run lifecycle scripts and save exact versions', () => {
  assert.ok(SMOKE_INSTALL_FLAGS.includes('--ignore-scripts'));
  assert.ok(SMOKE_INSTALL_FLAGS.includes('--save-exact'));
});

test('smoke pins: pinnedSpecs gives name@version and refuses an unpinned name', () => {
  assert.deepEqual(pinnedSpecs(['vite', '@types/react']), [`vite@${SMOKE_PINS.vite}`, `@types/react@${SMOKE_PINS['@types/react']}`]);
  assert.throws(() => pinnedSpecs(['left-pad']), /no pinned version for left-pad/);
});

test('smoke consumer: every npm install goes through the pinned installer, and npx fetches only the pinned pnpm and yarn', () => {
  const source = read('scripts/smoke-consumer.mjs');
  const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/npm install failed/g, '');
  assert.equal(code.match(/\bnpm (install|i|add|ci)\b/g)?.length, 1, 'one npm install command, inside installPinned');
  assert.match(source, /\['npm install', \.\.\.SMOKE_INSTALL_FLAGS,/);
  const calls = [...source.matchAll(/(?:runLoudly\('npx[^']*'|spawn\('npx', \[[^\]]*\])/g)].map((m) => m[0]);
  assert.equal(calls.length, 4, 'vite build, the global-stylesheet vite build, vite preview and tsc');
  for (const call of calls) assert.match(call, /npx(?:', \['| )--no(?:', '| )--/, `npx must never install: ${call}`);
  // The two npx runs that may fetch: pnpm and Yarn 4, each at its exact SMOKE_PACKAGE_MANAGERS version.
  assert.deepEqual(code.match(/npx --yes [^`]*/g), [
    'npx --yes pnpm@${SMOKE_PACKAGE_MANAGERS.pnpm}',
    'npx --yes --package @yarnpkg/cli-dist@${SMOKE_PACKAGE_MANAGERS.yarn} -- yarn',
  ]);
  assert.match(code, /\$\{pnpm\} add --ignore-scripts /, 'pnpm installs with no lifecycle scripts');
  assert.match(code, /YARN_ENABLE_SCRIPTS: 'false'/, 'yarn installs with no lifecycle scripts');
});
