import { fullFile as fullFileParts } from '../content/snippets.mjs';

/** A block that calls a hook (`const [open, setOpen] = useState(false);`): it belongs inside the component, not at module level. */
const HOOK_CALL = /=\s*use[A-Z]\w*\(/;

/**
 * Wrap a toJsx snippet in a file you can paste and run. Gallery-private. The snippet's blocks are separated by
 * blank lines: the import line, any `const` declarations, any hook setup lines, then the element. Plain consts
 * stay at module level, between the import and `export function Example()`; hook setup goes inside it.
 */
export function fullFile(jsx: string): string {
  const [importLine = '', ...rest] = jsx.split('\n\n');
  const isModuleConst = (block: string) => block.startsWith('const ') && !HOOK_CALL.test(block);
  const firstOther = rest.findIndex((block) => !isModuleConst(block));
  const splitAt = firstOther === -1 ? rest.length : firstOther;
  const after = rest.slice(splitAt);
  return fullFileParts({
    importLine: [importLine, ...rest.slice(0, splitAt)].join('\n\n'),
    setup: after.filter((block) => HOOK_CALL.test(block)).join('\n'),
    element: after.filter((block) => !HOOK_CALL.test(block)).join('\n\n'),
  });
}
