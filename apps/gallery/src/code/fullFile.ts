import { fullFile as fullFileParts } from '../content/snippets.mjs';

/**
 * Wrap a toJsx snippet in a file you can paste and run. Gallery-private. The snippet's blocks are separated by
 * blank lines: the import line, any `const` declarations, then the element. The consts stay at the top level,
 * between the import and `export function Example()`, so they ride along with the import line.
 */
export function fullFile(jsx: string): string {
  const [importLine = '', ...rest] = jsx.split('\n\n');
  const constCount = rest.findIndex((block) => !block.startsWith('const '));
  const elementAt = constCount === -1 ? rest.length : constCount;
  return fullFileParts({
    importLine: [importLine, ...rest.slice(0, elementAt)].join('\n\n'),
    element: rest.slice(elementAt).join('\n\n'),
  });
}
