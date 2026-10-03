import { forwardRef, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { tokenize } from './tokenize';
import type { CodeLanguage, CodeToken } from './tokenize';
import { CopyButton } from './CopyButton';

export type { CodeLanguage } from './tokenize';

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
  /** The code to show, exactly as written. */
  code: string;
  /** Picks the syntax colors and the label in the bar. */
  language: CodeLanguage;
  /** Show the Copy button. Default true. */
  copy?: boolean;
  /**
   * The accessible name of the code area. Default `${language} code`.
   * Give each CodeBlock on a page a unique label when several share a language; the code area is a named region.
   */
  label?: string;
  /** Extra controls in the bar, rendered between the language label and Copy. */
  actions?: ReactNode;
}

/** Plain text stays a bare string; every other token is a span the CSS colors by `data-kind`. */
function renderToken(token: CodeToken, index: number): ReactNode {
  if (token.kind === 'text') return token.text;
  return (
    <span key={index} className={element('code', 'token')} data-kind={token.kind}>
      {token.text}
    </span>
  );
}

/** A dark code panel with editor colors, a language label, optional actions and a Copy button. */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, language, copy = true, label, actions, className, ...rest },
  ref,
) {
  const tokens = useMemo(() => tokenize(code, language), [code, language]);
  return (
    <div ref={ref} className={withClassName(element('code', 'block'), className)} data-language={language} {...dropLegacyColor(rest)}>
      <div className={element('code', 'bar')}>
        <span className={element('code', 'lang')}>{language}</span>
        {actions == null ? null : <div className={element('code', 'actions')}>{actions}</div>}
        {copy ? <CopyButton code={code} /> : null}
      </div>
      <pre className={element('code', 'pre')} tabIndex={0} role="region" aria-label={label || `${language} code`}>
        <code>{tokens.map(renderToken)}</code>
      </pre>
    </div>
  );
});
