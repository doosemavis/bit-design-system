import { describe, expect, it } from 'vitest';
import type { VersionsFile } from '../../content/versionLines.mjs';
import { buildRows, newerBreaking } from './versionRows';

const ROOT = '/bit-design-system/';
const V01 = '/bit-design-system/v0.1/';
const entry = (line: string, version: string, path: string) => ({ line, version, date: '', path, react: '^19.0.0', reactDom: '^19.0.0' });
const CURRENT = { line: '0.1', version: '0.1.0', react: '^19.0.0', reactDom: '^19.0.0' };
const FILE: VersionsFile = {
  latest: '0.2',
  lines: [{ ...entry('0.2', '0.2.0', ROOT), breaking: [{ version: '0.2.0', items: ['A.'] }] }, entry('0.1', '0.1.0', V01)],
};

describe('buildRows', () => {
  it('makes one row per entry, Latest at the root and Viewing at this copy', () => {
    expect(buildRows(FILE, V01, CURRENT).map((r) => [r.version, r.latest, r.viewing])).toEqual([
      ['0.2.0', true, false],
      ['0.1.0', false, true],
    ]);
  });
  it('falls back to the current build alone, viewing, when there is no file', () => {
    expect(buildRows(null, V01, CURRENT)).toEqual([{ path: V01, ...CURRENT, latest: false, viewing: true }]);
  });
});

describe('newerBreaking', () => {
  it('lists the breaking releases of lines newer than this copy', () => {
    expect(newerBreaking(FILE, V01, '0.1')).toEqual([{ version: '0.2.0', items: ['A.'] }]);
  });
  it('is empty on the latest copy and without a file', () => {
    expect(newerBreaking(FILE, ROOT, '0.2')).toEqual([]);
    expect(newerBreaking(null, V01, '0.1')).toEqual([]);
  });
  it('uses this copy\'s entry over the build line: the as-older copy shares the latest line', () => {
    const asOlder: VersionsFile = { latest: '0.1', lines: [{ ...entry('0.1', '0.1.1', ROOT), breaking: [{ version: '0.1.1', items: ['x'] }] }, entry('0.1', '0.1.0', V01)] };
    expect(newerBreaking(asOlder, V01, '0.0')).toEqual([]);
  });
});
