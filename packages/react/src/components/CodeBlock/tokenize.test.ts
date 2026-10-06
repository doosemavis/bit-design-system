import { describe, expect, it } from 'vitest';
import { CODE_KINDS } from '@bit-ds/core/tokens';
import { CODE_LANGUAGES, TOKENIZE_LIMIT, tokenize } from './tokenize';
import type { CodeLanguage, CodeToken } from './tokenize';

/** Tokens as [kind, text] pairs, which read better in expectations. */
const pairs = (code: string, language: CodeLanguage) => tokenize(code, language).map((t) => [t.kind, t.text]);
const kindOf = (code: string, language: CodeLanguage, text: string) =>
  tokenize(code, language).find((t) => t.text === text)?.kind;
const joined = (tokens: readonly CodeToken[]) => tokens.map((t) => t.text).join('');

describe('tokenize: jsx', () => {
  it('splits a JSX element into punct, component, attr, string and text', () => {
    expect(pairs('<Button color="danger" loading>Save</Button>', 'jsx')).toEqual([
      ['punct', '<'],
      ['component', 'Button'],
      ['text', ' '],
      ['attr', 'color'],
      ['punct', '='],
      ['string', '"danger"'],
      ['text', ' '],
      ['attr', 'loading'],
      ['punct', '>'],
      ['text', 'Save'],
      ['punct', '</'],
      ['component', 'Button'],
      ['punct', '>'],
    ]);
  });

  it('colors the import line: keywords, the imported component, the module string', () => {
    expect(pairs(`import { Button } from '@bit-ds/react';`, 'jsx')).toEqual([
      ['keyword', 'import'],
      ['text', ' '],
      ['punct', '{'],
      ['text', ' '],
      ['component', 'Button'],
      ['text', ' '],
      ['punct', '}'],
      ['text', ' '],
      ['keyword', 'from'],
      ['text', ' '],
      ['string', "'@bit-ds/react'"],
      ['punct', ';'],
    ]);
  });

  it('a braced attribute value is code: numbers, punct and nested braces', () => {
    expect(pairs('<Stack gap={16} style={{ marginTop: 4 }} />', 'jsx')).toEqual([
      ['punct', '<'],
      ['component', 'Stack'],
      ['text', ' '],
      ['attr', 'gap'],
      ['punct', '='],
      ['punct', '{'],
      ['number', '16'],
      ['punct', '}'],
      ['text', ' '],
      ['attr', 'style'],
      ['punct', '='],
      ['punct', '{'],
      ['punct', '{'],
      ['text', ' '],
      ['prop', 'marginTop'],
      ['punct', ':'],
      ['text', ' '],
      ['number', '4'],
      ['text', ' '],
      ['punct', '}'],
      ['punct', '}'],
      ['text', ' '],
      ['punct', '/>'],
    ]);
  });

  it('lowercase elements are tags; children text stays plain, even capitalized words', () => {
    expect(pairs('<p>Hello World</p>', 'jsx')).toEqual([
      ['punct', '<'],
      ['tag', 'p'],
      ['punct', '>'],
      ['text', 'Hello World'],
      ['punct', '</'],
      ['tag', 'p'],
      ['punct', '>'],
    ]);
  });

  it('children can hold expressions, nested elements and fragments', () => {
    expect(pairs('<><b>{n}</b> < 3</>', 'jsx')).toEqual([
      ['punct', '<'],
      ['punct', '>'],
      ['punct', '<'],
      ['tag', 'b'],
      ['punct', '>'],
      ['punct', '{'],
      ['text', 'n'],
      ['punct', '}'],
      ['punct', '</'],
      ['tag', 'b'],
      ['punct', '>'],
      ['text', ' < 3'],
      ['punct', '</'],
      ['punct', '>'],
    ]);
  });

  it('comments, numbers and keywords in plain code', () => {
    expect(pairs('// note\nconst n = 1.5; /* done */', 'jsx')).toEqual([
      ['comment', '// note'],
      ['text', '\n'],
      ['keyword', 'const'],
      ['text', ' n '],
      ['punct', '='],
      ['text', ' '],
      ['number', '1.5'],
      ['punct', ';'],
      ['text', ' '],
      ['comment', '/* done */'],
    ]);
  });

  it('handles class attributes, self-closing tags, braces and import lines (the gallery highlighter cases)', () => {
    const code = `import { Button } from '@bit-ds/react';\n\n<span class="bit-badge bit-md" data-x="" />\n<BitLogo era={32} />`;
    const tokens = tokenize(code, 'jsx');
    expect(tokens.map((t) => t.text).join('')).toBe(code);
    expect(tokens).toContainEqual({ kind: 'string', text: "'@bit-ds/react'" });
    expect(tokens).toContainEqual({ kind: 'attr', text: 'data-x' });
    expect(tokens).toContainEqual({ kind: 'punct', text: '/>' });
    expect(tokens).toContainEqual({ kind: 'component', text: 'BitLogo' });
    expect(tokens).toContainEqual({ kind: 'number', text: '32' });
  });

  it('a stray closing brace or an unknown character is still kept', () => {
    expect(pairs('} ~', 'jsx')).toEqual([
      ['punct', '}'],
      ['text', ' ~'],
    ]);
    expect(pairs('<a ~>', 'jsx')).toEqual([
      ['punct', '<'],
      ['tag', 'a'],
      ['text', ' ~'],
      ['punct', '>'],
    ]);
  });
});

