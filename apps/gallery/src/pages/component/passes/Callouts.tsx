import type { CSSProperties, ReactElement } from 'react';
import { Code, Text } from '@bit-ds/react';
import type { AnatomyPart } from '../../../manifests/types';

const HIDDEN: CSSProperties = { visibility: 'hidden' };

interface CalloutsProps {
  side: AnatomyPart['side'];
  parts: readonly AnatomyPart[];
  /** The steps landed so far: a callout shows when its part's step lands (unseen parts are listed from the start). */
  landed: readonly string[];
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

const hasLanded = (part: AnatomyPart, landed: readonly string[]) => part.unseen !== undefined || landed.includes(part.step ?? part.label);

/**
 * A callout names its part as the part lands. Until then it keeps its slot (so nothing moves when it shows) but is
 * hidden, which also keeps it out of the tab order and the accessibility tree.
 */
function Callout({ part, shown, style, onHot }: { part: AnatomyPart; shown: boolean; style: CSSProperties | undefined; onHot: CalloutsProps['onHot'] }) {
  const on = () => onHot(part.label);
  const off = () => onHot(null);
  return (
    <div
      role="listitem"
      tabIndex={shown ? 0 : -1}
      data-part={part.label}
      className="gallery-passes__callout"
      style={shown ? style : { ...style, ...HIDDEN }}
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
export function Callouts({ side, parts, landed, tops, stacked, onHot }: CalloutsProps): ReactElement | null {
  const mine = parts.filter((part) => part.side === side);
  if (mine.length === 0) return null;
  return (
    <div role="list" aria-label={side === 'left' ? 'Parts, left' : 'Parts, right'} className="gallery-passes__callouts" data-side={side}>
      {mine.map((part) => (
        <Callout key={part.label} part={part} shown={hasLanded(part, landed)} style={placement(part.label, tops, stacked)} onHot={onHot} />
      ))}
    </div>
  );
}
