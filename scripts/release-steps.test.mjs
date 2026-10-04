import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTag, expectedTag, isNotFound, retry, shouldPublish, waitForVersion } from './release-steps.mjs';

test('expectedTag prefixes v', () => assert.equal(expectedTag('0.1.0'), 'v0.1.0'));
test('checkTag passes on a match', () => assert.doesNotThrow(() => checkTag({ tag: 'v0.1.0', version: '0.1.0' })));
test('checkTag throws on a mismatch, naming both', () =>
  assert.throws(() => checkTag({ tag: 'v0.1.1', version: '0.1.0' }), /tag v0\.1\.1 does not match package version 0\.1\.0/));
test('shouldPublish is false when the version exists', () =>
  assert.equal(shouldPublish({ publishedVersions: ['0.1.0'], version: '0.1.0' }), false));
test('shouldPublish is true for a new version, and when nothing is published', () => {
  assert.equal(shouldPublish({ publishedVersions: ['0.1.0'], version: '0.1.1' }), true);
  assert.equal(shouldPublish({ publishedVersions: [], version: '0.1.0' }), true);
});
test('retry succeeds on attempt 3 without waiting for real', async () => {
  let calls = 0; const waits = [];
  const value = await retry(async () => { calls += 1; if (calls < 3) throw new Error('not yet'); return 'ok'; },
    { attempts: 6, delayMs: 10_000, sleep: async (ms) => { waits.push(ms); } });
  assert.equal(value, 'ok'); assert.equal(calls, 3); assert.deepEqual(waits, [10_000, 10_000]);
});
test('retry defaults to 10 attempts, 15 s apart, then gives up and says so', async () => {
  let calls = 0; const waits = [];
  await assert.rejects(retry(async () => { calls += 1; throw new Error('404'); }, { sleep: async (ms) => { waits.push(ms); } }),
    /failed after 10 attempts: 404/);
  assert.equal(calls, 10);
  assert.deepEqual(waits, Array(9).fill(15_000));
});

test('isNotFound is true for npm E404 output (stderr text and --json forms)', () => {
  assert.equal(isNotFound('npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/x'), true);
  assert.equal(isNotFound('{\n  "error": {\n    "code": "E404",\n    "summary": "Not Found"\n  }\n}'), true);
});
test('isNotFound is false for everything else', () => {
  assert.equal(isNotFound('<html><title>404 Not Found</title></html>'), false);
  assert.equal(isNotFound('npm error code ETIMEDOUT'), false);
  assert.equal(isNotFound('npm error code ENOTFOUND\nnpm error errno ENOTFOUND'), false);
  assert.equal(isNotFound('npm error code E401'), false);
  assert.equal(isNotFound('{"error":{"code":"E403"}}'), false);
  assert.equal(isNotFound(''), false);
});

// waitForVersion polls `npm view @bit-ds/react@VERSION version` with an injected runner, so nothing hits the network.
const e404 = () => Object.assign(new Error('Command failed'), { stderr: 'npm error code E404\nnpm error 404 Not Found' });

test('waitForVersion keeps polling through E404 and empty output, then proceeds once the version shows', async () => {
  const calls = []; const waits = [];
  const outputs = [() => { throw e404(); }, () => '', () => '0.1.1\n'];
  const run = (cmd, args) => { calls.push([cmd, ...args]); return outputs[calls.length - 1](); };
  await waitForVersion('0.1.1', { run, sleep: async (ms) => { waits.push(ms); } });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0], ['npm', 'view', '@bit-ds/react@0.1.1', 'version']);
  assert.deepEqual(waits, [15_000, 15_000]);
});
test('waitForVersion waits up to 40 attempts, 15 s apart (10 minutes), then fails with the attempt count', async () => {
  let calls = 0; const waits = [];
  await assert.rejects(
    waitForVersion('0.1.1', { run: () => { calls += 1; throw e404(); }, sleep: async (ms) => { waits.push(ms); } }),
    /failed after 40 attempts/,
  );
  assert.equal(calls, 40);
  assert.equal(waits.length, 39);
  assert.ok(waits.every((ms) => ms === 15_000));
});
test('waitForVersion fails at once on an error that is not E404, keeping the last 20 stderr lines', async () => {
  let calls = 0;
  const stderr = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n');
  const run = () => { calls += 1; throw Object.assign(new Error('boom'), { stderr }); };
  await assert.rejects(waitForVersion('0.1.1', { run, sleep: async () => {} }), (error) => {
    assert.match(error.message, /npm view @bit-ds\/react@0\.1\.1 failed/);
    assert.match(error.message, /line 30/);
    assert.match(error.message, /line 11/);
    assert.doesNotMatch(error.message, /line 10\b/);
    return true;
  });
  assert.equal(calls, 1);
});
test('waitForVersion treats a different version in the output as not yet', async () => {
  const outputs = ['0.1.0\n', '0.1.1\n']; let calls = 0;
  await waitForVersion('0.1.1', { run: () => outputs[calls++], sleep: async () => {} });
  assert.equal(calls, 2);
});
