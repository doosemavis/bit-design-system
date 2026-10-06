import type { CODE_KINDS } from '@bit-ds/core/tokens';

/** One syntax color; each reads `--bit-code-{kind}`. */
export type CodeKind = (typeof CODE_KINDS)[number];
export interface CodeToken {
  kind: CodeKind;
  text: string;
}
export const CODE_LANGUAGES = ['jsx', 'tsx', 'ts', 'html', 'css', 'shell'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
/** Longer code is one plain-text token: colors are a nicety, never worth a slow page. */
export const TOKENIZE_LIMIT = 50_000;

/** A sticky pattern (matches only at `lastIndex`) and the kind its match becomes. No pattern can match empty. */
type Rule = readonly [kind: CodeKind, pattern: RegExp];
/** One step of a lexer: the token at `at` and the state after it. The token is never empty. */
type Step<S> = (code: string, at: number, state: S) => readonly [CodeToken, S];

/** Single, double or backtick quoted, skipping escaped quotes. An unclosed ' or " string ends at the line. */
const STRING = /(?:'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?)/y;
const BLOCK_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y;

const token = (kind: CodeKind, text: string): CodeToken => ({ kind, text });

/** What a sticky `pattern` matches starting exactly at `at`, without copying the rest of the code. */
function matchAt(pattern: RegExp, code: string, at: number): string | undefined {
  pattern.lastIndex = at;
  return pattern.exec(code)?.[0];
}

/** The first rule that matches at `at`, else that one character as plain text. */
function match(rules: readonly Rule[], code: string, at: number): CodeToken {
  for (const [kind, pattern] of rules) {
    const found = matchAt(pattern, code, at);
    if (found) return token(kind, found);
  }
  return token('text', code[at]!);
}

/** Runs a lexer over the code. Adjacent plain text merges, so the markup stays small. */
function run<S>(code: string, start: S, step: Step<S>): CodeToken[] {
  const tokens: CodeToken[] = [];
  let state = start;
  let textFrom = 0;
  for (let at = 0; at < code.length; ) {
    const [next, after] = step(code, at, state);
    if (next.kind !== 'text') {
      if (textFrom < at) tokens.push(token('text', code.slice(textFrom, at)));
      tokens.push(next);
      textFrom = at + next.text.length;
    }
    state = after;
    at += next.text.length;
  }
  if (textFrom < code.length) tokens.push(token('text', code.slice(textFrom)));
  return tokens;
}

/** True when the character before `at` opened a tag (`<` or `</`), so a name here is the tag name. */
function afterTagOpen(code: string, at: number): boolean {
  return code[at - 1] === '<' || (code[at - 1] === '/' && code[at - 2] === '<');
}

// ---------------------------------------------------------------------------------------- JSX

type JsxMode = 'js' | 'tag' | 'closeTag' | 'children';
/** The mode stack as a persistent list: push and pop are O(1) and never change a stack in place. */
interface JsxModes {
  readonly mode: JsxMode;
  readonly parent: JsxModes | null;
}

const JS_ROOT: JsxModes = { mode: 'js', parent: null };
const push = (modes: JsxModes, mode: JsxMode): JsxModes => ({ mode, parent: modes });
/** The stack minus its top entry; popping the root gives the root again, so the stack is never empty. */
const pop = (modes: JsxModes): JsxModes => modes.parent ?? JS_ROOT;

const JS_KEYWORDS = [
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'typeof',
  'as', 'type', 'interface', 'true', 'false', 'null', 'undefined',
];
const TS_KEYWORDS = [
  ...JS_KEYWORDS, 'enum', 'implements', 'extends', 'readonly', 'keyof', 'satisfies', 'declare', 'namespace', 'abstract',
  'private', 'public', 'protected', 'unknown', 'never', 'any', 'string', 'number', 'boolean', 'void', 'infer', 'is',
  'async', 'await', 'class', 'this', 'super', 'for', 'while', 'of', 'in', 'switch', 'case', 'break', 'continue', 'throw',
  'try', 'catch', 'finally', 'yield', 'static', 'get', 'set',
];

/** Comments, strings and numbers: the same in JS and TS. */
const LITERAL_RULES: readonly Rule[] = [
  ['comment', /\/\/[^\n]*/y],
  ['comment', BLOCK_COMMENT],
  ['string', STRING],
  ['number', /\d+(?:\.\d+)?/y],
];
const COMPONENT_RULE: Rule = ['component', /[A-Z][\w$]*/y];
const NAME_AND_PUNCT_RULES: readonly Rule[] = [
  ['text', /[A-Za-z_$][\w$]*/y],
  ['punct', /[()[\];,.:=+\-*/!?&|<>%]/y],
];

const JS_RULES: readonly Rule[] = [
  ...LITERAL_RULES,
  ['keyword', new RegExp(`(?:${JS_KEYWORDS.join('|')})\\b`, 'y')],
  COMPONENT_RULE,
  ['prop', /[A-Za-z_$][\w$]*(?=\s*:)/y],
  ...NAME_AND_PUNCT_RULES,
];

/** TypeScript: more keywords, matched as whole names only, and an optional `name?:` is a prop too. */
const TS_RULES: readonly Rule[] = [
  ...LITERAL_RULES,
  ['keyword', new RegExp(`(?:${TS_KEYWORDS.join('|')})(?![\\w$])`, 'y')],
  COMPONENT_RULE,
  ['prop', /[A-Za-z_$][\w$]*(?=\s*\??:)/y],
  ...NAME_AND_PUNCT_RULES,
];

/** A .ts file has no JSX, so braces are plain punct like every `<` and `>`. */
const TS_FILE_RULES: readonly Rule[] = [...TS_RULES, ['punct', /[{}]/y]];

const TAG_RULES: readonly Rule[] = [
  ['string', STRING],
  ['attr', /[A-Za-z_:][\w:.-]*/y],
  ['punct', /=/y],
];

const JSX_TAG_NAME = /[A-Za-z][\w.-]*/y;
const TAG_CLOSE = /\/?>/y;
const JSX_TAG_OPEN = /<\/?(?=[A-Za-z>])/y;
const JSX_CHILD_TEXT = /[^<{]+/y;

function jsxTagStep(code: string, at: number, modes: JsxModes): readonly [CodeToken, JsxModes] {
  const name = matchAt(JSX_TAG_NAME, code, at);
  if (name && afterTagOpen(code, at)) return [token(/^[A-Z]/.test(name) ? 'component' : 'tag', name), modes];
  const close = matchAt(TAG_CLOSE, code, at);
  if (!close) return [match(TAG_RULES, code, at), modes];
  if (modes.mode === 'closeTag') return [token('punct', close), pop(pop(modes))];
  return [token('punct', close), close === '/>' ? pop(modes) : push(pop(modes), 'children')];
}

/** A `<` opening type parameters (`<T,>` or `<T extends U>`), which TypeScript never reads as JSX in .tsx. */
const TYPE_PARAMS = /<(?=[A-Za-z_$][\w$]*(?:\s*,|\s+extends\b))/y;

/** The JSX lexer over `rules` for plain code; `typeParams` also reads `<T,>` and `<T extends U>` as code (tsx). */
function jsxStepFor(rules: readonly Rule[], typeParams: boolean): Step<JsxModes> {
  return (code, at, modes) => {
    const char = code[at];
    const mode = modes.mode;
    if (char === '{') return [token('punct', '{'), push(modes, 'js')];
    if (mode === 'tag' || mode === 'closeTag') return jsxTagStep(code, at, modes);
    if (mode === 'js' && char === '}') return [token('punct', '}'), pop(modes)];
    // A `<` straight after an identifier (no space) is a type argument (`useState<string>`) or a
    // comparison (`i<n`), never a JSX tag. JSX always follows a space, `(`, `=>`, `&&`, `?`, `{` or a line start.
    if (mode === 'js' && char === '<' && (/[\w$]/.test(code[at - 1] ?? '') || (typeParams && matchAt(TYPE_PARAMS, code, at)))) {
      return [token('punct', '<'), modes];
    }
    const open = matchAt(JSX_TAG_OPEN, code, at);
    if (open) return [token('punct', open), push(modes, open === '</' ? 'closeTag' : 'tag')];
    if (mode === 'children') return [token('text', matchAt(JSX_CHILD_TEXT, code, at) ?? char!), modes];
    return [match(rules, code, at), modes];
  };
}

const jsxStep = jsxStepFor(JS_RULES, false);
const tsxStep = jsxStepFor(TS_RULES, true);
const tsStep: Step<null> = (code, at) => [match(TS_FILE_RULES, code, at), null];

// --------------------------------------------------------------------------------------- HTML

const HTML_TAG_RULES: readonly Rule[] = [
  ['string', STRING],
  ['attr', /[A-Za-z_:@][\w:.-]*/y],
  ['punct', /=/y],
];

const HTML_TAG_NAME = /[A-Za-z][\w-]*/y;
const HTML_COMMENT = /<!--[\s\S]*?(?:-->|$)/y;
const HTML_TAG_OPEN = /<\/?(?=[A-Za-z])/y;
const HTML_TEXT = /[^<]+/y;

const htmlStep: Step<boolean> = (code, at, inTag) => {
  if (inTag) {
    const name = matchAt(HTML_TAG_NAME, code, at);
    if (name && afterTagOpen(code, at)) return [token('tag', name), true];
    const close = matchAt(TAG_CLOSE, code, at);
    if (close) return [token('punct', close), false];
    return [match(HTML_TAG_RULES, code, at), true];
  }
  const comment = matchAt(HTML_COMMENT, code, at);
  if (comment) return [token('comment', comment), false];
  const open = matchAt(HTML_TAG_OPEN, code, at);
  if (open) return [token('punct', open), true];
  return [token('text', matchAt(HTML_TEXT, code, at) ?? code[at]!), false];
};

// ---------------------------------------------------------------------------------------- CSS

const CSS_SELECTOR_RULES: readonly Rule[] = [
  ['keyword', /@[\w-]+/y],
  ['tag', /[.#]?-?[A-Za-z_][\w-]*/y],
  ['keyword', /::?[\w-]+/y],
  ['punct', /[,>+~*()[\]=]/y],
];

const CSS_DECLARATION_RULES: readonly Rule[] = [
  ['prop', /-{0,2}[A-Za-z_][\w-]*(?=\s*:)/y],
  ['prop', /--[\w-]+/y],
  ['keyword', /[A-Za-z-]+(?=\()/y],
  ['keyword', /!important\b/y],
  ['number', /#[0-9A-Fa-f]{3,8}\b/y],
  ['number', /-?(?:\d*\.)?\d+(?:[a-z%]+)?/y],
  ['text', /[A-Za-z_][\w-]*/y],
  ['punct', /[:;,()/*+]/y],
];

const cssStep: Step<number> = (code, at, depth) => {
  const comment = matchAt(BLOCK_COMMENT, code, at);
  if (comment) return [token('comment', comment), depth];
  const string = matchAt(STRING, code, at);
  if (string) return [token('string', string), depth];
  if (code[at] === '{') return [token('punct', '{'), depth + 1];
  if (code[at] === '}') return [token('punct', '}'), Math.max(0, depth - 1)];
  return [match(depth > 0 ? CSS_DECLARATION_RULES : CSS_SELECTOR_RULES, code, at), depth];
};

// -------------------------------------------------------------------------------------- shell

const SHELL_COMMENT = /#[^\n]*/y;
const SHELL_SPACE = /[ \t]+/y;
const SHELL_OPERATOR = /(?:&&|\|\||[|;&<>])/y;
const SHELL_VARIABLE = /\$\{?[A-Za-z_]\w*\}?/y;
const SHELL_FLAG = /--?[A-Za-z][\w-]*/y;
const SHELL_NUMBER = /\d+\b/y;
const SHELL_WORD = /[^\s'"`|;&<>$#]+/y;

/** `atCommand`: the next word is a command (start of a line, or after a pipe, `;`, `&&` or `||`). */
const shellStep: Step<boolean> = (code, at, atCommand) => {
  const wordStart = at === 0 || /\s/.test(code[at - 1]!);
  // Only a word start opens a comment, so a `#` mid-word never scans ahead to the end of the line.
  const comment = wordStart ? matchAt(SHELL_COMMENT, code, at) : undefined;
  if (comment) return [token('comment', comment), atCommand];
  if (code[at] === '\n') return [token('text', '\n'), true];
  const space = matchAt(SHELL_SPACE, code, at);
  if (space) return [token('text', space), atCommand];
  const operator = matchAt(SHELL_OPERATOR, code, at);
  if (operator) return [token('punct', operator), !/^[<>]$/.test(operator)];
  const string = matchAt(STRING, code, at);
  if (string) return [token('string', string), false];
  const variable = matchAt(SHELL_VARIABLE, code, at);
  if (variable) return [token('prop', variable), false];
  const flag = matchAt(SHELL_FLAG, code, at);
  if (flag && !atCommand) return [token('attr', flag), false];
  const number = matchAt(SHELL_NUMBER, code, at);
  if (number && !atCommand) return [token('number', number), false];
  const word = matchAt(SHELL_WORD, code, at);
  if (word) return [token(atCommand ? 'keyword' : 'text', word), false];
  return [token('text', code[at]!), atCommand];
};

// ---------------------------------------------------------------------------------------------

const LEXERS = new Map<string, (code: string) => CodeToken[]>([
  ['jsx', (code) => run(code, JS_ROOT, jsxStep)],
  ['tsx', (code) => run(code, JS_ROOT, tsxStep)],
  ['ts', (code) => run(code, null, tsStep)],
  ['html', (code) => run(code, false, htmlStep)],
  ['css', (code) => run(code, 0, cssStep)],
  ['shell', (code) => run(code, true, shellStep)],
]);

/**
 * Splits code into colored tokens. Not a parser: it only needs to pick a color per piece, and joining
 * the tokens' text always gives back the input exactly. An unknown language (from an untyped caller)
 * or code longer than `TOKENIZE_LIMIT` is one plain-text token.
 */
export function tokenize(code: string, language: CodeLanguage): CodeToken[] {
  const lex = LEXERS.get(language);
  if (!lex || code.length > TOKENIZE_LIMIT) return code === '' ? [] : [token('text', code)];
  return lex(code);
}
