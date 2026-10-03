// Bundles @bit-ds/core's CSS into dist/styles.css and copies theme files into dist/themes/.
// Consumers then import '@bit-ds/react/themes/power-up.css' and then '@bit-ds/react/styles.css'.
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
