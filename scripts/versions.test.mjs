import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isVersionsFile } from '../apps/gallery/src/content/versionLines.mjs';
import { buildVersionsFile, parseChangelog, readRepoInputs, stripV, writeVersionsFile } from './versions.mjs';

const readPackageJson = () => ({ peerDependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' } });

test('one line for 0.1.0 and 0.1.1, pointing at the newest patch at the root', () =>
  assert.deepEqual(
    buildVersionsFile({ tags: ['v0.1.0', 'v0.1.1'], readPackageJson, changelogDates: { '0.1.1': '2026-10-10', '0.1.0': '2026-10-04' } }),
    { latest: '0.1', lines: [{ line: '0.1', version: '0.1.1', date: '2026-10-10', path: '/bit-design-system/', react: '^19.0.0', reactDom: '^19.0.0' }] },
  ));

test('an older line moves under v<line>/', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0', 'v0.1.1', 'v0.2.0'], readPackageJson, changelogDates: {} });
  assert.equal(file.latest, '0.2');
  assert.deepEqual(file.lines.map((l) => [l.line, l.version, l.path]), [
    ['0.2', '0.2.0', '/bit-design-system/'],
    ['0.1', '0.1.1', '/bit-design-system/v0.1/'],
  ]);
});

test('a missing changelog date is an empty string, not an error', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0'], readPackageJson, changelogDates: {} });
  assert.equal(file.lines[0].date, '');
});

test('asOlder adds an older entry on the same line, after the latest', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0'], current: '0.1.1', readPackageJson, changelogDates: {}, asOlder: 'v0.1.0' });
  assert.equal(file.lines.length, 2);
  assert.equal(file.lines[0].version, '0.1.1');
  assert.equal(file.lines[0].path, '/bit-design-system/');
  assert.equal(file.lines[1].line, '0.1');
  assert.equal(file.lines[1].version, '0.1.0');
  assert.equal(file.lines[1].path, '/bit-design-system/v0.1/');
});

test('pre-release tags are ignored (v1.0.0-rc.1 never makes a line)', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0', 'v0.1.1', 'v1.0.0-rc.1', 'v1.0.0'], readPackageJson, changelogDates: {} });
  assert.deepEqual(file.lines.map((l) => `${l.line}=${l.version}`), ['1=1.0.0', '0.1=0.1.1']);
});

test('the peer ranges come from each chosen tag', () => {
  const seen = [];
  buildVersionsFile({ tags: ['v0.1.0', 'v0.2.0'], readPackageJson: (t) => (seen.push(t), { peerDependencies: {} }), changelogDates: {} });
  assert.deepEqual(seen.sort(), ['v0.1.0', 'v0.2.0']);
});

test('asOlder is skipped when a real older entry already owns its path', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0', 'v0.1.1', 'v0.2.0'], readPackageJson, changelogDates: {}, asOlder: 'v0.1.0' });
  assert.deepEqual(file.lines.map((l) => [l.version, l.path]), [
    ['0.2.0', '/bit-design-system/'],
    ['0.1.1', '/bit-design-system/v0.1/'],
  ]);
});

test('asOlder on the latest line gives the latest at the root and the older at v<line>/', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0'], current: '0.1.1', readPackageJson, changelogDates: {}, asOlder: 'v0.1.0' });
  assert.deepEqual(file.lines.map((l) => [l.version, l.path]), [
    ['0.1.1', '/bit-design-system/'],
    ['0.1.0', '/bit-design-system/v0.1/'],
  ]);
});

test('asOlder is deduped by path only: the same version as the root still gets its v<line>/ copy', () => {
  // The docs-only state: package.json and the newest tag are both 0.1.0. The PR rehearsal archives
  // v0.1.0 at v0.1/, so versions.json must list that copy for the picker to reach it.
  const file = buildVersionsFile({ tags: ['v0.1.0'], current: '0.1.0', readPackageJson, changelogDates: {}, asOlder: 'v0.1.0' });
  assert.equal(file.latest, '0.1');
  assert.deepEqual(file.lines.map((l) => [l.line, l.version, l.path]), [
    ['0.1', '0.1.0', '/bit-design-system/'],
    ['0.1', '0.1.0', '/bit-design-system/v0.1/'],
  ]);
});

test('a non-release asOlder throws a clear error', () =>
  assert.throws(
    () => buildVersionsFile({ tags: ['v0.1.0'], readPackageJson, changelogDates: {}, asOlder: 'v1.0.0-rc.1' }),
    /--as-older: not a release tag "v1\.0\.0-rc\.1"/,
  ));

test('current equal to a tagged version gives a single entry', () => {
  const file = buildVersionsFile({ tags: ['v0.1.0'], current: '0.1.0', readPackageJson, changelogDates: {} });
  assert.equal(file.lines.length, 1);
});

