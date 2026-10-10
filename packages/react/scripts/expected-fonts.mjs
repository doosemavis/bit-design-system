// The fonts power-up.css self-hosts: exactly the families and weights its old Google Fonts @import loaded, in
// every subset Google served for them (each @fontsource package's unicode.json, in its order: latin last).
// One list for verify-dist (the built dist/themes/fonts/) and scripts/smoke-consumer.mjs (a real Vite app in
// Chromium), so they cannot drift apart. build-css.mjs copies the files from the @fontsource packages.
export const THEME_FONTS = Object.freeze([
  { family: 'Lilita One', id: 'lilita-one', weights: [400], subsets: ['latin-ext', 'latin'] },
  {
    family: 'Nunito',
    id: 'nunito',
    weights: [600, 700, 800],
    // Text italic: the weights --bit-weight-normal and --bit-weight-bold use, upright and italic.
    italicWeights: [600, 800],
    subsets: ['cyrillic-ext', 'cyrillic', 'vietnamese', 'latin-ext', 'latin'],
  },
  { family: 'Press Start 2P', id: 'press-start-2p', weights: [400], subsets: ['cyrillic-ext', 'cyrillic', 'greek', 'latin-ext', 'latin'] },
  { family: 'Audiowide', id: 'audiowide', weights: [400], subsets: ['latin-ext', 'latin'] },
  {
    family: 'JetBrains Mono',
    id: 'jetbrains-mono',
    weights: [400, 700],
    subsets: ['cyrillic-ext', 'cyrillic', 'greek', 'vietnamese', 'latin-ext', 'latin'],
  },
]);

/** Text in each subset's unicode-range and no other's, so asking for it loads exactly that subset's file. */
export const SUBSET_SAMPLES = Object.freeze({
  latin: 'Aa',
  'latin-ext': 'ĀŁ', // Ā Ł
  cyrillic: 'Жж', // Ж ж
  'cyrillic-ext': 'Ѣѣ', // Ѣ ѣ
  greek: 'Ωλ', // Ω λ
  vietnamese: 'Ạạ', // Ạ ạ
});

/** One @font-face per family, style, weight and subset. */
export const FONT_FACES = Object.freeze(
  THEME_FONTS.flatMap(({ family, id, weights, italicWeights = [], subsets }) =>
    [
      ...weights.map((weight) => ({ weight, style: 'normal' })),
      ...italicWeights.map((weight) => ({ weight, style: 'italic' })),
    ].flatMap(({ weight, style }) =>
      subsets.map((subset) => ({ family, weight, style, subset, file: `${id}-${subset}-${weight}-${style}.woff2` })),
    ),
  ),
);

/** Every file in dist/themes/fonts/: one woff2 per face, and each family's OFL license. */
export const FONT_FILES = Object.freeze([...FONT_FACES.map(({ file }) => file), ...THEME_FONTS.map(({ id }) => `OFL-${id}.txt`)]);
