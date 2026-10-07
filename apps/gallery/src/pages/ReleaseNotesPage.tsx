import { Badge, Heading, Stack, Text } from '@bit-ds/react';
import type { BadgeProps } from '@bit-ds/react';
import { CHANGE_KINDS, RELEASES } from '../content/changelog';
import type { ChangeKind } from '../content/changelog';
import { ChangeList } from '../ui/ChangeList';
import { PageHeader } from '../ui/PageHeader';

const KIND_BADGE: Record<ChangeKind, Pick<BadgeProps, 'color' | 'variant'>> = {
  Breaking: { color: 'danger', variant: 'solid' },
  Added: { color: 'success', variant: 'solid' },
  Changed: { color: 'primary', variant: 'outline' },
  Fixed: { color: 'primary', variant: 'outline' },
  Removed: { color: 'neutral', variant: 'outline' },
};

/** What changed in each release, newest first, read from CHANGELOG.md. */
export function ReleaseNotesPage() {
  return (
    <Stack gap={32}>
      <PageHeader title="Release notes">
        <Text>What changed in each release.</Text>
      </PageHeader>
      {RELEASES.map((release) => (
        <Stack key={release.version} gap={16} align="start">
          <Stack direction="row" gap={12} align="center" wrap>
            <Heading level={2}>{`v${release.version}`}</Heading>
            {release.date ? (
              <Badge color="neutral" variant="outline">
                {release.date}
              </Badge>
            ) : null}
          </Stack>
          {CHANGE_KINDS.map((kind) => {
            const items = release.sections[kind];
            if (!items || items.length === 0) return null;
            return (
              <Stack key={kind} gap={8} align="start">
                <Badge {...KIND_BADGE[kind]}>{kind}</Badge>
                <ChangeList items={items} label={`${kind} in v${release.version}`} />
              </Stack>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}
