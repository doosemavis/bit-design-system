import { Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';

/** Stub: the release lines and the install-a-version help arrive with the Versions task. */
export function VersionsPage() {
  return (
    <Stack gap={24}>
      <PageHeader eyebrow="Start here" title="Versions">
        <Text>Every release line of bit, and where to read its docs.</Text>
      </PageHeader>
    </Stack>
  );
}
