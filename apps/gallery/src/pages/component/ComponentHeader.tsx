import { Badge, Code, Stack, Text } from '@bit-ds/react';
import type { Manifest } from '../../manifests/types';
import { PageHeader } from '../../ui/PageHeader';
import { CopyButton } from '../../ui/CopyButton';

/** `import { Name, ...parts } from '@bit-ds/react';`: the component first, then its parts in page order. */
export function importChip(manifest: Manifest): string {
  return `import { ${[manifest.name, ...(manifest.parts ?? [])].join(', ')} } from '@bit-ds/react';`;
}

/** The h1, description, the import chip with Copy, and the manifest's badges. */
export function ComponentHeader({ manifest }: { manifest: Manifest }) {
  const line = importChip(manifest);
  return (
    <PageHeader title={manifest.name}>
      <Text size={18}>{manifest.description}</Text>
      <Stack direction="row" gap={8} align="stretch" wrap>
        <Code className="gallery-import-code">{line}</Code>
        <CopyButton text={line} label="Copy import line" />
      </Stack>
      {manifest.docs.badges.length > 0 ? (
        <Stack direction="row" gap={8} wrap>
          {manifest.docs.badges.map((badge) => (
            <Badge key={badge} variant="outline" shape="square">
              {badge}
            </Badge>
          ))}
        </Stack>
      ) : null}
    </PageHeader>
  );
}
