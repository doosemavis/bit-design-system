import { Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';

/** Stub: the release notes arrive with the Versions task. */
export function ReleaseNotesPage() {
  return (
    <Stack gap={24}>
      <PageHeader eyebrow="Start here" title="Release notes">
        <Text>What changed in each release.</Text>
      </PageHeader>
    </Stack>
  );
}
