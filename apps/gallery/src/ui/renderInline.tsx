import type { ReactNode } from 'react';
import { Code } from '@bit-ds/react';

/** Changelog bullets hold plain text and `inline code`: a non-empty backtick pair becomes Code. An empty pair or an unmatched backtick stays text. */
export function renderInline(text: string): ReactNode[] {
  // The capture group puts every code span at an odd index.
  return text.split(/`([^`]+)`/).map((part, index) => (index % 2 === 1 ? <Code key={index}>{part}</Code> : part));
}
