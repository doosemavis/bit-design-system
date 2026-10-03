export type TokenKind = 'tag' | 'attr' | 'string' | 'punct' | 'text';
export interface Token {
  kind: TokenKind;
  text: string;
}

/**
 * A small tokenizer for the two things the gallery prints: JSX snippets and HTML markup.
 * It is not a parser; it only needs four colors, and joining the tokens must reproduce the input.
 */
export function highlight(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let inTag = false;

  const push = (kind: TokenKind, text: string) => {
    if (text.length > 0) tokens.push({ kind, text });
  };

  while (i < code.length) {
    const rest = code.slice(i);

    if (!inTag) {
      const open = rest.match(/^<\/?/);
      if (open) {
        push('punct', open[0]);
        i += open[0].length;
        const name = code.slice(i).match(/^[A-Za-z][\w.-]*/);
        if (name) {
          push('tag', name[0]);
          i += name[0].length;
        }
        inTag = true;
        continue;
      }
      const str = rest.match(/^'[^']*'|^"[^"]*"/);
      if (str) {
        push('string', str[0]);
        i += str[0].length;
        continue;
      }
      const brace = rest.match(/^[{}]/);
      if (brace) {
        push('punct', brace[0]);
        i += 1;
        continue;
      }
      const text = rest.match(/^[^<'"{}]+/);
      push('text', text ? text[0] : rest[0]!);
      i += text ? text[0].length : 1;
      continue;
    }

    const close = rest.match(/^\/?>/);
    if (close) {
      push('punct', close[0]);
      i += close[0].length;
      inTag = false;
      continue;
    }
    const str = rest.match(/^"[^"]*"|^'[^']*'/);
    if (str) {
      push('string', str[0]);
      i += str[0].length;
      continue;
    }
    const expr = rest.match(/^\{[^}]*\}/);
    if (expr) {
      push('punct', '{');
      push('text', expr[0].slice(1, -1));
      push('punct', '}');
      i += expr[0].length;
      continue;
    }
    const attr = rest.match(/^[A-Za-z_:][\w:.-]*/);
    if (attr) {
      push('attr', attr[0]);
      i += attr[0].length;
      continue;
    }
    const eq = rest.match(/^=/);
    if (eq) {
      push('punct', '=');
      i += 1;
      continue;
    }
    const ws = rest.match(/^\s+/);
    push('text', ws ? ws[0] : rest[0]!);
    i += ws ? ws[0].length : 1;
  }
  return tokens;
}
