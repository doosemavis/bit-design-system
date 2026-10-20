import type { ReactNode } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Code,
  CodeBlock,
  COLOR_MODES,
  COLORS,
  Icon,
  ICON_GROUPS,
  iconBolt,
  iconCelebration,
  iconFavorite,
  iconHome,
  iconPalette,
  iconSearch,
  Link,
  Stack,
  Text,
} from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { CURRENT_TOKENS } from '../../content/currentTokens';
import { InstallCommand } from '../../content/InstallCommand';
import { PACKAGE_NAME, STYLE_IMPORTS } from '../../content/snippets.mjs';
import { COMPONENT_COUNT, MANIFESTS, routeFor } from '../../manifests';
import { PAGE_HEADER } from '../tokens/TokenCard';
import { FactList } from '../../ui/FactList';
import type { Fact } from '../../ui/FactList';

/** The first component, as Getting started writes it: the styles once, then a Button. */
const FIRST_COMPONENT = `${STYLE_IMPORTS}\nimport { Button } from '${PACKAGE_NAME}';\n\n<Button color="primary">Save</Button>`;

/**
 * The hero's right side: install the package (with Getting started's pnpm / npm / yarn switcher, which shares
 * its remembered pick) and use a first component, each block with its Copy button. One layer: the two code
 * panels are the frames, under a plain caption, with no card around them (a card of panels nests frames).
 */
export function QuickStart() {
  return (
    <Stack gap={8} role="group" aria-label="quick start">
      <Text weight="bold">Quick start</Text>
      <Stack gap={12}>
        <InstallCommand />
        <CodeBlock language="jsx" code={FIRST_COMPONENT} label="Your first component" />
      </Stack>
    </Stack>
  );
}

const ICON_COUNT = ICON_GROUPS.reduce((n, group) => n + group.icons.length, 0);

/** Four facts, each counted from its source, so they stay true as the system grows. */
const FACTS: readonly Fact[] = [
  [COMPONENT_COUNT, 'components'],
  [CURRENT_TOKENS.length, 'tokens'],
  [ICON_COUNT, 'icons'],
  [COLOR_MODES.length, 'color modes'],
];

/** Two by two under the hero's buttons. Outline cards, with no fill or shadow: facts to read, so they sit back from the Buttons above them. */
export function Facts() {
  return <FactList facts={FACTS} label="At a glance" />;
}

/**
 * One "start building" card: a dark header like the Tokens page, its content, and a link pinned to the bottom.
 * Flat: only the link clicks, so the card reads as a surface, not a button.
 */
function StartCard({ name, to, link, children }: { name: string; to: string; link: string; children: ReactNode }) {
  return (
    <Card flat role="group" aria-label={name} className="gallery-start-card">
      <CardHeader style={PAGE_HEADER}>{name}</CardHeader>
      <CardBody>
        {children}
        <Link asChild className="gallery-start-card__link">
          <RouterLink to={to}>
            {link} <span aria-hidden="true">→</span>
          </RouterLink>
        </Link>
      </CardBody>
    </Card>
  );
}

/** The five color roles, then the text color. */
const SWATCHES = [...COLORS, 'text'] as const;
const SAMPLE_ICONS = [iconFavorite, iconBolt, iconHome, iconSearch, iconPalette, iconCelebration];

/** Three ways on: install it, see the tokens, browse the icons. */
export function StartBuilding() {
  const icon = MANIFESTS.find((m) => m.slug === 'icon')!;
  return (
    <div className="gallery-token-grid">
      <StartCard name="get started" to="/getting-started" link="Five short steps">
        <ol className="gallery-steps">
          <li>
            Install <Code>{PACKAGE_NAME}</Code>
          </li>
          <li>Add the styles once</li>
          <li>Use a component</li>
        </ol>
      </StartCard>
      <StartCard name="tokens" to="/tokens" link="Explore the tokens">
        <Stack direction="row" gap={8} aria-hidden="true">
          {SWATCHES.map((role) => (
            <span key={role} className="gallery-swatch" style={{ background: `var(--bit-color-${role})` }} />
          ))}
        </Stack>
        <Text color="neutral">{`${CURRENT_TOKENS.length} tokens for color, type, space and shape, each one copyable.`}</Text>
      </StartCard>
      <StartCard name="icons" to={routeFor(icon)} link="Browse the icons">
        <Stack direction="row" gap={12} aria-hidden="true">
          {SAMPLE_ICONS.map((data) => (
            <Icon key={data.name} icon={data} size="lg" />
          ))}
        </Stack>
        <Text color="neutral">{`${ICON_COUNT} Material Symbols icons, each with a filled version.`}</Text>
      </StartCard>
    </div>
  );
}
