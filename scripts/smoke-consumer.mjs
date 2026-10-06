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
import { FONT_FACES, FONT_FILES, SUBSET_SAMPLES } from '../packages/react/scripts/expected-fonts.mjs';
import { cssRefs, isRemote, remoteImports, thirdPartyFontHosts, unresolvedRefs } from '../packages/react/scripts/css-refs.mjs';
import { GLOBAL_CSS_IMPORTS, INSTALL_COMMANDS, PACKAGE_NAME, STYLE_IMPORTS, fullFile } from '../apps/gallery/src/content/snippets.mjs';
import { SMOKE_INSTALL_FLAGS, pinnedSpecs } from './smoke-pins.mjs';

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

// Installs the tarball plus the named registry packages at their exact SMOKE_PINS versions, with no
// lifecycle scripts. The peers (react, react-dom) are named too, so npm never picks them itself.
const installPinned = (app, tarballPath, names, failureMessage) =>
  runLoudly(
    ['npm install', ...SMOKE_INSTALL_FLAGS, `"${tarballPath}"`, ...pinnedSpecs(names).map((spec) => `"${spec}"`)].join(' '),
    app,
    failureMessage,
  );

// Security audit A1: CSS must load nothing from a third party, and every file it names must be in `files`
// (paths in the same scheme as `cssPath`). `where` names the CSS in failure messages.
function assertSelfContainedCss(where, cssPath, css, files) {
  assert.deepEqual(remoteImports(css), [], `${where}: @imports a remote stylesheet`);
  assert.deepEqual(cssRefs(css).filter(isRemote), [], `${where}: loads a remote url()`);
  assert.deepEqual(thirdPartyFontHosts(css), [], `${where}: mentions a Google Fonts host`);
  assert.deepEqual(unresolvedRefs(cssPath, css, files), [], `${where}: names files that are not there`);
}

// One @font-face per self-hosted family, weight and subset (36).
const FONT_FACE_COUNT = FONT_FACES.length;

// A Vite build's CSS: self-contained, and every @font-face came through, its font emitted beside the CSS
// (or, under Vite's 4 KB inline limit, kept as a data: URI).
function assertBuiltCss(where, outDir, cssFile) {
  const css = readFileSync(join(outDir, 'assets', cssFile), 'utf8');
  const files = new Set(readdirSync(join(outDir, 'assets')).map((f) => `assets/${f}`));
  assertSelfContainedCss(where, `assets/${cssFile}`, css, files);
  const faces = css.match(/@font-face\s*\{/g)?.length ?? 0;
  assert.equal(faces, FONT_FACE_COUNT, `${where}: built CSS has ${faces} @font-face rules, expected ${FONT_FACE_COUNT}`);
  return css;
}

// The other documented route: the same app with the styles as CSS @imports in its global stylesheet. Vite must still
// carry the theme's self-hosted fonts through, and the tokens and component styles must both land in the built CSS.
function globalCssBuild(app) {
  // A marker only index.css declares, so the check below proves the built CSS came through it.
  writeFileSync(join(app, 'src', 'index.css'), `${GLOBAL_CSS_IMPORTS}\n\n:root { --smoke-global-css: 1; }\n`);
  const main = readFileSync(join(app, 'src', 'main.jsx'), 'utf8');
  const swapped = main.replace(STYLE_IMPORTS, "import './index.css';");
  // Without this, a main.jsx that no longer holds STYLE_IMPORTS would build through the JS imports and pass.
  assert.notEqual(swapped, main, 'global stylesheet: main.jsx did not contain STYLE_IMPORTS, so nothing was swapped');
  writeFileSync(join(app, 'src', 'main.jsx'), swapped);
  try {
    runLoudly('npx --no -- vite build --outDir dist-global-css', app, 'vite build (global stylesheet) failed');
  } finally {
    writeFileSync(join(app, 'src', 'main.jsx'), main);
  }
  const assets = join(app, 'dist-global-css', 'assets');
  const cssFile = readdirSync(assets).find((f) => f.endsWith('.css'));
  assert.ok(cssFile, 'vite build (global stylesheet) produced no CSS');
  const css = assertBuiltCss('global stylesheet', join(app, 'dist-global-css'), cssFile);
  for (const needle of ['--bit-color-bg', '.bit-button', '--smoke-global-css']) assert.ok(css.includes(needle), `global stylesheet: built CSS lacks ${needle}`);
  console.log(`global stylesheet OK: ${FONT_FACE_COUNT} self-hosted @font-face rules, theme tokens and component styles present`);
}

// The woff2 files requested so far, by their source name (Vite keeps it, adding `-<hash>`).
const requestedFonts = (requests) =>
  requests.filter((u) => /\.woff2(\?|$)/.test(u)).map((u) => u.split('/').pop().replace(/-[\w-]{8}\.woff2.*$/, '.woff2'));

// unicode-range keeps the subsets lazy: with only the app's Latin text on the page, no other subset is fetched.
// Then the page renders sample text in every family, weight and subset, and each of those faces must reach
// status 'loaded', with no request (fonts included) leaving the app's own origin.
async function assertFontsLoadFromOrigin(page, origin, requests) {
  await page.evaluate(() => document.fonts.ready);
  const early = requestedFonts(requests);
  assert.ok(early.length > 0, 'the page rendered Latin text but requested no woff2 from the app');
  assert.deepEqual(early.filter((f) => !/-latin-\d+-normal\.woff2$/.test(f)), [], 'Latin-only text fetched another subset');

  const loaded = await page.evaluate(
    async ({ faces, samples }) => {
      for (const { family, weight, subset } of faces) {
        const el = document.createElement('span');
        el.style.cssText = `font-family: "${family}"; font-weight: ${weight}`;
        el.textContent = samples[subset];
        document.body.append(el);
      }
      document.body.getBoundingClientRect(); // lay the samples out, so the browser asks for their fonts
      await document.fonts.ready;
      // Name each loaded face's subset by the sample its (browser-normalised) unicode-range covers.
      const covers = (range, code) =>
        range.split(',').some((part) => {
          const [lo, hi = lo] = part.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16));
          return code >= lo && code <= hi;
        });
      return [...document.fonts]
        .filter((face) => face.status === 'loaded')
        .map((face) => {
          const subset = Object.keys(samples).find((s) => covers(face.unicodeRange, samples[s].codePointAt(0)));
          return `${face.family.replace(/"/g, '')} ${face.weight} ${subset}`;
        });
    },
    { faces: FONT_FACES, samples: SUBSET_SAMPLES },
  );
  const expected = FONT_FACES.map(({ family, weight, subset }) => `${family} ${weight} ${subset}`);
  assert.deepEqual([...loaded].sort(), [...expected].sort(), 'every self-hosted face, in every subset, must reach status "loaded"');
  const offOrigin = requests.filter((u) => !u.startsWith(`${origin}/`) && !u.startsWith('data:'));
  assert.deepEqual(offOrigin, [], `requests left ${origin}`);
  const fonts = requestedFonts(requests);
  assert.deepEqual(fonts.filter((f) => !FONT_FILES.includes(f)), [], 'requested a woff2 the theme does not ship');
  console.log(
    `fonts OK: Latin text fetched only latin files (${early.length}); samples in every subset loaded all ${loaded.length} faces, ${fonts.length} woff2 requests, all from ${origin}`,
  );
}

