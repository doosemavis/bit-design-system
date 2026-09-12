// Bundles @bit/core's CSS into dist/styles.css and copies theme files into dist/themes/.
// Consumers then import '@bit/react/styles.css' and '@bit/react/themes/power-up.css'.
import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = resolve(here, '../../core/src');
const dist = resolve(here, '../dist');

await build({
  entryPoints: [resolve(coreSrc, 'index.css')],
  bundle: true,
  outfile: resolve(dist, 'styles.css'),
  logLevel: 'info',
});

mkdirSync(resolve(dist, 'themes'), { recursive: true });
cpSync(resolve(coreSrc, 'themes'), resolve(dist, 'themes'), { recursive: true });
console.log('copied themes to dist/themes');
