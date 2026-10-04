import raw from '../../../../CHANGELOG.md?raw';
import { compareVersions, parseChangelogSections } from './versionLines.mjs';

export type ChangeKind = 'Breaking' | 'Added' | 'Changed' | 'Fixed' | 'Removed';

/** Every CHANGELOG section, in the order Release notes shows them. */
export const CHANGE_KINDS: readonly ChangeKind[] = ['Breaking', 'Added', 'Changed', 'Fixed', 'Removed'];

interface Release {
  version: string;
  date: string;
  sections: Partial<Record<ChangeKind, string[]>>;
}

const isKind = (name: string): name is ChangeKind => (CHANGE_KINDS as readonly string[]).includes(name);

export function parseChangelog(text: string): Release[] {
  return parseChangelogSections(text, { strict: true }).map(({ version, date, sections }) => ({
    version,
    date,
    sections: Object.fromEntries(Object.entries(sections).filter(([name]) => isKind(name))),
  }));
}

/** True when each version is newer than the next: no duplicates, newest first. */
export function isStrictlyDescending(versions: readonly string[]): boolean {
  return versions.every((version, i) => i === 0 || compareVersions(versions[i - 1]!, version) > 0);
}

/** The release gates: entries strictly newest first, the newest being the package version. Null when both pass. */
export function releaseGateProblem(releases: readonly Release[], packageVersion: string): string | null {
  const versions = releases.map((r) => r.version);
  if (!isStrictlyDescending(versions)) return `CHANGELOG versions must strictly descend: ${versions.join(', ')}`;
  const newest = versions[0] ?? 'none';
  return newest === packageVersion ? null : `the newest CHANGELOG entry is ${newest}, not the package version ${packageVersion}`;
}

export const RELEASES: Release[] = parseChangelog(raw);
