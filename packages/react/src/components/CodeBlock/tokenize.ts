import type { CODE_KINDS } from '@bit-ds/core/tokens';

/** One syntax color; each reads `--bit-code-{kind}`. */
export type CodeKind = (typeof CODE_KINDS)[number];
export interface CodeToken {
  kind: CodeKind;
  text: string;
}
export const CODE_LANGUAGES = ['jsx', 'html', 'css', 'shell'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** A pattern anchored at the cursor and the kind its match becomes. No pattern can match empty. */
type Rule = readonly [kind: CodeKind, pattern: RegExp];
/** One step of a lexer: the token at `at` and the state after it. The token is never empty. */
type Step<S> = (code: string, at: number, state: S) => readonly [CodeToken, S];

/** Single, double or backtick quoted, skipping escaped quotes. An unclosed ' or " string ends at the line. */
const STRING = /^(?:'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?)/;
const BLOCK_COMMENT = /^\/\*[\s\S]*?(?:\*\/|$)/;

const token = (kind: CodeKind, text: string): CodeToken => ({ kind, text });

/** The first rule that matches at the start of `rest`, else its first character as plain text. */
function match(rules: readonly Rule[], rest: string): CodeToken {
  for (const [kind, pattern] of rules) {
    const found = pattern.exec(rest);
    if (found) return token(kind, found[0]);
  }
  return token('text', rest[0]!);
}

/** Runs a lexer over the code. Adjacent plain text merges, so the markup stays small. */
function run<S>(code: string, start: S, step: Step<S>): CodeToken[] {
  const tokens: CodeToken[] = [];
  let state = start;
  for (let at = 0; at < code.length; ) {
    const [next, after] = step(code, at, state);
    const last = tokens[tokens.length - 1];
    if (last?.kind === 'text' && next.kind === 'text') tokens[tokens.length - 1] = token('text', last.text + next.text);
    else tokens.push(next);
    state = after;
    at += next.text.length;
  }
  return tokens;
}

/** True when the character before `at` opened a tag (`<` or `</`), so a name here is the tag name. */
function afterTagOpen(code: string, at: number): boolean {
  return code[at - 1] === '<' || (code[at - 1] === '/' && code[at - 2] === '<');
}

// ---------------------------------------------------------------------------------------- JSX

type JsxMode = 'js' | 'tag' | 'closeTag' | 'children';

const JS_RULES: readonly Rule[] = [
  ['comment', /^\/\/[^\n]*/],
  ['comment', BLOCK_COMMENT],
  ['string', STRING],
  ['number', /^\d+(?:\.\d+)?/],
  ['keyword', /^(?:import|from|export|default|const|let|var|function|return|if|else|new|typeof|as|type|interface|true|false|null|undefined)\b/],
  ['component', /^[A-Z][\w$]*/],
  ['prop', /^[A-Za-z_$][\w$]*(?=\s*:)/],
  ['text', /^[A-Za-z_$][\w$]*/],
  ['punct', /^[()[\];,.:=+\-*/!?&|<>%]/],
];

const TAG_RULES: readonly Rule[] = [
  ['string', STRING],
  ['attr', /^[A-Za-z_:][\w:.-]*/],
  ['punct', /^=/],
];

/** The mode stack minus its top `count` entries, never empty. */
function pop(modes: readonly JsxMode[], count = 1): JsxMode[] {
  return modes.length > count ? modes.slice(0, -count) : ['js'];
}

function jsxTagStep(code: string, at: number, modes: readonly JsxMode[]): readonly [CodeToken, readonly JsxMode[]] {
  const rest = code.slice(at);
  const name = /^[A-Za-z][\w.-]*/.exec(rest);
  if (name && afterTagOpen(code, at)) return [token(/^[A-Z]/.test(name[0]) ? 'component' : 'tag', name[0]), modes];
  const close = /^\/?>/.exec(rest);
  if (!close) return [match(TAG_RULES, rest), modes];
  if (modes[modes.length - 1] === 'closeTag') return [token('punct', close[0]), pop(modes, 2)];
  return [token('punct', close[0]), close[0] === '/>' ? pop(modes) : [...pop(modes), 'children']];
}

const jsxStep: Step<readonly JsxMode[]> = (code, at, modes) => {
  const rest = code.slice(at);
  const mode = modes[modes.length - 1];
  if (rest[0] === '{') return [token('punct', '{'), [...modes, 'js']];
  if (mode === 'tag' || mode === 'closeTag') return jsxTagStep(code, at, modes);
  if (mode === 'js' && rest[0] === '}') return [token('punct', '}'), pop(modes)];
  // A `<` straight after an identifier (no space) is a type argument (`useState<string>`) or a
  // comparison (`i<n`), never a JSX tag. JSX always follows a space, `(`, `=>`, `&&`, `?`, `{` or a line start.
  if (mode === 'js' && rest[0] === '<' && /[\w$]/.test(code[at - 1] ?? '')) return [token('punct', '<'), modes];
  const open = /^<\/?(?=[A-Za-z>])/.exec(rest);
  if (open) return [token('punct', open[0]), [...modes, open[0] === '</' ? 'closeTag' : 'tag']];
  if (mode === 'children') return [token('text', /^[^<{]+/.exec(rest)?.[0] ?? rest[0]!), modes];
  return [match(JS_RULES, rest), modes];
};

// --------------------------------------------------------------------------------------- HTML

const HTML_TAG_RULES: readonly Rule[] = [
  ['string', STRING],
  ['attr', /^[A-Za-z_:@][\w:.-]*/],
  ['punct', /^=/],
];

const htmlStep: Step<boolean> = (code, at, inTag) => {
  const rest = code.slice(at);
  if (inTag) {
    const name = /^[A-Za-z][\w-]*/.exec(rest);
    if (name && afterTagOpen(code, at)) return [token('tag', name[0]), true];
    const close = /^\/?>/.exec(rest);
    if (close) return [token('punct', close[0]), false];
    return [match(HTML_TAG_RULES, rest), true];
  }
  const comment = /^<!--[\s\S]*?(?:-->|$)/.exec(rest);
  if (comment) return [token('comment', comment[0]), false];
  const open = /^<\/?(?=[A-Za-z])/.exec(rest);
  if (open) return [token('punct', open[0]), true];
  return [token('text', /^[^<]+/.exec(rest)?.[0] ?? rest[0]!), false];
};

// ---------------------------------------------------------------------------------------- CSS

const CSS_SELECTOR_RULES: readonly Rule[] = [
  ['keyword', /^@[\w-]+/],
  ['tag', /^[.#]?-?[A-Za-z_][\w-]*/],
  ['keyword', /^::?[\w-]+/],
  ['punct', /^[,>+~*()[\]=]/],
];

const CSS_DECLARATION_RULES: readonly Rule[] = [
  ['prop', /^-{0,2}[A-Za-z_][\w-]*(?=\s*:)/],
  ['prop', /^--[\w-]+/],
  ['keyword', /^[A-Za-z-]+(?=\()/],
  ['keyword', /^!important\b/],
  ['number', /^#[0-9A-Fa-f]{3,8}\b/],
  ['number', /^-?(?:\d*\.)?\d+(?:[a-z%]+)?/],
  ['text', /^[A-Za-z_][\w-]*/],
  ['punct', /^[:;,()/*+]/],
];

const cssStep: Step<number> = (code, at, depth) => {
  const rest = code.slice(at);
  const comment = BLOCK_COMMENT.exec(rest);
  if (comment) return [token('comment', comment[0]), depth];
  const string = STRING.exec(rest);
  if (string) return [token('string', string[0]), depth];
  if (rest[0] === '{') return [token('punct', '{'), depth + 1];
  if (rest[0] === '}') return [token('punct', '}'), Math.max(0, depth - 1)];
  return [match(depth > 0 ? CSS_DECLARATION_RULES : CSS_SELECTOR_RULES, rest), depth];
};

// -------------------------------------------------------------------------------------- shell

/** `atCommand`: the next word is a command (start of a line, or after a pipe, `;`, `&&` or `||`). */
const shellStep: Step<boolean> = (code, at, atCommand) => {
  const rest = code.slice(at);
  const wordStart = at === 0 || /\s/.test(code[at - 1]!);
  const comment = /^#[^\n]*/.exec(rest);
  if (comment && wordStart) return [token('comment', comment[0]), atCommand];
  if (rest[0] === '\n') return [token('text', '\n'), true];
  const space = /^[ \t]+/.exec(rest);
  if (space) return [token('text', space[0]), atCommand];
  const operator = /^(?:&&|\|\||[|;&<>])/.exec(rest);
  if (operator) return [token('punct', operator[0]), !/^[<>]$/.test(operator[0])];
  const string = STRING.exec(rest);
  if (string) return [token('string', string[0]), false];
  const variable = /^\$\{?[A-Za-z_]\w*\}?/.exec(rest);
  if (variable) return [token('prop', variable[0]), false];
  const flag = /^--?[A-Za-z][\w-]*/.exec(rest);
  if (flag && !atCommand) return [token('attr', flag[0]), false];
  const number = /^\d+\b/.exec(rest);
  if (number && !atCommand) return [token('number', number[0]), false];
  const word = /^[^\s'"`|;&<>$#]+/.exec(rest);
  if (word) return [token(atCommand ? 'keyword' : 'text', word[0]), false];
  return [token('text', rest[0]!), atCommand];
};

// ---------------------------------------------------------------------------------------------

const LEXERS = new Map<string, (code: string) => CodeToken[]>([
  ['jsx', (code) => run<readonly JsxMode[]>(code, ['js'], jsxStep)],
  ['html', (code) => run(code, false, htmlStep)],
  ['css', (code) => run(code, 0, cssStep)],
  ['shell', (code) => run(code, true, shellStep)],
]);

/**
 * Splits code into colored tokens. Not a parser: it only needs to pick a color per piece, and joining
 * the tokens' text always gives back the input exactly. An unknown language (from an untyped caller)
 * is one plain-text token.
 */
export function tokenize(code: string, language: CodeLanguage): CodeToken[] {
  const lex = LEXERS.get(language);
  if (!lex) return code === '' ? [] : [token('text', code)];
  return lex(code);
}
