import { Card, CardBody, CardHeader, Code, COLORS, Stack, Text } from '@bit-ds/react';
import type { TokenValues } from './tokenValues';

const ROLES = [
  ['fill', ''],
  ['hover', '-hover'],
  ['soft', '-soft'],
  ['contrast', '-contrast'],
] as const;

/** The page-wide colors that aren't one of the five roles. */
export const SURFACE_TOKENS = [
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
      <Stack gap={4}>
        <Text as="span" size={13} weight="bold">
          {name}
        </Text>
        <Code>{values.values.get(token)}</Code>
      </Stack>
    </Stack>
  );
}

/** One Card per color role, headed in its fill and contrast, then the surface tokens in a row. */
export function ColorSection({ values }: { values: TokenValues }) {
  return (
    <Stack gap={16}>
      <div className="gallery-color-grid">
        {COLORS.map((color) => (
          <Card key={color} aria-label={`${color} tokens`} role="group">
            <CardHeader style={{ background: `var(--bit-color-${color})`, color: `var(--bit-color-${color}-contrast)` }}>
              {color}
            </CardHeader>
            <CardBody>
              <Stack gap={8}>
                {ROLES.map(([role, suffix]) => (
                  <SwatchRow key={role} name={role} token={`--bit-color-${color}${suffix}`} values={values} />
                ))}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </div>
      <Stack direction="row" gap={16} wrap role="group" aria-label="Surface tokens">
        {SURFACE_TOKENS.map(([name, token]) => (
          <SwatchRow key={token} name={name} token={token} values={values} />
        ))}
      </Stack>
    </Stack>
  );
}
