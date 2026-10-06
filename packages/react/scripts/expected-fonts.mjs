// The fonts power-up.css self-hosts: exactly the families and weights its old Google Fonts @import loaded.
// One list for verify-dist (the built dist/themes/fonts/) and scripts/smoke-consumer.mjs (a real Vite app in
// Chromium), so they cannot drift apart. build-css.mjs copies the files from the @fontsource packages.
export const THEME_FONTS = Object.freeze([
  { family: 'Lilita One', id: 'lilita-one', weights: [400] },
  { family: 'Nunito', id: 'nunito', weights: [600, 700, 800] },
  { family: 'Press Start 2P', id: 'press-start-2p', weights: [400] },
  { family: 'Audiowide', id: 'audiowide', weights: [400] },
  { family: 'JetBrains Mono', id: 'jetbrains-mono', weights: [400, 700] },
]);

/** Each face is split into these subsets, each its own @font-face with its own unicode-range. */
export const FONT_SUBSETS = Object.freeze(['latin', 'latin-ext']);

/** Every file in dist/themes/fonts/: one woff2 per family, weight and subset, and each family's OFL license. */
export const FONT_FILES = Object.freeze([
  ...THEME_FONTS.flatMap(({ id, weights }) =>
    weights.flatMap((weight) => FONT_SUBSETS.map((subset) => `${id}-${subset}-${weight}-normal.woff2`)),
  ),
  ...THEME_FONTS.map(({ id }) => `OFL-${id}.txt`),
]);
