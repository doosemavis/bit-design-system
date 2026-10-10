import { useId } from 'react';
import { Card, CardBody, Heading, Stack, Text } from '@bit-ds/react';
import type { ColorMode } from '@bit-ds/react';
import { CopyChip } from '../../ui/CopyChip';
import type { ColorFlow as Flow, ColorFlows } from './colorFlows';

/** Row pitch, bar height and the gap between palette groups, in viewBox units. A row fits one Copy chip. */
const ROW = 24;
const BAR = 16;
const GROUP_GAP = 12;
/** The box each token's Copy chip sits in, right of its tick. */
const CHIP_X_GAP = 16;
const CHIP_W = 300;
/** Where the palette bars and the token ticks sit, and how wide the picture is. */
const LEFT_X = 170;
const BAR_W = 14;
const RIGHT_X = 640;
const WIDTH = 960;
const TOP = 26;

const INK = {
  text: 'var(--bit-color-text)',
  muted: 'var(--bit-color-text-muted)',
  line: 'var(--bit-color-line)',
  shadow: 'var(--bit-color-shadow)',
  accent: 'var(--bit-color-link)',
} as const;

interface Group {
  readonly from: string;
  readonly y: number;
  readonly height: number;
  readonly tokens: readonly { readonly to: string; readonly y: number; readonly tokenY: number }[];
}

/** Groups flows by palette color, in first-seen order, and places each bar and each token row. */
function layout(flows: readonly Flow[]): { groups: readonly Group[]; height: number } {
  const order = [...new Set(flows.map((flow) => flow.from))];
  const leftH = flows.length * ROW + GROUP_GAP * (order.length - 1);
  const height = Math.max(leftH, flows.length * ROW) + TOP * 2;
  const rightTop = TOP + (height - TOP * 2 - flows.length * ROW) / 2;
  let y = TOP + (height - TOP * 2 - leftH) / 2;
  let row = 0;
  const groups = order.map((from) => {
    const names = flows.filter((flow) => flow.from === from).map((flow) => flow.to);
    const tokens = names.map((to, i) => ({ to, y: y + i * ROW, tokenY: rightTop + (row + i) * ROW }));
    const group = { from, y, height: names.length * ROW - (ROW - BAR), tokens };
    y += names.length * ROW + GROUP_GAP;
    row += names.length;
    return group;
  });
  return { groups, height };
}

/** A band from a slot on a palette bar to a token's tick, as one closed curve. */
function bandPath(y0: number, t0: number): string {
  const x1 = LEFT_X + BAR_W;
  const mid = (x1 + RIGHT_X) / 2;
  const [y1, t1] = [y0 + BAR, t0 + BAR];
  return `M${x1},${y0} C${mid},${y0} ${mid},${t0} ${RIGHT_X},${t0} L${RIGHT_X},${t1} C${mid},${t1} ${mid},${y1} ${x1},${y1} Z`;
}

/** The bands, the palette bar and the token ticks: decoration, hidden from screen readers. */
function GroupShapes({ group, hex, accent }: { group: Group; hex: string; accent: boolean }) {
  return (
    <g aria-hidden="true">
      {group.tokens.map((token) => (
        <path
          key={token.to}
          d={bandPath(token.y, token.tokenY)}
          data-flow={`${group.from} → ${token.to}`}
          data-accent={accent ? '' : undefined}
          style={{ fill: hex, opacity: accent ? 0.95 : 0.4, stroke: INK.line, strokeOpacity: accent ? 0.9 : 0.18, strokeWidth: 1 }}
        />
      ))}
      <rect x={LEFT_X + 3} y={group.y + 3} width={BAR_W} height={group.height} rx={3} style={{ fill: INK.shadow }} />
      <rect x={LEFT_X} y={group.y} width={BAR_W} height={group.height} rx={3} style={{ fill: hex, stroke: INK.line, strokeWidth: 2 }} />
      {group.tokens.map((token) => (
        <rect key={token.to} x={RIGHT_X} y={token.tokenY} width={10} height={BAR} style={{ fill: hex, stroke: INK.line, strokeWidth: 1.5 }} />
      ))}
    </g>
  );
}

/** One palette color: its shapes, its name on the left, and a Copy chip per token it feeds on the right. */
function PaletteGroup({ group, hex, accent }: { group: Group; hex: string; accent: boolean }) {
  return (
    <g>
      <GroupShapes group={group} hex={hex} accent={accent} />
      <text x={LEFT_X - 10} y={group.y + group.height / 2 + 4} textAnchor="end" style={{ font: '800 13px var(--bit-font-body)', fill: accent ? INK.accent : INK.text }}>
        {group.from}
      </text>
      {group.tokens.map((token) => (
        <foreignObject key={token.to} x={RIGHT_X + CHIP_X_GAP} y={token.tokenY + BAR / 2 - ROW / 2} width={CHIP_W} height={ROW}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <CopyChip text={token.to} />
          </div>
        </foreignObject>
      ))}
    </g>
  );
}

/**
 * A Sankey of the theme's two tiers: each palette color (left) flows into the public color tokens it feeds
 * (right), for the mode on screen. The flows from the accent's palette color are drawn bright.
 */
export function ColorFlow({ flows, mode }: { flows: ColorFlows; mode: ColorMode }) {
  const titleId = useId();
  const wiring = flows[mode];
  const { groups, height } = layout(wiring);
  const accentFrom = wiring.find((flow) => flow.to === '--bit-color-accent')?.from;
  const total = Object.keys(flows.palette).length;
  return (
    <Card role="group" aria-labelledby={titleId}>
      <CardBody>
        <Stack gap={8}>
          <Heading size={26} id={titleId}>
            Where every color goes
          </Heading>
          <Text color="neutral">
            {`The palette is private to the theme; the tokens are what you use. ${groups.length} of ${total} palette colors feed ${wiring.length} color tokens in ${mode} mode.`}
            {accentFrom ? ` The bright flows come from ${accentFrom}, the accent's color.` : ''}
          </Text>
          <div className="gallery-flow">
            {/* A group, not an img: an img's children are hidden, and each token here is a Copy chip. */}
            <svg viewBox={`0 0 ${WIDTH} ${height}`} role="group" aria-label={`Which palette color feeds each color token, ${mode} mode`}>
              <text x={LEFT_X + 7} y={12} textAnchor="middle" style={{ font: '400 9px var(--bit-font-pixel)', fill: INK.muted }}>
                PALETTE
              </text>
              <text x={RIGHT_X} y={12} style={{ font: '400 9px var(--bit-font-pixel)', fill: INK.muted }}>
                SEMANTIC TOKENS
              </text>
              {groups.map((group) => (
                <PaletteGroup key={group.from} group={group} hex={flows.palette[group.from]!} accent={group.from === accentFrom} />
              ))}
            </svg>
          </div>
        </Stack>
      </CardBody>
    </Card>
  );
}