describe('tokenize: jsx generics', () => {
  it('useState<string>(…) keeps the code after the generic as JS, with no tag tokens', () => {
    const tokens = tokenize('const [a, b] = useState<string>("");', 'jsx');
    expect(tokens.some((t) => t.kind === 'tag' || t.kind === 'component')).toBe(false);
    expect(kindOf('const [a, b] = useState<string>("");', 'jsx', '""')).toBe('string');
    expect(tokens.map((t) => t.text).join('')).toBe('const [a, b] = useState<string>("");');
  });

  it('forwardRef<HTMLDivElement, Props>( colours the type names as components, not tags', () => {
    expect(kindOf('forwardRef<HTMLDivElement, Props>(', 'jsx', 'HTMLDivElement')).toBe('component');
    expect(kindOf('forwardRef<HTMLDivElement, Props>(', 'jsx', 'Props')).toBe('component');
    expect(tokenize('forwardRef<HTMLDivElement, Props>(', 'jsx').some((t) => t.kind === 'tag')).toBe(false);
  });

  it('Array<Item> followed by more code does not swallow it as JSX children', () => {
    expect(kindOf('let xs: Array<Item> = [];', 'jsx', '=')).toBe('punct');
  });

  it('i<n with no spaces is a comparison, not a tag', () => {
    expect(tokenize('for (let i=0; i<n; i++) {}', 'jsx').some((t) => t.kind === 'tag')).toBe(false);
  });

  it.each([
    ['return (', 'return (<div>hi</div>);'],
    ['an arrow', 'const A = () => <div>hi</div>;'],
    ['&&', 'ok && <div>hi</div>'],
    ['?', 'ok ? <div>hi</div> : null'],
    ['a line start', '<div>hi</div>'],
  ])('JSX after %s is still a tag', (_, code) => {
    expect(kindOf(code, 'jsx', 'div')).toBe('tag');
  });
});

const TS_KEYWORDS = [
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'typeof',
  'as', 'type', 'interface', 'true', 'false', 'null', 'undefined', 'enum', 'implements', 'extends', 'readonly', 'keyof',
  'satisfies', 'declare', 'namespace', 'abstract', 'private', 'public', 'protected', 'unknown', 'never', 'any', 'string',
  'number', 'boolean', 'void', 'infer', 'is', 'async', 'await', 'class', 'this', 'super', 'for', 'while', 'of', 'in',
  'switch', 'case', 'break', 'continue', 'throw', 'try', 'catch', 'finally', 'yield', 'static', 'get', 'set',
];

