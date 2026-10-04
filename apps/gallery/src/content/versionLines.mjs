// Release lines: a minor while the major is 0 (0.1, 0.2), a major from 1.0 (1, 2).
// Shared by the gallery and scripts/versions.mjs, so it has no imports.
export const SITE_BASE = '/bit-design-system/';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export const isRelease = (version) => typeof version === 'string' && SEMVER.test(version);

const parts = (version) => version.split('.').map(Number);

export const lineOf = (version) => {
  if (!isRelease(version)) throw new Error(`lineOf: not a release "${version}"`);
  const [major, minor] = parts(version);
  return major === 0 ? `0.${minor}` : String(major);
};

/** Orders releases numerically: negative when `a` is older than `b` ('0.1.9' < '0.1.10' < '0.2.0'). */
export const compareVersions = (a, b) => {
  const [pa, pb] = [parts(a), parts(b)];
  return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
};

/**
 * A CHANGELOG release heading, `## X.Y.Z — YYYY-MM-DD` (an em dash or a hyphen). Groups: version, date.
 * Callers trimEnd() the line first, so trailing spaces are not an error. Shared by
 * apps/gallery/src/content/changelog.ts and scripts/versions.mjs.
 */
export const CHANGELOG_HEADING = /^## (\d+\.\d+\.\d+) (?:—|-) (\d{4}-\d{2}-\d{2})$/;

/**
 * One walk over CHANGELOG text: `[{ version, date, sections: { [kind]: items[] } }]`, newest first as written.
 * Every `### ` name is kept as a section, so callers pick the kinds they know. A bullet counts only
 * under a release and a section. A `## ` line that isn't a CHANGELOG_HEADING (an undated draft) throws
 * when `strict`, and is skipped along with its bullets otherwise.
 */
export const parseChangelogSections = (text, { strict }) => {
  const releases = [];
  let current = null;
  let kind = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.startsWith('## ')) {
      const m = CHANGELOG_HEADING.exec(line);
      if (!m && strict) throw new Error(`CHANGELOG: bad heading "${line}"`);
      current = m ? { version: m[1], date: m[2], sections: new Map() } : null;
      if (current) releases.push(current);
      kind = null;
    } else if (line.startsWith('### ')) {
      kind = line.slice(4).trim();
    } else if (line.startsWith('- ') && current && kind) {
      current.sections.set(kind, [...(current.sections.get(kind) ?? []), line.slice(2).trim()]);
    }
  }
  // A Map while walking, so a section named `constructor` or `__proto__` is just a name.
  return releases.map(({ version, date, sections }) => ({ version, date, sections: Object.fromEntries(sections) }));
};

export const pathForLine = (line, latestLine) => (line === latestLine ? SITE_BASE : `${SITE_BASE}v${line}/`);

export const newestPerLine = (versions) => {
  const newest = new Map();
  for (const version of versions.filter(isRelease)) {
    const line = lineOf(version);
    const held = newest.get(line);
    if (held === undefined || compareVersions(version, held) > 0) newest.set(line, version);
  }
  return [...newest.values()].sort((a, b) => compareVersions(b, a)).map((version) => ({ line: lineOf(version), version }));
};

const lineParts = (line) => {
  const [first, second] = line.split('.').map(Number);
  return first === 0 ? [0, second] : [first, 0];
};

/** Orders release lines numerically: negative when `a` is older than `b` ('0.9' < '0.10' < '1'). */
export const compareLines = (a, b) => {
  const [pa, pb] = [lineParts(a), lineParts(b)];
  return pa[0] - pb[0] || pa[1] - pb[1];
};

// --- versions.json: one contract for its writer (scripts/versions.mjs), its checker
// (scripts/build-versioned-site.mjs) and its reader (the gallery). The file is untrusted at runtime.
const LINE = /^\d+(\.\d+)?$/;
/** Exactly the site root or `<site>/v<line>/`. Paths reach location.assign and hrefs, so nothing else gets through. */
const SITE_PATH = /^\/bit-design-system\/(v[0-9][0-9.]*\/)?$/;

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringList = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Optional on an entry: the releases in its line with Breaking items, `{ version, items }`. */
const isBreakingList = (value) =>
  value === undefined || (Array.isArray(value) && value.every((b) => isRecord(b) && isRelease(b.version) && isStringList(b.items)));

const isEntry = (entry) =>
  isRecord(entry) &&
  isBreakingList(entry.breaking) &&
  typeof entry.line === 'string' &&
  LINE.test(entry.line) &&
  isRelease(entry.version) &&
  typeof entry.date === 'string' &&
  typeof entry.path === 'string' &&
  SITE_PATH.test(entry.path) &&
  typeof entry.react === 'string' &&
  typeof entry.reactDom === 'string';

/**
 * True for a well-formed versions.json: `latest` is a line ('0.2', not '0.2.0'), every entry is
 * complete with a safe path, paths are unique, and exactly one entry (the latest line's) is at SITE_BASE.
 */
export const isVersionsFile = (value) => {
  if (!isRecord(value) || typeof value.latest !== 'string' || !LINE.test(value.latest)) return false;
  if (!Array.isArray(value.lines) || value.lines.length === 0 || !value.lines.every(isEntry)) return false;
  const paths = value.lines.map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) return false;
  const roots = value.lines.filter((entry) => entry.path === SITE_BASE);
  return roots.length === 1 && roots[0].line === value.latest;
};

/** The copy a page is served from: SITE_BASE or `<site>/v<line>/`. Null outside the site (dev, tests). */
export const ownPathOf = (pathname) => {
  if (typeof pathname !== 'string' || !pathname.startsWith(SITE_BASE)) return null;
  const folder = /^v[0-9][0-9.]*\//.exec(pathname.slice(SITE_BASE.length));
  return SITE_BASE + (folder ? folder[0] : '');
};
