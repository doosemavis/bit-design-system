// Proves a stranger can `npm install` the packed @bit-ds/react into a fresh project.
// Steps: build → pnpm pack → temp project → npm install <tarball> → import ESM + CJS →
// check CSS files → typecheck a small TS consumer against the shipped declarations.
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reactPkg = join(root, 'packages', 'react');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });

const EXPECTED = [
  'Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'ModeToggle', 'Spinner', 'Stack', 'Text',
  'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock', 'SegmentedControl',
  'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',
];

// Run a command, printing its stdout/stderr and rethrowing on failure so a broken
// consumer step fails loudly instead of an opaque non-zero exit.
const runLoudly = (cmd, cwd, failureMessage) => {
  try {
    return run(cmd, cwd);
  } catch (err) {
    console.error(err.stdout ?? '');
    console.error(err.stderr ?? '');
    throw new Error(`${failureMessage} (${cmd})`);
  }
};

// 1. Build and pack into a temp directory
const work = mkdtempSync(join(tmpdir(), 'bit-smoke-'));
try {
  run('pnpm build', reactPkg);
  run(`pnpm pack --pack-destination "${work}"`, reactPkg);
  const tarball = readdirSync(work).find((f) => f.endsWith('.tgz'));
  assert.ok(tarball, 'pnpm pack produced no tarball');

  // 2. A fresh consumer project installed with npm; the react/react-dom peers, plus
  // typescript and the React type packages needed to typecheck the dist declarations,
  // resolve from the registry.
  const app = join(work, 'consumer');
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));
  run(
    `npm install --no-audit --no-fund --loglevel=error "${join(work, tarball)}" typescript @types/react @types/react-dom`,
    app,
  );

  // 3. Import both entry points and check the CSS shipped
  writeFileSync(
    join(app, 'check.mjs'),
    `import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const expected = ${JSON.stringify(EXPECTED)};
const esm = await import('@bit-ds/react');
for (const n of expected) assert.ok(esm[n], 'ESM missing ' + n);
assert.equal(esm.PREFIX, 'bit');
assert.deepEqual([...esm.COLORS], ['primary', 'neutral', 'success', 'warning', 'danger']);
const require = createRequire(import.meta.url);
const cjs = require('@bit-ds/react');
for (const n of expected) assert.ok(cjs[n], 'CJS missing ' + n);
const dist = join(dirname(require.resolve('@bit-ds/react/package.json')), 'dist');
assert.ok(existsSync(join(dist, 'styles.css')), 'styles.css missing');
assert.ok(existsSync(join(dist, 'themes', 'power-up.css')), 'themes/power-up.css missing');
`,
  );
  runLoudly('node check.mjs', app, 'consumer runtime checks failed (node check.mjs)');

  // 4. Typecheck a small TS consumer against the shipped declarations (dist/index.d.ts):
  // proves the tarball's types are self-contained (no unresolved `@bit-ds/core` import).
  writeFileSync(
    join(app, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          moduleResolution: 'bundler',
          module: 'esnext',
          target: 'es2022',
          jsx: 'react-jsx',
          noEmit: true,
          skipLibCheck: false,
        },
        include: ['check.tsx'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(app, 'check.tsx'),
    `import { Button, COLORS } from '@bit-ds/react';
import type { Color } from '@bit-ds/react';

const c: Color = COLORS[0];

export function App() {
  return <Button color={c}>ok</Button>;
}
`,
  );
  runLoudly('npx tsc -p tsconfig.json', app, 'consumer type-check failed (npx tsc -p tsconfig.json)');

  console.log(`consumer OK: ${EXPECTED.length} components via ESM and CJS, CSS present, types check`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
