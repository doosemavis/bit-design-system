import { Fragment } from 'react';
import { Code, Stack, Text } from '@bit-ds/react';
import type { Manifest } from '../../manifests/types';
import { PageHeader } from '../../ui/PageHeader';
import { CopyButton } from '../../ui/CopyButton';
import { renderInline } from '../../ui/renderInline';

/** `import { Name, ...parts } from '@bit-ds/react';`: the component first, then its parts in page order. */
export function importChip(manifest: Manifest): string {
  return `import { ${[manifest.name, ...(manifest.parts ?? [])].join(', ')} } from '@bit-ds/react';`;
}

/** What separates two facts on the meta line: a middle dot, which screen readers pass over as a pause. */
const FACT_SEPARATOR = ' · ';

/**
 * The manifest's short facts ("Native <button>", "Keyboard ready") as one muted line of body text. They used to
 * be a row of pixel Badges at 8px, which read as a second header.
 */
function MetaLine({ facts }: { facts: readonly string[] }) {
  return (
    <Text color="neutral" className="gallery-meta">
      {facts.map((fact, index) => (
        <Fragment key={fact}>
          {index > 0 ? FACT_SEPARATOR : null}
          {fact}
        </Fragment>
      ))}
    </Text>
  );
}

/** The h1, a plain description, the facts on one muted line, and the import line with Copy. */
export function ComponentHeader({ manifest }: { manifest: Manifest }) {
  const line = importChip(manifest);
  return (
    <PageHeader title={manifest.name}>
      <Text size={18}>{renderInline(manifest.description)}</Text>
      {manifest.docs.badges.length > 0 ? <MetaLine facts={manifest.docs.badges} /> : null}
      <Stack direction="row" gap={8} align="stretch" wrap>
        <Code className="gallery-import-code">{line}</Code>
        <CopyButton text={line} label="Copy import line" />
      </Stack>
    </PageHeader>
  );
}
