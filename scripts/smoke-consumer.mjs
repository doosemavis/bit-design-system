// Proves a stranger can `npm install` the packed @bit-ds/react into a fresh project.
// Steps: build → pnpm pack → temp project → npm install <tarball> → import ESM + CJS →
// check CSS files → typecheck a small TS consumer against the shipped declarations.
// With SMOKE_TARBALL=<path to a .tgz>, it skips the build and pack and tests that tarball,
// so release.yml smoke-tests the exact file it publishes.
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { EXPECTED } from '../packages/react/scripts/expected-exports.mjs';
import { INSTALL_COMMANDS, PACKAGE_NAME, STYLE_IMPORTS, fullFile } from '../apps/gallery/src/content/snippets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reactPkg = join(root, 'packages', 'react');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });

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

// Ask the OS for a free port, then release it for vite preview to take.
const freePort = () =>
  new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });

const galleryPkg = JSON.parse(readFileSync(join(root, 'apps', 'gallery', 'package.json'), 'utf8'));
const versionOf = (name) => {
  const v = galleryPkg.dependencies?.[name] ?? galleryPkg.devDependencies?.[name];
  assert.ok(v, `apps/gallery/package.json has no ${name}`);
  return v;
};

// Vite minifies `@import url("...")` to `@import"..."`, so accept both forms.
const THEME_FONTS_IMPORT = /^@import\s*(?:url\()?["']https:\/\/fonts\.googleapis\.com\/css2\?[^"']*["']\)?\s*;/;

