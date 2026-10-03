// Generates assets/bit-logo.svg: the bit wordmark ("bit" in its 64-bit style, with "DESIGN" over "SYSTEM"
// to its right, centred on the word) on a snug card, static and fully self-contained. An image can't
// advance per page load, so the README shows the still era (64). Fonts are read from the @fontsource
// packages and embedded as base64 so GitHub can render it.
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

// Lockup proportions, matching components/logo.css: the caption is 0.26em of the root and the 64-bit word
// 1.04em, so the caption is a quarter of the word; tracking 0.14em, leading 1.3, gap 0.4em.
const WORD_SIZE = 72;
const CAPTION_SIZE = WORD_SIZE / 4;
const CAPTION_TRACKING = 0.14 * CAPTION_SIZE;
const CAPTION_LEADING = 1.3 * CAPTION_SIZE;
const GAP = 0.4 * WORD_SIZE;
const CAPTION_LINES = ['DESIGN', 'SYSTEM'];
const MARGIN = 24; // even, from the card's outer edge to the ink on every side

// 64-bit layering (px): the deepest drop layer is offset this far, and the face stroke is this wide.
const DROP = 6;
const STROKE = 3;

// Ink metrics per em, measured from the embedded fonts (canvas measureText).
const LILITA_BIT = { inkLeft: 0.05, advance: 1.161, ascent: 0.709, descent: 0.01 };
const PS2P = { capTop: 1, capBottom: 0.125, lastGlyphInk: 0.875 };

const round = (n) => Math.round(n * 10) / 10;

// The word: ink starts at the left margin and its ascender at the top margin.
const X = round(MARGIN - LILITA_BIT.inkLeft * WORD_SIZE + STROKE / 2);
const WORD_Y = round(MARGIN + LILITA_BIT.ascent * WORD_SIZE + STROKE / 2);
// The drop layers are unstroked, so the lowest ink is the deepest drop (or the face stroke, if deeper).
const WORD_INK_BOTTOM = WORD_Y + LILITA_BIT.descent * WORD_SIZE + Math.max(DROP, STROKE / 2);
const WORD_MIDDLE = (MARGIN + WORD_INK_BOTTOM) / 2;

// The caption: two lines whose ink block is centred on the word's ink (face plus extrusion).
const CAPTION_X = round(X + LILITA_BIT.advance * WORD_SIZE + GAP);
const CAPTION_INK_TOP = -PS2P.capTop * CAPTION_SIZE; // relative to the first baseline
const CAPTION_INK_BOTTOM = CAPTION_LEADING - PS2P.capBottom * CAPTION_SIZE;
const CAPTION_Y = round(WORD_MIDDLE - (CAPTION_INK_TOP + CAPTION_INK_BOTTOM) / 2);
const CAPTION_CHARS = Math.max(...CAPTION_LINES.map((line) => line.length));
const CAPTION_INK_RIGHT =
  CAPTION_X + (CAPTION_CHARS - 1) * (CAPTION_SIZE + CAPTION_TRACKING) + PS2P.lastGlyphInk * CAPTION_SIZE;

const WIDTH = Math.round(CAPTION_INK_RIGHT + MARGIN);
const HEIGHT = Math.round(WORD_INK_BOTTOM + MARGIN);

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
  `<text x="${round(X + dx)}" y="${round(WORD_Y + dx)}" font-family="'Lilita One'" font-size="${WORD_SIZE}" fill="${fill}"${extra}>bit</text>`;

// 64-bit: two ink layers for the hard drop, four coin-shade layers for the extrusion, then the face.
const word64 = [
  ...[DROP, DROP - 1].map((o) => word(o, INK)),
  ...[4, 3, 2, 1].map((o) => word(o, COIN_SHADE)),
  word(0, COIN, ` stroke="${INK}" stroke-width="${STROKE}" paint-order="stroke fill"`),
].join('\n  ');

const caption = CAPTION_LINES.map(
  (line, i) =>
    `<text x="${CAPTION_X}" y="${round(CAPTION_Y + i * CAPTION_LEADING)}" font-family="'Press Start 2P'" font-size="${round(CAPTION_SIZE)}" letter-spacing="${round(CAPTION_TRACKING)}" fill="${SLATE}">${line}</text>`,
).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="bit Design System">
<style>
${fonts}
</style>
<rect x="1.5" y="1.5" width="${WIDTH - 3}" height="${HEIGHT - 3}" rx="14" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
<g>
  ${word64}
</g>
${caption}
</svg>
`;

mkdirSync(resolve(root, 'assets'), { recursive: true });
writeFileSync(resolve(root, 'assets/bit-logo.svg'), svg);
console.log(`wrote assets/bit-logo.svg (${(svg.length / 1024).toFixed(0)} KB)`);