test('no tags, current only: one root entry', () => {
  const file = buildVersionsFile({ tags: [], current: '0.1.0', readPackageJson, changelogDates: {} });
  assert.deepEqual(file.lines.map((l) => [l.line, l.version, l.path]), [['0.1', '0.1.0', '/bit-design-system/']]);
});

test('parseChangelog reads dated headings (em dash or hyphen, trailing spaces ok) and skips others', () => {
  const text = '# Changelog\n\n## 0.1.1 — 2026-10-XX\n\n## 0.1.0 - 2026-10-04  \r\n\n## [0.0.9] — 2026-09-01\n\n## 0.0.8 — 2026-08-01\n';
  assert.deepEqual(parseChangelog(text).dates, { '0.1.0': '2026-10-04', '0.0.8': '2026-08-01' });
});

test('parseChangelog collects each release\'s Breaking items, and only those', () => {
  const text = [
    '# Changelog',
    '## 0.2.0 — 2026-11-01',
    '### Breaking',
    '- `Button` lost `size`.',
    '- Second. ',
    '### Added',
    '- Not breaking.',
    '## 0.1.1 — 2026-10-10',
    '### Fixed',
    '- A fix.',
    '## 0.1.0 — 2026-10-04',
    '### Breaking',
    '- Old one.',
  ].join('\n');
  assert.deepEqual(parseChangelog(text).breakingByVersion, { '0.2.0': ['`Button` lost `size`.', 'Second.'], '0.1.0': ['Old one.'] });
});

test('stripV drops one leading v', () => {
  assert.equal(stripV('v0.1.0'), '0.1.0');
  assert.equal(stripV('0.1.0'), '0.1.0');
});

test('each line entry lists its releases with Breaking items, newest first, and omits the field when none', () => {
  const file = buildVersionsFile({
    tags: ['v0.1.0', 'v0.1.1', 'v0.2.0', 'v0.2.1', 'v0.2.2'],
    readPackageJson,
    breakingByVersion: { '0.2.0': ['A.'], '0.2.2': ['B.', 'C.'], '0.2.1': [], '0.1.1': [] },
  });
  assert.deepEqual(file.lines[0].breaking, [
    { version: '0.2.2', items: ['B.', 'C.'] },
    { version: '0.2.0', items: ['A.'] },
  ]);
  assert.equal('breaking' in file.lines[1], false, 'no Breaking items in 0.1: no field');
  assert.equal(isVersionsFile(file), true);
});

test('a line entry lists only releases up to its own version (a CHANGELOG entry ahead of the tags is not shown)', () => {
  const file = buildVersionsFile({ tags: ['v0.2.0'], readPackageJson, breakingByVersion: { '0.2.0': ['A.'], '0.2.1': ['Unreleased.'], 'next': ['x'] } });
  assert.deepEqual(file.lines[0].breaking, [{ version: '0.2.0', items: ['A.'] }]);
});

// A real (temporary) git repository: tags, package.json at each tag, and the CHANGELOG at HEAD.
const git = (cwd, ...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args], { cwd, stdio: 'pipe' });
const commitRelease = (dir, version, changelog) => {
  writeFileSync(join(dir, 'packages/react/package.json'), JSON.stringify({ version, peerDependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' } }));
  writeFileSync(join(dir, 'CHANGELOG.md'), changelog);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', `release ${version}`);
  git(dir, 'tag', `v${version}`);
};

test('readRepoInputs: a Breaking section in a newer line reaches versions.json; unmerged tags are ignored', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bit-versions-repo-'));
  try {
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'config', 'user.email', 'test@example.com');
    git(dir, 'config', 'user.name', 'test');
    mkdirSync(join(dir, 'packages/react'), { recursive: true });
    commitRelease(dir, '0.1.0', '# Changelog\n\n## 0.1.0 — 2026-10-04\n### Added\n- First.\n');
    // A tag on a branch that never reached HEAD: `--merged HEAD` must leave it out.
    git(dir, 'checkout', '-qb', 'side');
    commitRelease(dir, '0.9.0', '# Changelog\n\n## 0.9.0 — 2026-12-01\n');
    git(dir, 'checkout', '-q', 'main');
    commitRelease(dir, '0.2.0', '# Changelog\n\n## 0.2.0 — 2026-11-01\n### Breaking\n- `Button` lost `size`.\n\n## 0.1.0 — 2026-10-04\n### Added\n- First.\n');

    const inputs = readRepoInputs(dir);
    assert.deepEqual([...inputs.tags].sort(), ['v0.1.0', 'v0.2.0']);
    const out = join(dir, 'out/versions.json');
    writeVersionsFile(out, buildVersionsFile(inputs));
    const file = JSON.parse(readFileSync(out, 'utf8'));
    assert.equal(isVersionsFile(file), true);
    assert.deepEqual(file.lines.map((l) => [l.line, l.date, l.breaking]), [
      ['0.2', '2026-11-01', [{ version: '0.2.0', items: ['`Button` lost `size`.'] }]],
      ['0.1', '2026-10-04', undefined],
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
