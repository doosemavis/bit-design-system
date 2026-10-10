import { Text } from '@bit-ds/react';
import type { ReactNode } from 'react';
import { CopyChip } from '../../ui/CopyChip';
import { formatValue } from './formatValue';

interface TokenRowProps {
  /** A sample drawn with the token, in the fixed-width column on the left. Decoration: the name and chip say it. */
  preview: ReactNode;
  /** A short name for the step or role, such as "16" or "inset". */
  name: ReactNode;
  /** The token's full name: the Copy chip shows it and copies it. */
  token: string;
  /** The value the page computes for the token right now; empty when it isn't worth showing (a font stack). */
  value?: string;
}

/**
 * One token, in the same shape everywhere: the preview in a fixed column, then the name, a dotted leader and
 * the value on one line (the value at the card's right edge), then the Copy chip under the name. So in every
 * card the previews, names, values and chips each line up, and the leader ties each name to its value.
 */
export function TokenRow({ preview, name, token, value = '' }: TokenRowProps) {
  return (
    <div className="gallery-token-row">
      <span className="gallery-token-row__preview" aria-hidden="true">
        {preview}
      </span>
      <div className="gallery-token-row__text">
        <Text weight="bold" className="gallery-token-row__name">
          {name}
        </Text>
        <span className="gallery-token-row__leader" aria-hidden="true" />
        {/* 14, the caption size: the value is muted detail beside the name, and the inset shadow's still fits a phone. */}
        <Text size={14} color="neutral" className="gallery-token-row__value">
          {formatValue(value)}
        </Text>
        <span className="gallery-token-row__chip">
          <CopyChip text={token} />
        </span>
      </div>
    </div>
  );
}

/**
 * A card's rows, one under another. `columns` lays a long family out in as many 17rem columns as fit; `wide`
 * uses 24rem columns, for a family whose values are long (the shadows).
 */
export function TokenRows({ columns = false, wide = false, children }: { columns?: boolean; wide?: boolean; children: ReactNode }) {
  const layout = wide ? ' gallery-token-rows--wide' : columns ? ' gallery-token-rows--columns' : '';
  return <div className={`gallery-token-rows${layout}`}>{children}</div>;
}
