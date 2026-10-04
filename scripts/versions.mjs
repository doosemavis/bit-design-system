// Builds versions.json: one entry per release line, each at that line's newest patch.
// buildVersionsFile is pure (I/O injected); the CLI below wires in git and CHANGELOG.md.
//   node scripts/versions.mjs --out apps/gallery/public/versions.json [--as-older <tag>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRelease, lineOf, newestPerLine, pathForLine } from '../apps/gallery/src/content/versionLines.mjs';

const entryFor = ({ line, version }, { latestLine, readPackageJson, changelogDates }) => {
  const peers = readPackageJson(`v${version}`)?.peerDependencies ?? {};
  return {
    line,
    version,
    date: changelogDates[version] ?? '',
    path: pathForLine(line, latestLine),
    react: peers.react ?? '',
    reactDom: peers['react-dom'] ?? '',
  };
};

export const buildVersionsFile = ({ tags, current, readPackageJson, changelogDates = {}, asOlder }) => {
  // `current` may be older than the newest tag (a stale branch); it then forms its own
  // line entry like any other release, and the newest tag still wins the root.
  const versions = [...tags.map((t) => t.replace(/^v/, '')), ...(current ? [current] : [])].filter(isRelease);
  const chosen = newestPerLine(versions);
  if (chosen.length === 0) throw new Error('versions.json: no release tags found');
  const latestLine = chosen[0].line;
  const ctx = { latestLine, readPackageJson, changelogDates };
  const lines = chosen.map((c) => entryFor(c, ctx));
  if (asOlder !== undefined) {
    const older = asOlder.replace(/^v/, '');
    if (!isRelease(older)) throw new Error(`--as-older: not a release tag "${asOlder}"`);
    // asOlder only exists to exercise archiving when no real older line does: a real entry
    // that already owns this path (or version) wins and the extra entry is skipped.
    // latestLine '' makes the path v<line>/ even when it shares the latest's line.
    const extra = entryFor({ line: lineOf(older), version: older }, { ...ctx, latestLine: '' });
    if (!lines.some((l) => l.version === older || l.path === extra.path)) lines.push(extra);
  }
  return { latest: latestLine, lines };
};

export const parseChangelogDates = (text) =>
  Object.fromEntries([...text.matchAll(/^##\s+\[?(\d+\.\d+\.\d+)\]?\s+[—–-]\s+(\d{4}-\d{2}-\d{2})/gm)].map((m) => [m[1], m[2]]));

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Reads what buildVersionsFile needs from a checkout: the v* tags, the package's current
// version, each tag's packages/react/package.json (via `git show`) and the CHANGELOG dates.
export const readRepoInputs = (root = REPO_ROOT) => {
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
  const tags = git('tag', '--list', 'v*').split('\n').filter(Boolean);
  const current = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8')).version;
  const readFromTag = (tag) => {
    try {
      return JSON.parse(git('show', `${tag}:packages/react/package.json`));
    } catch (error) {
      throw new Error(`could not read packages/react/package.json at ${tag}: ${error.message}`);
    }
  };
  const changelog = join(root, 'CHANGELOG.md');
  return {
    tags,
    current,
    readPackageJson: (tag) =>
      tag === `v${current}` && !tags.includes(tag)
        ? JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8'))
        : readFromTag(tag),
    changelogDates: existsSync(changelog) ? parseChangelogDates(readFileSync(changelog, 'utf8')) : {},
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