describe('tokenize: ts and tsx', () => {
  it.each(['ts', 'tsx'] as const)('%s: every TypeScript keyword is a keyword, but not inside a longer name', (language) => {
    for (const word of TS_KEYWORDS) {
      expect(kindOf(`${word} x`, language, word)).toBe('keyword');
      expect(pairs(`${word}$x ${word}2`, language)).toEqual([['text', `${word}$x ${word}2`]]);
    }
  });

  it('jsx keeps its own, shorter keyword list', () => {
    for (const word of ['enum', 'async', 'await', 'class', 'this', 'readonly', 'string', 'for']) {
      expect(pairs(`${word} x`, 'jsx')).toEqual([['text', `${word} x`]]);
    }
  });

  it('tsx: an arrow-function generic <T,> is code, not a tag', () => {
    expect(pairs('<T,>(x: T) => x', 'tsx')).toEqual([
      ['punct', '<'],
      ['component', 'T'],
      ['punct', ','],
      ['punct', '>'],
      ['punct', '('],
      ['prop', 'x'],
      ['punct', ':'],
      ['text', ' '],
      ['component', 'T'],
      ['punct', ')'],
      ['text', ' '],
      ['punct', '='],
      ['punct', '>'],
      ['text', ' x'],
    ]);
  });

  it('tsx: <T extends U>(…) is a generic; extends is a keyword and what follows stays code', () => {
    const code = 'const pick = <T extends Item>(items: T[]) => items[0];';
    const tokens = tokenize(code, 'tsx');
    expect(tokens.some((t) => t.kind === 'tag')).toBe(false);
    expect(kindOf(code, 'tsx', 'extends')).toBe('keyword');
    expect(kindOf(code, 'tsx', 'Item')).toBe('component');
    expect(kindOf(code, 'tsx', 'items')).toBe('prop');
    expect(kindOf(code, 'tsx', '0')).toBe('number');
    expect(joined(tokens)).toBe(code);
  });

  it('tsx: a name that only starts with "extends" is still a tag', () => {
    expect(kindOf('x = <Textends />', 'tsx', 'Textends')).toBe('component');
    expect(tokenize('x = <Textends />', 'tsx')).toContainEqual({ kind: 'punct', text: '/>' });
  });

  it.each(['ts', 'tsx'] as const)('%s: nested type arguments Array<Promise<T>> are punct and components', (language) => {
    expect(pairs('Array<Promise<T>>', language)).toEqual([
      ['component', 'Array'],
      ['punct', '<'],
      ['component', 'Promise'],
      ['punct', '<'],
      ['component', 'T'],
      ['punct', '>'],
      ['punct', '>'],
    ]);
  });

  it.each(['ts', 'tsx'] as const)('%s: useState<string | null>(null) keeps the code after it as code', (language) => {
    const code = 'const [a, b] = useState<string | null>(null);';
    expect(tokenize(code, language).some((t) => t.kind === 'tag')).toBe(false);
    expect(kindOf(code, language, 'string')).toBe('keyword');
    expect(kindOf(code, language, 'null')).toBe('keyword');
  });

  it.each(['ts', 'tsx'] as const)('%s: an interface: keywords, optional and readonly props, type names', (language) => {
    const code = `interface Props extends Base {\n  readonly size?: 'sm' | 'md';\n  onPick(value: number): void;\n}`;
    const tokens = tokenize(code, language);
    for (const word of ['interface', 'extends', 'readonly', 'number', 'void']) expect(kindOf(code, language, word)).toBe('keyword');
    expect(kindOf(code, language, 'Props')).toBe('component');
    expect(kindOf(code, language, 'size')).toBe('prop');
    expect(kindOf(code, language, 'value')).toBe('prop');
    expect(kindOf(code, language, "'sm'")).toBe('string');
    expect(tokens).toContainEqual({ kind: 'punct', text: '{' });
    expect(joined(tokens)).toBe(code);
  });

  it('tsx: a component with generic props colours both the types and the JSX', () => {
    const code = [
      'interface ListProps<T> {',
      '  items: readonly T[];',
      '  render?: (item: T) => string;',
      '}',
      '',
      'export function List<T>({ items, render = String }: ListProps<T>) {',
      '  return <ul className="list">{items.map((item, i) => <li key={i}>{render(item)}</li>)}</ul>;',
      '}',
    ].join('\n');
    const tokens = tokenize(code, 'tsx');
    expect(joined(tokens)).toBe(code);
    for (const word of ['interface', 'readonly', 'string', 'export', 'function', 'return']) {
      expect(kindOf(code, 'tsx', word)).toBe('keyword');
    }
    expect(kindOf(code, 'tsx', 'render')).toBe('prop');
    expect(kindOf(code, 'tsx', 'ListProps')).toBe('component');
    expect(kindOf(code, 'tsx', 'className')).toBe('attr');
    expect(kindOf(code, 'tsx', '"list"')).toBe('string');
    expect(tokens).toContainEqual({ kind: 'tag', text: 'ul' });
    expect(tokens).toContainEqual({ kind: 'tag', text: 'li' });
    expect(tokens).toContainEqual({ kind: 'attr', text: 'key' });
  });

  it('tsx: JSX after return, an arrow, && and ? is still a tag, as in jsx', () => {
    for (const code of ['return (<div>hi</div>);', 'const A = () => <div>hi</div>;', 'ok && <div>hi</div>', 'ok ? <div>hi</div> : null']) {
      expect(kindOf(code, 'tsx', 'div')).toBe('tag');
    }
  });

  it('ts: no JSX at all, so comparisons are punct, even with no spaces', () => {
    expect(pairs('a <b && c> d', 'ts')).toEqual([
      ['text', 'a '],
      ['punct', '<'],
      ['text', 'b '],
      ['punct', '&'],
      ['punct', '&'],
      ['text', ' c'],
      ['punct', '>'],
      ['text', ' d'],
    ]);
    expect(tokenize('const el = <div>hi</div>;', 'ts').some((t) => t.kind === 'tag')).toBe(false);
    expect(tokenize('if (a < b && c > d) { go(); }', 'ts').some((t) => t.kind === 'tag')).toBe(false);
  });

  it('ts: braces are punct and a .ts file reads back exactly', () => {
    const code = `export enum Size { Sm = 'sm', Md = 'md' }\n\nexport async function load<T extends object>(url: string): Promise<T> {\n  try {\n    return (await fetch(url)).json() as Promise<T>; // cast\n  } catch {\n    throw new Error(\`no \${url}\`);\n  }\n}`;
    const tokens = tokenize(code, 'ts');
    expect(joined(tokens)).toBe(code);
    expect(tokens.filter((t) => t.text === '{').every((t) => t.kind === 'punct')).toBe(true);
    expect(tokens.filter((t) => t.text === '}').every((t) => t.kind === 'punct')).toBe(true);
    for (const word of ['enum', 'async', 'extends', 'try', 'await', 'catch', 'throw']) expect(kindOf(code, 'ts', word)).toBe('keyword');
    expect(kindOf(code, 'ts', '// cast')).toBe('comment');
    expect(kindOf(code, 'ts', '`no ${url}`')).toBe('string');
  });
});

