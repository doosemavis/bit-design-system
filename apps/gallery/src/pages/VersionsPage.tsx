import { Alert, Badge, Heading, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import { RELEASES } from '../content/changelog';
import { compareLines, isRelease, lineOf } from '../content/versionLines.mjs';
import { BUILD_VERSION } from '../buildVersion';
import { useVersions } from '../shell/useVersions';
import { ChangeList } from '../ui/ChangeList';
import { PageHeader } from '../ui/PageHeader';
import pkg from '../../../../packages/react/package.json';

interface Row {
  line: string;
  version: string;
  react: string;
  reactDom: string;
  latest: boolean;
  viewing: boolean;
}

/** Releases newer than the viewed line that broke something. Empty on the latest line, and for a pre-release build. */
function newerBreaking(currentLine: string) {
  if (!isRelease(BUILD_VERSION)) return [];
  return RELEASES.filter(
    (release) => isRelease(release.version) && compareLines(lineOf(release.version), currentLine) > 0 && (release.sections.Breaking?.length ?? 0) > 0,
  );
}

export function VersionsPage() {
  const { status, file, currentLine } = useVersions();

  const rows: Row[] =
    status === 'ready' && file
      ? file.lines.map((entry) => ({
          line: entry.line,
          version: entry.version,
          react: entry.react,
          reactDom: entry.reactDom,
          latest: entry.line === lineOf(file.latest),
          viewing: entry.line === currentLine,
        }))
      : // Unavailable (or still loading): the one build we know, with the peers this package declares.
        [{ line: currentLine, version: BUILD_VERSION, react: pkg.peerDependencies.react, reactDom: pkg.peerDependencies['react-dom'], latest: false, viewing: true }];

  const latestLine = status === 'ready' && file ? lineOf(file.latest) : null;
  const olderThanLatest = latestLine !== null && compareLines(currentLine, latestLine) < 0;
  const breaking = olderThanLatest ? newerBreaking(currentLine) : [];

  return (
    <Stack gap={24}>
      <PageHeader eyebrow="Start here" title="Versions">
        <Text>Every release line of bit, and the React it needs.</Text>
      </PageHeader>
      <Table aria-label="Versions">
        <TableHead>
          <TableRow>
            <TableCell>bit</TableCell>
            <TableCell>React</TableCell>
            <TableCell>react-dom</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.line}>
              <TableCell>
                <Text weight="bold">{`v${row.version}`}</Text>
              </TableCell>
              <TableCell>
                <Text>{row.react}</Text>
              </TableCell>
              <TableCell>
                <Text>{row.reactDom}</Text>
              </TableCell>
              <TableCell>
                <Stack direction="row" gap={8} wrap>
                  {row.latest ? <Badge color="success">Latest</Badge> : null}
                  {row.viewing && !row.latest ? (
                    <Badge color="primary" variant="outline">
                      Viewing
                    </Badge>
                  ) : null}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {breaking.length > 0 ? (
        <Stack gap={12}>
          <Heading level={2}>Breaking changes ahead</Heading>
          {breaking.map((release) => (
            <Alert key={release.version} color="warning" variant="outline" title={`Breaking changes in ${release.version}`}>
              <ChangeList items={release.sections.Breaking ?? []} label={`Breaking in v${release.version}`} />
            </Alert>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
