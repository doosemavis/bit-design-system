import { Badge, CodeBlock, Stack, Text } from '@bit-ds/react';
import type { Manifest, ManifestGroup } from '../../manifests/types';
import { PageHeader } from '../../ui/PageHeader';

const GROUP_LABELS: Record<ManifestGroup, string> = { components: 'Components', forms: 'Forms', brand: 'Brand' };

/** `import { Name, ...parts } from '@bit-ds/react';`: the component first, then its parts in page order. */
export function importChip(manifest: Manifest): string {
  return `import { ${[manifest.name, ...(manifest.parts ?? [])].join(', ')} } from '@bit-ds/react';`;
}

/** Eyebrow, h1, description, the import line as a CodeBlock, and the manifest's badges. */
export function ComponentHeader({ manifest }: { manifest: Manifest }) {
  const line = importChip(manifest);
  return (
    <PageHeader eyebrow={GROUP_LABELS[manifest.group]} title={manifest.name}>
      <Text size={18}>{manifest.description}</Text>
      <CodeBlock code={line} language="jsx" label="import line" />
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
