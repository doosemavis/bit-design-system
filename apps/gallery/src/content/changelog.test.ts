import { describe, expect, it } from 'vitest';
import { parseChangelog, RELEASES } from './changelog';
import pkg from '../../../../packages/react/package.json';

const sample = `# Changelog\n\n## 0.1.1 — 2026-10-10\n### Added\n- Versions page.\n### Fixed\n- \`Code\` in tables.\n\n## 0.1.0 — 2026-10-04\n### Added\n- First release.\n`;

describe('parseChangelog', () => {
  it('reads releases newest first with their sections', () => {
    expect(parseChangelog(sample)).toEqual([
      { version: '0.1.1', date: '2026-10-10', sections: { Added: ['Versions page.'], Fixed: ['`Code` in tables.'] } },
      { version: '0.1.0', date: '2026-10-04', sections: { Added: ['First release.'] } },
    ]);
  });
  it('rejects a malformed release heading', () => {
    expect(() => parseChangelog('## next\n')).toThrow('CHANGELOG: bad heading "## next"');
  });
  it('ignores unknown section names rather than guessing', () => {
    expect(parseChangelog('## 1.0.0 — 2027-01-01\n### Misc\n- x\n')[0]!.sections).toEqual({});
  });
  it('the repo CHANGELOG has an entry for the package version (release gate)', () => {
    expect(RELEASES.map((r) => r.version)).toContain(pkg.version);
  });
  it('the newest CHANGELOG entry is the package version', () => {
    expect(RELEASES[0]?.version).toBe(pkg.version);
  });
  it('CHANGELOG versions strictly descend by numeric semver', () => {
    const key = (v: string) => v.split('.').map(Number);
    const versions = RELEASES.map((r) => r.version);
    for (let i = 1; i < versions.length; i++) {
      const [a, b] = [key(versions[i - 1]!), key(versions[i]!)];
      const cmp = a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]!;
      expect(cmp, `${versions[i - 1]} must come after ${versions[i]}`).toBeGreaterThan(0);
    }
  });
  it('parses CRLF line endings the same as LF', () => {
    expect(parseChangelog(sample.replace(/\n/g, '\r\n'))).toEqual(parseChangelog(sample));
  });
});
