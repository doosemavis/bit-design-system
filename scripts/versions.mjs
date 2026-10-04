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
  const versions = [...tags.map((t) => t.replace(/^v/, '')), ...(current ? [current] : [])].filter(isRelease);
  const chosen = newestPerLine(versions);
  if (chosen.length === 0) throw new Error('versions.json: no release tags found');
  const latestLine = chosen[0].line;
  const ctx = { latestLine, readPackageJson, changelogDates };
  const lines = chosen.map((c) => entryFor(c, ctx));
  const older = asOlder?.replace(/^v/, '');
  if (older && isRelease(older) && !lines.some((l) => l.version === older)) {
    // latestLine '' so the extra entry always lives under v<line>/, even on the latest's line.
    lines.push(entryFor({ line: lineOf(older), version: older }, { ...ctx, latestLine: '' }));
  }
  return { latest: latestLine, lines };
};

export const parseChangelogDates = (text) =>
  Object.fromEntries([...text.matchAll(/^##\s+\[?(\d+\.\d+\.\d+)\]?\s+[—–-]\s+(\d{4}-\d{2}-\d{2})/gm)].map((m) => [m[1], m[2]]));

const main = () => {
  const args = process.argv.slice(2);
  const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const out = flag('--out');
  if (!out) throw new Error('usage: versions.mjs --out <file> [--as-older <tag>]');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
  const tags = git('tag', '--list', 'v*').split('\n').filter(Boolean);
  const current = JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8')).version;
  const changelog = join(root, 'CHANGELOG.md');
  const file = buildVersionsFile({
    tags,
    current,
    readPackageJson: (tag) =>
      tag === `v${current}` && !tags.includes(tag)
        ? JSON.parse(readFileSync(join(root, 'packages/react/package.json'), 'utf8'))
        : JSON.parse(git('show', `${tag}:packages/react/package.json`)),
    changelogDates: existsSync(changelog) ? parseChangelogDates(readFileSync(changelog, 'utf8')) : {},
    asOlder: flag('--as-older'),
  });
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
  console.log(JSON.stringify(file, null, 2));
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
