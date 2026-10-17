import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_FILES } from '../pages/architecture/architectureDoc';

// A path, not a URL: under jsdom the global URL is jsdom's, which node's fs doesn't take.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const REPO_URL = 'https://github.com/doosemavis/bit-design-system/';

/** GitHub's anchor for a heading, as readme-sync.test.ts computes it: lowercase, punctuation dropped, spaces to dashes. */
export const githubSlug = (heading: string) => heading.toLowerCase().replace(/[^\w\- ]/g, '').replaceAll(' ', '-');

/**
 * Why a link into this repo would not land, or null when it does. A file link (REPO_FILES…) must name a file the repo
 * has, and its #anchor, if any, a heading in it. Any other link must still be this repo's page on GitHub (a commit,
 * say): checking that it exists needs the network, so only its shape is checked.
 */
export function missingRepoLink(href: string): string | null {
  if (!href.startsWith(REPO_FILES)) return href.startsWith(REPO_URL) ? null : `${href} is not a page of this repo`;
  const [path, anchor] = href.slice(REPO_FILES.length).split('#') as [string, string | undefined];
  const file = resolve(REPO_ROOT, path);
  if (!existsSync(file)) return `${path} is not a file in the repo`;
  if (!anchor) return null;
  const headings = [...readFileSync(file, 'utf8').matchAll(/^#{1,6} (.+)$/gm)].map((match) => githubSlug(match[1]!));
  return headings.includes(anchor) ? null : `${path} has no heading #${anchor}`;
}
