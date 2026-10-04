import raw from '../../../../CHANGELOG.md?raw';
import { CHANGELOG_HEADING, compareVersions } from './versionLines.mjs';

export type ChangeKind = 'Breaking' | 'Added' | 'Changed' | 'Fixed' | 'Removed';

/** Every CHANGELOG section, in the order Release notes shows them. */
export const CHANGE_KINDS: readonly ChangeKind[] = ['Breaking', 'Added', 'Changed', 'Fixed', 'Removed'];

export interface Release {
  version: string;
  date: string;
  sections: Partial<Record<ChangeKind, string[]>>;
}

const isKind = (name: string): name is ChangeKind => (CHANGE_KINDS as readonly string[]).includes(name);

export function parseChangelog(text: string): Release[] {
  const releases: Release[] = [];
  let current: Release | null = null;
  let kind: ChangeKind | null = null;

  for (const line of text.split(/\r?\n/).map((l) => l.trimEnd())) {
    if (line.startsWith('## ')) {
      const m = CHANGELOG_HEADING.exec(line);
      if (!m) throw new Error(`CHANGELOG: bad heading "${line}"`);
      current = { version: m[1]!, date: m[2]!, sections: {} };
      releases.push(current);
      kind = null;
    } else if (line.startsWith('### ')) {
      const name = line.slice(4).trim();
      kind = isKind(name) ? name : null;
    } else if (line.startsWith('- ') && current && kind) {
      current.sections[kind] = [...(current.sections[kind] ?? []), line.slice(2).trim()];
    }
  }
  return releases;
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
