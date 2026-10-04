import { Badge, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { VersionRow } from './versionRows';

/** bit / React / react-dom / Status, one row per release line. */
export function VersionsTable({ rows }: { rows: readonly VersionRow[] }) {
  return (
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
          <TableRow key={row.path}>
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
  );
}
