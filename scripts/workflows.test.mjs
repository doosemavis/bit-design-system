// Structure tests for .github/workflows/ci.yml and release.yml.
// actionlint is not installed here, so these parse the YAML and check the parts a typo would break:
// triggers, jobs, needs, environments, permissions, step order and the step `if:` logic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const load = (name) => parse(readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8'));
const ci = () => load('ci.yml');
const release = () => load('release.yml');

const TAG_PUSH = { event_name: 'push', ref: 'refs/tags/v0.1.0', workflow: 'Release' };
const BRANCH_PUSH = { event_name: 'push', ref: 'refs/heads/main', workflow: 'Release' };
const PULL_REQUEST = { event_name: 'pull_request', ref: 'refs/pull/7/merge', workflow: 'Release' };

const PINNED_ACTIONS = new Set([
  'actions/checkout@v4',
  'pnpm/action-setup@v4',
  'actions/setup-node@v4',
  'actions/cache@v4',
  'actions/upload-artifact@v4',
  'actions/configure-pages@v5',
  'actions/upload-pages-artifact@v3',
  'actions/deploy-pages@v4',
]);

const runOf = (step) => String(step?.run ?? '');
const keyOf = (step) => step.id ?? step.name ?? step.uses ?? runOf(step);
const findIndex = (steps, predicate, label) => {
  const index = steps.findIndex(predicate);
  assert.ok(index >= 0, `no step ${label}`);
  return index;
};
const allSteps = (workflow) =>
  Object.entries(workflow.jobs).flatMap(([job, def]) => (def.steps ?? []).map((step) => ({ job, step })));

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

// --- ci.yml -------------------------------------------------------------------------------
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
test('release: triggers on pull requests and on v* tag pushes, with read-only default permissions', () => {
  const wf = release();
  assert.ok('pull_request' in wf.on, 'on.pull_request');
  assert.deepEqual(wf.on.push.tags, ['v*']);
  assert.equal(wf.on.push.branches, undefined, 'push runs only for tags');
  assert.deepEqual(wf.permissions, { contents: 'read' });
});

test('release: the jobs are exactly dry-run, guard, publish and deploy', () => {
  assert.deepEqual(Object.keys(release().jobs).sort(), ['deploy', 'dry-run', 'guard', 'publish']);
});

test('release: dry-run runs only on pull requests; the others only on tag pushes', () => {
  const { jobs } = release();
  const runsOn = (github) => Object.keys(jobs).filter((name) => evaluate(jobs[name].if ?? 'true', { github })).sort();
  assert.deepEqual(runsOn(PULL_REQUEST), ['dry-run']);
  assert.deepEqual(runsOn(TAG_PUSH), ['deploy', 'guard', 'publish']);
  assert.deepEqual(runsOn(BRANCH_PUSH), []);
});

test('release: concurrency queues every tag in one group and never cancels a release', () => {
  const { concurrency } = release();
  const group = (github) => interpolate(concurrency.group, github);
  assert.equal(group(TAG_PUSH), group({ ...TAG_PUSH, ref: 'refs/tags/v0.2.0' }), 'two tags share one group');
  assert.notEqual(group(PULL_REQUEST), group(TAG_PUSH), 'pull requests do not queue behind releases');
  assert.equal(interpolate(concurrency['cancel-in-progress'], TAG_PUSH), 'false');
});

// --- release.yml: jobs ----------------------------------------------------------------------
test('release: guard checks the tag and that the commit is on main', () => {
  const { steps } = release().jobs.guard;
  const checkout = steps.find((s) => s.uses === 'actions/checkout@v4');
  assert.equal(checkout.with['fetch-depth'], 0);
  findIndex(steps, (s) => runOf(s).includes('node scripts/release-steps.mjs check-tag "$GITHUB_REF_NAME"'), 'running check-tag');
  const onMain = steps.find((s) => runOf(s).includes('git merge-base --is-ancestor "$GITHUB_SHA" origin/main'));
  assert.ok(onMain, 'guard asserts the tag commit is on main');
  assert.match(runOf(onMain), /git fetch[^\n]* origin main/);
});

test('release: publish needs guard, uses npm-publish and may mint an OIDC token', () => {
  const job = release().jobs.publish;
  assert.deepEqual([job.needs].flat(), ['guard']);
  assert.equal(job.environment?.name ?? job.environment, 'npm-publish');
  assert.deepEqual(job.permissions, { contents: 'read', 'id-token': 'write' });
});

test('release: publish upgrades npm, packs, smoke-tests, decides, publishes the tarball, then verifies', () => {
  const { steps } = release().jobs.publish;
  const node = steps.find((s) => s.uses === 'actions/setup-node@v4');
  assert.equal(node.with['registry-url'], 'https://registry.npmjs.org');
  const npm = findIndex(steps, (s) => runOf(s) === 'npm i -g npm@^11.5.1', 'upgrading npm');
  const pack = findIndex(
    steps,
    (s) => runOf(s).includes('pnpm --dir packages/react pack --pack-destination "$RUNNER_TEMP/out"'),
    'packing into $RUNNER_TEMP/out',
  );
  const smoke = findIndex(steps, (s) => s.id === 'smoke' && runOf(s) === 'pnpm smoke:full', 'running smoke:full');
  const decide = findIndex(steps, (s) => s.id === 'decide' && runOf(s) === 'node scripts/release-steps.mjs should-publish', 'deciding');
  const publish = findIndex(steps, (s) => /\bnpm publish\b/.test(runOf(s)), 'publishing');
  const verify = findIndex(
    steps,
    (s) => s.id === 'verify' && runOf(s) === 'node scripts/release-steps.mjs verify-install "${GITHUB_REF_NAME#v}"',
    'running verify-install',
  );
  assert.ok(npm < pack && pack < smoke && smoke < decide && decide < publish && publish < verify, 'step order');

  const step = steps[publish];
  assert.equal(runOf(step), 'npm publish "$RUNNER_TEMP"/out/*.tgz --provenance --access public');
  assert.equal(step.id, 'publish');
  assert.equal(step.env?.NODE_AUTH_TOKEN, '${{ secrets.NPM_TOKEN }}');
  assert.match(String(step.if), /steps\.decide\.outputs\.publish == 'true'/);
});

