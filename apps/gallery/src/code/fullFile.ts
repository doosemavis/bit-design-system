import { fullFile as fullFileParts } from '../content/snippets.mjs';

/** Wrap a toJsx snippet (import line, blank line, element) in a file you can paste and run. Gallery-private. */
export function fullFile(jsx: string): string {
  const split = jsx.indexOf('\n\n');
  return fullFileParts({ importLine: jsx.slice(0, split), element: jsx.slice(split + 2) });
}
