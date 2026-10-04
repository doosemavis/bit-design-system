import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { BANNER_TAG, assembleSite, cacheKey, checkSite, gitBuildArchive, injectBanner, planSite } from './build-versioned-site.mjs';

// --- planSite ---------------------------------------------------------------------------------
test('planSite: one tag on the current line gives no archives', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0'], currentVersion: '0.1.1' }), { latestLine: '0.1', archives: [] }));

test('planSite: asOlder archives a tag on the latest line under v<line>', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0'], currentVersion: '0.1.1', asOlder: 'v0.1.0' }), {
    latestLine: '0.1',
    archives: [{ line: '0.1', tag: 'v0.1.0', outDir: 'v0.1' }],
  }));

test('planSite: asOlder still archives when the current version is that tag (the docs-only case)', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0'], currentVersion: '0.1.0', asOlder: 'v0.1.0' }).archives, [
    { line: '0.1', tag: 'v0.1.0', outDir: 'v0.1' },
  ]));

test('planSite: an older line is archived at its newest patch', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0', 'v0.1.1', 'v0.2.0'], currentVersion: '0.2.0' }), {
    latestLine: '0.2',
    archives: [{ line: '0.1', tag: 'v0.1.1', outDir: 'v0.1' }],
  }));

test('planSite: a real archive owns its outDir, so asOlder on that line is skipped', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0', 'v0.1.1', 'v0.2.0'], currentVersion: '0.2.0', asOlder: 'v0.1.0' }).archives, [
    { line: '0.1', tag: 'v0.1.1', outDir: 'v0.1' },
  ]));

test('planSite: majors from 1.0, pre-releases ignored, newest line first', () =>
  assert.deepEqual(
    planSite({ tags: ['v0.9.4', 'v1.0.0', 'v1.2.3', 'v2.0.0-rc.1', 'v2.0.0'], currentVersion: '2.0.0' }).archives.map((a) => a.outDir),
    ['v1', 'v0.9'],
  ));

test('planSite: an untagged current version never becomes an archive', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0'], currentVersion: '0.2.0' }).archives, [{ line: '0.1', tag: 'v0.1.0', outDir: 'v0.1' }]));

test('planSite: asOlder must be an existing release tag', () => {
  assert.throws(() => planSite({ tags: ['v0.1.0'], currentVersion: '0.1.0', asOlder: 'v0.1.0-rc.1' }), /not a release tag/);
  assert.throws(() => planSite({ tags: ['v0.1.0'], currentVersion: '0.1.0', asOlder: 'v0.0.9' }), /no tag "v0\.0\.9"/);
});

test('planSite: a stale checkout, behind the newest tag line, throws', () =>
  assert.throws(() => planSite({ tags: ['v0.1.0', 'v0.2.0'], currentVersion: '0.1.0' }), /stale checkout.*0\.1\.0.*0\.2/));

test('planSite: an older patch on the newest line is not stale', () =>
  assert.deepEqual(planSite({ tags: ['v0.1.0', 'v0.1.1'], currentVersion: '0.1.0' }), { latestLine: '0.1', archives: [] }));

test('planSite: no release at all throws', () => assert.throws(() => planSite({ tags: [], currentVersion: '' }), /no release/));

test('cacheKey names the recipe version and the archive tags, or none', () => {
  assert.equal(cacheKey({ archives: [] }), 'site-archives-v1-none');
  assert.equal(cacheKey({ archives: [{ tag: 'v1.2.3' }, { tag: 'v0.9.4' }] }), 'site-archives-v1-v1.2.3_v0.9.4');
});

// --- injectBanner -----------------------------------------------------------------------------
const HTML = '<!doctype html><html><head><title>x</title></head><body></body></html>';
// The current gallery marks <html> as having its own picker; 0.1.0's archive does not.
const ROOT_HTML = '<!doctype html><html lang="en" data-bit-version-picker><head><title>x</title></head><body></body></html>';

test('injectBanner: adds the deferred banner script once, before </head>', () => {
  assert.equal(BANNER_TAG, '<script src="/bit-design-system/version-banner.js" defer></script>');
  const out = injectBanner(HTML);
  assert.equal(out.split(BANNER_TAG).length - 1, 1);
  assert.ok(out.includes(`${BANNER_TAG}</head>`));
});

test('injectBanner: running it twice adds nothing more', () => assert.equal(injectBanner(injectBanner(HTML)), injectBanner(HTML)));

test('injectBanner: with no </head> the input comes back unchanged', () => assert.equal(injectBanner('<p>hi</p>'), '<p>hi</p>'));

// --- assembleSite and checkSite (temp dirs, archive build injected) ----------------------------
const write = (file, text) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};
const VERSIONS = {
  latest: '0.1',
  lines: [
    { line: '0.1', version: '0.1.0', date: '', path: '/bit-design-system/', react: '^19.0.0', reactDom: '^19.0.0' },
    { line: '0.1', version: '0.1.0', date: '', path: '/bit-design-system/v0.1/', react: '^19.0.0', reactDom: '^19.0.0' },
  ],
};
const PLAN = { latestLine: '0.1', archives: [{ line: '0.1', tag: 'v0.1.0', outDir: 'v0.1' }] };