test('release: the npm token reaches only the publish step', () => {
  for (const { job, step } of allSteps(release())) {
    const usesSecret = JSON.stringify(step).includes('secrets.');
    assert.equal(usesSecret, job === 'publish' && step.id === 'publish', `${job}: ${keyOf(step)}`);
  }
});

test('release: publish and verify-install run on the right outcomes', () => {
  const { steps } = release().jobs.publish;
  const did = (opts) => {
    const ran = simulate(steps, opts);
    return { published: ran.includes('publish'), verified: ran.includes('verify') };
  };
  const newVersion = { outputs: { decide: { publish: 'true' } } };
  const existing = { outputs: { decide: { publish: 'false' } } };
  assert.deepEqual(did(newVersion), { published: true, verified: true }, 'new version: publish, then verify');
  assert.deepEqual(did(existing), { published: false, verified: true }, 're-run, version exists: skip publish, still verify');
  assert.deepEqual(did({ ...newVersion, results: { smoke: 'failure' } }), { published: false, verified: false }, 'smoke failed');
  assert.deepEqual(did({ ...newVersion, results: { decide: 'failure' } }), { published: false, verified: false }, 'decide failed');
  assert.deepEqual(did({ ...newVersion, results: { publish: 'failure' } }), { published: true, verified: false }, 'publish failed');
});

test('release: deploy needs publish and ships the gallery to github-pages', () => {
  const job = release().jobs.deploy;
  assert.deepEqual([job.needs].flat(), ['publish']);
  assert.doesNotMatch(String(job.if), STATUS_FUNCTION, 'deploy runs only when publish succeeded');
  assert.equal(job.environment.name, 'github-pages');
  assert.equal(job.environment.url, '${{ steps.deployment.outputs.page_url }}');
  assert.deepEqual(job.permissions, { contents: 'read', pages: 'write', 'id-token': 'write' });
  const { steps } = job;
  const build = findIndex(steps, (s) => runOf(s) === 'pnpm gallery:build', 'running gallery:build');
  const configure = findIndex(steps, (s) => s.uses === 'actions/configure-pages@v5', 'configuring pages');
  const upload = findIndex(steps, (s) => s.uses === 'actions/upload-pages-artifact@v3', 'uploading the pages artifact');
  const deploy = findIndex(steps, (s) => s.uses === 'actions/deploy-pages@v4', 'deploying pages');
  assert.ok(build < configure && configure < upload && upload < deploy, 'step order');
  assert.equal(steps[upload].with.path, 'apps/gallery/dist');
  assert.equal(steps[deploy].id, 'deployment');
});

test('release: dry-run packs, dry-runs the publish, smoke-tests in Chromium and builds the gallery, with no secrets', () => {
  const job = release().jobs['dry-run'];
  assert.equal(job.environment, undefined);
  assert.equal(job.permissions, undefined, 'dry-run keeps the read-only default');
  assert.doesNotMatch(JSON.stringify(job), /secrets\.|id-token/);
  const { steps } = job;
  const pack = findIndex(
    steps,
    (s) => runOf(s).includes('pnpm --dir packages/react pack --pack-destination "$RUNNER_TEMP/out"'),
    'packing',
  );
  const dry = findIndex(steps, (s) => runOf(s) === 'npm publish "$RUNNER_TEMP"/out/*.tgz --dry-run --access public', 'dry-run publishing');
  const install = findIndex(steps, (s) => runOf(s) === 'pnpm exec playwright install --with-deps chromium', 'installing Chromium');
  const smoke = findIndex(steps, (s) => runOf(s) === 'pnpm smoke:full', 'running smoke:full');
  const gallery = findIndex(steps, (s) => runOf(s) === 'pnpm gallery:build', 'building the gallery');
  assert.ok(pack < dry && install < smoke && dry < gallery && smoke < gallery, 'step order');
  // npm 11 refuses even a dry run over a published version, so the dry run follows should-publish.
  const ran = (publish) => simulate(steps, { outputs: { decide: { publish } } }).includes(keyOf(steps[dry]));
  assert.equal(ran('true'), true, 'dry-run publishes a new version');
  assert.equal(ran('false'), false, 'dry-run skips a version that is already on npm');
});

test('release: no step outside publish runs npm publish without --dry-run', () => {
  const real = allSteps(release()).filter(({ step }) => /\bnpm publish\b/.test(runOf(step)) && !runOf(step).includes('--dry-run'));
  assert.deepEqual(real.map(({ job }) => job), ['publish']);
});

// --- both files: pinned actions and the shared setup ---------------------------------------
test('both: actions are pinned to the agreed major tags, with the ci.yml pnpm and node setup', () => {
  for (const [file, wf] of [['ci.yml', ci()], ['release.yml', release()]]) {
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
  for (const [file, wf] of [['ci.yml', ci()], ['release.yml', release()]]) {
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
