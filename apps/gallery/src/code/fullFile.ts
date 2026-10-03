import { STYLE_IMPORTS } from '../content/styleImports';

/** Above the style imports in the full file: they belong in the app's entry file, once. */
export const STYLE_COMMENT = '// once per app: skip if already in your entry file';

const BODY_INDENT = '    ';

/**
 * Wrap a toJsx snippet (import line, blank line, element) in a file you can paste and run: the style
 * imports, the component import, and an `Example` component that returns the element. Gallery-private.
 */
export function fullFile(jsx: string): string {
  const split = jsx.indexOf('\n\n');
  const importLine = jsx.slice(0, split);
  const element = jsx.slice(split + 2);
  const body = element
    .split('\n')
    .map((line) => BODY_INDENT + line)
    .join('\n');
  return `${STYLE_COMMENT}\n${STYLE_IMPORTS}\n${importLine}\n\nexport function Example() {\n  return (\n${body}\n  );\n}\n`;
}
