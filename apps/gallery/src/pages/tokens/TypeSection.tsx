import { Stack, Text } from '@bit-ds/react';
import { SUPPORTED_TEXT_SIZES } from '../../content/textSizes';
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

/** Faces, the text sizes, and the weights and line heights, each a card of rows. */
export function TypeSection({ values }: { values: TokenValues }) {
  const value = (token: string) => values.values.get(token) ?? '';
  return (
    <Stack gap={12}>
      <SectionLead to="/typography" page="Typography">
        The four faces, the text sizes, and the weights and line heights Text and Heading use.
      </SectionLead>
      <TokenGrid>
        <TokenCard name="faces">
          <TokenRows>
            {FACES.map(([face, name]) => (
              <TokenRow
                key={face}
                preview={
                  <Text as="span" size={24} className="gallery-face" data-face={face}>
                    Aa
                  </Text>
                }
                name={name}
                token={`--bit-font-${face}`}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="sizes">
          <TokenRows>
            {/* The supported sizes only: the deprecated 11 goes in 0.2.0, so it isn't offered here. */}
            {SUPPORTED_TEXT_SIZES.map((size) => (
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