describe('tokenize: strings', () => {
  it.each(CODE_LANGUAGES.filter((l) => l !== 'html'))('%s: an escaped quote does not end the string', (language) => {
    expect(kindOf(`x 'it\\'s' y`, language, `'it\\'s'`)).toBe('string');
    expect(kindOf(`x "say \\"hi\\"" y`, language, `"say \\"hi\\""`)).toBe('string');
  });

  it('an unclosed string runs to the end of its line, not past it', () => {
    expect(pairs(`a = 'oops\nb`, 'jsx')).toEqual([
      ['text', 'a '],
      ['punct', '='],
      ['text', ' '],
      ['string', "'oops"],
      ['text', '\nb'],
    ]);
  });

  it('a template string may span lines', () => {
    expect(kindOf('x = `a\nb`', 'jsx', '`a\nb`')).toBe('string');
  });
});

describe('tokenize: html', () => {
  it('splits markup into tags, attributes, strings and text; comments are comments', () => {
    expect(pairs('<div class="bit-card"><!-- hi -->Stats</div>', 'html')).toEqual([
      ['punct', '<'],
      ['tag', 'div'],
      ['text', ' '],
      ['attr', 'class'],
      ['punct', '='],
      ['string', '"bit-card"'],
      ['punct', '>'],
      ['comment', '<!-- hi -->'],
      ['text', 'Stats'],
      ['punct', '</'],
      ['tag', 'div'],
      ['punct', '>'],
    ]);
  });

  it('self-closing tags, a lone < in text, and stray characters in a tag', () => {
    expect(pairs('a < b <br ~/>', 'html')).toEqual([
      ['text', 'a < b '],
      ['punct', '<'],
      ['tag', 'br'],
      ['text', ' ~'],
      ['punct', '/>'],
    ]);
  });
});

