import { Icon, iconBolt, iconTimer, SEMANTIC_TOKENS, Stack } from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import { SectionLead, TokenCard, TokenGrid } from './TokenCard';
import { TokenRow, TokenRows } from './TokenRow';
import type { TokenValues } from './tokenValues';

const MOTION: readonly (readonly [string, IconData])[] = [
  ['fast', iconBolt],
  ['normal', iconTimer],
];

/** The two text colors set to a raw value, so the color flow under Color can't draw them. */
const TEXT_COLORS = [
  ['link visited', '--bit-color-link-visited'],
  ['danger text', '--bit-color-danger-text'],
] as const;

const LOGO = ['coin', 'coin-light', 'coin-shade', 'coin-deep', 'violet'] as const;

/** The syntax colors CodeBlock paints with. The code background and inline-code tokens are in the color flow. */
const SYNTAX = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-code-') && !/^--bit-code-(bg|inline-)/.test(name));

/** A square of a color token, read live through var(). */
function Swatch({ token }: { token: string }) {
  return <span className="gallery-swatch" style={{ background: `var(${token})` }} />;
}

/** Everything else: motion, two text colors, the logo's fixed colors (the same in every theme), and the code syntax colors. */
export function SystemSection({ values }: { values: TokenValues }) {
  const value = (token: string) => values.values.get(token) ?? '';
  return (
    <Stack gap={12}>
      <SectionLead>Everything else: motion, two text colors, code syntax, and the logo's colors, which are the same in every theme.</SectionLead>
      <TokenGrid>
        <TokenCard name="motion">
          <TokenRows>
            {MOTION.map(([speed, icon]) => (
              <TokenRow
                key={speed}
                preview={<Icon icon={icon} />}
                name={speed}
                token={`--bit-duration-${speed}`}
                value={value(`--bit-duration-${speed}`)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="text colors">
          <TokenRows>
            {TEXT_COLORS.map(([name, token]) => (
              <TokenRow key={token} preview={<Swatch token={token} />} name={name} token={token} value={value(token)} />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="logo">
          <TokenRows>
            {LOGO.map((part) => (
              <TokenRow
                key={part}
                preview={<Swatch token={`--bit-logo-${part}`} />}
                name={part}
                token={`--bit-logo-${part}`}
                value={value(`--bit-logo-${part}`)}
              />
            ))}
          </TokenRows>
        </TokenCard>
        <TokenCard name="code syntax" full>
          <TokenRows columns>
            {SYNTAX.map((token) => (
              <TokenRow
                key={token}
                preview={<Swatch token={token} />}
                name={token.slice('--bit-code-'.length)}
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
