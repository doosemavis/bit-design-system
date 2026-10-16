import { Alert, Code, Link, Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';
import { PageSection } from '../ui/PageSection';
import { ARCHITECTURE_FACTS } from './architecture/facts';
import { KindTable } from './architecture/KindTable';
import { LayerStack } from './architecture/LayerStack';
import { NamingChain } from './architecture/NamingChain';
import { Scoreboard } from './architecture/Scoreboard';
import type { Score } from './architecture/Scoreboard';

/** The living architecture record. The page is its visual companion, not a copy. */
export const ARCHITECTURE_DOC_URL = 'https://github.com/doosemavis/bit-design-system/blob/main/ARCHITECTURE.md';

const { components, runtimeDependencies, layers, tokens, packageName, version } = ARCHITECTURE_FACTS;

/** Each read from its source (architecture/facts.ts). `dependencies` is the package.json field bit leaves empty. */
const SCORES: readonly Score[] = [
  { count: components, label: 'components' },
  { count: runtimeDependencies, label: 'dependencies' },
  { count: layers.length, label: 'CSS layers' },
  { count: tokens, label: 'tokens' },
];

/**
 * Foundations: how bit is built and why. The layers, drawn from bit's own components with a live specimen in each;
 * the naming rule followed from a prop to a hex code; and the six choices that make bit the kind of system it is.
 * Every count and name on the page is read from its source (architecture/facts.ts).
 */
export function ArchitecturePage() {
  return (
    <Stack gap={64}>
      <PageHeader title="Architecture">
        <Text size={18}>
          How bit is built, and why. One CSS core holds the tokens and every component’s styles; <Code>{packageName}</Code>{' '}
          {`v${version}`} adds the behavior and is the one package you install.
        </Text>
        <Scoreboard scores={SCORES} label="bit by the numbers" />
      </PageHeader>
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
          says when we’d revisit each choice.
        </Alert>
      </PageSection>
    </Stack>
  );
}