// Stage 5: a real Vite app built from the tarball and the shared snippets, checked in Chromium.
async function viteStage(app, tarballPath) {
  runLoudly(
    `npm install --no-audit --no-fund --loglevel=error "${tarballPath}" vite@"${versionOf('vite')}" @vitejs/plugin-react@"${versionOf('@vitejs/plugin-react')}" react@"${versionOf('react')}" react-dom@"${versionOf('react-dom')}"`,
    app,
    'vite-stage npm install failed',
  );
  mkdirSync(join(app, 'src'), { recursive: true });
  writeFileSync(
    join(app, 'vite.config.js'),
    `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n`,
  );
  writeFileSync(
    join(app, 'index.html'),
    `<!doctype html>\n<html lang="en">\n  <head><meta charset="UTF-8" /><title>smoke</title></head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`,
  );
  writeFileSync(
    join(app, 'src', 'main.jsx'),
    `${STYLE_IMPORTS}\nimport { createRoot } from 'react-dom/client';\nimport { colorMode } from '${PACKAGE_NAME}';\nimport App from './App.jsx';\n\nwindow.bitColorMode = colorMode;\ncreateRoot(document.getElementById('root')).render(<App />);\n`,
  );
  writeFileSync(
    join(app, 'src', 'App.jsx'),
    `${fullFile({ importLine: `import { Button } from '${PACKAGE_NAME}';`, element: '<Button>Save</Button>' })}\nexport default Example;\n`,
  );
  runLoudly('npx vite build', app, 'vite build failed');

  const assets = join(app, 'dist', 'assets');
  const cssFile = readdirSync(assets).find((f) => f.endsWith('.css'));
  assert.ok(cssFile, 'vite build produced no CSS');
  const css = readFileSync(join(assets, cssFile), 'utf8').trimStart();
  const fontsImport = THEME_FONTS_IMPORT.exec(css)?.[0];
  assert.ok(fontsImport, `built CSS must start with the Google Fonts @import, but starts with: ${css.slice(0, 120)}`);
  console.log(`fonts @import first in built CSS: ${fontsImport}`);

  const port = await freePort();
  const preview = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: app,
    stdio: 'pipe',
    detached: true,
  });
  let previewLog = '';
  preview.stdout.on('data', (d) => (previewLog += d));
  preview.stderr.on('data', (d) => (previewLog += d));
  let browser;
  try {
    const url = `http://127.0.0.1:${port}/`;
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      if (preview.exitCode !== null) throw new Error(`vite preview exited early:\n${previewLog}`);
      ready = await fetch(url).then((r) => r.ok, () => false);
      if (!ready) await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(ready, `vite preview never answered on ${url}:\n${previewLog}`);

    const { chromium } = await import('playwright');
    browser = await chromium.launch();
    const page = await browser.newPage();
    // Not 'load': that waits on Google Fonts. The button wait below is the readiness check.
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const button = page.locator('button.bit-button');
    await button.waitFor({ state: 'visible', timeout: 15_000 });
    const classes = (await button.getAttribute('class')).split(/\s+/);
    for (const c of ['bit-button', 'bit-primary']) assert.ok(classes.includes(c), `button lacks ${c}: ${classes.join(' ')}`);
    const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(bg, 'rgb(124, 58, 237)');
    // The service drives the same attribute the CSS reads: set('dark') must land on <html>, and the
    // packed CSS must answer it, so the page background token changes from its light value.
    const pageBg = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bit-color-bg').trim());
    const lightBg = await pageBg();
    assert.ok(lightBg, '--bit-color-bg is not set on <html>: the packed theme CSS did not load');
    await page.evaluate(() => window.bitColorMode.set('dark'));
    const mode = await page.evaluate(() => document.documentElement.dataset.mode);
    assert.equal(mode, 'dark', `colorMode.set('dark') left data-mode as ${mode}`);
    const darkBg = await pageBg();
    assert.notEqual(darkBg, lightBg, `colorMode.set('dark') left --bit-color-bg at its light value ${lightBg}`);
    console.log(
      `vite OK: Button renders with bit-button and bit-primary classes and background ${bg}; colorMode.set("dark") sets data-mode="dark" and --bit-color-bg ${lightBg} -> ${darkBg}`,
    );
  } finally {
    await browser?.close();
    try {
      process.kill(-preview.pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
}

// Use SMOKE_TARBALL when set (resolved from where the command was run), else build and pack into `work`.
function obtainTarball(work) {
  const given = process.env.SMOKE_TARBALL;
  if (given) {
    const tarballPath = resolve(process.env.INIT_CWD ?? process.cwd(), given);
    assert.ok(existsSync(tarballPath), `SMOKE_TARBALL does not exist: ${tarballPath}`);
    console.log(`SMOKE_TARBALL set: testing ${tarballPath} (skipping pnpm build and pnpm pack)`);
    return tarballPath;
  }
  run('pnpm build', reactPkg);
  run(`pnpm pack --pack-destination "${work}"`, reactPkg);
  const tarball = readdirSync(work).find((f) => f.endsWith('.tgz'));
  assert.ok(tarball, 'pnpm pack produced no tarball');
  return join(work, tarball);
}

// 1. Get the tarball: the one given in SMOKE_TARBALL, or a fresh build and pack
const work = mkdtempSync(join(tmpdir(), 'bit-smoke-'));
try {
  const tarballPath = obtainTarball(work);

  // The tarball must carry the version in packages/react/package.json.
  const { name: realName, version: realVersion } = JSON.parse(readFileSync(join(reactPkg, 'package.json'), 'utf8'));
  const packed = JSON.parse(run(`tar -xzOf "${tarballPath}" package/package.json`, work));
  assert.equal(packed.version, realVersion, `tarball version ${packed.version} differs from packages/react/package.json ${realVersion}`);

  // The shared snippets must name the real package, and prepack must put README and LICENSE in the tarball.
  assert.equal(PACKAGE_NAME, realName, 'snippets.mjs PACKAGE_NAME differs from packages/react/package.json name');
  for (const [pm, cmd] of Object.entries(INSTALL_COMMANDS)) {
    assert.ok(cmd.endsWith(` ${realName}`), `INSTALL_COMMANDS.${pm} must end with " ${realName}": ${cmd}`);
  }
  const files = run(`tar -tzf "${tarballPath}"`, work).split('\n');
  for (const f of ['package/README.md', 'package/LICENSE']) assert.ok(files.includes(f), `tarball is missing ${f}`);

  // 2. A fresh consumer project installed with npm; the react/react-dom peers, plus
  // typescript and the React type packages needed to typecheck the dist declarations,
  // resolve from the registry.
  const app = join(work, 'consumer');
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));
  run(
    `npm install --no-audit --no-fund --loglevel=error "${tarballPath}" typescript @types/react @types/react-dom`,
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

  if (process.argv.includes('--vite') || process.env.SMOKE_VITE === '1') await viteStage(app, tarballPath);
} finally {
  rmSync(work, { recursive: true, force: true });
}
