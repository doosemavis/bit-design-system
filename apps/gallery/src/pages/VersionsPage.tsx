import { Alert, Heading, Stack, Text } from '@bit-ds/react';
import { isRelease } from '../content/versionLines.mjs';
import { BUILD_VERSION } from '../buildVersion';
import { useVersions } from '../shell/useVersions';
import { ChangeList } from '../ui/ChangeList';
import { PageHeader } from '../ui/PageHeader';
import { buildRows, newerBreaking } from './versions/versionRows';
import { VersionsTable } from './versions/VersionsTable';
import pkg from '../../../../packages/react/package.json';

/** Every release line with its React range and, on an older copy, what newer lines broke. */
export function VersionsPage() {
  const { status, file, currentLine, ownPath } = useVersions();
  const ready = status === 'ready' ? file : null;
  const current = { line: currentLine, version: BUILD_VERSION, react: pkg.peerDependencies.react, reactDom: pkg.peerDependencies['react-dom'] };
  const rows = buildRows(ready, ownPath, current);
  // A pre-release build has no line to compare.
  const breaking = isRelease(BUILD_VERSION) ? newerBreaking(ready, ownPath, currentLine) : [];

  return (
    <Stack gap={24}>
      <PageHeader eyebrow="Start here" title="Versions">
        <Text>Every release line of bit, and the React it needs.</Text>
      </PageHeader>
      <VersionsTable rows={rows} />
      {breaking.length > 0 ? (
        <Stack gap={12}>
          <Heading level={2}>Breaking changes ahead</Heading>
          {breaking.map((release) => (
            <Alert key={release.version} color="warning" variant="outline" title={`Breaking changes in ${release.version}`}>
              <ChangeList items={release.items} label={`Breaking in v${release.version}`} />
            </Alert>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
