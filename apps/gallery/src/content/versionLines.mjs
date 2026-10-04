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

const compare = (a, b) => {
  const [pa, pb] = [parts(a), parts(b)];
  return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
};

export const pathForLine = (line, latestLine) => (line === latestLine ? SITE_BASE : `${SITE_BASE}v${line}/`);

export const newestPerLine = (versions) => {
  const newest = new Map();
  for (const version of versions.filter(isRelease)) {
    const line = lineOf(version);
    const held = newest.get(line);
    if (held === undefined || compare(version, held) > 0) newest.set(line, version);
  }
  return [...newest.values()].sort((a, b) => compare(b, a)).map((version) => ({ line: lineOf(version), version }));
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

const isEntry = (entry) =>
  isRecord(entry) &&
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
