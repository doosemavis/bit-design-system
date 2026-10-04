// Builds the Pages site: the current gallery at the root, a frozen copy of each older release
// line at v<line>/, versions.json, and version-banner.js (injected into the copies only).
//   node scripts/build-versioned-site.mjs --out <dir> [--current-dist apps/gallery/dist]
//        [--as-older vX.Y.Z] [--cache <dir>]
//   node scripts/build-versioned-site.mjs --check <dir> [--as-older vX.Y.Z]   (asserts a built site)
//   node scripts/build-versioned-site.mjs --cache-key [--as-older vX.Y.Z]     (prints the cache key)
// See docs/superpowers/specs/2026-10-04-versions-design.md, section 2.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_BASE, isRelease, newestPerLine, pathForLine } from '../apps/gallery/src/content/versionLines.mjs';
import { REPO_ROOT, buildVersionsFile, readRepoInputs, writeVersionsFile } from './versions.mjs';

export const BANNER_FILE = 'version-banner.js';
export const BANNER_TAG = `<script src="${SITE_BASE}${BANNER_FILE}" defer></script>`;

// The folder under the site root that pathForLine gives a line: '' for the latest, 'v0.1' otherwise.
const outDirFor = (line, latestLine) => pathForLine(line, latestLine).slice(SITE_BASE.length).replace(/\/$/, '');

const stripV = (tag) => tag.replace(/^v/, '');

/**
 * Which copies the site needs. The latest line (tags plus the current version) is the root.
 * Every other line is archived at its newest tagged patch. `asOlder` adds a copy of that tag
 * even on the latest line, to rehearse archiving before a second line exists; a real archive
 * that already owns its folder wins.
 */
export const planSite = ({ tags, currentVersion, asOlder }) => {
  const tagged = tags.map(stripV).filter(isRelease);
  const all = newestPerLine([...tagged, ...(isRelease(currentVersion) ? [currentVersion] : [])]);
  if (all.length === 0) throw new Error('build-versioned-site: no release tags and no current release version');
  const latestLine = all[0].line;
  const archives = newestPerLine(tagged)
    .filter(({ line }) => line !== latestLine)
    .map(({ line, version }) => ({ line, tag: `v${version}`, outDir: outDirFor(line, latestLine) }));
  if (asOlder !== undefined) {
    const older = stripV(asOlder);
    if (!isRelease(older)) throw new Error(`--as-older: not a release tag "${asOlder}"`);
    if (!tagged.includes(older)) throw new Error(`--as-older: no tag "${asOlder}" in this repository`);
    const [{ line }] = newestPerLine([older]);
    const outDir = outDirFor(line, '');
    if (!archives.some((a) => a.outDir === outDir)) archives.push({ line, tag: `v${older}`, outDir });
  }
  return { latestLine, archives };
};

/** The actions/cache key: the archive tags, so a new patch on an old line rebuilds that line once. */
export const cacheKey = ({ archives }) => `site-archives-${archives.map((a) => a.tag).join('_') || 'none'}`;

/** Adds the banner script before </head>. Idempotent; HTML without </head> comes back unchanged. */
export const injectBanner = (html) =>
  html.includes(BANNER_TAG) || !html.includes('</head>') ? html : html.replace('</head>', `${BANNER_TAG}</head>`);

const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath ?? e.path, e.name));

const injectInto = (dir) => {
  for (const file of htmlFiles(dir)) writeFileSync(file, injectBanner(readFileSync(file, 'utf8')));
};

const assertEmptyOrAbsent = (out) => {
  if (existsSync(out) && readdirSync(out).length > 0) throw new Error(`--out ${out} is not empty; remove it or pick another folder`);
};

// One archive: from the cache when it holds this tag, otherwise built (and then cached).
// The cache keeps the raw build; the banner is injected into the site copy only.
const placeArchive = ({ archive, dest, cache, buildArchive }) => {
  const cached = cache ? join(cache, archive.tag) : undefined;
  if (cached && existsSync(join(cached, 'index.html'))) {
    console.log(`${archive.tag}: from the cache -> ${archive.outDir}/`);
    cpSync(cached, dest, { recursive: true });
  } else {
    console.log(`${archive.tag}: building -> ${archive.outDir}/`);
    try {
      buildArchive(archive, dest);
    } catch (error) {
      throw new Error(`${archive.tag}: ${error.message}`);
    }
    if (!existsSync(join(dest, 'index.html'))) throw new Error(`${archive.tag}: the build wrote no index.html`);
    if (cached) cpSync(dest, cached, { recursive: true });
  }
  injectInto(dest);
};

// Drops cached tags the plan no longer archives (a line got a newer patch), so the cache stays small.
const pruneCache = (cache, archives) => {
  if (!cache || !existsSync(cache)) return;
  const keep = new Set(archives.map((a) => a.tag));
  for (const name of readdirSync(cache)) if (!keep.has(name)) rmSync(join(cache, name), { recursive: true, force: true });
};

