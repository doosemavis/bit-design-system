// Repo-level supply-chain settings: which dependencies may run install scripts, the Dependabot
// config and the secret-file ignores (security.md C1, C7, D2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('pnpm: no dependency may run an install script unless it is allowlisted on purpose', () => {
  // pnpm 9 runs only the build scripts of the packages listed here; an empty list runs none.
  assert.deepEqual(readJson('package.json').pnpm?.onlyBuiltDependencies, []);
});
