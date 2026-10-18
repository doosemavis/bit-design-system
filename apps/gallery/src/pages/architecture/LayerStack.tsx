import { Fragment, useId } from 'react';
import type { ReactNode } from 'react';
import {
  Avatar,
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
  iconPalette,
  iconWidgets,
  Link,
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

/** The published package's npm page, where the react box's "published on npm" badge leads. */
const NPM_PAGE = `https://www.npmjs.com/package/${PACKAGE_NAME}`;

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
  /** A card of its own, to set it apart from the other levels in its box. A box's only level goes without one. */
  framed: boolean;
}

/**
 * One layer: its number, name and job on the left, a live specimen of what it holds on the right. A level alone in
 * its box isn't carded inside the box's card (owner, 2026-10-18: no nested cards); gallery.css keeps the card's
 * inset, so its name and specimen sit where every other level's do.
 */
function Level({ n, icon, title, detail, children, framed }: LevelProps) {
  const grid = (
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
  );
  return framed ? (
    <Card flat className="gallery-arch-level">
      <CardBody>{grid}</CardBody>
    </Card>
  ) : (
    <div className="gallery-arch-level" data-framed="false">
      {grid}
    </div>
  );
}

/** A boundary: an outlined box named by its package (tinted for bit's two), holding the layers it ships. */
type ZoneKind = 'core' | 'react' | 'app';
const ZONE_ICON: Readonly<Record<ZoneKind, IconData>> = { core: iconInventory2, react: iconInventory2, app: iconApps };

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

/** Four of the five colors: neutral, the default look, sits out so each row is four across. */
const SPECIMEN_COLORS = COLORS.filter((color) => color !== 'neutral');

/**
 * Level 4's specimen: a Button, an outline Badge and an Avatar in rows, one color per column, so each column is one
 * decorator class (`bit-primary`, …) styling three different components the same way.
 */
function ComponentGrid() {
  return (
    <div className="gallery-arch-specimens" role="group" aria-label="A Button, a Badge and an Avatar in four colors">
      {SPECIMEN_COLORS.map((color) => (
        <Button key={`button-${color}`} color={color} size="sm">
          {color}
        </Button>
      ))}
      {SPECIMEN_COLORS.map((color) => (
        <Badge key={`badge-${color}`} color={color} variant="outline" size="lg">
          {color}
        </Badge>
      ))}
      {SPECIMEN_COLORS.map((color) => (
        <Avatar key={`avatar-${color}`} name={color} color={color} size="sm" />
      ))}
    </div>
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
        specimen: <ComponentGrid />,
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
        <Level n={LAYERS.indexOf(layer) + 1} icon={icon} title={layer.title} detail={detail} framed={layers.length > 1}>
          {specimen}
        </Level>
      </Fragment>
    );
  });
}

/**
 * bit's layers top to bottom, in their package boxes, drawn from the model (model.ts), each level showing a live
 * specimen of what it holds. The model's not-built Angular box isn't drawn here (owner, 2026-10-17); the Mermaid
 * diagram in ARCHITECTURE.md keeps it. The caption says the flow in words, so the picture isn't the only place it lives.
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
        <Zone
          label={<Code>{PACKAGE_NAME}</Code>}
          zone="react"
          badge={
            <Link href={NPM_PAGE} color="neutral" className="gallery-arch-npm">
              <Badge size="lg" flat color="success">
                published on npm
              </Badge>
            </Link>
          }
        >
          <BoxLevels box="published" />
        </Zone>
        <Pipe edge="into-app" verb={verbBetween('components', 'app')} />
        <Zone label={<Text weight="bold">Any React 19 app</Text>} zone="app" badge={<Badge size="lg" flat variant="outline" color="neutral">installs bit</Badge>}>
          <BoxLevels box="app" />
        </Zone>
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