/** Writes the whole site into `out`. File I/O only; `buildArchive(archive, dest)` does the building. */
export const assembleSite = ({ out, currentDist, plan, versionsFile, bannerSource, buildArchive, cache }) => {
  if (!existsSync(join(currentDist, 'index.html'))) {
    throw new Error(`no index.html in the current dist ${currentDist}; run pnpm gallery:build first`);
  }
  assertEmptyOrAbsent(out);
  mkdirSync(out, { recursive: true });
  cpSync(currentDist, out, { recursive: true });
  if (cache) mkdirSync(cache, { recursive: true });
  for (const archive of plan.archives) {
    placeArchive({ archive, dest: join(out, archive.outDir), cache, buildArchive });
  }
  pruneCache(cache, plan.archives);
  writeVersionsFile(join(out, 'versions.json'), versionsFile);
  cpSync(bannerSource, join(out, BANNER_FILE));
};

const validVersionsFile = (file) =>
  typeof file?.latest === 'string' &&
  Array.isArray(file.lines) &&
  file.lines.length > 0 &&
  file.lines.every((l) => ['line', 'version', 'path'].every((k) => typeof l?.[k] === 'string' && l[k] !== '')) &&
  file.lines.some((l) => l.line === file.latest && l.path === SITE_BASE);

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
};

/** Returns the problems with a built site (none means it is good). Used by the release dry run. */
export const checkSite = ({ out, plan }) => {
  const problems = [];
  const root = join(out, 'index.html');
  if (!existsSync(root)) problems.push('the root index.html is missing');
  else if (readFileSync(root, 'utf8').includes(BANNER_TAG)) problems.push('the root index.html has the banner script');
  if (!validVersionsFile(readJson(join(out, 'versions.json')))) {
    problems.push('versions.json is missing or invalid (needs latest, and lines with line/version/path, the latest at the root)');
  }
  if (!existsSync(join(out, BANNER_FILE))) problems.push(`${BANNER_FILE} is missing at the root`);
  for (const { outDir } of plan.archives) {
    const index = join(out, outDir, 'index.html');
    if (!existsSync(index)) problems.push(`${outDir}/index.html is missing`);
    else if (!readFileSync(index, 'utf8').includes(BANNER_TAG)) problems.push(`${outDir}/index.html has no banner script`);
  }
  return problems;
};

// --- the real archive build: a git worktree at the tag -----------------------------------------
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

const gitBuildArchive = (root) => (archive, dest) => {
  const work = mkdtempSync(join(tmpdir(), `bit-archive-${archive.tag}-`));
  try {
    run('git', ['worktree', 'add', '--detach', work, archive.tag], root);
    run('pnpm', ['install', '--frozen-lockfile'], work);
    run('pnpm', ['--dir', work, 'build'], work);
    // --base and --outDir override the old vite config; the hash router needs nothing else.
    run(
      'pnpm',
      ['--dir', join(work, 'apps/gallery'), 'exec', 'vite', 'build', '--base', `${SITE_BASE}${archive.outDir}/`, '--outDir', dest, '--emptyOutDir'],
      work,
    );
  } finally {
    try {
      run('git', ['worktree', 'remove', '--force', work], root);
    } catch (error) {
      console.error(`could not remove the worktree ${work}: ${error.message}`);
    }
    rmSync(work, { recursive: true, force: true });
    run('git', ['worktree', 'prune'], root);
  }
};

const parseArgs = (args) => {
  const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  return {
    out: flag('--out'),
    check: flag('--check'),
    cacheKeyOnly: args.includes('--cache-key'),
    currentDist: flag('--current-dist') ?? join(REPO_ROOT, 'apps/gallery/dist'),
    asOlder: flag('--as-older'),
    cache: flag('--cache'),
  };
};

const USAGE = 'usage: build-versioned-site.mjs --out <dir> [--current-dist <dir>] [--as-older vX.Y.Z] [--cache <dir>] | --check <dir> | --cache-key';

const main = () => {
  const opts = parseArgs(process.argv.slice(2));
  const inputs = readRepoInputs(REPO_ROOT);
  const plan = planSite({ tags: inputs.tags, currentVersion: inputs.current, asOlder: opts.asOlder });
  if (opts.cacheKeyOnly) return console.log(cacheKey(plan));
  if (opts.check) {
    const problems = checkSite({ out: resolve(opts.check), plan });
    for (const p of problems) console.error(`::error::${p}`);
    if (problems.length > 0) throw new Error(`the versioned site has ${problems.length} problem(s)`);
    return console.log(`site ok: root, ${plan.archives.map((a) => `${a.outDir}/`).join(', ') || 'no archives'}, versions.json`);
  }
  if (!opts.out) throw new Error(USAGE);
  assembleSite({
    out: resolve(opts.out),
    currentDist: resolve(opts.currentDist),
    plan,
    versionsFile: buildVersionsFile({ ...inputs, asOlder: opts.asOlder }),
    bannerSource: fileURLToPath(new URL(`./${BANNER_FILE}`, import.meta.url)),
    buildArchive: gitBuildArchive(REPO_ROOT),
    cache: opts.cache && resolve(opts.cache),
  });
  console.log(`site written to ${resolve(opts.out)}: root (${plan.latestLine}) + ${plan.archives.map((a) => `${a.outDir}/ (${a.tag})`).join(', ') || 'no archives'}`);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
