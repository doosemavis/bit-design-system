import { HEADING_SIZES, Stack, TEXT_SIZES, Text } from '@bit-ds/react';
import { SectionLead, TokenCard, TokenGrid } from './TokenCard';
import { TokenRow, TokenRows } from './TokenRow';
import type { TokenValues } from './tokenValues';

const FACES = [
  ['display', 'Lilita One'],
  ['body', 'Nunito'],
  ['pixel', 'Press Start'],
  ['mono', 'JetBrains Mono'],
] as const;

const WEIGHTS = ['normal', 'bold'] as const;
const LEADINGS = ['tight', 'normal'] as const;

/** A two-line sample, so the gap between the lines shows the leading. */
function LeadingSample({ leading }: { leading: string }) {
  return (
    <span style={{ display: 'block', textAlign: 'center', lineHeight: `var(--bit-leading-${leading})` }}>
      Ag
      <br />
      Ag
    </span>
  );
}

/** Faces, the Text and Heading sizes, and the weights and line heights, each a card of rows. */
export function TypeSection({ values }: { values: TokenValues }) {
  const value = (token: string) => values.values.get(token) ?? '';
  return (
    <Stack gap={12}>
      <SectionLead to="/typography" page="Typography">
        The four faces, the Text and Heading sizes, and the weights and line heights they use.
      </SectionLead>
      <TokenGrid>
        <TokenCard name="faces">
          <TokenRows>
            {FACES.map(([face, name]) => (
              <TokenRow
                key={face}
                preview={
                  <Text size={24} className="gallery-face" data-face={face}>
                    Aa
                  </Text>
                }
                name={name}
                token={`--bit-font-${face}`}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="text sizes">
          <TokenRows>
            {/* The supported sizes only: the deprecated 11, 13 and 15 go in 0.2.0, so they aren't offered here. */}
            {TEXT_SIZES.map((size) => (
              <TokenRow
                key={size}
                preview={<span style={{ fontSize: `var(--bit-text-${size}px)`, fontWeight: 'var(--bit-weight-bold)' }}>Ag</span>}
                name={`${size}`}
                token={`--bit-text-${size}px`}
                value={value(`--bit-text-${size}px`)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="heading sizes">
          <TokenRows>
            {HEADING_SIZES.map((size) => (
              <TokenRow
                key={size}
                preview={<span style={{ fontFamily: 'var(--bit-font-display)', fontSize: `var(--bit-heading-${size}px)` }}>Ag</span>}
                name={`${size}`}
                token={`--bit-heading-${size}px`}
                value={value(`--bit-heading-${size}px`)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="weight & leading">
          <TokenRows>
            {WEIGHTS.map((weight) => (
              <TokenRow
                key={weight}
                preview={<span style={{ fontWeight: `var(--bit-weight-${weight})` }}>Aa</span>}
                name={weight}
                token={`--bit-weight-${weight}`}
                value={value(`--bit-weight-${weight}`)}
              />
            ))}
            {LEADINGS.map((leading) => (
              <TokenRow
                key={leading}
                preview={<LeadingSample leading={leading} />}
                name={`${leading} lines`}
                token={`--bit-leading-${leading}`}
                value={value(`--bit-leading-${leading}`)}
              />
            ))}
          </TokenRows>
        </TokenCard>
      </TokenGrid>
    </Stack>
  );
}