describe('tokenize: css', () => {
  it('selectors are tags, pseudo-classes and functions keywords, properties props, values numbers', () => {
    expect(pairs('.bit-button:hover {\n  height: 40px;\n  border: var(--bit-line) !important;\n}', 'css')).toEqual([
      ['tag', '.bit-button'],
      ['keyword', ':hover'],
      ['text', ' '],
      ['punct', '{'],
      ['text', '\n  '],
      ['prop', 'height'],
      ['punct', ':'],
      ['text', ' '],
      ['number', '40px'],
      ['punct', ';'],
      ['text', '\n  '],
      ['prop', 'border'],
      ['punct', ':'],
      ['text', ' '],
      ['keyword', 'var'],
      ['punct', '('],
      ['prop', '--bit-line'],
      ['punct', ')'],
      ['text', ' '],
      ['keyword', '!important'],
      ['punct', ';'],
      ['text', '\n'],
      ['punct', '}'],
    ]);
  });

  it('at-rules, comments, strings, hex colors, custom properties and plain words', () => {
    expect(pairs('@media x { /* c */ --a: #FFF "s" auto ~ }', 'css')).toEqual([
      ['keyword', '@media'],
      ['text', ' '],
      ['tag', 'x'],
      ['text', ' '],
      ['punct', '{'],
      ['text', ' '],
      ['comment', '/* c */'],
      ['text', ' '],
      ['prop', '--a'],
      ['punct', ':'],
      ['text', ' '],
      ['number', '#FFF'],
      ['text', ' '],
      ['string', '"s"'],
      ['text', ' auto ~ '],
      ['punct', '}'],
    ]);
  });

  it('a stray closing brace never drops below the top level', () => {
    expect(pairs('} a', 'css')).toEqual([
      ['punct', '}'],
      ['text', ' '],
      ['tag', 'a'],
    ]);
  });
});

describe('tokenize: shell', () => {
  it('the first word of each command is a keyword; flags are attrs; comments only start a word', () => {
    expect(pairs('pnpm add @bit-ds/react --save-dev # dev\nnpm i a#b', 'shell')).toEqual([
      ['keyword', 'pnpm'],
      ['text', ' add @bit-ds/react '],
      ['attr', '--save-dev'],
      ['text', ' '],
      ['comment', '# dev'],
      ['text', '\n'],
      ['keyword', 'npm'],
      ['text', ' i a#b'],
    ]);
  });

  it('pipes and && start a new command; redirects do not; variables, numbers and strings', () => {
    expect(pairs('a 3 | b $HOME && c "x" > 5 $', 'shell')).toEqual([
      ['keyword', 'a'],
      ['text', ' '],
      ['number', '3'],
      ['text', ' '],
      ['punct', '|'],
      ['text', ' '],
      ['keyword', 'b'],
      ['text', ' '],
      ['prop', '$HOME'],
      ['text', ' '],
      ['punct', '&&'],
      ['text', ' '],
      ['keyword', 'c'],
      ['text', ' '],
      ['string', '"x"'],
      ['text', ' '],
      ['punct', '>'],
      ['text', ' '],
      ['number', '5'],
      ['text', ' $'],
    ]);
  });

  it('at the start of a command, a flag-like or numeric word is the command', () => {
    expect(pairs('--version\n42', 'shell')).toEqual([
      ['keyword', '--version'],
      ['text', '\n'],
      ['keyword', '42'],
    ]);
  });
});

