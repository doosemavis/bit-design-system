import { describe, expect, it } from 'vitest';
import { CHANGE_KINDS, isStrictlyDescending, parseChangelog, RELEASES, releaseGateProblem } from './changelog';
import pkg from '../../../../packages/react/package.json';

const sample = `# Changelog\n\n## 0.1.1 — 2026-10-10\n### Added\n- Versions page.\n### Fixed\n- \`Code\` in tables.\n\n## 0.1.0 — 2026-10-04\n### Added\n- First release.\n`;
const versionsOf = (text: string) => parseChangelog(text).map((r) => r.version);

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
  it('accepts a hyphen for the dash, and trailing spaces after a heading', () => {
    expect(parseChangelog('## 0.1.0 - 2026-10-04 \n### Added  \n- x\n')).toEqual([{ version: '0.1.0', date: '2026-10-04', sections: { Added: ['x'] } }]);
  });
  it('ignores unknown section names rather than guessing', () => {
    expect(parseChangelog('## 1.0.0 — 2027-01-01\n### Misc\n- x\n')[0]!.sections).toEqual({});
  });
  it('parses CRLF line endings the same as LF', () => {
    expect(parseChangelog(sample.replace(/\n/g, '\r\n'))).toEqual(parseChangelog(sample));
  });
  it('CHANGE_KINDS lists every section, in display order', () => {
    expect(CHANGE_KINDS).toEqual(['Breaking', 'Added', 'Changed', 'Fixed', 'Removed']);
  });
});

describe('isStrictlyDescending', () => {
  it('is true for newest first, and for zero or one version', () => {
    expect(isStrictlyDescending(['0.10.0', '0.9.1', '0.1.0'])).toBe(true);
    expect(isStrictlyDescending([])).toBe(true);
    expect(isStrictlyDescending(['0.1.0'])).toBe(true);
  });
});

// The release gates, each tried against a crafted CHANGELOG that must fail it.
describe('releaseGateProblem', () => {
  it('passes a CHANGELOG whose newest entry is the package version, in strict order', () => {
    expect(releaseGateProblem(parseChangelog(sample), '0.1.1')).toBeNull();
  });
  it('fails entries out of order (0.1.0 above 0.1.1)', () => {
    const text = '## 0.1.0 — 2026-10-04\n\n## 0.1.1 — 2026-10-10\n';
    expect(versionsOf(text)).toEqual(['0.1.0', '0.1.1']);
    expect(releaseGateProblem(parseChangelog(text), '0.1.0')).toBe('CHANGELOG versions must strictly descend: 0.1.0, 0.1.1');
  });
  it('fails a duplicate version', () => {
    const text = '## 0.1.1 — 2026-10-10\n\n## 0.1.1 — 2026-10-09\n\n## 0.1.0 — 2026-10-04\n';
    expect(releaseGateProblem(parseChangelog(text), '0.1.1')).toMatch(/strictly descend/);
  });
  it('fails a top entry that is not the package version', () => {
    expect(releaseGateProblem(parseChangelog(sample), '0.1.0')).toBe('the newest CHANGELOG entry is 0.1.1, not the package version 0.1.0');
    expect(releaseGateProblem([], '0.1.0')).toBe('the newest CHANGELOG entry is none, not the package version 0.1.0');
  });
  it('the repo CHANGELOG passes the gates for the package version', () => {
    expect(releaseGateProblem(RELEASES, pkg.version)).toBeNull();
  });
});
