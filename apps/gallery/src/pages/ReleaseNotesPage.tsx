import { useState } from 'react';
import { SegmentedControl, Stack, Text } from '@bit-ds/react';
import { RELEASES } from '../content/changelog';
import type { ChangeKind } from '../content/changelog';
import { PageHeader } from '../ui/PageHeader';
import { releaseStatus, useLatestVersion } from '../shell/latestVersion';
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
  // Choices made while a kind is chosen live apart from the All view, and start over with each new filter.
  const [filteredOpened, setFilteredOpened] = useState<Readonly<Record<string, boolean>>>({});
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  // Latest is the newest published release (versions.json), not the top of CHANGELOG, which can run ahead of its tag.
  const latest = useLatestVersion();
  const kind = filter === ALL ? null : (filter as ChangeKind);
  const shown = kind ? RELEASES.filter((r) => (r.sections[kind]?.length ?? 0) > 0) : RELEASES;
  const current = shown.some((r) => r.version === chosen) ? chosen : shown[0]?.version;
  const isOpen = (version: string, index: number) =>
    kind !== null ? (filteredOpened[version] ?? true) : (opened[version] ?? index === 0);
  const setOpen = (version: string, value: boolean) =>
    (kind !== null ? setFilteredOpened : setOpened)((prev) => ({ ...prev, [version]: value }));

  function choose(next: string) {
    setFilteredOpened({});
    setFilter(next);
  }

  function select(version: string) {
    setOpen(version, true);
    setChosen(version);
    // The heading is in the header, which is never hidden, so it can take focus now.
    scrollToSection(releaseAnchor(version));
  }

  return (
    <Stack gap={32}>
      <PageHeader title="Release notes">
        <Text>What changed in each release.</Text>
      </PageHeader>
      <SegmentedControl legend="Show" options={FILTER_OPTIONS} value={filter} onValueChange={choose} />
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
                status={releaseStatus(release.version, latest)}
                open={isOpen(release.version, RELEASES.indexOf(release))}
                only={kind}
                onToggle={() => setOpen(release.version, !isOpen(release.version, RELEASES.indexOf(release)))}
              />
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  );
}
