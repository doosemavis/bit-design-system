import { useState } from 'react';
import { SegmentedControl, Stack, Text } from '@bit-ds/react';
import { RELEASES } from '../content/changelog';
import type { ChangeKind } from '../content/changelog';
import { PageHeader } from '../ui/PageHeader';
import { scrollToSection } from '../ui/scrollToSection';
import { ReleaseCard } from './release-notes/ReleaseCard';
import { VersionRail } from './release-notes/VersionRail';
import { FILTER_KINDS, releaseAnchor } from './release-notes/kinds';

const ALL = 'All';
const total = (kind: ChangeKind) => RELEASES.reduce((sum, r) => sum + (r.sections[kind]?.length ?? 0), 0);
const FILTER_OPTIONS = [
  { value: ALL, label: ALL },
  ...FILTER_KINDS.map((kind) => ({ value: kind, label: `${kind} (${total(kind)})` })),
];

/** What changed in each release, newest first, read from CHANGELOG.md. */
export function ReleaseNotesPage() {
  const [filter, setFilter] = useState<string>(ALL);
  const [opened, setOpened] = useState<Readonly<Record<string, boolean>>>({});
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const kind = filter === ALL ? null : (filter as ChangeKind);
  const shown = kind ? RELEASES.filter((r) => (r.sections[kind]?.length ?? 0) > 0) : RELEASES;
  const current = shown.some((r) => r.version === chosen) ? chosen : shown[0]?.version;
  const isOpen = (version: string, index: number) => kind !== null || (opened[version] ?? index === 0);

  function select(version: string) {
    setOpened((prev) => ({ ...prev, [version]: true }));
    setChosen(version);
    // The heading is in the header, which is never hidden, so it can take focus now.
    scrollToSection(releaseAnchor(version));
  }

  return (
    <Stack gap={32}>
      <PageHeader title="Release notes">
        <Text>What changed in each release.</Text>
      </PageHeader>
      <SegmentedControl legend="Show" options={FILTER_OPTIONS} value={filter} onValueChange={setFilter} />
      {shown.length === 0 ? (
        <Text>No changes of this kind yet.</Text>
      ) : (
        <div className="gallery-releases">
          <VersionRail entries={shown} current={current} onSelect={select} />
          <Stack gap={16}>
            {shown.map((release) => (
              <ReleaseCard
                key={release.version}
                {...release}
                latest={release.version === RELEASES[0]?.version}
                open={isOpen(release.version, RELEASES.indexOf(release))}
                locked={kind !== null}
                only={kind}
                onToggle={() => setOpened((prev) => ({ ...prev, [release.version]: !isOpen(release.version, RELEASES.indexOf(release)) }))}
              />
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  );
}
