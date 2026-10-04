import raw from '../../../../CHANGELOG.md?raw';

export type ChangeKind = 'Breaking' | 'Added' | 'Changed' | 'Fixed' | 'Removed';

export interface Release {
  version: string;
  date: string;
  sections: Partial<Record<ChangeKind, string[]>>;
}

const KINDS: readonly string[] = ['Breaking', 'Added', 'Changed', 'Fixed', 'Removed'];
const HEADING = /^## (\d+\.\d+\.\d+) (?:—|-) (\d{4}-\d{2}-\d{2})$/;

export function parseChangelog(text: string): Release[] {
  const releases: Release[] = [];
  let current: Release | null = null;
  let kind: ChangeKind | null = null;

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      const m = HEADING.exec(line);
      if (!m) throw new Error(`CHANGELOG: bad heading "${line}"`);
      current = { version: m[1]!, date: m[2]!, sections: {} };
      releases.push(current);
      kind = null;
    } else if (line.startsWith('### ')) {
      const name = line.slice(4).trim();
      kind = KINDS.includes(name) ? (name as ChangeKind) : null;
    } else if (line.startsWith('- ') && current && kind) {
      current.sections[kind] = [...(current.sections[kind] ?? []), line.slice(2).trim()];
    }
  }
  return releases;
}

export const RELEASES: Release[] = parseChangelog(raw);
