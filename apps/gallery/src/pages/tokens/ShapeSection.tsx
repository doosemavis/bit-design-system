import { SEMANTIC_TOKENS, Stack } from '@bit-ds/react';
import type { CSSProperties } from 'react';
import { SectionLead, TokenCard, TokenGrid } from './TokenCard';
import { TokenRow, TokenRows } from './TokenRow';
import type { TokenValues } from './tokenValues';

const RADII = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-radius-'));
const SHADOWS = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-shadow-'));

const FOCUS_RING = 'var(--bit-focus-ring-width) solid var(--bit-focus-ring-color)';

/** The lines around everything: the border, the press, and the focus ring's color, width and offset. */
const LINES: readonly { name: string; token: string; style: CSSProperties; swatch?: boolean }[] = [
  { name: 'border', token: '--bit-border-width', style: { borderWidth: 'var(--bit-border-width)' } },
  {
    name: 'press',
    token: '--bit-press-offset',
    style: { boxShadow: 'var(--bit-press-offset) var(--bit-press-offset) 0 var(--bit-color-shadow)' },
  },
  { name: 'focus color', token: '--bit-focus-ring-color', style: { background: 'var(--bit-focus-ring-color)' }, swatch: true },
  { name: 'focus width', token: '--bit-focus-ring-width', style: { outline: FOCUS_RING } },
  { name: 'focus offset', token: '--bit-focus-ring-offset', style: { outline: FOCUS_RING, outlineOffset: 'var(--bit-focus-ring-offset)' } },
];

/** The step after the family prefix: "6px" for --bit-radius-6px, "inset" for --bit-shadow-inset. */
const step = (token: string, family: string) => token.slice(`--bit-${family}-`.length);

/** Radius, lines and shadow: a card each, every row a surface tile drawn with its own token. */
export function ShapeSection({ values }: { values: TokenValues }) {
  const value = (token: string) => values.values.get(token) ?? '';
  return (
    <Stack gap={12}>
      <SectionLead>Corners, the hard shadows, and the lines around everything.</SectionLead>
      {/* Two wide columns, not three: radius and lines side by side, then shadow across the full width, so its
          long values (an inset shadow and its color) stay on one line like every other row. */}
      <TokenGrid wide>
        <TokenCard name="radius">
          <TokenRows>
            {RADII.map((token) => (
              <TokenRow
                key={token}
                preview={<span className="gallery-shape" style={{ borderRadius: `var(${token})` }} />}
                name={step(token, 'radius').replace(/px$/, '')}
                token={token}
                value={value(token)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="lines">
          <TokenRows>
            {LINES.map((line) => (
              <TokenRow
                key={line.token}
                preview={<span className={line.swatch ? 'gallery-swatch' : 'gallery-shape'} style={line.style} />}
                name={line.name}
                token={line.token}
                value={value(line.token)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="shadow" full>
          <TokenRows wide>
            {SHADOWS.map((token) => (
              <TokenRow
                key={token}
                preview={<span className="gallery-shape" style={{ boxShadow: `var(${token})` }} />}
                name={step(token, 'shadow')}
                token={token}
                value={value(token)}
              />
            ))}
          </TokenRows>
        </TokenCard>
      </TokenGrid>
    </Stack>
  );
}
