import { COLORS, Stack, Text } from '@bit-ds/react';
import { CopyChip } from '../../ui/CopyChip';
import { ColorFlow } from './ColorFlow';
import { THEME_FLOWS } from './themeFlows';
import { TokenCard } from './TokenCard';
import type { TokenValues } from './tokenValues';

const ROLES = [
  ['fill', ''],
  ['hover', '-hover'],
  ['soft', '-soft'],
  ['contrast', '-contrast'],
] as const;

/** The page-wide colors that aren't one of the five roles. */
const PAGE_TOKENS = [
  ['bg', '--bit-color-bg'],
  ['surface', '--bit-color-surface'],
  ['text', '--bit-color-text'],
  ['text-muted', '--bit-color-text-muted'],
  ['ink', '--bit-color-ink'],
  ['focus', '--bit-focus-ring-color'],
] as const;

/** A square of the token's own color, read live through var(). Decoration: the name and value say it. */
function Swatch({ token }: { token: string }) {
  return <span className="gallery-swatch" style={{ background: `var(${token})` }} aria-hidden="true" />;
}

function SwatchRow({ name, token, values }: { name: string; token: string; values: TokenValues }) {
  return (
    <Stack direction="row" gap={8} align="center">
      <Swatch token={token} />
      <Stack gap={4} align="start">
        <Text weight="bold">
          {name}
        </Text>
        <CopyChip text={values.values.get(token) ?? ''} />
      </Stack>
    </Stack>
  );
}

/**
 * The color flow (palette → tokens) for the mode on screen, then one Card per color role, headed in its fill
 * and contrast, and a page card for the page-wide colors: 3 + 3.
 */
export function ColorSection({ values }: { values: TokenValues }) {
  return (
    <Stack gap={16}>
      {THEME_FLOWS ? <ColorFlow flows={THEME_FLOWS} mode={values.mode} /> : null}
      <ColorCards values={values} />
    </Stack>
  );
}

function ColorCards({ values }: { values: TokenValues }) {
  return (
    <div className="gallery-color-grid">
      {COLORS.map((color) => (
        <TokenCard
          key={color}
          name={color}
          header={{ background: `var(--bit-color-${color})`, color: `var(--bit-color-${color}-contrast)` }}
        >
          <Stack gap={8}>
            {ROLES.map(([role, suffix]) => (
              <SwatchRow key={role} name={role} token={`--bit-color-${color}${suffix}`} values={values} />
            ))}
          </Stack>
        </TokenCard>
      ))}
      <TokenCard name="page">
        <div className="gallery-swatch-grid">
          {PAGE_TOKENS.map(([name, token]) => (
            <SwatchRow key={token} name={name} token={token} values={values} />
          ))}
        </div>
      </TokenCard>
    </div>
  );
}
