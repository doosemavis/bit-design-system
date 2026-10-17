import { Fragment, useId } from 'react';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Code,
  CodeBlock,
  COLORS,
  Heading,
  Icon,
  iconApps,
  iconBrush,
  iconDataObject,
  iconInventory2,
  iconLock,
  iconPalette,
  iconWidgets,
  Stack,
  Text,
  useColorMode,
} from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import { PACKAGE_NAME, STYLE_IMPORTS } from '../../content/snippets.mjs';
import { THEME_FLOWS } from '../tokens/themeFlows';
import { ARCHITECTURE_FACTS } from './facts';
import { LAYERS, layersIn, verbBetween } from './model';
import type { Box, Layer } from './model';
import { resolveFill } from './NamingChain';

/**
 * The real decorator rule and the real Button rule that reads it, trimmed to one property each. Every code line
 * here is a line of packages/core/src/system/colors.css or components/button.css; architecture.test.ts checks it.
 */
export const DECORATOR_SNIPPET = `/* system/colors.css: one rule per color, written once */
.bit-primary {
  --_bit-color: var(--bit-color-primary);
}

/* components/button.css: reads only the private variable */
.bit-button.bit-solid {
  background: var(--_bit-color);
}`;

/** The app's side: the styles once, theme first, then a component. */
const APP_SNIPPET = `${STYLE_IMPORTS}\nimport { Button } from '${PACKAGE_NAME}';`;

/**
 * A connector between two boxes: one accent line, the border's width, with a drawn arrowhead, edge to edge, and the
 * word for how one feeds the next. Decoration: the caption says it.
 */
function Pipe({ verb, edge }: { verb: string; edge?: string }) {
  return (
    <div className="gallery-arch-pipe" data-edge={edge} aria-hidden="true">
      <span className="gallery-arch-pipe__line" />
      <Text color="neutral" className="gallery-arch-label gallery-arch-pipe__verb">
        {verb}
      </Text>
    </div>
  );
}

interface LevelProps {
  n: number;
  icon: IconData;
  title: string;
  detail: ReactNode;
  /** What this layer holds, drawn live: swatches, tokens, CSS, components. */
  children: ReactNode;
}

/** One layer: its number, name and job on the left, a live specimen of what it holds on the right. */
function Level({ n, icon, title, detail, children }: LevelProps) {
  return (
    <Card flat className="gallery-arch-level">
      <CardBody>
        <div className="gallery-arch-level__grid">
          <Stack gap={8} align="start">
            <Stack direction="row" gap={8} align="center">
              <span className="gallery-arch-level__icon" aria-hidden="true">
                <Icon icon={icon} className="gallery-arch-icon" />
              </span>
              <Text color="neutral" className="gallery-arch-label">{`Level ${n}`}</Text>
            </Stack>
            <Heading size={26}>{title}</Heading>
            <Text color="neutral">
              {detail}
            </Text>
          </Stack>
          <div className="gallery-arch-level__specimen">{children}</div>
        </div>
      </CardBody>
    </Card>
  );
}

/** A boundary: an outlined box named by its package (tinted for bit's two), holding the layers it ships. */
type ZoneKind = 'core' | 'react' | 'future' | 'app';
const ZONE_ICON: Readonly<Record<ZoneKind, IconData>> = { core: iconInventory2, react: iconInventory2, future: iconLock, app: iconApps };

/**
 * A boundary box. A named group, so a screen reader entering it hears the package ("@bit-ds/core, private · inlined at
 * build, group") before its levels, the grouping the picture shows.
 */
function Zone({ label, zone, badge, children }: { label: ReactNode; zone: ZoneKind; badge: ReactNode; children: ReactNode }) {
  const headerId = useId();
  return (
    <Card variant="outline" className="gallery-arch-zone" data-zone={zone} role="group" aria-labelledby={headerId}>
      <CardHeader id={headerId}>
        <Stack direction="row" gap={8} align="center" wrap>
          <Icon icon={ZONE_ICON[zone]} />
          {label}
          {badge}
        </Stack>
      </CardHeader>
      <CardBody>
        <div className="gallery-arch-zone__levels">{children}</div>
      </CardBody>
    </Card>
  );
}

/** The palette colors behind the five fills, for the mode on screen: five equal tiles across the level, each a block
 * of the color over its name and hex. */
function Palette() {
  const { mode } = useColorMode();
  return (
    <ul role="list" className="gallery-arch-swatches" aria-label={`Palette colors behind the five fills, ${mode} mode`}>
      {COLORS.map((color) => {
        const fill = resolveFill(THEME_FLOWS, color, mode);
        return fill.hex ? (
          <li key={color}>
            <span className="gallery-arch-tile" style={{ background: fill.hex }} aria-hidden="true" />
            <Text>{fill.palette}</Text>
            <Code>{fill.hex}</Code>
          </li>
        ) : null;
      })}
    </ul>
  );
}

