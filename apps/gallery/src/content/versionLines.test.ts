import { describe, expect, it } from 'vitest';
import { compareLines, isRelease, isVersionsFile, lineOf, newestPerLine, ownPathOf, pathForLine, SITE_BASE } from './versionLines.mjs';

describe('release lines', () => {
  it.each([['0.1.0', '0.1'], ['0.1.13', '0.1'], ['0.10.2', '0.10'], ['1.0.0', '1'], ['1.4.9', '1'], ['2.0.0', '2']])('lineOf(%s) is %s', (v, l) =>
    expect(lineOf(v)).toBe(l));
  it('throws on a non-release', () => {
    expect(() => lineOf('1.0.0-rc.1')).toThrow('lineOf: not a release "1.0.0-rc.1"');
  });
  it('ignores pre-releases and non-semver', () => {
    expect(isRelease('1.0.0-rc.1')).toBe(false);
    expect(isRelease('next')).toBe(false);
    expect(isRelease('0.1.1')).toBe(true);
  });
  it('keeps the newest patch per line, newest line first (numeric, not string, order)', () => {
    expect(newestPerLine(['0.1.0', '0.1.1', '0.2.0', '0.10.0', '0.9.4', '1.0.0-rc.1'])).toEqual([
      { line: '0.10', version: '0.10.0' }, { line: '0.9', version: '0.9.4' }, { line: '0.2', version: '0.2.0' }, { line: '0.1', version: '0.1.1' },
    ]);
  });
  it('crosses 1.0 into major lines', () => {
    expect(newestPerLine(['0.9.4', '1.0.0', '1.2.3', '2.0.0']).map((e) => `${e.line}=${e.version}`)).toEqual(['2=2.0.0', '1=1.2.3', '0.9=0.9.4']);
  });
  it('puts the latest line at the root and older lines under v<line>/', () => {
    expect(pathForLine('0.2', '0.2')).toBe(SITE_BASE);
    expect(pathForLine('0.1', '0.2')).toBe('/bit-design-system/v0.1/');
  });
});

describe('compareLines', () => {
  it('orders numerically across minors and majors', () => {
    expect(compareLines('0.9', '0.10')).toBeLessThan(0);
    expect(compareLines('0.10', '0.9')).toBeGreaterThan(0);
    expect(compareLines('0.10', '1')).toBeLessThan(0);
    expect(compareLines('2', '1')).toBeGreaterThan(0);
    expect(compareLines('0.1', '0.1')).toBe(0);
  });
});

// The one contract for versions.json: scripts/versions.mjs writes it, build-versioned-site.mjs checks
// it, and the gallery reads it. `latest` is a line ('0.2'), the same as the root entry's line.
const entry = (line: string, version: string, path: string) => ({ line, version, date: '2026-10-04', path, react: '^19.0.0', reactDom: '^19.0.0' });
const GOOD = { latest: '0.2', lines: [entry('0.2', '0.2.0', '/bit-design-system/'), entry('0.1', '0.1.3', '/bit-design-system/v0.1/')] };

describe('isVersionsFile', () => {
  it('accepts what versions.mjs writes', () => expect(isVersionsFile(GOOD)).toBe(true));
  it('accepts the as-older rehearsal: two entries on one line, at different paths', () =>
    expect(isVersionsFile({ latest: '0.1', lines: [entry('0.1', '0.1.0', SITE_BASE), entry('0.1', '0.1.0', '/bit-design-system/v0.1/')] })).toBe(true));
  it('accepts major lines', () => expect(isVersionsFile({ latest: '1', lines: [entry('1', '1.2.3', SITE_BASE), entry('0.9', '0.9.4', '/bit-design-system/v0.9/')] })).toBe(true));
  it.each([
    ['null', null],
    ['an array', [GOOD]],
    ['a version as latest', { ...GOOD, latest: '0.2.0' }],
    ['a latest no entry has', { ...GOOD, latest: '0.3' }],
    ['a latest that is not the root entry\'s line', { ...GOOD, latest: '0.1' }],
    ['no lines', { latest: '0.2', lines: [] }],
    ['lines not an array', { latest: '0.2', lines: {} }],
    ['a null entry', { ...GOOD, lines: [...GOOD.lines, null] }],
    ['a bad line', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], line: 'v0.1' }] }],
    ['a pre-release version', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], version: '0.1.3-rc.1' }] }],
    ['a missing date', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], date: undefined }] }],
    ['a numeric react', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], react: 19 }] }],
    ['a missing reactDom', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], reactDom: undefined }] }],
    ['a javascript: path', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], path: 'javascript:alert(1)' }] }],
    ['a path on another origin', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], path: '//evil.example/bit-design-system/' }] }],
    ['a path that climbs out', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], path: '/bit-design-system/../x/' }] }],
    ['duplicate paths', { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[1], path: SITE_BASE }] }],
    ['no root entry', { ...GOOD, lines: [{ ...GOOD.lines[0], path: '/bit-design-system/v0.2/' }, GOOD.lines[1]] }],
  ])('rejects %s', (_name, value) => expect(isVersionsFile(value)).toBe(false));
});

describe('ownPathOf', () => {
  it.each([
    ['/bit-design-system/', SITE_BASE],
    ['/bit-design-system/index.html', SITE_BASE],
    ['/bit-design-system/v0.1/', '/bit-design-system/v0.1/'],
    ['/bit-design-system/v0.1/index.html', '/bit-design-system/v0.1/'],
    ['/bit-design-system/v12/', '/bit-design-system/v12/'],
  ])('%s belongs to the copy at %s', (pathname, path) => expect(ownPathOf(pathname)).toBe(path));
  it.each([['/'], ['/elsewhere/'], [''], [undefined]])('%s is outside the site: null', (pathname) => expect(ownPathOf(pathname as string)).toBeNull());
});
