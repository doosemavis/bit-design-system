import { Stack } from '@bit-ds/react';
import type { Manifest } from '../manifests';
import { useControlState } from '../engine/useControlState';
import { variantAxes, VariantsTable } from '../engine/VariantsTable';
import { PageSection } from '../ui/PageSection';
import { SectionBar } from '../ui/SectionBar';
import { ComponentHeader } from './component/ComponentHeader';
import { Playground } from './component/Playground';
import { A11yList, ClassTip, classTip, PropsTable, UsageLists } from './component/DocsSections';
import { componentSections, SECTIONS } from './component/sections';

interface ComponentPageProps {
  manifest: Manifest;
}

/** Layout C: header, section bar, then Playground, Variants, the page's extra section, Usage, Props and Accessibility. State lives in the URL. */
export function ComponentPage({ manifest }: ComponentPageProps) {
  const controls = useControlState(manifest);
  const axes = variantAxes(manifest);
  const tip = classTip(manifest);
  return (
    <Stack gap={32}>
      <Stack gap={16}>
        <ComponentHeader manifest={manifest} />
        <SectionBar sections={componentSections(manifest)} />
      </Stack>
      <PageSection {...SECTIONS.playground}>
        <Playground manifest={manifest} controls={controls} />
      </PageSection>
      {axes ? (
        <PageSection {...SECTIONS.variants}>
          <VariantsTable manifest={manifest} axes={axes} state={controls.state} />
        </PageSection>
      ) : null}
      {manifest.extraSection ? (
        <PageSection id={manifest.extraSection.id} title={manifest.extraSection.title}>
          <manifest.extraSection.Component />
        </PageSection>
      ) : null}
      <PageSection {...SECTIONS.usage}>
        <UsageLists usage={manifest.docs.usage} />
      </PageSection>
      <PageSection {...SECTIONS.props} aside={tip ? <ClassTip tip={tip} /> : undefined}>
        <PropsTable manifest={manifest} />
      </PageSection>
      <PageSection {...SECTIONS.accessibility}>
        <A11yList lines={manifest.docs.a11y} />
      </PageSection>
    </Stack>
  );
}
