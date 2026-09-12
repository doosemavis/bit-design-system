// Proves a stranger can `npm install` the packed @bit/react into a fresh project.
// Steps: build → pnpm pack → temp project → npm install <tarball> → import ESM + CJS → check CSS files.
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reactPkg = join(root, 'packages', 'react');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });

const EXPECTED = ['Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'Spinner', 'Stack', 'Text'];

// 1. Build and pack into a temp directory
const work = mkdtempSync(join(tmpdir(), 'bit-smoke-'));
try {
  run('pnpm build', reactPkg);
  run(`pnpm pack --pack-destination "${work}"`, reactPkg);
  const tarball = readdirSync(work).find((f) => f.endsWith('.tgz'));
  assert.ok(tarball, 'pnpm pack produced no tarball');

  // 2. A fresh consumer project installed with npm; the react/react-dom peers resolve from the registry
  const app = join(work, 'consumer');
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));
  run(`npm install --no-audit --no-fund --loglevel=error "${join(work, tarball)}"`, app);

  // 3. Import both entry points and check the CSS shipped
  writeFileSync(
    join(app, 'check.mjs'),
    `import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const expected = ${JSON.stringify(EXPECTED)};
const esm = await import('@bit/react');
for (const n of expected) assert.ok(esm[n], 'ESM missing ' + n);
assert.equal(esm.PREFIX, 'bit');
assert.deepEqual([...esm.COLORS], ['primary', 'neutral', 'success', 'warning', 'danger']);
const require = createRequire(import.meta.url);
const cjs = require('@bit/react');
for (const n of expected) assert.ok(cjs[n], 'CJS missing ' + n);
const dist = join(dirname(require.resolve('@bit/react/package.json')), 'dist');
assert.ok(existsSync(join(dist, 'styles.css')), 'styles.css missing');
assert.ok(existsSync(join(dist, 'themes', 'power-up.css')), 'themes/power-up.css missing');
console.log('consumer OK: ' + expected.length + ' components via ESM and CJS, CSS present');
`,
  );
  console.log(run('node check.mjs', app).trim());
} finally {
  rmSync(work, { recursive: true, force: true });
}
