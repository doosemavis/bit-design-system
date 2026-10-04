// Structure tests for .github/workflows/ci.yml, release.yml and .github/dependabot.yml.
// They parse the YAML and check the parts a typo would break (triggers, jobs, needs, environments,
// permissions, step order and the step `if:` logic) and the release's security properties: which
// jobs hold a credential, that those jobs install nothing, and that only a v* tag push can publish.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { CACHE_PREFIX } from './build-versioned-site.mjs';

const load = (name) => parse(readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8'));
const ci = () => load('ci.yml');
const release = () => load('release.yml');
const BOTH = () => [['ci.yml', ci()], ['release.yml', release()]];

const TAG_PUSH = { event_name: 'push', ref: 'refs/tags/v0.1.0', workflow: 'Release' };
const BRANCH_PUSH = { event_name: 'push', ref: 'refs/heads/main', workflow: 'Release' };
const PULL_REQUEST = { event_name: 'pull_request', ref: 'refs/pull/7/merge', workflow: 'Release' };
const DISPATCH_MAIN = { event_name: 'workflow_dispatch', ref: 'refs/heads/main', workflow: 'Release' };
// A manual run can pick any branch or tag. Neither a feature branch nor a tag may deploy or publish.
const DISPATCH_BRANCH = { event_name: 'workflow_dispatch', ref: 'refs/heads/feature', workflow: 'Release' };
const DISPATCH_TAG = { event_name: 'workflow_dispatch', ref: 'refs/tags/v0.1.0', workflow: 'Release' };
const OTHER_BRANCH_PUSH = { event_name: 'push', ref: 'refs/heads/feature', workflow: 'Release' };
const NOT_TAG_PUSH = [BRANCH_PUSH, PULL_REQUEST, DISPATCH_MAIN, DISPATCH_BRANCH, DISPATCH_TAG, OTHER_BRANCH_PUSH];

const PINNED_ACTIONS = new Set([
  'actions/checkout@v4',
  'pnpm/action-setup@v4',
  'actions/setup-node@v4',
  'actions/cache@v4',
  'actions/upload-artifact@v4',
  'actions/download-artifact@v4',
  'actions/upload-pages-artifact@v3',
  'actions/deploy-pages@v4',
]);

const TAG_JOBS = ['build', 'deploy', 'guard', 'publish', 'site-build', 'verify-install'];
const PAGES_DEPLOY_JOBS = ['deploy', 'docs'];
const SITE_BUILD_JOBS = ['site-build', 'docs-build'];
// The one install the credential-holding publish job may run: npm itself, at the exact pinned version.
const NPM_PIN = 'npm install -g --ignore-scripts "npm@$NPM_VERSION"';

const runOf = (step) => String(step?.run ?? '');
const keyOf = (step) => step.id ?? step.name ?? step.uses ?? runOf(step);
const findIndex = (steps, predicate, label) => {
  const index = steps.findIndex(predicate);
  assert.ok(index >= 0, `no step ${label}`);
  return index;
};
// The Pack step's output: the one tarball that smoke:full tests and the build job uploads.
const PACKED_TGZ = '${{ steps.pack.outputs.tgz }}';

// The Pack step has id `pack`, resolves exactly one tarball and writes it to `tgz`, and the
// smoke step tests that tarball through SMOKE_TARBALL instead of packing its own.
const assertSmokesThePackedTarball = (steps, packIndex, smokeIndex) => {
  const pack = steps[packIndex];
  assert.equal(pack.id, 'pack', 'the Pack step has id pack');
  assert.match(runOf(pack), /shopt -s nullglob[\s\S]*tgz=\("\$RUNNER_TEMP"\/out\/\*\.tgz\)/, 'Pack globs the tarball into an array, empty when none');
  assert.match(runOf(pack), /\$\{#tgz\[@\]\} -eq 1/, 'Pack requires exactly one tarball');
  assert.match(runOf(pack), /\{\n\s*echo "tgz=\$\{tgz\[0\]\}"\n[\s\S]*?\} >> "\$GITHUB_OUTPUT"/, 'Pack writes the tgz output');
  assert.equal(steps[smokeIndex].env?.SMOKE_TARBALL, PACKED_TGZ, 'smoke:full tests the packed tarball');
};
const allSteps = (workflow) =>
  Object.entries(workflow.jobs).flatMap(([job, def]) => (def.steps ?? []).map((step) => ({ job, step })));
const checkouts = (def) => (def.steps ?? []).filter((s) => s.uses === 'actions/checkout@v4');

// --- A small evaluator for the GitHub expression subset these workflows use. ---------------
// It lets the tests check what the conditions do, not how they are worded.
const STATUS_FUNCTION = /\b(success|always|failure|cancelled)\(\)/;
const startsWith = (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase());

function evaluate(expression, ctx = {}, { implicitSuccess = true } = {}) {
  let source = String(expression).trim().replace(/^\$\{\{([\s\S]*)\}\}$/, '$1').trim();
  // GitHub adds success() to any `if:` that has no status function.
  if (implicitSuccess && !STATUS_FUNCTION.test(source)) source = `success() && (${source})`;
  const ok = ctx.success ?? true;
  const js = source
    .replace(/\bsuccess\(\)/g, String(ok))
    .replace(/\balways\(\)/g, 'true')
    .replace(/\bfailure\(\)/g, String(!ok))
    .replace(/\bcancelled\(\)/g, 'false')
    .replace(/\bsteps\.([\w-]+)\.outputs\.([\w-]+)/g, (_, id, key) => JSON.stringify(ctx.steps?.[id]?.outputs?.[key] ?? ''))
    .replace(/\bsteps\.([\w-]+)\.outcome\b/g, (_, id) => JSON.stringify(ctx.steps?.[id]?.outcome ?? ''))
    .replace(/\bneeds\.([\w-]+)\.outputs\.([\w-]+)/g, (_, job, key) => JSON.stringify(ctx.needs?.[job]?.outputs?.[key] ?? ''))
    .replace(/\bgithub\.(\w+)/g, (_, key) => JSON.stringify(ctx.github?.[key] ?? ''))
    .replace(/\bstartsWith\(/g, '__startsWith(')
    .replace(/!=/g, '!==')
    .replace(/(?<![!=])==(?!=)/g, '===');
  const leftover = js.replace(/'[^']*'|"[^"]*"/g, '').replace(/\b(true|false|__startsWith)\b/g, '');
  assert.match(leftover, /^[\s()!&|=,]*$/, `expression uses syntax the test evaluator does not know: ${expression}`);
  return new Function('__startsWith', `return (${js});`)(startsWith);
}

const interpolate = (text, github) =>
  String(text).replace(/\$\{\{([\s\S]*?)\}\}/g, (_, inner) => String(evaluate(inner, { github }, { implicitSuccess: false })));

// Walks a job's steps the way the runner does. `results` maps a step key to 'failure';
// `outputs` gives the outputs a step writes when it runs. Returns the keys of the steps that ran.
function simulate(steps, { results = {}, outputs = {} } = {}) {
  const state = { success: true, steps: {} };
  const ran = [];
  for (const step of steps) {
    const key = keyOf(step);
    const runs = step.if === undefined ? state.success : evaluate(step.if, state);
    const outcome = runs ? (results[key] ?? 'success') : 'skipped';
    if (runs) ran.push(key);
    if (step.id) state.steps[step.id] = { outcome, outputs: outcome === 'success' ? (outputs[step.id] ?? {}) : {} };
    if (outcome === 'failure') state.success = false;
  }
  return ran;
}

// The jobs that run for an event, following `needs` the way GitHub does: a job runs only when its
// own `if` holds and every job it needs ran and succeeded. `needs` gives job outputs (docs-check's).
function jobsThatRun(jobs, github, needs = {}) {
  const ran = new Set();
  for (let changed = true; changed; ) {
    changed = false;
    for (const [name, def] of Object.entries(jobs)) {
      if (ran.has(name)) continue;
      const deps = [def.needs ?? []].flat();
      if (!deps.every((d) => ran.has(d))) continue;
      if (evaluate(def.if ?? 'true', { github, needs })) {
        ran.add(name);
        changed = true;
      }
    }
  }
  return [...ran].sort();
}
const DOCS_DEPLOY = { 'docs-check': { outputs: { deploy: 'true' } } };

// Runs a step's own shell the way GitHub does (bash -eo pipefail) with the given env.
const runShell = (step, env, cwd) =>
  spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', runOf(step)], { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
const readOutputs = (file) =>
  Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
// The integrity npm records for a tarball: sha512 as a Subresource Integrity string.
const sri = (text) => `sha512-${createHash('sha512').update(text).digest('base64')}`;

// --- ci.yml -------------------------------------------------------------------------------
test('ci: read-only permissions at the top', () => assert.deepEqual(ci().permissions, { contents: 'read' }));

test('ci: the ci job runs the scripts tests after the gallery tests', () => {
  const steps = ci().jobs.ci.steps;
  const gallery = findIndex(steps, (s) => runOf(s) === 'pnpm --filter @bit-ds/gallery test', 'running the gallery tests');
  // Node 22 reads a bare directory as a module path, so CI passes a glob.
  const scripts = findIndex(steps, (s) => runOf(s) === "node --test 'scripts/*.test.mjs'", 'running node --test on scripts');
  assert.ok(scripts > gallery, 'node --test runs after the gallery tests');
});

test('ci: no step mentions storybook', () => {
  for (const { job, step } of allSteps(ci())) assert.doesNotMatch(JSON.stringify(step), /storybook/i, `ci.yml ${job}`);
});

test('ci: the e2e job needs ci, installs Chromium from a cache and runs pnpm e2e', () => {
  const e2e = ci().jobs.e2e;
  assert.ok(e2e, 'ci.yml has an e2e job');
  assert.deepEqual([e2e.needs].flat(), ['ci']);
  const steps = e2e.steps;
  const build = findIndex(steps, (s) => runOf(s) === 'pnpm build', 'running pnpm build');
  const cache = findIndex(steps, (s) => s.uses === 'actions/cache@v4', 'using actions/cache');
  assert.equal(steps[cache].with.path, '~/.cache/ms-playwright');
  const install = findIndex(
    steps,
    (s) => runOf(s) === 'pnpm --filter @bit-ds/gallery exec playwright install --with-deps chromium',
    'installing Chromium',
  );
  const run = findIndex(steps, (s) => runOf(s) === 'pnpm e2e', 'running pnpm e2e');
  assert.ok(build < run && cache < install && install < run, 'build, cache and install come before pnpm e2e');
  const upload = steps.find((s) => s.uses === 'actions/upload-artifact@v4');
  assert.ok(upload, 'e2e uploads an artifact');
  assert.equal(upload.if, 'failure()');
  assert.match(String(upload.with.path), /apps\/gallery\/playwright-report/);
});

// --- release.yml: triggers, jobs and when they run ------------------------------------------
test('release: triggers on pull requests, v* tags, pushes to main and a manual run, with read-only default permissions', () => {
  const wf = release();
  assert.ok('pull_request' in wf.on, 'on.pull_request');
  assert.deepEqual(wf.on.push.tags, ['v*']);
  assert.deepEqual(wf.on.push.branches, ['main'], 'push runs for tags and for main only');
  assert.ok('workflow_dispatch' in wf.on, 'on.workflow_dispatch (a manual "Run workflow" of Release on main)');
  assert.deepEqual(wf.permissions, { contents: 'read' });
});

test('release: the jobs are exactly the dry run, the tag chain and the docs chain', () => {
  assert.deepEqual(Object.keys(release().jobs).sort(), [
    'build', 'deploy', 'docs', 'docs-build', 'docs-check', 'dry-run', 'guard', 'publish', 'site-build', 'verify-install',
  ]);
});

test('release: dry-run on pull requests, the tag jobs only on tag pushes, the docs jobs only on main', () => {
  const { jobs } = release();
  assert.deepEqual(jobsThatRun(jobs, PULL_REQUEST), ['dry-run']);
  assert.deepEqual(jobsThatRun(jobs, TAG_PUSH), TAG_JOBS);
  // docs-build and docs wait on docs-check's output (see below), so with no output they do not run.
  assert.deepEqual(jobsThatRun(jobs, BRANCH_PUSH), ['docs-check'], 'a push to main checks for a docs deploy and never publishes');
  assert.deepEqual(jobsThatRun(jobs, BRANCH_PUSH, DOCS_DEPLOY), ['docs', 'docs-build', 'docs-check']);
  assert.deepEqual(jobsThatRun(jobs, DISPATCH_MAIN, DOCS_DEPLOY), ['docs', 'docs-build', 'docs-check']);
  assert.deepEqual(jobsThatRun(jobs, DISPATCH_BRANCH, DOCS_DEPLOY), [], 'a manual run on another branch does nothing');
  assert.deepEqual(jobsThatRun(jobs, DISPATCH_TAG, DOCS_DEPLOY), [], 'a manual run on a tag never publishes');
  assert.deepEqual(jobsThatRun(jobs, OTHER_BRANCH_PUSH, DOCS_DEPLOY), []);
  assert.deepEqual(jobsThatRun(jobs, PULL_REQUEST, DOCS_DEPLOY), ['dry-run']);
});

test('release: every tag job gates on a v* tag push itself, not only through needs', () => {
  for (const name of TAG_JOBS) {
    const gate = String(release().jobs[name].if);
    assert.match(gate, /startsWith\(github\.ref, 'refs\/tags\/v'\)/, name);
    assert.match(gate, /github\.event_name == 'push'/, name);
    for (const github of NOT_TAG_PUSH) assert.equal(evaluate(gate, { github, needs: DOCS_DEPLOY }), false, `${name} on ${github.event_name} ${github.ref}`);
  }
});

// --- release.yml: the security properties ----------------------------------------------------
test('release: npm publish and the npm-publish environment are reachable only on a v* tag push, after guard and build', () => {
  const { jobs } = release();
  const publishing = Object.entries(jobs)
    .filter(([, def]) => (def.environment?.name ?? def.environment) === 'npm-publish' || (def.steps ?? []).some((s) => /\bnpm publish\b/.test(runOf(s)) && !runOf(s).includes('--dry-run')))
    .map(([name]) => name);
  assert.deepEqual(publishing, ['publish']);
  assert.deepEqual([jobs.publish.needs].flat(), ['guard', 'build']);
  assert.ok(jobsThatRun(jobs, TAG_PUSH).includes('publish'));
  for (const github of NOT_TAG_PUSH) assert.ok(!jobsThatRun(jobs, github, DOCS_DEPLOY).includes('publish'), `${github.event_name} ${github.ref}`);
});

test('release: only publish, deploy and docs hold a credential; the build, site and check jobs hold none', () => {
  const { jobs } = release();
  const holders = Object.entries(jobs).filter(([, def]) => def.environment || def.permissions?.['id-token'] || def.permissions?.pages).map(([n]) => n).sort();
  assert.deepEqual(holders, ['deploy', 'docs', 'publish']);
  for (const name of ['dry-run', 'build', 'site-build', 'docs-build', 'docs-check', 'verify-install', 'guard']) {
    assert.equal(jobs[name].environment, undefined, name);
    assert.equal(jobs[name].permissions, undefined, `${name} keeps the read-only default`);
    assert.doesNotMatch(JSON.stringify(jobs[name]), /secrets\.|id-token/, name);
  }
});

// The credential jobs may run only these actions, and no package manager beyond the npm pin.
const CREDENTIAL_JOB_ACTIONS = new Set(['actions/checkout@v4', 'actions/setup-node@v4', 'actions/download-artifact@v4', 'actions/deploy-pages@v4']);
const INSTALLS = /\b(pnpm|yarn|npx|corepack|bun)\b|\bnpm\s+(install|i|ci|add|exec|x|run|run-script|rebuild|update|link)\b/;

test('both: no job that holds id-token: write installs a dependency or runs a package manager', () => {
  let checked = 0;
  for (const [file, wf] of BOTH()) {
    for (const [name, def] of Object.entries(wf.jobs)) {
      if (def.permissions?.['id-token'] !== 'write') continue;
      checked += 1;
      for (const step of def.steps) {
        const label = `${file} ${name}: ${keyOf(step)}`;
        if (step.uses) assert.ok(CREDENTIAL_JOB_ACTIONS.has(step.uses), `${label} is not allowed in a credential job`);
        if (step.uses === 'actions/setup-node@v4') assert.equal(step.with?.cache, undefined, `${label}: no dependency cache`);
        const run = runOf(step);
        if (run === NPM_PIN) continue;
        assert.doesNotMatch(run, INSTALLS, label);
        // Repo code with dependencies would need an install; release-steps.mjs has none (see below).
        for (const node of run.match(/\bnode\b[^\n]*/g) ?? []) assert.match(node, /^node scripts\/release-steps\.mjs /, label);
      }
    }
  }
  assert.equal(checked, 3, 'publish, deploy and docs');
});

test('release-steps.mjs, which publish runs without an install, imports only Node built-ins', () => {
  const source = readFileSync(new URL('./release-steps.mjs', import.meta.url), 'utf8');
  const imports = [...source.matchAll(/^import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  assert.ok(imports.length > 0);
  for (const spec of imports) assert.match(spec, /^node:/, spec);
  // The one dynamic import is inside the `node -e` check that runs in verify-install's scratch project.
  assert.doesNotMatch(source.replace(/"import\('@bit-ds\/react'\)[^"]*"/, ''), /\bimport\(|\brequire\(/);
});

test('both: every checkout leaves no token behind (persist-credentials: false)', () => {
  let count = 0;
  for (const [file, wf] of BOTH()) {
    for (const [name, def] of Object.entries(wf.jobs)) {
      for (const checkout of checkouts(def)) {
        count += 1;
        assert.equal(checkout.with?.['persist-credentials'], false, `${file} ${name}`);
      }
    }
  }
  assert.ok(count >= 9, `found ${count} checkouts`);
});

test('both: no run script interpolates an expression; values arrive through env', () => {
  for (const [file, wf] of BOTH()) {
    const runs = allSteps(wf).filter(({ step }) => typeof step.run === 'string');
    assert.ok(runs.length > 10, `${file}: every run step is checked`);
    for (const { job, step } of runs) assert.doesNotMatch(runOf(step), /\$\{\{/, `${file} ${job}: ${keyOf(step)}`);
  }
});

test('release: the npm token reaches only the publish step', () => {
  for (const { job, step } of allSteps(release())) {
    const usesSecret = JSON.stringify(step).includes('secrets.');
    assert.equal(usesSecret, job === 'publish' && step.id === 'publish', `${job}: ${keyOf(step)}`);
  }
});

test('release: the workflow text names a secret exactly once, in the publish step', () => {
  const text = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
  assert.equal(text.match(/secrets\./g)?.length, 1, 'one secrets. reference: NODE_AUTH_TOKEN on the publish step');
});

// A status function in a job `if` (always(), !cancelled(), ...) lets the job run after a job it
// needs failed or was skipped, so a broken build or a failed guard could still reach publish.
test('release: no job gate uses a status function, so a failed or skipped job always stops the jobs after it', () => {
  for (const [name, def] of Object.entries(release().jobs)) {
    if (def.if !== undefined) assert.doesNotMatch(String(def.if), STATUS_FUNCTION, name);
  }
});

const ENV_GUARDED = ['NODE_AUTH_TOKEN', 'NPM_VERSION'];

test('release: env is set in one place each: NPM_VERSION at the top, NODE_AUTH_TOKEN on the publish step', () => {
  const wf = release();
  assert.deepEqual(Object.keys(wf.env ?? {}), ['NPM_VERSION'], 'the workflow env holds only NPM_VERSION');
  assert.equal(wf.jobs.publish.env, undefined, 'publish has no job-level env');
  for (const [name, def] of Object.entries(wf.jobs)) {
    for (const key of ENV_GUARDED) assert.ok(!(key in (def.env ?? {})), `job ${name} sets ${key}`);
    for (const step of def.steps ?? []) {
      const isPublishStep = name === 'publish' && step.id === 'publish';
      for (const key of ENV_GUARDED) {
        const allowed = isPublishStep && key === 'NODE_AUTH_TOKEN';
        assert.equal(key in (step.env ?? {}), allowed, `${name}: ${keyOf(step)} ${allowed ? 'must' : 'must not'} set ${key}`);
      }
    }
  }
});

test('release: npm is one exact version, 11.5.1 or later, installed without scripts wherever it is upgraded', () => {
  const version = release().env.NPM_VERSION;
  assert.match(version, /^\d+\.\d+\.\d+$/, 'exact, never a range');
  const [major, minor, patch] = version.split('.').map(Number);
  assert.ok(major > 11 || (major === 11 && (minor > 5 || (minor === 5 && patch >= 1))), `${version} is older than 11.5.1`);
  for (const [file, wf] of BOTH()) {
    for (const { job, step } of allSteps(wf)) {
      if (/\bnpm (i|install)\b[^\n]*-g\b/.test(runOf(step))) assert.equal(runOf(step), NPM_PIN, `${file} ${job}`);
      assert.doesNotMatch(runOf(step), /npm@[\^~]|npm@latest/, `${file} ${job}`);
    }
  }
  for (const name of ['dry-run', 'build', 'publish']) assert.ok(release().jobs[name].steps.some((s) => runOf(s) === NPM_PIN), name);
});

// --- release.yml: concurrency ---------------------------------------------------------------
test('release: concurrency queues every tag in one group and never cancels a release or a docs deploy', () => {
  const { concurrency } = release();
  const group = (github) => interpolate(concurrency.group, github);
  assert.equal(group(TAG_PUSH), group({ ...TAG_PUSH, ref: 'refs/tags/v0.2.0' }), 'two tags share one group');
  assert.notEqual(group(PULL_REQUEST), group(TAG_PUSH), 'pull requests do not queue behind releases');
  // GitHub keeps one pending run per group, so a main push in the tags group could replace a waiting release.
  assert.notEqual(group(BRANCH_PUSH), group(TAG_PUSH), 'main pushes do not queue in the release group');
  assert.notEqual(group(DISPATCH_MAIN), group(TAG_PUSH));
  for (const github of [TAG_PUSH, BRANCH_PUSH, DISPATCH_MAIN]) {
    assert.equal(interpolate(concurrency['cancel-in-progress'], github), 'false', github.ref);
  }
  assert.equal(interpolate(concurrency['cancel-in-progress'], PULL_REQUEST), 'true');
});

test('release: only the two Pages deploy jobs hold the pages group, and it never cancels', () => {
  for (const [name, def] of Object.entries(release().jobs)) {
    if (PAGES_DEPLOY_JOBS.includes(name)) assert.deepEqual(def.concurrency, { group: 'pages', 'cancel-in-progress': false }, name);
    else assert.equal(def.concurrency, undefined, `${name} holds no pages slot`);
  }
});

// --- release.yml: guard, build, publish, verify-install --------------------------------------
test('release: guard checks the tag and that the commit is on main', () => {
  const { steps } = release().jobs.guard;
  const checkout = steps.find((s) => s.uses === 'actions/checkout@v4');
  assert.equal(checkout.with['fetch-depth'], 0);
  findIndex(steps, (s) => runOf(s).includes('node scripts/release-steps.mjs check-tag "$GITHUB_REF_NAME"'), 'running check-tag');
  const onMain = steps.find((s) => runOf(s).includes('git merge-base --is-ancestor "$GITHUB_SHA" origin/main'));
  assert.ok(onMain, 'guard asserts the tag commit is on main');
  assert.match(runOf(onMain), /git fetch[^\n]* origin main/);
});

// The build steps dry-run and build share: from pnpm setup to the smoke test, word for word.
const sharedBuildSteps = (steps) => {
  const start = findIndex(steps, (s) => s.uses === 'pnpm/action-setup@v4', 'setting up pnpm');
  const end = findIndex(steps, (s) => s.id === 'smoke', 'the smoke test');
  return steps.slice(start, end + 1);
};

test('release: build packs, hashes, smoke-tests and uploads the tarball, needing guard', () => {
  const job = release().jobs.build;
  assert.deepEqual([job.needs].flat(), ['guard']);
  assert.deepEqual(job.outputs, {
    'tgz-name': '${{ steps.pack.outputs.name }}',
    sha256: '${{ steps.pack.outputs.sha256 }}',
    integrity: '${{ steps.pack.outputs.integrity }}',
  });
  const { steps } = job;
  const npm = findIndex(steps, (s) => runOf(s) === NPM_PIN, 'installing the pinned npm');
  const install = findIndex(steps, (s) => runOf(s) === 'pnpm install --frozen-lockfile', 'installing');
  const verify = findIndex(steps, (s) => runOf(s) === 'pnpm build && pnpm verify', 'building and verifying');
  const pack = findIndex(steps, (s) => runOf(s).includes('pnpm --dir packages/react pack --pack-destination "$RUNNER_TEMP/out"'), 'packing');
  const smoke = findIndex(steps, (s) => s.id === 'smoke' && runOf(s) === 'pnpm smoke:full', 'running smoke:full');
  assertSmokesThePackedTarball(steps, pack, smoke);
  // The hash is taken in Pack, before smoke:full runs any freshly installed registry code.
  assert.match(runOf(steps[pack]), /sha256=\$\(sha256sum "\$\{tgz\[0\]\}"/);
  const recheck = findIndex(steps, (s) => s.id === 'recheck', 'rechecking the tarball after the smoke test');
  assert.deepEqual(steps[recheck].env, { TGZ: PACKED_TGZ, EXPECTED_SHA256: '${{ steps.pack.outputs.sha256 }}' });
  const upload = findIndex(steps, (s) => s.uses === 'actions/upload-artifact@v4', 'uploading the tarball');
  assert.deepEqual(steps[upload].with, { name: 'npm-tarball', path: PACKED_TGZ, 'if-no-files-found': 'error' });
  assert.ok(npm < install && install < verify && verify < pack && pack < smoke && smoke < recheck && recheck < upload, 'step order');
  assert.equal(upload, steps.length - 1, 'the upload is the last step');
});

test("release: dry-run runs the build job's steps word for word, so a PR rehearses the tag build", () => {
  const { jobs } = release();
  assert.deepEqual(sharedBuildSteps(jobs['dry-run'].steps), sharedBuildSteps(jobs.build.steps));
  // pnpm, node, npm, install, build + verify, pack, Playwright version, cache, Chromium, smoke.
  assert.equal(sharedBuildSteps(jobs.build.steps).length, 10);
});

test('release: the Pack shell writes the tarball path, name and sha256, and refuses zero or two tarballs', () => {
  const pack = release().jobs.build.steps.find((s) => s.id === 'pack');
  const dir = mkdtempSync(join(tmpdir(), 'bit-pack-'));
  try {
    const bin = join(dir, 'bin');
    mkdirSync(bin);
    // A stand-in pnpm: `pnpm --dir packages/react pack --pack-destination DIR` writes STUB_COUNT tarballs.
    writeFileSync(join(bin, 'pnpm'), '#!/bin/bash\nmkdir -p "$5"\nfor ((i = 1; i <= STUB_COUNT; i++)); do printf "tarball %s" "$i" > "$5/bit-ds-react-9.9.$i.tgz"; done\n');
    chmodSync(join(bin, 'pnpm'), 0o755);
    const run = (count, name) => {
      const temp = join(dir, name);
      const output = join(dir, `${name}.out`);
      writeFileSync(output, '');
      const result = runShell(pack, { PATH: `${bin}:${process.env.PATH}`, RUNNER_TEMP: temp, GITHUB_OUTPUT: output, STUB_COUNT: String(count) }, dir);
      return { result, outputs: readOutputs(output), temp };
    };
    const one = run(1, 'one');
    assert.equal(one.result.status, 0, one.result.stderr);
    assert.deepEqual(one.outputs, {
      tgz: join(one.temp, 'out', 'bit-ds-react-9.9.1.tgz'),
      name: 'bit-ds-react-9.9.1.tgz',
      sha256: sha256('tarball 1'),
      integrity: sri('tarball 1'),
    });
    for (const count of [0, 2]) {
      const bad = run(count, `n${count}`);
      assert.notEqual(bad.result.status, 0, `${count} tarballs must fail`);
      assert.match(bad.result.stdout, new RegExp(`expected exactly one tarball, found ${count}`));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The smoke test runs freshly installed registry code. If it changed the tarball, build fails here,
// before anyone is asked to approve a publish, instead of at publish's own hash check.
test('release: the build recheck fails when the tarball changed after Pack hashed it', () => {
  const recheck = release().jobs.build.steps.find((s) => s.id === 'recheck');
  const dir = mkdtempSync(join(tmpdir(), 'bit-recheck-'));
  try {
    const tgz = join(dir, 'bit-ds-react-0.1.1.tgz');
    writeFileSync(tgz, 'the packed tarball');
    const run = (expected) => runShell(recheck, { TGZ: tgz, EXPECTED_SHA256: expected }, dir);
    assert.equal(run(sha256('the packed tarball')).status, 0);
    const changed = run(sha256('what Pack hashed before the smoke test'));
    assert.notEqual(changed.status, 0, 'a changed tarball fails the build');
    assert.match(changed.stdout, /changed after it was packed/);
    assert.notEqual(run('').status, 0, 'no hash from Pack fails too');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('release: publish needs guard and build, uses npm-publish and may mint an OIDC token', () => {
  const job = release().jobs.publish;
  assert.deepEqual([job.needs].flat(), ['guard', 'build']);
  assert.equal(job.environment?.name ?? job.environment, 'npm-publish');
  assert.deepEqual(job.permissions, { contents: 'read', 'id-token': 'write' });
});

test('release: publish downloads the artifact, checks its hash, decides, then publishes that file', () => {
  const { steps } = release().jobs.publish;
  assert.equal(steps.length, 7, 'checkout, node, npm, download, verify, decide, publish: nothing else');
  const checkout = findIndex(steps, (s) => s.uses === 'actions/checkout@v4', 'checking out');
  const node = findIndex(steps, (s) => s.uses === 'actions/setup-node@v4', 'setting up node');
  assert.deepEqual(steps[node].with, { 'node-version': 22, 'registry-url': 'https://registry.npmjs.org' });
  const npm = findIndex(steps, (s) => runOf(s) === NPM_PIN, 'installing the pinned npm');
  const download = findIndex(steps, (s) => s.uses === 'actions/download-artifact@v4', 'downloading the tarball');
  assert.deepEqual(steps[download].with, { name: 'npm-tarball', path: '${{ runner.temp }}/release' });
  const verify = findIndex(steps, (s) => s.id === 'tarball', 'verifying the tarball');
  assert.deepEqual(steps[verify].env, {
    TGZ_NAME: '${{ needs.build.outputs.tgz-name }}',
    EXPECTED_SHA256: '${{ needs.build.outputs.sha256 }}',
    EXPECTED_INTEGRITY: '${{ needs.build.outputs.integrity }}',
  });
  // verify-install compares npm's dist.integrity with this, so it travels build -> publish -> verify-install.
  assert.deepEqual(release().jobs.publish.outputs, { integrity: '${{ steps.tarball.outputs.integrity }}' });
  const decide = findIndex(steps, (s) => s.id === 'decide' && runOf(s) === 'node scripts/release-steps.mjs should-publish', 'deciding');
  const publish = findIndex(steps, (s) => /\bnpm publish\b/.test(runOf(s)), 'publishing');
  assert.ok(checkout < node && node < npm && npm < download && download < verify && verify < decide && decide < publish, 'step order');

  const step = steps[publish];
  // The tarball path reaches the shell through env, never as ${{ }} text inside the script.
  assert.equal(runOf(step), 'npm publish "$TGZ" --provenance --access public');
  assert.equal(step.env?.TGZ, '${{ steps.tarball.outputs.tgz }}', 'publishes the file whose hash was checked');
  assert.equal(step.id, 'publish');
  assert.equal(step.env?.NODE_AUTH_TOKEN, '${{ secrets.NPM_TOKEN }}');
  assert.match(String(step.if), /steps\.decide\.outputs\.publish == 'true'/);
});

test('release: publish publishes only a new version whose tarball checked out', () => {
  const { steps } = release().jobs.publish;
  const published = (opts) => simulate(steps, opts).includes('publish');
  const newVersion = { outputs: { decide: { publish: 'true' } } };
  assert.equal(published(newVersion), true, 'new version: publish');
  assert.equal(published({ outputs: { decide: { publish: 'false' } } }), false, 're-run, version exists: skip');
  assert.equal(published({ ...newVersion, results: { tarball: 'failure' } }), false, 'hash mismatch: never publish');
  assert.equal(published({ ...newVersion, results: { decide: 'failure' } }), false, 'decide failed');
});

test('release: the tarball check passes only the one file the build job hashed', () => {
  const verify = release().jobs.publish.steps.find((s) => s.id === 'tarball');
  const dir = mkdtempSync(join(tmpdir(), 'bit-verify-'));
  const NAME = 'bit-ds-react-0.1.1.tgz';
  const GOOD = sha256('the packed tarball');
  try {
    const check = (label, { files = { [NAME]: 'the packed tarball' }, name = NAME, sha = GOOD, integrity = sri('the packed tarball') } = {}) => {
      const temp = join(dir, label);
      mkdirSync(join(temp, 'release'), { recursive: true });
      for (const [file, text] of Object.entries(files)) writeFileSync(join(temp, 'release', file), text);
      const output = join(temp, 'github-output');
      writeFileSync(output, '');
      const result = runShell(verify, { RUNNER_TEMP: temp, GITHUB_OUTPUT: output, TGZ_NAME: name, EXPECTED_SHA256: sha, EXPECTED_INTEGRITY: integrity }, dir);
      return { ok: result.status === 0, out: result.stdout, outputs: readOutputs(output), temp };
    };
    const good = check('good');
    assert.equal(good.ok, true, good.out);
    assert.deepEqual(good.outputs, { tgz: join(good.temp, 'release', NAME), integrity: sri('the packed tarball') });
    const refused = {
      tampered: check('tampered', { files: { [NAME]: 'a swapped tarball' } }),
      'no sha256': check('nosha', { sha: '' }),
      'uppercase sha256': check('upper', { sha: GOOD.toUpperCase() }),
      'another name': check('rename', { name: 'bit-ds-react-0.1.2.tgz' }),
      'a path as the name': check('path', { name: '../release/x.tgz' }),
      'an extra file': check('extra', { files: { [NAME]: 'the packed tarball', 'other.tgz': 'x' } }),
      'a hidden extra file': check('hidden', { files: { [NAME]: 'the packed tarball', '.npmrc': 'x' } }),
      'an empty artifact': check('empty', { files: {} }),
      'another integrity': check('integrity', { integrity: sri('another tarball') }),
      // Each check must hold on its own: a swapped file whose integrity was forged to match still fails on sha256.
      'tampered, integrity forged': check('forged', { files: { [NAME]: 'a swapped tarball' }, integrity: sri('a swapped tarball') }),
      'no integrity': check('nointegrity', { integrity: '' }),
    };
    for (const [label, result] of Object.entries(refused)) {
      assert.equal(result.ok, false, `${label} must fail`);
      assert.deepEqual(result.outputs, {}, `${label}: no tgz output`);
    }
    assert.match(refused.tampered.out, /sha256 mismatch/);
    assert.match(refused['another integrity'].out, /integrity mismatch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('release: verify-install needs publish and checks the install with no credential', () => {
  const job = release().jobs['verify-install'];
  assert.deepEqual([job.needs].flat(), ['publish']);
  assert.doesNotMatch(String(job.if), STATUS_FUNCTION, 'runs only when publish succeeded (published or skipped as existing)');
  const runs = job.steps.filter((s) => s.run);
  assert.deepEqual(runs.map(runOf), ['node scripts/release-steps.mjs verify-install "${GITHUB_REF_NAME#v}"']);
  assert.deepEqual(runs[0].env, { EXPECTED_INTEGRITY: '${{ needs.publish.outputs.integrity }}' }, 'checks npm serves the bytes build packed');
});

// --- release.yml: the Pages site -------------------------------------------------------------
// The site build both chains share: the gallery, then the versioned site with cached archives,
// ending with the Pages artifact upload. No Pages permission, nothing deployed here.
const assertBuildsVersionedSite = (job, label) => {
  const { steps } = job;
  const checkout = steps.find((s) => s.uses === 'actions/checkout@v4');
  assert.equal(checkout.with?.['fetch-depth'], 0, `${label}: full history, so the tags exist`);
  const gallery = findIndex(steps, (s) => runOf(s) === 'pnpm gallery:build', `${label}: running gallery:build`);
  const key = findIndex(
    steps,
    (s) => s.id === 'archives' && /node scripts\/build-versioned-site\.mjs --cache-key/.test(runOf(s)) && /key=.*>> "\$GITHUB_OUTPUT"/.test(runOf(s)),
    `${label}: naming the archive cache from the archive tags`,
  );
  const cache = findIndex(
    steps,
    (s) => s.uses === 'actions/cache@v4' && s.with?.path === '${{ runner.temp }}/archive-cache',
    `${label}: caching the archives`,
  );
  assert.equal(steps[cache].with.key, '${{ steps.archives.outputs.key }}', `${label}: the cache is keyed on the archive tags`);
  assert.equal(steps[cache].with['restore-keys'], CACHE_PREFIX, `${label}: a new tag reuses archives built by this recipe only`);
  const site = findIndex(
    steps,
    (s) => runOf(s) === 'node scripts/build-versioned-site.mjs --out "$RUNNER_TEMP/site" --cache "$RUNNER_TEMP/archive-cache"',
    `${label}: building the versioned site`,
  );
  const upload = findIndex(steps, (s) => s.uses === 'actions/upload-pages-artifact@v3', `${label}: uploading the pages artifact`);
  assert.ok(gallery < key && key < cache && cache < site && site < upload, `${label}: step order`);
  assert.equal(upload, steps.length - 1, `${label}: the upload is the last step`);
  // `with:` is not a shell, so $RUNNER_TEMP would stay literal there.
  assert.equal(steps[upload].with.path, '${{ runner.temp }}/site', `${label}: uploads the versioned site`);
  // The default is 1 day. site-build runs before the publish approval, so a slow approval must not
  // leave deploy with an expired artifact after npm already has the release.
  assert.equal(steps[upload].with['retention-days'], 7, `${label}: the site artifact outlives a slow approval`);
  assert.ok(!steps.some((s) => s.uses === 'actions/deploy-pages@v4'), `${label}: never deploys`);
};

const assertPagesDeployJob = (job, label) => {
  assert.equal(job.environment.name, 'github-pages', label);
  assert.equal(job.environment.url, '${{ steps.deployment.outputs.page_url }}', label);
  assert.deepEqual(job.permissions, { contents: 'read', pages: 'write', 'id-token': 'write' }, label);
  assert.deepEqual(job.steps, [{ id: 'deployment', uses: 'actions/deploy-pages@v4' }], `${label}: deploy-pages and nothing else`);
};

test('release: site-build and docs-build build the same site, with no Pages permission', () => {
  const { jobs } = release();
  for (const name of SITE_BUILD_JOBS) assertBuildsVersionedSite(jobs[name], name);
  assert.deepEqual(jobs['site-build'].steps, jobs['docs-build'].steps, 'one recipe for both deploys');
});

test('release: deploy needs site-build and verify-install, so the site changes only after a good publish', () => {
  const { jobs } = release();
  assert.deepEqual([jobs.deploy.needs].flat(), ['site-build', 'verify-install']);
  assert.deepEqual([jobs['site-build'].needs].flat(), ['guard']);
  assert.doesNotMatch(String(jobs.deploy.if), STATUS_FUNCTION, 'deploy runs only when everything it needs succeeded');
  assertPagesDeployJob(jobs.deploy, 'deploy');
});

// --- release.yml: the docs deploy without a release ------------------------------------------
// docs-check runs the guard; docs-build and docs (the Pages deploy) run only when it says so.
const GUARD_LATEST = "LATEST=$(git tag --list 'v[0-9]*' --merged HEAD --sort=-v:refname | grep -Ev -- '-' | head -1 || true)";
const GUARD_DIFF = 'git diff --quiet "$LATEST" HEAD -- packages/ "${IGNORED[@]}"';
const GUARD_EXCLUDES = [
  ':(exclude,glob)packages/**/*.test.*',
  ':(exclude,glob)packages/**/__tests__/**',
  ':(exclude,glob)packages/**/src/test/**',
  ':(exclude,glob)packages/**/vitest.*',
  ':(exclude)packages/react/scripts/verify-dist.mjs',
  ':(exclude)packages/react/scripts/expected-exports.mjs',
];
const GUARD_NOTICE = '::notice::packages/ changed since $LATEST; docs deploy waits for the next release';
const docsGuard = () => release().jobs['docs-check'].steps.find((s) => s.id === 'released');

test('release: docs-check runs the guard right after checkout and outputs deploy', () => {
  const job = release().jobs['docs-check'];
  assert.equal(job.needs, undefined, 'docs-check does not wait for a release');
  assert.deepEqual(job.outputs, { deploy: '${{ steps.released.outputs.deploy }}' });
  const { steps } = job;
  assert.equal(steps.length, 2, 'checkout and the guard, nothing else');
  assert.equal(steps[0].uses, 'actions/checkout@v4');
  assert.equal(steps[0].with['fetch-depth'], 0, 'full history, so the tags exist');
  assert.equal(steps[1].id, 'released');
});

test('release: the docs guard compares packages/ with the latest release tag on HEAD', () => {
  const run = runOf(docsGuard());
  assert.ok(run.includes(GUARD_LATEST), 'reads the latest release tag merged into HEAD, skipping pre-releases, pipefail-safe');
  assert.ok(run.includes(GUARD_DIFF), 'diffs packages/ against it, minus the ignored paths');
  const listed = /IGNORED=\(\n([\s\S]*?)\n\s*\)/.exec(run)?.[1].split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^'|'$/g, ''));
  assert.deepEqual(listed, GUARD_EXCLUDES, 'the exclude list is exactly the agreed test-only paths, nothing broader');
  assert.ok(run.includes(GUARD_NOTICE), 'says why it skipped');
});

test('release: docs-build and docs run only when docs-check says deploy, and docs deploys only', () => {
  const { jobs } = release();
  assert.deepEqual([jobs['docs-build'].needs].flat(), ['docs-check']);
  assert.deepEqual([jobs.docs.needs].flat(), ['docs-check', 'docs-build']);
  for (const name of ['docs-build', 'docs']) {
    const job = jobs[name];
    assert.equal(job.if, "needs.docs-check.outputs.deploy == 'true'", name);
    const runs = (deploy) => evaluate(job.if, { github: BRANCH_PUSH, needs: { 'docs-check': { outputs: { deploy } } } });
    assert.equal(runs('true'), true, name);
    assert.equal(runs('false'), false, name);
    assert.equal(runs(''), false, `${name}: no output (docs-check skipped or failed): no deploy`);
    for (const step of job.steps) assert.equal(step.if, undefined, `${name} ${keyOf(step)}: the job-level gate is enough`);
  }
  assertPagesDeployJob(jobs.docs, 'docs');
});

// --- release.yml: the pull request rehearsal -------------------------------------------------
test('release: dry-run smoke-tests, dry-runs the publish of a new version and builds the gallery', () => {
  const { steps } = release().jobs['dry-run'];
  const pack = findIndex(steps, (s) => s.id === 'pack', 'packing');
  const smoke = findIndex(steps, (s) => s.id === 'smoke', 'running smoke:full');
  assertSmokesThePackedTarball(steps, pack, smoke);
  const dry = findIndex(steps, (s) => runOf(s) === 'npm publish "$TGZ" --dry-run --access public' && s.env?.TGZ === PACKED_TGZ, 'dry-run publishing');
  const gallery = findIndex(steps, (s) => runOf(s) === 'pnpm gallery:build', 'building the gallery');
  assert.ok(smoke < dry && dry < gallery, 'step order');
  // npm 11 refuses even a dry run over a published version, so the dry run follows should-publish.
  const ran = (publish) => simulate(steps, { outputs: { decide: { publish } } }).includes(keyOf(steps[dry]));
  assert.equal(ran('true'), true, 'dry-run publishes a new version');
  assert.equal(ran('false'), false, 'dry-run skips a version that is already on npm');
});

test('release: dry-run builds the versioned site with v0.1.0 as an older line, then checks it', () => {
  const { steps } = release().jobs['dry-run'];
  const checkout = steps.find((s) => s.uses === 'actions/checkout@v4');
  assert.equal(checkout.with?.['fetch-depth'], 0, 'full history, so v0.1.0 exists');
  const gallery = findIndex(steps, (s) => runOf(s) === 'pnpm gallery:build', 'building the gallery');
  const build = findIndex(
    steps,
    (s) => runOf(s) === 'node scripts/build-versioned-site.mjs --out "$RUNNER_TEMP/site" --as-older v0.1.0',
    'building the versioned site',
  );
  // --check asserts: index.html at the root, v0.1/index.html, a valid versions.json, and the
  // banner script in the archives only (see checkSite in build-versioned-site.mjs).
  const check = findIndex(
    steps,
    (s) => runOf(s) === 'node scripts/build-versioned-site.mjs --check "$RUNNER_TEMP/site" --as-older v0.1.0',
    'checking the versioned site',
  );
  assert.ok(gallery < build && build < check, 'step order');
  assert.ok(!steps.some((s) => s.uses?.startsWith('actions/upload-pages-artifact') || s.uses?.startsWith('actions/deploy-pages')), 'never deploys');
});

// --- both files: pinned actions and the shared setup ---------------------------------------
test('both: the workflows folder holds exactly ci.yml and release.yml, so every workflow is checked here', () => {
  assert.deepEqual(readdirSync(new URL('../.github/workflows/', import.meta.url)).sort(), ['ci.yml', 'release.yml']);
});

test('both: actions are pinned to the agreed major tags, with the ci.yml pnpm and node setup', () => {
  for (const [file, wf] of BOTH()) {
    for (const { job, step } of allSteps(wf)) {
      if (step.uses) assert.ok(PINNED_ACTIONS.has(step.uses), `${file} ${job}: ${step.uses} is not an agreed pin`);
      if (step.uses === 'pnpm/action-setup@v4') assert.equal(step.with.version, '9.15.9', `${file} ${job}`);
      if (step.uses === 'actions/setup-node@v4') assert.equal(step.with['node-version'], 22, `${file} ${job}`);
      if (/^pnpm install\b/.test(runOf(step))) assert.equal(runOf(step), 'pnpm install --frozen-lockfile', `${file} ${job}`);
    }
    for (const [job, def] of Object.entries(wf.jobs)) {
      if (!(def.steps ?? []).some((s) => /^pnpm install\b/.test(runOf(s)))) continue;
      const node = def.steps.find((s) => s.uses === 'actions/setup-node@v4');
      assert.equal(node?.with.cache, 'pnpm', `${file} ${job} caches the pnpm store`);
      assert.ok(def.steps.some((s) => s.uses === 'pnpm/action-setup@v4'), `${file} ${job} sets up pnpm`);
    }
  }
});

test('both: every Playwright browser cache is keyed on the Playwright version', () => {
  for (const [file, wf] of BOTH()) {
    for (const [job, def] of Object.entries(wf.jobs)) {
      const steps = def.steps ?? [];
      if (!steps.some((s) => /playwright install/.test(runOf(s)))) continue;
      const cache = steps.find((s) => s.uses === 'actions/cache@v4');
      assert.equal(cache?.with.path, '~/.cache/ms-playwright', `${file} ${job}`);
      const id = /\$\{\{\s*steps\.([\w-]+)\.outputs\.version\s*\}\}/.exec(cache.with.key)?.[1];
      assert.ok(id, `${file} ${job}: the cache key uses a version output`);
      const reader = steps.find((s) => s.id === id);
      assert.match(runOf(reader), /playwright(\/test)?\/package\.json'\)\.version/, `${file} ${job} reads the installed version`);
    }
  }
});
