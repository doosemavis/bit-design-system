// Proves the built package is consumable: ESM + CJS entries, types, bundled CSS, theme files.
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { EXPECTED } from './expected-exports.mjs';
import { FONT_FILES } from './expected-fonts.mjs';
import { cssRefs, isRemote, remoteImports, thirdPartyFontHosts, unresolvedRefs } from './css-refs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../dist');
const require = createRequire(import.meta.url);

// 0. Client boundary: the hooks and toggle need a 'use client' directive for React Server Components.
for (const file of ['index.js', 'index.cjs']) {
  const source = readFileSync(resolve(dist, file), 'utf8');
  assert.ok(/^\s*'use client';/.test(source), `dist/${file} must start with 'use client'; (tsup banner missing)`);
}

// 1. CJS entry
const cjs = require(resolve(dist, 'index.cjs'));
for (const name of EXPECTED) assert.ok(cjs[name], `CJS export missing: ${name}`);
assert.equal(cjs.PREFIX, 'bit');
assert.equal(typeof cjs.COLOR_MODE_SCRIPT, 'string', 'CJS export missing: COLOR_MODE_SCRIPT');
assert.equal(typeof cjs.useColorMode, 'function', 'CJS export missing: useColorMode');
assert.equal(typeof cjs.colorMode?.set, 'function', 'CJS export missing: colorMode.set');
assert.equal(typeof cjs.ColorModeService, 'function', 'CJS export ColorModeService must be a class');
assert.equal(typeof cjs.colorMode, 'object', 'CJS export colorMode must be the shared instance');
assert.ok(Array.isArray(cjs.SEMANTIC_TOKENS), 'CJS export missing: SEMANTIC_TOKENS');

// 2. ESM entry
const esm = await import(resolve(dist, 'index.js'));
for (const name of EXPECTED) assert.ok(esm[name], `ESM export missing: ${name}`);
assert.equal(typeof esm.COLOR_MODE_SCRIPT, 'string', 'ESM export missing: COLOR_MODE_SCRIPT');
assert.equal(typeof esm.useColorMode, 'function', 'ESM export missing: useColorMode');
assert.equal(typeof esm.colorMode?.set, 'function', 'ESM export missing: colorMode.set');
assert.equal(typeof esm.ColorModeService, 'function', 'ESM export ColorModeService must be a class');
assert.equal(typeof esm.colorMode, 'object', 'ESM export colorMode must be the shared instance');
assert.ok(Array.isArray(esm.SEMANTIC_TOKENS), 'ESM export missing: SEMANTIC_TOKENS');

// 2b. SEMANTIC_TOKENS checked against the package itself (nothing outside dist, so any Node >= 20 runs it):
// both builds agree, no blanks or duplicates, and the names are exactly the --bit-* custom properties
// each shipped theme declares (tier-1 --bit-palette-* excluded).
const tokens = esm.SEMANTIC_TOKENS;
assert.deepEqual([...cjs.SEMANTIC_TOKENS], [...tokens], 'CJS and ESM SEMANTIC_TOKENS differ');
assert.ok(tokens.length > 0, 'SEMANTIC_TOKENS is empty');
assert.equal(new Set(tokens).size, tokens.length, 'SEMANTIC_TOKENS has duplicates');
const themesDir = resolve(dist, 'themes');
const themeFiles = readdirSync(themesDir).filter((f) => f.endsWith('.css'));
assert.ok(themeFiles.length > 0, 'dist/themes has no CSS');
for (const file of themeFiles) {
  const declared = new Set(
    [...readFileSync(resolve(themesDir, file), 'utf8').matchAll(/(--bit-[\w-]+)\s*:/g)].map((m) => m[1]).filter((n) => !n.startsWith('--bit-palette-')),
  );
  const missing = tokens.filter((t) => !declared.has(t));
  const extra = [...declared].filter((t) => !tokens.includes(t));
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, `SEMANTIC_TOKENS and themes/${file} disagree`);
}

