// Proves the built package is consumable: ESM + CJS entries, types, bundled CSS, theme files.
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const require = createRequire(import.meta.url);

const EXPECTED = ['Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'Spinner', 'Stack', 'Text'];

// 1. CJS entry
const cjs = require(resolve(dist, 'index.cjs'));
for (const name of EXPECTED) assert.ok(cjs[name], `CJS export missing: ${name}`);
assert.equal(cjs.PREFIX, 'bit');

// 2. ESM entry
const esm = await import(resolve(dist, 'index.js'));
for (const name of EXPECTED) assert.ok(esm[name], `ESM export missing: ${name}`);

// 3. Types
const dts = readFileSync(resolve(dist, 'index.d.ts'), 'utf8');
for (const name of ['ButtonProps', 'BitLogoProps', 'Tone', 'Variant', 'Size']) {
  assert.ok(dts.includes(name), `index.d.ts missing type: ${name}`);
}

// 4. CSS bundle: system layer + every component, no unresolved local imports
const css = readFileSync(resolve(dist, 'styles.css'), 'utf8');
for (const needle of ['.bit-primary', '--_bit-tone', '.bit-sm', '@keyframes bit-power-up', '.bit-button', '.bit-badge', '.bit-alert', '.bit-card__header', '.bit-stack', '.bit-text', '.bit-spinner', '.bit-logo']) {
  assert.ok(css.includes(needle), `styles.css missing: ${needle}`);
}
assert.ok(!/@import\s+"\.\//.test(css), 'styles.css still contains a relative @import (bundling failed)');

// 5. Themes copied, not bundled (they keep their Google Fonts @import)
const theme = resolve(dist, 'themes/power-up.css');
assert.ok(existsSync(theme), 'themes/power-up.css missing');
assert.ok(readFileSync(theme, 'utf8').includes('--bit-color-primary'), 'theme lost its tokens');

console.log(`dist OK: ${EXPECTED.length} components, styles.css ${css.length} bytes, themes present`);
