// Builds versions.json: one entry per release line, each at that line's newest patch.
// buildVersionsFile is pure (I/O injected); the CLI below wires in git and CHANGELOG.md.
// Each entry also carries its line's Breaking items, read from the current CHANGELOG at deploy
// time, so a frozen copy (whose own CHANGELOG stops at its tag) can still warn about newer lines.
//   node scripts/versions.mjs --out apps/gallery/public/versions.json [--as-older <tag>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareVersions, isRelease, lineOf, newestPerLine, parseChangelogSections, pathForLine } from '../apps/gallery/src/content/versionLines.mjs';

/** 'v0.1.0' → '0.1.0'. The one copy; build-versioned-site.mjs imports it. */
export const stripV = (tag) => tag.replace(/^v/, '');

/** The releases in `line`, up to `version`, that have Breaking items: newest first. */
const breakingFor = (line, version, breakingByVersion) =>
  Object.entries(breakingByVersion)
    .filter(([v, items]) => isRelease(v) && lineOf(v) === line && compareVersions(v, version) <= 0 && items.length > 0)
    .sort(([a], [b]) => compareVersions(b, a))
    .map(([v, items]) => ({ version: v, items }));

const entryFor = ({ line, version }, { latestLine, readPackageJson, changelogDates, breakingByVersion }) => {
  const peers = readPackageJson(`v${version}`)?.peerDependencies ?? {};
  const breaking = breakingFor(line, version, breakingByVersion);
  return {
    line,
    version,
    date: changelogDates[version] ?? '',
    path: pathForLine(line, latestLine),
    react: peers.react ?? '',
    reactDom: peers['react-dom'] ?? '',
    ...(breaking.length > 0 ? { breaking } : {}),
  };
};

export const buildVersionsFile = ({ tags, current, readPackageJson, changelogDates = {}, breakingByVersion = {}, asOlder }) => {
  // `current` may be older than the newest tag (a stale branch); it then forms its own
  // line entry like any other release, and the newest tag still wins the root.
  const versions = [...tags.map(stripV), ...(current ? [current] : [])].filter(isRelease);
  const chosen = newestPerLine(versions);
  if (chosen.length === 0) throw new Error('versions.json: no release tags found');
  const latestLine = chosen[0].line;
  const ctx = { latestLine, readPackageJson, changelogDates, breakingByVersion };
  const lines = chosen.map((c) => entryFor(c, ctx));
  if (asOlder !== undefined) {
    const older = stripV(asOlder);
    if (!isRelease(older)) throw new Error(`--as-older: not a release tag "${asOlder}"`);
    // asOlder only exists to exercise archiving when no real older line does (production never
    // passes it): a real entry that already owns this path wins and the extra entry is skipped.
    // Deduped by path only, so the same version as the root still gets its v<line>/ copy.
    // latestLine '' makes the path v<line>/ even when it shares the latest's line.
    const extra = entryFor({ line: lineOf(older), version: older }, { ...ctx, latestLine: '' });
    if (!lines.some((l) => l.path === extra.path)) lines.push(extra);
  }
  return { latest: latestLine, lines };
};

/**
 * Each release's date and its Breaking bullets, from the gallery's shared walker. A heading that
 * doesn't match (an undated draft) is skipped here, and the gallery's changelog tests reject it in CI.
 */
export const readChangelogFacts = (text) => {
  const dates = {};
  const breakingByVersion = {};
  for (const { version, date, sections } of parseChangelogSections(text, { strict: false })) {
    dates[version] = date;
    if (sections.Breaking) breakingByVersion[version] = sections.Breaking;
  }
  return { dates, breakingByVersion };
};

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Reads what buildVersionsFile needs from a checkout: the v* tags reachable from HEAD (as the
// docs-check job lists them), the package's current version, each tag's
// packages/react/package.json (via `git show`), and the CHANGELOG's dates and Breaking items.
export const readRepoInputs = (root = REPO_ROOT) => {
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
  const tags = git('tag', '--list', 'v*', '--merged', 'HEAD').split('\n').filter(Boolean);
  const current = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8')).version;
  const readFromTag = (tag) => {
    try {
      return JSON.parse(git('show', `${tag}:packages/react/package.json`));
    } catch (error) {
      throw new Error(`could not read packages/react/package.json at ${tag}: ${error.message}`);
    }
  };
  const changelog = join(root, 'CHANGELOG.md');
  const { dates, breakingByVersion } = existsSync(changelog) ? readChangelogFacts(readFileSync(changelog, 'utf8')) : { dates: {}, breakingByVersion: {} };
  return {
    tags,
    current,
    readPackageJson: (tag) =>
      tag === `v${current}` && !tags.includes(tag)
        ? JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8'))
        : readFromTag(tag),
    changelogDates: dates,
    breakingByVersion,
  };
};

export const writeVersionsFile = (out, file) => {
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
};

const main = () => {
  const args = process.argv.slice(2);
  const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const out = flag('--out');
  if (!out) throw new Error('usage: versions.mjs --out <file> [--as-older <tag>]');
  const file = buildVersionsFile({ ...readRepoInputs(), asOlder: flag('--as-older') });
  writeVersionsFile(out, file);
  console.log(JSON.stringify(file, null, 2));
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
