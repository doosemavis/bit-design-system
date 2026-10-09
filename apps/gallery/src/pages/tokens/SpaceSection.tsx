import { Box, SIZES, SPACE_STEPS, Stack } from '@bit-ds/react';
import { SectionLead, TokenCard, TokenGrid } from './TokenCard';
import { TokenRow, TokenRows } from './TokenRow';
import type { TokenValues } from './tokenValues';

/** A Button's look at one size, on a span: bit's classes are public, so the sample needs no button. */
function ControlSample({ size }: { size: string }) {
  return <span className={`bit-button bit-neutral bit-outline bit-${size}`}>Aa</span>;
}

/** The space steps as ruler bars, then the control heights and paddings, each family a full-width card. */
export function SpaceSection({ values }: { values: TokenValues }) {
  const value = (token: string) => values.values.get(token) ?? '';
  return (
    <Stack gap={12}>
      <SectionLead to="/spacing" page="Spacing">
        Gaps and padding, and the control sizes they add up to.
      </SectionLead>
      <TokenGrid>
        <TokenCard name="space" full>
          <TokenRows columns>
            {SPACE_STEPS.map((step) => (
              <TokenRow
                key={step}
                preview={<Box paddingLeft={step} className="gallery-ruler__bar" />}
                name={`${step}`}
                token={`--bit-space-${step}px`}
                value={value(`--bit-space-${step}px`)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="controls" full>
          <TokenRows columns>
            {(['height', 'padding'] as const).flatMap((part) =>
              SIZES.map((size) => (
                <TokenRow
                  key={`${part}-${size}`}
                  preview={<ControlSample size={size} />}
                  name={`${part} ${size}`}
                  token={`--bit-control-${part}-${size}`}
                  value={value(`--bit-control-${part}-${size}`)}
                />
              )),
            )}
          </TokenRows>
        </TokenCard>
      </TokenGrid>
    </Stack>
  );
}
