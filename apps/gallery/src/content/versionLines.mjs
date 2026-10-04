// Release lines: a minor while the major is 0 (0.1, 0.2), a major from 1.0 (1, 2).
// Shared by the gallery and scripts/versions.mjs, so it has no imports.
export const SITE_BASE = '/bit-design-system/';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export const isRelease = (version) => typeof version === 'string' && SEMVER.test(version);

const parts = (version) => version.split('.').map(Number);

export const lineOf = (version) => {
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
