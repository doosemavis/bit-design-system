import type { CSSProperties, ReactElement } from 'react';
import { Code, Text } from '@bit-ds/react';
import type { AnatomyPart } from '../../../manifests/types';

const HIDDEN: CSSProperties = { visibility: 'hidden' };

interface CalloutsProps {
  side: AnatomyPart['side'];
  parts: readonly AnatomyPart[];
  /** Each callout's placed top in its column, by label; null before the first measure. */
  tops: Readonly<Record<string, number>> | null;
  /** Stacked: the callouts flow as a list under the instance, with no tops. */
  stacked: boolean;
  /** The pointed-at or focused callout's label, or null when it leaves. */
  onHot: (label: string | null) => void;
}

/** Where a callout sits: in the list flow when stacked, at its placed top, or hidden until it has one (no first-frame flash). */
function placement(label: string, tops: CalloutsProps['tops'], stacked: boolean): CSSProperties | undefined {
  if (stacked) return undefined;
  const top = tops?.[label];
  return top === undefined ? HIDDEN : { top };
}

function Callout({ part, style, onHot }: { part: AnatomyPart; style: CSSProperties | undefined; onHot: CalloutsProps['onHot'] }) {
  const on = () => onHot(part.label);
  const off = () => onHot(null);
  return (
    <div
      role="listitem"
      tabIndex={0}
      data-part={part.label}
      className="gallery-passes__callout"
      style={style}
      onFocus={on}
      onBlur={off}
      onMouseEnter={on}
      onMouseLeave={off}
    >
      <Text weight="bold">{part.label}</Text>
      {part.tokens.map((token) => (
        <Code key={token}>{token}</Code>
      ))}
      {part.unseen ? <Text>{part.unseen}</Text> : null}
    </div>
  );
}

/** One column of callouts: each part's label and tokens, focusable so the keyboard lights its part up too. */
export function Callouts({ side, parts, tops, stacked, onHot }: CalloutsProps): ReactElement | null {
  const mine = parts.filter((part) => part.side === side);
  if (mine.length === 0) return null;
  return (
    <div role="list" aria-label={side === 'left' ? 'Parts, left' : 'Parts, right'} className="gallery-passes__callouts" data-side={side}>
      {mine.map((part) => (
        <Callout key={part.label} part={part} style={placement(part.label, tops, stacked)} onHot={onHot} />
      ))}
    </div>
  );
}
