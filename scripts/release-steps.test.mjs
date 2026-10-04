import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTag, expectedTag, retry, shouldPublish } from './release-steps.mjs';

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
test('retry gives up after 6 attempts and says so', async () => {
  let calls = 0;
  await assert.rejects(retry(async () => { calls += 1; throw new Error('404'); }, { sleep: async () => {} }),
    /failed after 6 attempts: 404/);
  assert.equal(calls, 6);
});
