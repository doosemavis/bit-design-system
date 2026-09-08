// Generates assets/bit-logo.svg: the #-bit wordmark with the power-up cycle, fully self-contained.
// Fonts are read from the @fontsource packages and embedded as base64 so GitHub can render it in an <img>.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// power-up theme values (kept in sync by hand; this is a static brand asset)
const INK = '#1B1B2F';
const PRIMARY = '#FFCC00';
const PRIMARY_SOFT = '#FFF3BF';
const PRIMARY_HOVER = '#E0B000';
const WARNING = '#F5A623';
const DANGER = '#D42B26';
const CREAM = '#F5EEDC';

const INTERVAL_S = 5;
const CYCLE_S = INTERVAL_S * 4;

function fontFace(family, pkg, file) {
  const path = require.resolve(`${pkg}/files/${file}`);
  const b64 = readFileSync(path).toString('base64');
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:400;font-style:normal}`;
}

const fonts = [
  fontFace('Press Start 2P', '@fontsource/press-start-2p', 'press-start-2p-latin-400-normal.woff2'),
  fontFace('Lilita One', '@fontsource/lilita-one', 'lilita-one-latin-400-normal.woff2'),
  fontFace('Bungee', '@fontsource/bungee', 'bungee-latin-400-normal.woff2'),
].join('\n');

// Layout: numbers right-aligned at x=150, suffix starts at x=160, baseline y=86.
const X = 150;
const Y = 86;

const eras = [
  // 8-bit: flat pixel red
  `<g class="era"><text x="${X}" y="${Y - 3}" text-anchor="end" font-family="Press Start 2P" font-size="46" fill="${DANGER}">8</text></g>`,
  // 16-bit: banded fill + hard ink drop
  `<g class="era">
    <text x="${X + 2}" y="${Y - 1}" text-anchor="end" font-family="Press Start 2P" font-size="46" fill="${INK}">16</text>
    <text x="${X}" y="${Y - 3}" text-anchor="end" font-family="Press Start 2P" font-size="46" fill="url(#g16)">16</text>
  </g>`,
  // 32-bit: chrome gradient + white lip + ink drop
  `<g class="era">
    <text x="${X + 3}" y="${Y + 3}" text-anchor="end" font-family="Bungee" font-size="62" fill="${INK}">32</text>
    <text x="${X + 1}" y="${Y + 1}" text-anchor="end" font-family="Bungee" font-size="62" fill="#ffffff">32</text>
    <text x="${X}" y="${Y}" text-anchor="end" font-family="Bungee" font-size="62" fill="url(#g32)">32</text>
  </g>`,
  // 64-bit: extruded rounded type with ink stroke
  `<g class="era">
    ${[6, 5].map((o) => `<text x="${X + o}" y="${Y + o}" text-anchor="end" font-family="Lilita One" font-size="66" fill="${INK}">64</text>`).join('')}
    ${[4, 3, 2, 1].map((o) => `<text x="${X + o}" y="${Y + o}" text-anchor="end" font-family="Lilita One" font-size="66" fill="${PRIMARY_HOVER}">64</text>`).join('')}
    <text x="${X}" y="${Y}" text-anchor="end" font-family="Lilita One" font-size="66" fill="${PRIMARY}" stroke="${INK}" stroke-width="3" paint-order="stroke fill">64</text>
  </g>`,
];

const delays = eras.map((_, i) => `.era:nth-of-type(${i + 1}){animation-delay:${-(4 - i) * INTERVAL_S}s}`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 110" width="320" height="110" role="img" aria-label="bit">
<style>
${fonts}
.era{opacity:0;transform-box:fill-box;transform-origin:50% 100%;animation:cycle ${CYCLE_S}s step-end infinite}
${delays}
@keyframes cycle{
0%{opacity:1;transform:scale(.5)}0.6%{transform:scale(.75)}1.2%{transform:scale(1)}
1.8%{transform:scale(.5)}2.4%{transform:scale(.75)}3%{transform:scale(1)}
3.6%{transform:scale(.5)}4.2%{transform:scale(.75)}4.8%{opacity:1;transform:scale(1)}
25%{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.era{animation:none}.era:first-of-type{opacity:1}}
</style>
<defs>
  <linearGradient id="g16" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${PRIMARY_SOFT}"/><stop offset=".34" stop-color="${PRIMARY_SOFT}"/>
    <stop offset=".34" stop-color="${PRIMARY}"/><stop offset=".67" stop-color="${PRIMARY}"/>
    <stop offset=".67" stop-color="${WARNING}"/><stop offset="1" stop-color="${WARNING}"/>
  </linearGradient>
  <linearGradient id="g32" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".38" stop-color="#c9d8f0"/>
    <stop offset=".5" stop-color="#3b5b8c"/><stop offset=".58" stop-color="#9db4d6"/><stop offset="1" stop-color="#4e6fa3"/>
  </linearGradient>
</defs>
<rect width="320" height="110" rx="14" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
${eras.join('\n')}
<text x="160" y="${Y}" font-family="Lilita One" font-size="64" fill="${INK}">-bit</text>
</svg>
`;

mkdirSync(resolve(root, 'assets'), { recursive: true });
writeFileSync(resolve(root, 'assets/bit-logo.svg'), svg);
console.log(`wrote assets/bit-logo.svg (${(svg.length / 1024).toFixed(0)} KB)`);
