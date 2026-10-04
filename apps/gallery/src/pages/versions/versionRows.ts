import { compareLines, SITE_BASE } from '../../content/versionLines.mjs';
import type { BreakingRelease, VersionsFile } from '../../content/versionLines.mjs';

export interface VersionRow {
  path: string;
  line: string;
  version: string;
  react: string;
  reactDom: string;
  latest: boolean;
  viewing: boolean;
}

/** The build this page belongs to, for the fallback row. */
interface CurrentBuild {
  line: string;
  version: string;
  react: string;
  reactDom: string;
}

/**
 * One row per versions.json entry, told apart by path (the as-older rehearsal lists one line twice).
 * With no file (loading or unavailable) it is the one build we know: this one.
 */
export function buildRows(file: VersionsFile | null, ownPath: string, current: CurrentBuild): VersionRow[] {
  if (!file) return [{ path: ownPath, ...current, latest: false, viewing: true }];
  return file.lines.map((entry) => ({
    path: entry.path,
    line: entry.line,
    version: entry.version,
    react: entry.react,
    reactDom: entry.reactDom,
    latest: entry.path === SITE_BASE,
    viewing: entry.path === ownPath,
  }));
}

/**
 * The breaking releases of every line newer than this copy, newest first. They come from
 * versions.json (written at deploy from the current CHANGELOG), because a frozen copy's own
 * CHANGELOG stops at its tag. This copy's line is its own entry's, else `currentLine`.
 */
export function newerBreaking(file: VersionsFile | null, ownPath: string, currentLine: string): BreakingRelease[] {
  if (!file) return [];
  const ownLine = file.lines.find((entry) => entry.path === ownPath)?.line ?? currentLine;
  return file.lines.filter((entry) => compareLines(entry.line, ownLine) > 0).flatMap((entry) => entry.breaking ?? []);
}
