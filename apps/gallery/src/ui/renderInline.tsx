import type { ReactNode } from 'react';
import { Code } from '@bit-ds/react';

/** Changelog bullets hold plain text and `inline code`: split on backticks into text and Code. An unmatched backtick stays text. */
export function renderInline(text: string): ReactNode[] {
  const parts = text.split('`');
  // An odd count of backticks leaves the last piece unclosed, so it is text with its backtick restored.
  const closed = parts.length % 2 === 1 ? parts : [...parts.slice(0, -2), `${parts[parts.length - 2]}\`${parts[parts.length - 1]}`];
  return closed.map((part, index) => (index % 2 === 1 ? <Code key={index}>{part}</Code> : part));
}
