// Bundles @bit-ds/core's CSS into dist/styles.css and copies theme files into dist/themes/.
// Consumers then import '@bit-ds/react/themes/power-up.css' and then '@bit-ds/react/styles.css'.
// The icon classes ship as dist/icons.css (opt-in), with the Material Symbols licence in dist/icons/.
// Each theme's fonts are self-hosted: every url("./fonts/<file>.woff2") a theme names is copied from its
// @fontsource devDependency into dist/themes/fonts/, with that family's SIL OFL 1.1 license as OFL-<id>.txt.
import { build } from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = resolve(here, '../../core/src');
const dist = resolve(here, '../dist');
const require = createRequire(import.meta.url);

await build({
  entryPoints: [resolve(coreSrc, 'index.css')],
  bundle: true,
  outfile: resolve(dist, 'styles.css'),
  logLevel: 'info',
});

mkdirSync(resolve(dist, 'themes'), { recursive: true });
cpSync(resolve(coreSrc, 'themes'), resolve(dist, 'themes'), { recursive: true });
console.log('copied themes to dist/themes');

// Icons: the opt-in class form ships as its own stylesheet, never inside styles.css. The artwork's
// Apache 2.0 licence travels with it, as the fonts' OFL does.
copyFileSync(resolve(coreSrc, 'icons/icons.generated.css'), resolve(dist, 'icons.css'));
mkdirSync(resolve(dist, 'icons'), { recursive: true });
copyFileSync(require.resolve('@material-symbols/svg-700/LICENSE'), resolve(dist, 'icons/LICENSE-material-symbols.txt'));
console.log('copied icons.css and the Material Symbols licence');

// The @fontsource packages (exact versions, in package.json devDependencies) the theme fonts come from.
const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8'));
const FONT_IDS = Object.keys(pkg.devDependencies)
  .filter((name) => name.startsWith('@fontsource/'))
  .map((name) => name.slice('@fontsource/'.length));

// A face: its subset from the file name (<id>-<subset>-<weight>-normal.woff2) and its declared unicode-range.
const FACE = /@font-face\s*\{[^}]*?url\("\.\/fonts\/([\w-]+\.woff2)"\)[^}]*?unicode-range:\s*([^;]+);/g;

/** Copy one font file from its @fontsource package, checking the theme's unicode-range against the package's. */
function copyFont(file, declaredRange, fontsDir) {
  const id = FONT_IDS.find((candidate) => file.startsWith(`${candidate}-`));
  if (!id) throw new Error(`build-css: no @fontsource devDependency provides ${file} (have: ${FONT_IDS.join(', ')})`);
  const subset = file.slice(id.length + 1).replace(/-\d+-normal\.woff2$/, '');
  const ranges = JSON.parse(readFileSync(require.resolve(`@fontsource/${id}/unicode.json`), 'utf8'));
  if (ranges[subset]?.replace(/\s/g, '') !== declaredRange.replace(/\s/g, '')) {
    throw new Error(`build-css: ${file} declares unicode-range ${declaredRange}, but @fontsource/${id} has ${ranges[subset]}`);
  }
  copyFileSync(require.resolve(`@fontsource/${id}/files/${file}`), resolve(fontsDir, file));
  return id;
}

const fontsDir = resolve(dist, 'themes/fonts');
mkdirSync(fontsDir, { recursive: true });
const themeFiles = readdirSync(resolve(dist, 'themes')).filter((f) => f.endsWith('.css'));
const faces = themeFiles.flatMap((f) => [...readFileSync(resolve(dist, 'themes', f), 'utf8').matchAll(FACE)]);
const families = new Set(faces.map(([, file, range]) => copyFont(file, range, fontsDir)));
for (const id of families) copyFileSync(require.resolve(`@fontsource/${id}/LICENSE`), resolve(fontsDir, `OFL-${id}.txt`));
console.log(`copied ${faces.length} font files and ${families.size} OFL licenses to dist/themes/fonts`);
