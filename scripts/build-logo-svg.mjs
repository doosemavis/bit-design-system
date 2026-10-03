// Generates assets/bit-logo.svg: the bit wordmark ("bit" in its 64-bit style over "DESIGN SYSTEM"),
// static and fully self-contained. An image can't advance per page load, so the README shows the still
// era (64). Fonts are read from the @fontsource packages and embedded as base64 so GitHub can render it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// power-up light values (kept in sync by hand; this is a static brand asset)
const INK = '#151515';
const PAPER = '#EEEFE9';
const SLATE = '#4A4A5E';
const COIN = '#FFCC00';
const COIN_SHADE = '#E0B000';

const WIDTH = 320;
const HEIGHT = 130;
const X = 32;
const WORD_Y = 80;
const CAPTION_Y = 108;

function fontFace(family, pkg, file) {
  const path = require.resolve(`${pkg}/files/${file}`);
  const b64 = readFileSync(path).toString('base64');
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:400;font-style:normal}`;
}

const fonts = [
  fontFace('Press Start 2P', '@fontsource/press-start-2p', 'press-start-2p-latin-400-normal.woff2'),
  fontFace('Lilita One', '@fontsource/lilita-one', 'lilita-one-latin-400-normal.woff2'),
].join('\n');

const word = (dx, fill, extra = '') =>
  `<text x="${X + dx}" y="${WORD_Y + dx}" font-family="'Lilita One'" font-size="78" fill="${fill}"${extra}>bit</text>`;

// 64-bit: two ink layers for the hard drop, four coin-shade layers for the extrusion, then the face.
const word64 = [
  ...[6, 5].map((o) => word(o, INK)),
  ...[4, 3, 2, 1].map((o) => word(o, COIN_SHADE)),
  word(0, COIN, ` stroke="${INK}" stroke-width="3" paint-order="stroke fill"`),
].join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="bit Design System">
<style>
${fonts}
</style>
<rect x="1.5" y="1.5" width="${WIDTH - 3}" height="${HEIGHT - 3}" rx="14" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
<g>
  ${word64}
</g>
<text x="${X}" y="${CAPTION_Y}" font-family="'Press Start 2P'" font-size="13" letter-spacing="2.3" fill="${SLATE}">DESIGN SYSTEM</text>
</svg>
`;

mkdirSync(resolve(root, 'assets'), { recursive: true });
writeFileSync(resolve(root, 'assets/bit-logo.svg'), svg);
console.log(`wrote assets/bit-logo.svg (${(svg.length / 1024).toFixed(0)} KB)`);
