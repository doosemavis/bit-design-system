// data-mode="system" follows the visitor's OS: on a dark OS it is dark mode. A theme writes its dark block once,
// keyed on `.bit-dark, [data-mode="dark"]`, and withSystemMode adds the system copy behind a dark-OS query right
// after each such rule. build-css.mjs runs it on every shipped theme, so the source never repeats the block.
// Plain string work, no CSS parser, so any Node >= 20 runs it.

/** The text a dark rule's selectors carry, inside :where() or :is(). */
export const DARK = '.bit-dark, [data-mode="dark"]';
/** What the copy carries instead. */
export const SYSTEM = '[data-mode="system"]';
/** The query the copy sits behind. */
export const DARK_OS = '@media (prefers-color-scheme: dark)';

/** The index of the `}` that closes the block opened at `open`. */
function closingBrace(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return i;
  }
  throw new Error('system-mode: unbalanced braces');
}

/** Where the prelude of the block opened at `open` starts: after the last `{`, `}` or `;` before it. */
function preludeStart(css, open) {
  const before = css.slice(0, open);
  let start = Math.max(before.lastIndexOf('{'), before.lastIndexOf('}'), before.lastIndexOf(';')) + 1;
  while (/\s/.test(css[start])) start++;
  return start;
}

/** The line's leading whitespace at `index`. */
function indentAt(css, index) {
  return /[ \t]*$/.exec(css.slice(0, index))[0];
}

/** A dark-only style rule: its selectors turn dark mode on and none applies in light. */
function isDarkRule(prelude) {
  return !prelude.startsWith('@') && prelude.includes(DARK) && !prelude.includes('.bit-light');
}

/**
 * The theme with a `@media (prefers-color-scheme: dark) { … }` copy of each dark rule after it, its selectors
 * reading `[data-mode="system"]`. Throws when the theme has no dark rule, or already has a dark-OS query, so a
 * theme that breaks the convention fails the build instead of shipping without system mode.
 */
export function withSystemMode(css) {
  // Comments blanked to spaces, so braces in them don't count and every index still matches `css`.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  if (source.includes('prefers-color-scheme')) {
    throw new Error('system-mode: the theme already has a prefers-color-scheme query; write only the dark block');
  }
  const copies = [];
  for (let open = source.indexOf('{'); open !== -1; open = source.indexOf('{', open + 1)) {
    const start = preludeStart(source, open);
    if (!isDarkRule(source.slice(start, open).trim())) continue;
    const close = closingBrace(source, open);
    const indent = indentAt(css, start);
    const rule = source.slice(start, close + 1).replaceAll(DARK, SYSTEM);
    // The copy leaves out the comments (blank lines once blanked); the dark block keeps them.
    const nested = rule
      .split('\n')
      .filter((line, i) => i === 0 || line.trim() !== '')
      .map((line, i) => (i === 0 ? line : `  ${line}`))
      .join('\n');
    copies.push({ at: close + 1, text: `\n\n${indent}${DARK_OS} {\n${indent}  ${nested}\n${indent}}` });
    open = close;
  }
  if (copies.length === 0) throw new Error(`system-mode: no dark rule (selectors with ${DARK}) to copy for ${SYSTEM}`);
  return copies.reduceRight((out, copy) => out.slice(0, copy.at) + copy.text + out.slice(copy.at), css);
}