describe('tokenize: edges', () => {
  it.each(CODE_LANGUAGES)('%s: empty code is no tokens', (language) => {
    expect(tokenize('', language)).toEqual([]);
  });

  it('an unknown language (an untyped caller) is one plain-text token, never a crash', () => {
    // @ts-expect-error python is not a supported language
    expect(tokenize('a = 1', 'python')).toEqual([{ kind: 'text', text: 'a = 1' }]);
    // @ts-expect-error a prototype key is not a language either
    expect(tokenize('x', 'constructor')).toEqual([{ kind: 'text', text: 'x' }]);
    // @ts-expect-error python is not a supported language
    expect(tokenize('', 'python')).toEqual([]);
  });

  it('CODE_LANGUAGES lists jsx, then the TypeScript pair, then the rest', () => {
    expect(CODE_LANGUAGES).toEqual(['jsx', 'tsx', 'ts', 'html', 'css', 'shell']);
  });
});

/** A seeded PRNG (mulberry32), so a failing case reproduces from its seed. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The awkward pieces code is made of: quotes, escapes, unclosed openers, comment markers, unicode. */
const PIECES = [
  '<', '</', '>', '/>', '<>', '{', '}', '"', "'", '`', '\\', '\\"', "\\'", '=', ':', ';', '#', '$', '${', '-', '--',
  '//', '/*', '*/', '<!--', '-->', '@media', '.', '(', ')', '!important', ' ', '\n', '\t', '&&', '|', '>',
  'a', 'Button', 'div', 'class', 'import', 'from', 'var', '42', '3.5px', '#fff', 'é', '🙂',
];

function randomCode(next: () => number): string {
  const length = Math.floor(next() * 48);
  return Array.from({ length }, () => PIECES[Math.floor(next() * PIECES.length)]).join('');
}

const kinds = new Set<string>(CODE_KINDS);

/** The invariant and the token rules every output must keep. */
function expectWellFormed(code: string, tokens: readonly CodeToken[]): void {
  expect(tokens.map((t) => t.text).join('')).toBe(code);
  for (const [index, t] of tokens.entries()) {
    expect(t.text.length).toBeGreaterThan(0);
    expect(kinds.has(t.kind)).toBe(true);
    if (index > 0 && t.kind === 'text') expect(tokens[index - 1]!.kind).not.toBe('text');
  }
}

describe('tokenize: the invariant (property test)', () => {
  it.each(CODE_LANGUAGES)('%s: joining the tokens gives back any input exactly, over 400 random inputs', (language) => {
    const next = seeded(2026_10_03);
    for (let run = 0; run < 400; run += 1) {
      const code = randomCode(next);
      expectWellFormed(code, tokenize(code, language));
    }
  });

  it.each(CODE_LANGUAGES)('%s: holds for every piece alone and every pair of pieces', (language) => {
    for (const a of PIECES) {
      expectWellFormed(a, tokenize(a, language));
      for (const b of PIECES) expectWellFormed(a + b, tokenize(a + b, language));
    }
  });
});

/** Inputs that have tripped lexers: unclosed openers, stacked modes, stray closers, generics. */
const TRICKY = [
  '{{{', '}}}', '<a', '<a>', '</a>', '<a><b>', '</>', '<>', '<a {b}>', '<a b={<c />}>', '<T,>(x: T) => x',
  'a<b>c', 'x < y > z', 'Array<Promise<T>>', '`${a}`', "'", '"\\\\"', '/*', '<!--', '@media {', '$(',
  'a && <b>{c}</b>', 'é<🙂>',
];

