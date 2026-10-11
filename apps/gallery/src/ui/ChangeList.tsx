import { Text } from '@bit-ds/react';
import { renderInline } from './renderInline';

/** A code span's stand-in while a headline is cut (a private-use character): no dot, colon or bracket, so code never ends a sentence. */
const HOLE = (index: number) => `\uE000${index}\uE000`;
const HOLES = /\uE000(\d+)\uE000/g;
/** A subject before the colon reads as a label only when it is short; a later colon is mid-sentence. */
const SUBJECT_MAX = 60;

export interface ChangeHeadline {
  /** What changed, when the item opens "Name: …" (Slider notched). */
  subject?: string;
  /** The rest of the first sentence, in plain words. */
  text: string;
}

/**
 * A changelog item's one-line headline: its first sentence, without parentheses, code as plain text, and the short
 * subject before a colon apart. The item itself stays the source; this only reads it.
 */
export function changeHeadline(item: string): ChangeHeadline {
  const parts = item.split(/`([^`]+)`/);
  const code = parts.filter((_, index) => index % 2 === 1);
  // Text with every code span held as a HOLE, so the cuts below only ever look at prose.
  const masked = parts.map((part, index) => (index % 2 === 1 ? HOLE((index - 1) / 2) : part)).join('');
  const end = /\.(?=\s|$)/.exec(masked);
  const sentence = (end ? masked.slice(0, end.index + 1) : masked).replace(/\s*\([^()]*\)/g, '');
  const restore = (text: string) => text.replace(HOLES, (_, index: string) => code[Number(index)]!).trim();
  const colon = sentence.indexOf(': ');
  if (colon > 0 && restore(sentence.slice(0, colon)).length <= SUBJECT_MAX) {
    return { subject: restore(sentence.slice(0, colon)), text: restore(sentence.slice(colon + 2)) };
  }
  return { text: restore(sentence) };
}

function Headline({ item }: { item: string }) {
  const { subject, text } = changeHeadline(item);
  return (
    <Text>
      {subject ? (
        <>
          <Text weight="bold">{subject}</Text>: {text}
        </>
      ) : (
        text
      )}
    </Text>
  );
}

interface ChangeListProps {
  items: readonly string[];
  label: string;
  /** Each item's plain headline instead of the full item with its code. */
  headlines?: boolean;
}

/** A bulleted list of changelog items. A plain list: the gallery has no List component. */
export function ChangeList({ items, label, headlines = false }: ChangeListProps) {
  return (
    <ul className="gallery-bullets" aria-label={label}>
      {items.map((item, index) => (
        <li key={index}>{headlines ? <Headline item={item} /> : renderInline(item)}</li>
      ))}
    </ul>
  );
}
