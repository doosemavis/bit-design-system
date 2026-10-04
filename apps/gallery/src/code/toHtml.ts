import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const INDENT = '  ';

/**
 * One element per line with two-space indents; an element holding only text stays on one line. React
 * escapes `<`, `>` and quotes inside text and attributes, so splitting on tags is safe.
 */
export function prettyHtml(html: string): string {
  const parts = html.match(/<[^>]+>|[^<]+/g) ?? [];
  const lines: string[] = [];
  let depth = 0;
  let open: string | null = null; // an opening tag, held back to see whether only text follows

  const flush = () => {
    if (open === null) return;
    lines.push(INDENT.repeat(depth) + open);
    depth += 1;
    open = null;
  };

  for (const part of parts) {
    if (part.startsWith('</')) {
      if (open !== null) {
        lines.push(INDENT.repeat(depth) + open + part);
        open = null;
      } else {
        depth = Math.max(0, depth - 1);
        lines.push(INDENT.repeat(depth) + part);
      }
    } else if (part.startsWith('<')) {
      flush();
      const name = /^<([a-zA-Z][\w-]*)/.exec(part)?.[1]?.toLowerCase() ?? '';
      if (VOID.has(name) || part.endsWith('/>')) lines.push(INDENT.repeat(depth) + part);
      else open = part;
    } else if (open !== null) {
      open += part;
    } else {
      lines.push(INDENT.repeat(depth) + part);
    }
  }
  flush();
  return lines.join('\n');
}

/** A React `useId` name, such as `_R_0_`. */
const REACT_ID = /_R_\w*_/g;

/**
 * React's generated ids (`_R_0_`) as `example-1`, `example-2`, … in order of first use. The same id always
 * gets the same name, so a label's `for` still matches its input's `id` and radios keep one `name`.
 */
export function readableIds(html: string): string {
  const ids = [...new Set(html.match(REACT_ID) ?? [])];
  return html.replace(REACT_ID, (id) => `example-${ids.indexOf(id) + 1}`);
}

/** The markup the preview's element renders, so the HTML tab can never drift from what you see. */
export function toHtml(element: ReactElement): string {
  return prettyHtml(readableIds(renderToStaticMarkup(element)));
}