// 3. Types
assert.ok(existsSync(resolve(dist, 'index.d.cts')), 'index.d.cts missing (CJS types entry)');
const dtsFiles = {
  'index.d.ts': readFileSync(resolve(dist, 'index.d.ts'), 'utf8'),
  'index.d.cts': readFileSync(resolve(dist, 'index.d.cts'), 'utf8'),
};
// @bit-ds/core is a devDependency: it is never in the tarball, so the declarations must be
// self-contained. A substring check on 'Color' would pass even if the type still came from
// an unresolved `@bit-ds/core` import, so assert the shape directly instead.
for (const [file, contents] of Object.entries(dtsFiles)) {
  assert.ok(!/from\s+['"]@bit-ds\/core/.test(contents), `${file} still imports from @bit-ds/core (types must be self-contained)`);
  assert.ok(/declare\s+const\s+COLORS\b/.test(contents), `${file} missing local declaration: COLORS`);
  assert.ok(/type\s+Color\b/.test(contents), `${file} missing exported type: Color`);
}
for (const name of ['ButtonProps', 'BitLogoProps', 'Variant', 'Size', 'FieldProps', 'InputProps', 'SelectProps', 'SwitchProps', 'LinkProps', 'CodeProps', 'CodeBlockProps', 'SegmentedControlProps', 'TableProps', 'TableCellProps', 'HeadingProps', 'HeadingLevel', 'BoxProps', 'BoxElement']) {
  assert.ok(dtsFiles['index.d.ts'].includes(name), `index.d.ts missing type: ${name}`);
}

// 4. CSS bundle: system layer + every component, no unresolved local imports
const css = readFileSync(resolve(dist, 'styles.css'), 'utf8');
for (const needle of ['.bit-primary', '--_bit-color', '.bit-sm', '.bit-logo__caption', '.bit-button', '.bit-badge', '.bit-alert', '.bit-card__header', '.bit-stack', '.bit-text', '.bit-spinner', '.bit-logo', '.bit-mode-toggle', '.bit-field__error', '.bit-input', '.bit-select__control', '.bit-switch__track', '.bit-link', '.bit-code', '.bit-code__token', '.bit-code__copy', '.bit-segmented-control__label', '.bit-table__cell', '.bit-heading[data-level="6"]', '.bit-box[data-ml="64"]']) {
  assert.ok(css.includes(needle), `styles.css missing: ${needle}`);
}
assert.ok(!/@import\s+"\.\//.test(css), 'styles.css still contains a relative @import (bundling failed)');

// 4b. Box precedence: the tiers share one specificity, so source order decides. All four sides, then an axis,
// then one side; a side beats an axis beats all four only if bundling kept that order.
const BOX_TIERS = ['[data-p="0"]', '[data-px="0"]', '[data-pt="0"]'];
const tierAt = BOX_TIERS.map((needle) => css.indexOf(needle));
BOX_TIERS.forEach((needle, i) => assert.ok(tierAt[i] >= 0, `styles.css missing Box rule: ${needle}`));
assert.ok(
  tierAt[0] < tierAt[1] && tierAt[1] < tierAt[2],
  `styles.css Box precedence tiers out of order: expected ${BOX_TIERS.join(' < ')}, got offsets ${tierAt.join(', ')}`,
);

// 5. Themes copied, not bundled, with their self-hosted fonts beside them (security audit A1: no third-party request)
const theme = resolve(dist, 'themes/power-up.css');
assert.ok(existsSync(theme), 'themes/power-up.css missing');
assert.ok(readFileSync(theme, 'utf8').includes('--bit-color-primary'), 'theme lost its tokens');
// Every font file power-up.css names, and each family's SIL OFL 1.1 license, which must travel with the fonts.
const fontsDir = resolve(dist, 'themes/fonts');
for (const file of FONT_FILES) assert.ok(existsSync(resolve(fontsDir, file)), `themes/fonts/${file} missing`);
assert.deepEqual(readdirSync(fontsDir).sort(), [...FONT_FILES].sort(), 'themes/fonts holds exactly the expected fonts and licenses');
for (const file of FONT_FILES.filter((f) => f.startsWith('OFL-'))) {
  assert.match(readFileSync(resolve(fontsDir, file), 'utf8'), /SIL Open Font License, Version 1\.1/, `themes/fonts/${file} is not the OFL`);
}
const distFiles = readdirSync(dist, { recursive: true }).map((f) => f.split(sep).join('/'));
const distSet = new Set(distFiles);
for (const file of distFiles.filter((f) => f.endsWith('.css'))) {
  const source = readFileSync(resolve(dist, file), 'utf8');
  assert.deepEqual(remoteImports(source), [], `dist/${file} @imports a remote stylesheet`);
  assert.deepEqual(cssRefs(source).filter(isRemote), [], `dist/${file} loads a remote url()`);
  assert.deepEqual(unresolvedRefs(file, source, distSet), [], `dist/${file} names files that are not in dist`);
}
for (const file of distFiles.filter((f) => !f.endsWith('.woff2') && statSync(resolve(dist, f)).isFile())) {
  assert.deepEqual(thirdPartyFontHosts(readFileSync(resolve(dist, file), 'utf8')), [], `dist/${file} mentions a Google Fonts host`);
}

// 6. Publish metadata: what npm will ship and how it is described
const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8'));
assert.notEqual(pkg.private, true, 'package.json must not be private');
// The release guard ties the tag to this version, so here only its shape is checked.
assert.match(pkg.version, /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/, `package.json version is not semver: ${pkg.version}`);
assert.equal(pkg.repository?.url, 'git+https://github.com/doosemavis/bit-design-system.git', 'repository.url is wrong');
assert.equal(pkg.repository?.directory, 'packages/react', 'repository.directory is wrong');
assert.deepEqual(pkg.files, ['dist'], 'files must be exactly ["dist"]');
assert.equal(pkg.publishConfig?.access, 'public', 'publishConfig.access must be public');
assert.ok(!('@bit-ds/core' in (pkg.dependencies ?? {})), '@bit-ds/core must not be a runtime dependency');

console.log(`dist OK: ${EXPECTED.length} components, styles.css ${css.length} bytes, themes and ${FONT_FILES.length} font files present, nothing loaded from a third party`);
