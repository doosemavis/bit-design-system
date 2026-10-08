// releaseNotes pulls one version's section out of CHANGELOG.md for its GitHub Release.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { releaseNotes } from './release-notes.mjs';

const SAMPLE = `# Changelog

## 0.2.0 — 2026-02-01
### Added
- New thing

## 0.1.1 — 2026-01-15
### Breaking
- Renamed a prop
### Fixed
- A bug

## 0.1.0 — 2026-01-01
### Added
- First release
`;

test('releaseNotes extracts a middle section exactly, subsections kept', () => {
  assert.equal(releaseNotes(SAMPLE, '0.1.1'), '### Breaking\n- Renamed a prop\n### Fixed\n- A bug');
});

test('releaseNotes extracts the first and the last section', () => {
  assert.equal(releaseNotes(SAMPLE, '0.2.0'), '### Added\n- New thing');
  assert.equal(releaseNotes(SAMPLE, '0.1.0'), '### Added\n- First release');
});

test('releaseNotes throws for a version the CHANGELOG does not have', () => {
  assert.throws(() => releaseNotes(SAMPLE, '9.9.9'), /no "## 9\.9\.9/);
  assert.throws(() => releaseNotes(SAMPLE, '0.1'), /no "## 0\.1/);
});

test('the real CHANGELOG yields notes for 0.1.6', () => {
  const notes = releaseNotes(readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'), '0.1.6');
  assert.match(notes, /Icon/);
});
