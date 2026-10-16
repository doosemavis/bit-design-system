import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  announce,
  Button,
  Card,
  CardBody,
  Code,
  CodeBlock,
  COLORS,
  Icon,
  iconArrowDownward,
  iconArrowForward,
  SegmentedControl,
  Stack,
  Text,
  useColorMode,
} from '@bit-ds/react';
import type { Color, ColorMode } from '@bit-ds/react';
import type { ColorFlows } from '../tokens/colorFlows';
import { THEME_FLOWS } from '../tokens/themeFlows';

/** A color's fill token, and where the theme gets it in a mode: the palette entry it reads and that entry's hex. */
export interface Fill {
  readonly token: string;
  readonly palette?: string;
  readonly hex?: string;
}

/** Follows `--bit-color-{color}` through the theme to its hex, for a mode. Only the token when the theme is unread. */
export function resolveFill(flows: ColorFlows | null, color: Color, mode: ColorMode): Fill {
  const token = `--bit-color-${color}`;
  const palette = flows?.[mode].find((flow) => flow.to === token)?.from;
  const hex = palette ? flows?.palette[palette] : undefined;
  return palette && hex ? { token, palette, hex } : { token };
}

/**
 * The two theme lines that give a fill its hex, the palette entry (tier 1) then the token that reads it (tier 2),
 * inside a selector both apply under: the theme's class, plus the mode class in dark (both are in the theme's own
 * selector lists). A declaration needs its rule, or CodeBlock reads the hex as a selector.
 */
export function themeLines(fill: Fill, mode: ColorMode): string {
  const selector = mode === 'dark' ? '.bit-theme-power-up.bit-dark' : '.bit-theme-power-up';
  return `${selector} {\n  --bit-palette-${fill.palette}: ${fill.hex};\n  ${fill.token}: var(--bit-palette-${fill.palette});\n}`;
}

function Step({ n, label, last = false, children }: { n: number; label: string; last?: boolean; children: ReactNode }) {
  return (
    <li className="gallery-arch-chain__step">
      <Stack gap={4} align="start">
        <Text color="neutral" className="gallery-arch-label">{`${n} · ${label}`}</Text>
        {children}
      </Stack>
      {last ? null : (
        // Right while the chain runs in a row, down once it stacks: CSS shows one of the two.
        <>
          <Icon icon={iconArrowForward} size="lg" className="gallery-arch-chain__arrow" data-dir="row" />
          <Icon icon={iconArrowDownward} size="lg" className="gallery-arch-chain__arrow" data-dir="column" />
        </>
      )}
    </li>
  );
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** What the caption says about the other mode: the hex it changes to, or that this color doesn't change. */
function otherMode(color: Color, mode: ColorMode, fill: Fill): ReactNode {
  const other: ColorMode = mode === 'dark' ? 'light' : 'dark';
  const there = resolveFill(THEME_FLOWS, color, other);
  if (!there.hex) return null;
  if (there.hex === fill.hex) return ` ${capitalize(fill.palette ?? '')} is the same in light and dark.`;
  return (
    <>
      {' '}
      In {other} mode it reads {there.palette}, <Code>{there.hex}</Code>: switch the mode in the header to watch it change.
    </>
  );
}

/**
 * The naming rule, live: pick a color and every step moves, from the prop you type, to the class bit emits, the token
 * that class reads, the hex the theme assigns that token in the mode on screen, and the pixels a real Button paints.
 * It starts on neutral, the fill that changes between modes, so switching the mode shows the hex follow.
 */
export function NamingChain() {
  const [color, setColor] = useState<Color>('neutral');
  const { mode } = useColorMode();
  const fill = resolveFill(THEME_FLOWS, color, mode);
  const choose = (value: string) => {
    const next = value as Color;
    setColor(next);
    const hex = resolveFill(THEME_FLOWS, next, mode).hex;
    announce(`bit-${next}, --bit-color-${next}${hex ? `, ${hex}` : ''}`);
  };
  return (
    <Card flat>
      <CardBody>
        <div className="gallery-arch-naming">
          <div className="gallery-arch-picker">
            <SegmentedControl legend="color" size="sm" options={COLORS.map((value) => ({ value, label: value }))} value={color} onValueChange={choose} />
          </div>
          <ol role="list" className="gallery-arch-chain" aria-label="From the prop to the pixels">
            <Step n={1} label="prop">
              <Code>{`color="${color}"`}</Code>
            </Step>
            <Step n={2} label="class">
              <Code>{`bit-${color}`}</Code>
            </Step>
            <Step n={3} label="token">
              <Code>{fill.token}</Code>
            </Step>
            {fill.hex ? (
              <Step n={4} label="hex">
                <Stack direction="row" gap={8} align="center">
                  <span className="gallery-swatch" style={{ background: fill.hex }} aria-hidden="true" />
                  <Code>{fill.hex}</Code>
                </Stack>
              </Step>
            ) : null}
            <Step n={fill.hex ? 5 : 4} label="pixels" last>
              <Button color={color}>Save</Button>
            </Step>
          </ol>
          {fill.hex ? (
            <Stack gap={8}>
              <CodeBlock code={themeLines(fill, mode)} language="css" label={`power-up theme, ${mode} mode`} />
              <Text color="neutral">
                In {mode} mode, power-up sets <Code>{fill.token}</Code> to the palette’s {fill.palette},{' '}
                <Code>{fill.hex}</Code>.{otherMode(color, mode, fill)}
              </Text>
            </Stack>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
