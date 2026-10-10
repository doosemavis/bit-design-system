import { Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';
import { PageSection } from '../ui/PageSection';
import { SectionBar } from '../ui/SectionBar';
import { useTokenValues } from './tokens/tokenValues';
import { ColorSection } from './tokens/ColorSection';
import { TypeSection } from './tokens/TypeSection';
import { SpaceSection } from './tokens/SpaceSection';
import { ShapeSection } from './tokens/ShapeSection';
import { SystemSection } from './tokens/SystemSection';

const SECTIONS = {
  color: { id: 'tokens-color', title: 'Color' },
  type: { id: 'tokens-type', title: 'Type' },
  space: { id: 'tokens-space', title: 'Space' },
  shape: { id: 'tokens-shape', title: 'Shape' },
  system: { id: 'tokens-system', title: 'System' },
} as const;

/**
 * Foundations: the theme's whole public API, with values computed live in the current mode. The color flow
 * holds the color tokens; every other token is a row in one card below it, each name a Copy chip.
 */
export function TokensPage() {
  const values = useTokenValues();
  return (
    <Stack gap={64}>
      <Stack gap={16}>
        <PageHeader title="Tokens">
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
        <TypeSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.space}>
        <SpaceSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.shape}>
        <ShapeSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.system}>
        <SystemSection values={values} />
      </PageSection>
    </Stack>
  );
}