describe('tokenize: the invariant on tricky samples', () => {
  it.each(CODE_LANGUAGES)('%s: joining the tokens gives back every tricky sample, alone and doubled', (language) => {
    for (const code of TRICKY) {
      expectWellFormed(code, tokenize(code, language));
      expectWellFormed(code + code, tokenize(code + code, language));
    }
  });
});

/** Realistic code per language, repeated to fill a long input. */
const SAMPLES: Record<CodeLanguage, string> = {
  jsx: `import { Button } from '@bit-ds/react';\n// note\nconst n = useState<string>("x"); /* c */\nreturn (<Stack gap={16} style={{ a: 1 }}><p>Hi {n} ~</p><Button color="danger" /></Stack>);\n`,
  tsx: `interface P<T> { items?: readonly T[] }\nconst f = <T,>(x: T) => x;\nexport function L<T extends object>({ items }: P<T>) { return <ul>{items?.map((i) => <li key={1}>{String(i)}</li>)}</ul>; }\n`,
  ts: `export enum Size { Sm = 'sm' }\nasync function load<T>(url: string): Promise<Array<T>> { return a < b && c > d ? await f(url) : null; } // c\n`,
  html: `<div class="bit-card"><!-- hi -->Stats a < b <br data-x="" /></div>\n`,
  css: `.bit-button:hover { height: 40px; border: var(--bit-line) !important; } /* c */ @media x { --a: #FFF "s" }\n`,
  shell: `pnpm add @bit-ds/react --save-dev # dev\na 3 | b $HOME && c "x" > 5 $ ~\n`,
};

/** `piece` repeated to exactly `length` characters. */
const fill = (piece: string, length: number) => piece.repeat(Math.ceil(length / piece.length)).slice(0, length);

/** Tokenizes once, in well under a second, and gets the input back. The bound is loose so CI stays steady. */
function expectFast(code: string, language: CodeLanguage): void {
  const start = performance.now();
  const tokens = tokenize(code, language);
  expect(performance.now() - start).toBeLessThan(1500);
  expect(joined(tokens)).toBe(code);
}

describe('tokenize: long input stays fast', () => {
  it.each([
    ['200,000 open braces', '{'.repeat(200_000)],
    ['30,000 <a> tags', '<a>'.repeat(30_000)],
    ['open braces up to the cap', '{'.repeat(TOKENIZE_LIMIT)],
    ['<a> tags up to the cap', fill('<a>', TOKENIZE_LIMIT)],
    ['nested elements up to the cap', fill('<a><b>{x}', TOKENIZE_LIMIT)],
  ])('jsx: %s', (_, code) => {
    expectFast(code, 'jsx');
  });

  it('shell: a word full of # (none starts a comment) up to the cap', () => {
    expectFast(`a${'#'.repeat(TOKENIZE_LIMIT - 1)}`, 'shell');
  });

  it.each(CODE_LANGUAGES)('%s: realistic code up to the cap', (language) => {
    expectFast(fill(SAMPLES[language], TOKENIZE_LIMIT), language);
  });

  it.each(CODE_LANGUAGES)('%s: one plain-text run up to the cap', (language) => {
    expectFast(fill('~', TOKENIZE_LIMIT), language);
  });

  it.each(CODE_LANGUAGES)('%s: code at the cap is still colored', (language) => {
    expect(tokenize(fill(SAMPLES[language], TOKENIZE_LIMIT), language).some((t) => t.kind !== 'text')).toBe(true);
  });

  it.each(CODE_LANGUAGES)('%s: code over the cap is one plain-text token', (language) => {
    const code = fill(SAMPLES[language], TOKENIZE_LIMIT + 1);
    expect(tokenize(code, language)).toEqual([{ kind: 'text', text: code }]);
  });
});
