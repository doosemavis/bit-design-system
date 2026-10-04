// Copies the repo-root README and LICENSE into the package so npm ships them.
// Both copies are gitignored. Runs from `npm pack` and `npm publish`.
import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(pkgDir, '../..');

for (const file of ['README.md', 'LICENSE']) {
  copyFileSync(resolve(root, file), resolve(pkgDir, file));
}
