import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { Alert, Code, Link, Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';
import { PageSection } from '../ui/PageSection';
import { renderInline } from '../ui/renderInline';
import { REPO_FILES, SUMMARY } from './architecture/architectureDoc';
import { ARCHITECTURE_FACTS } from './architecture/facts';
import { KindTable } from './architecture/KindTable';
import { LayerStack } from './architecture/LayerStack';
import { NamingChain } from './architecture/NamingChain';
import { Scoreboard } from './architecture/Scoreboard';
import type { Score } from './architecture/Scoreboard';

/** The living architecture record. The page is its visual companion, not a copy. */
export const ARCHITECTURE_DOC_URL = `${REPO_FILES}ARCHITECTURE.md`;

const { components, runtimeDependencies, layers, tokens, packageName, version } = ARCHITECTURE_FACTS;

/**
 * Each read from its source (architecture/facts.ts), and each linked to where a reader can count it: the README's
 * component list, npm's dependencies tab (`dependencies` is the package.json field bit leaves empty), the README
 * section that names the layers, and the Tokens page.
 */
const SCORES: readonly Score[] = [
  { count: components, label: 'components', link: { href: `${REPO_FILES}README.md#components` } },
  { count: runtimeDependencies, label: 'dependencies', link: { href: `https://www.npmjs.com/package/${packageName}?activeTab=dependencies` } },
  { count: layers.length, label: 'CSS layers', link: { href: `${REPO_FILES}README.md#your-css-wins` } },
  { count: tokens, label: 'tokens', link: { to: '/tokens' } },
];

/** The summary's **bold** terms as bold Text (inline, nested in the paragraph), and its `inline code` as Code. */
function renderSummary(text: string): ReactNode[] {
  // The capture group puts every bold run at an odd index.
  return text
    .split(/\*\*([^*]+)\*\*/)
    .map((part, index) =>
      index % 2 === 1 ? (
        <Text key={index} weight="bold">
          {renderInline(part)}
        </Text>
      ) : (
        <Fragment key={index}>{renderInline(part)}</Fragment>
      ),
    );
}

/**
 * Foundations: how bit is built and why. The layers, drawn from bit's own components with a live specimen in each;
 * the naming rule followed from a prop to a hex code; and the six choices that make bit the kind of system it is.
 * Every count and name on the page is read from its source (architecture/facts.ts).
 */
export function ArchitecturePage() {
  return (
    <Stack gap={64} className="gallery-arch-page">
      <PageHeader title="Architecture">
        <Text size={18}>
          How bit is built, and why. One CSS core holds the tokens and every component’s styles; <Code>{packageName}</Code>{' '}
          {`v${version}`} adds the behavior and is the one package you install.
        </Text>
        <Scoreboard scores={SCORES} label="bit by the numbers" />
      </PageHeader>
      <PageSection id="architecture-summary" title="In system-design terms">
        {/* §1 of ARCHITECTURE.md, read at build time (architectureDoc.ts), so the page and the doc say the same thing. */}
        <Text>{renderSummary(SUMMARY)}</Text>
      </PageSection>
      <PageSection id="architecture-layers" title="How the layers fit">
        <LayerStack />
      </PageSection>
      <PageSection id="architecture-naming" title="The naming rule, live">
        <Text>
          The word you type as a prop is the class bit emits and the token that class reads, and the theme gives that
          token its hex. Pick a color to follow it all the way down.
        </Text>
        <NamingChain />
      </PageSection>
      <PageSection id="architecture-kind" title="What kind of design system this is" landmark={false}>
        <KindTable />
        <Alert color="primary" variant="outline" role="note" icon={false}>
          These rows are §4 of <Link href={ARCHITECTURE_DOC_URL}>ARCHITECTURE.md</Link>, read at build time, and every
          count on this page is read from the code: a test fails CI if the page and the code disagree. The doc also
          lists the options each choice turned down, and when we’d revisit it.
        </Alert>
      </PageSection>
    </Stack>
  );
}