const fixture = () => {
  const dir = mkdtempSync(join(tmpdir(), 'bit-site-test-'));
  const currentDist = join(dir, 'dist');
  write(join(currentDist, 'index.html'), ROOT_HTML);
  write(join(currentDist, 'assets', 'a.js'), 'current');
  const bannerSource = join(dir, 'version-banner.js');
  write(bannerSource, '/* banner */');
  const built = [];
  const buildArchive = (archive, dest) => {
    built.push(archive.tag);
    write(join(dest, 'index.html'), HTML);
    write(join(dest, 'assets', 'a.js'), `archive ${archive.tag}`);
  };
  return { dir, currentDist, bannerSource, built, buildArchive, out: join(dir, 'site') };
};

const withFixture = (fn) => () => {
  const f = fixture();
  try {
    fn(f);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
};

test(
  'assembleSite: root from the current dist, archives under v<line>, versions.json and the banner script',
  withFixture((f) => {
    assembleSite({ ...f, plan: PLAN, versionsFile: VERSIONS });
    assert.equal(readFileSync(join(f.out, 'assets', 'a.js'), 'utf8'), 'current');
    assert.equal(readFileSync(join(f.out, 'v0.1', 'assets', 'a.js'), 'utf8'), 'archive v0.1.0');
    assert.deepEqual(JSON.parse(readFileSync(join(f.out, 'versions.json'), 'utf8')), VERSIONS);
    assert.equal(readFileSync(join(f.out, 'version-banner.js'), 'utf8'), '/* banner */');
    assert.ok(!readFileSync(join(f.out, 'index.html'), 'utf8').includes(BANNER_TAG), 'the root has no injected banner');
    assert.ok(readFileSync(join(f.out, 'v0.1', 'index.html'), 'utf8').includes(BANNER_TAG), 'the archive has the banner');
    assert.deepEqual(checkSite({ out: f.out, plan: PLAN }), []);
  }),
);

test(
  'assembleSite: a cached archive is copied instead of built, and a fresh build fills the cache',
  withFixture((f) => {
    const cache = join(f.dir, 'cache');
    assembleSite({ ...f, plan: PLAN, versionsFile: VERSIONS, cache });
    assert.deepEqual(f.built, ['v0.1.0']);
    assert.ok(existsSync(join(cache, 'v0.1.0', 'index.html')), 'the build is cached by tag');
    assert.ok(!readFileSync(join(cache, 'v0.1.0', 'index.html'), 'utf8').includes(BANNER_TAG), 'the cache keeps the raw build');
    write(join(cache, 'v0.0.9', 'index.html'), HTML);
    const out2 = join(f.dir, 'site2');
    assembleSite({ ...f, out: out2, plan: PLAN, versionsFile: VERSIONS, cache });
    assert.deepEqual(f.built, ['v0.1.0'], 'the second run reuses the cache');
    assert.ok(readFileSync(join(out2, 'v0.1', 'index.html'), 'utf8').includes(BANNER_TAG));
    assert.ok(!existsSync(join(cache, 'v0.0.9')), 'tags no longer archived are pruned from the cache');
  }),
);

test(
  'assembleSite: refuses a non-empty --out and a missing current dist',
  withFixture((f) => {
    write(join(f.out, 'old.txt'), 'x');
    assert.throws(() => assembleSite({ ...f, plan: PLAN, versionsFile: VERSIONS }), /--out .* is not empty/);
    assert.throws(
      () => assembleSite({ ...f, out: join(f.dir, 'other'), currentDist: join(f.dir, 'nope'), plan: PLAN, versionsFile: VERSIONS }),
      /no index\.html in the current dist/,
    );
  }),
);

test(
  'assembleSite: a failed archive build fails the run and names the tag',
  withFixture((f) => {
    const buildArchive = () => {
      throw new Error('boom');
    };
    assert.throws(() => assembleSite({ ...f, buildArchive, plan: PLAN, versionsFile: VERSIONS }), /v0\.1\.0: boom/);
  }),
);

test(
  'checkSite: reports a missing archive, a bad versions.json, a banner in the root and no banner script',
  withFixture((f) => {
    write(join(f.out, 'index.html'), injectBanner(HTML));
    // The drift the review caught: a version where the gallery expects a line.
    write(join(f.out, 'versions.json'), JSON.stringify({ ...VERSIONS, latest: '0.1.0' }));
    const problems = checkSite({ out: f.out, plan: PLAN });
    const has = (re) => assert.ok(problems.some((p) => re.test(p)), `${re}\n${problems.join('\n')}`);
    has(/v0\.1\/index\.html is missing/);
    has(/versions\.json/);
    has(/root index\.html has the banner/);
    has(/version-banner\.js is missing/);
    has(/root index\.html has no data-bit-version-picker/);
  }),
);

test(
  'checkSite: a versions.json that lists no copy at an archived folder is reported',
  withFixture((f) => {
    assembleSite({ ...f, plan: PLAN, versionsFile: { latest: '0.1', lines: [VERSIONS.lines[0]] } });
    assert.deepEqual(checkSite({ out: f.out, plan: PLAN }), ['versions.json lists no entry at /bit-design-system/v0.1/']);
  }),
);

test(
  'checkSite: an archive without the banner is reported',
  withFixture((f) => {
    assembleSite({ ...f, plan: PLAN, versionsFile: VERSIONS });
    write(join(f.out, 'v0.1', 'index.html'), HTML);
    assert.deepEqual(checkSite({ out: f.out, plan: PLAN }), ['v0.1/index.html has no banner script']);
  }),
);

// --- gitBuildArchive: the worktree is always cleaned up, and cleanup never hides the real error --
test('gitBuildArchive: a failed build throws its own error even when worktree cleanup also fails', () => {
  const calls = [];
  const run = (cmd, args) => {
    calls.push(`${cmd} ${args.join(' ')}`);
    if (args.includes('vite')) throw new Error('vite build failed');
    if (args[0] === 'worktree' && args[1] !== 'add') throw new Error(`git ${args[1]} failed`);
  };
  const dest = mkdtempSync(join(tmpdir(), 'bit-archive-dest-'));
  try {
    assert.throws(() => gitBuildArchive('/repo', run)({ tag: 'v0.1.0', outDir: 'v0.1' }, dest), /vite build failed/);
    assert.ok(calls.some((c) => c.startsWith('git worktree remove')), 'removes the worktree');
    assert.ok(calls.some((c) => c === 'git worktree prune'), 'prunes');
    const vite = calls.find((c) => c.includes('vite build'));
    assert.match(vite, /--base \/bit-design-system\/v0\.1\/ --outDir /);
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
});