/** The five fill tokens, each beside the palette color it reads in the mode on screen. */
function Tokens() {
  const { mode } = useColorMode();
  return (
    <ul role="list" className="gallery-arch-token-list" aria-label="Five color tokens and the palette color each reads">
      {COLORS.map((color) => {
        const fill = resolveFill(THEME_FLOWS, color, mode);
        return (
          <li key={color}>
            <span className="gallery-swatch" style={{ background: `var(${fill.token})` }} aria-hidden="true" />
            <Code>{fill.token}</Code>
            <span className="gallery-token-row__leader" aria-hidden="true" />
            {fill.palette ? (
              <Text color="neutral">
                {`reads ${fill.palette}`}
              </Text>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The future framework: a package box like the others, dashed and locked, so nobody mistakes it for a shipped one.
 * Its header holds only the lock and the tag, so it stays one line, level with the react box's header beside it.
 */
function Locked() {
  return (
    <Zone label={null} zone="future" badge={<Badge size="lg" flat variant="outline" color="neutral">not built</Badge>}>
      <Stack gap={8} align="start">
        <Heading size={26}>A second framework</Heading>
        <Text color="neutral">
          <Code>@bit-ds/angular</Code> would read the same core and add its own behavior. bit is designed for a second
          framework; it doesn’t ship one.
        </Text>
      </Stack>
    </Zone>
  );
}

/** What each level shows beside its name: its icon, its job in a line, and a live specimen of what it holds. */
function levelContent(id: Layer['id']): { icon: IconData; detail: ReactNode; specimen: ReactNode } {
  const { layers, paletteColors, tokens } = ARCHITECTURE_FACTS;
  switch (id) {
    case 'theme':
      return {
        icon: iconPalette,
        detail: `Tier 1: ${paletteColors} raw colors, and only the theme file reads them. These ${COLORS.length} feed the five fills.`,
        specimen: <Palette />,
      };
    case 'tokens':
      return { icon: iconDataObject, detail: `Tier 2, the public API: ${tokens} tokens, and every theme declares every one.`, specimen: <Tokens /> };
    case 'css':
      return {
        icon: iconBrush,
        detail: (
          <>
            Decorators and component rules, in the <Code>{layers.at(-1) ?? 'bit.components'}</Code> layer.
          </>
        ),
        specimen: <CodeBlock code={DECORATOR_SNIPPET} language="css" label="Decorator and component CSS" />,
      };
    case 'components':
      return {
        icon: iconWidgets,
        detail: 'They emit the classes, and own focus, keyboard and ARIA.',
        specimen: (
          <Stack direction="row" gap={8} wrap>
            {COLORS.map((color) => (
              <Button key={color} color={color} size="sm">
                {color}
              </Button>
            ))}
          </Stack>
        ),
      };
    case 'app':
      return {
        icon: iconApps,
        detail: 'It imports a theme and the styles once, then uses components.',
        specimen: <CodeBlock code={APP_SNIPPET} language="tsx" label="Your app's imports" />,
      };
  }
}

/** A box's levels in model order, each numbered by its place in the whole stack, joined by the model's verbs. */
function BoxLevels({ box }: { box: Box }) {
  const layers = layersIn(box);
  return layers.map((layer, i) => {
    const { icon, detail, specimen } = levelContent(layer.id);
    return (
      <Fragment key={layer.id}>
        {i > 0 ? <Pipe verb={verbBetween(layers[i - 1]!.id, layer.id)} /> : null}
        <Level n={LAYERS.indexOf(layer) + 1} icon={icon} title={layer.title} detail={detail}>
          {specimen}
        </Level>
      </Fragment>
    );
  });
}

/**
 * bit's layers top to bottom, in their package boxes, drawn from the model (model.ts), each level showing a live
 * specimen of what it holds. The figure is one grid of named areas: the not-built box comes after the app in reading
 * order (where a phone shows it), and the grid places it beside the react box when there is room. The caption says
 * the flow in words, so the picture isn't the only place it lives.
 */
export function LayerStack() {
  const captionId = useId();
  return (
    <figure className="gallery-arch" aria-label="bit's layers, top to bottom" aria-describedby={captionId}>
      <div className="gallery-arch__grid">
        <Zone label={<Code>@bit-ds/core</Code>} zone="core" badge={<Badge size="lg" flat variant="outline" color="neutral">private · inlined at build</Badge>}>
          <BoxLevels box="core" />
        </Zone>
        <Pipe edge="into-published" verb={verbBetween('css', 'components')} />
        <Zone label={<Code>{PACKAGE_NAME}</Code>} zone="react" badge={<Badge size="lg" flat color="success">published on npm</Badge>}>
          <BoxLevels box="published" />
        </Zone>
        <Pipe edge="into-app" verb={verbBetween('components', 'app')} />
        <Zone label={<Text weight="bold">Any React 19 app</Text>} zone="app" badge={<Badge size="lg" flat variant="outline" color="neutral">installs bit</Badge>}>
          <BoxLevels box="app" />
        </Zone>
        <Locked />
      </div>
      <figcaption id={captionId}>
        <Text color="neutral">
          Read top to bottom: the theme’s palette maps onto semantic tokens; component CSS reads only those tokens;
          that CSS styles the classes the React components emit; and your app imports the components.
        </Text>
      </figcaption>
    </figure>
  );
}