// Stage 5: a real Vite app built from the tarball and the shared snippets, checked in Chromium.
async function viteStage(app, tarballPath) {
  installPinned(app, tarballPath, ['vite', '@vitejs/plugin-react', 'react', 'react-dom'], 'vite-stage npm install failed');
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
  runLoudly('npx --no -- vite build', app, 'vite build failed');

  const assets = join(app, 'dist', 'assets');
  const cssFile = readdirSync(assets).find((f) => f.endsWith('.css'));
  assert.ok(cssFile, 'vite build produced no CSS');
  assertBuiltCss('vite build', join(app, 'dist'), cssFile);
  const woff2 = readdirSync(assets).filter((f) => f.endsWith('.woff2')).length;
  console.log(`vite build OK: ${FONT_FACE_COUNT} @font-face rules, ${woff2} woff2 files emitted beside the CSS, nothing from a third party`);

  globalCssBuild(app);

  const port = await freePort();
  const preview = spawn('npx', ['--no', '--', 'vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
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
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    // The button wait below is the readiness check.
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
    await assertFontsLoadFromOrigin(page, new URL(url).origin, requests);
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
  // come from the registry at the exact versions in smoke-pins.mjs.
  const app = join(work, 'consumer');
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));
  installPinned(app, tarballPath, ['react', 'react-dom', 'typescript', '@types/react', '@types/react-dom'], 'consumer npm install failed');

  // Security audit A1: no file in the package names a Google Fonts host, and its CSS loads nothing remote and
  // names only files the tarball carries. Read from the installed copy, which holds exactly the tarball's files.
  const installed = join(app, 'node_modules', ...realName.split('/'));
  const packaged = files.filter((f) => f.startsWith('package/') && !f.endsWith('/')).map((f) => f.slice('package/'.length));
  const packagedSet = new Set(packaged);
  for (const file of packaged.filter((f) => !f.endsWith('.woff2'))) {
    const text = readFileSync(join(installed, file), 'utf8');
    assert.deepEqual(thirdPartyFontHosts(text), [], `tarball ${file} mentions a Google Fonts host`);
    if (file.endsWith('.css')) assertSelfContainedCss(`tarball ${file}`, file, text, packagedSet);
  }
  const fonts = packaged.filter((f) => f.startsWith('dist/themes/fonts/'));
  console.log(`tarball OK: ${fonts.length} font and license files in dist/themes/fonts, every CSS url() resolves, no third-party host`);

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
  runLoudly('npx --no -- tsc -p tsconfig.json', app, 'consumer type-check failed (npx tsc -p tsconfig.json)');

  console.log(`consumer OK: ${EXPECTED.length} components via ESM and CJS, CSS present, types check`);

  if (process.argv.includes('--vite') || process.env.SMOKE_VITE === '1') await viteStage(app, tarballPath);
} finally {
  rmSync(work, { recursive: true, force: true });
}
