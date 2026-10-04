import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVersionsFile } from './versions.mjs';

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
