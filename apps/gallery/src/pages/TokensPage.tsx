import { Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';
import { PageSection } from '../ui/PageSection';
import { SectionBar } from '../ui/SectionBar';
import { useTokenValues } from './tokens/tokenValues';
import { ColorSection } from './tokens/ColorSection';
import { SpaceRow, TypeRow } from './tokens/CompactRows';
import { ShapeSection } from './tokens/ShapeSection';
import { AllTokens } from './tokens/AllTokens';

const SECTIONS = {
  color: { id: 'tokens-color', title: 'Color' },
  type: { id: 'tokens-type', title: 'Type' },
  space: { id: 'tokens-space', title: 'Space' },
  shape: { id: 'tokens-shape', title: 'Shape' },
  all: { id: 'tokens-all', title: 'All tokens' },
} as const;

/** Foundations: the theme's whole public API, with values computed live in the current mode. */
export function TokensPage() {
  const values = useTokenValues();
  return (
    <Stack gap={32}>
      <Stack gap={16}>
        <PageHeader eyebrow="Foundations" title="Tokens">
          <Text size={18}>
            Every value a theme sets, read live from this page, so they follow the light and dark switch.
          </Text>
        </PageHeader>
        <SectionBar sections={Object.values(SECTIONS)} />
      </Stack>
      <PageSection {...SECTIONS.color}>
        <ColorSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.type}>
        <TypeRow />
      </PageSection>
      <PageSection {...SECTIONS.space}>
        <SpaceRow />
      </PageSection>
      <PageSection {...SECTIONS.shape}>
        <ShapeSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.all}>
        <AllTokens values={values} />
      </PageSection>
    </Stack>
  );
}
