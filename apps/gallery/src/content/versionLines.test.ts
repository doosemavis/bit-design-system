import { describe, expect, it } from 'vitest';
import { isRelease, lineOf, newestPerLine, pathForLine, SITE_BASE } from './versionLines.mjs';

describe('release lines', () => {
  it.each([['0.1.0', '0.1'], ['0.1.13', '0.1'], ['0.10.2', '0.10'], ['1.0.0', '1'], ['1.4.9', '1'], ['2.0.0', '2']])('lineOf(%s) is %s', (v, l) =>
    expect(lineOf(v)).toBe(l));
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
