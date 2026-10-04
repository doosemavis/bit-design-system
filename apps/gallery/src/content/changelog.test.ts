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
});
