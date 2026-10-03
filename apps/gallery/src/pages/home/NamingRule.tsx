import type { ReactNode } from 'react';
import { Button, Code, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { ButtonProps } from '@bit-ds/react';

/** One decorator, three ways to say it, and what it reads. */
interface NamingRow {
  prop: string;
  className: string;
  emits: string;
  /** A real token name, or null when each component's own CSS decides. */
  token: string | null;
  /** The live Button the Result column renders. */
  result: ButtonProps;
}

export const NAMING_ROWS: readonly NamingRow[] = [
  { prop: 'color="primary"', className: 'className="bit-primary"', emits: 'bit-primary', token: '--bit-color-primary', result: { color: 'primary' } },
  { prop: 'variant="outline"', className: 'className="bit-outline"', emits: 'bit-outline', token: null, result: { variant: 'outline' } },
  { prop: 'size="lg"', className: 'className="bit-lg"', emits: 'bit-lg', token: '--bit-control-height-lg', result: { size: 'lg' } },
];

/** One naming-rule column. To add a column, add an entry here. */
export interface NamingColumn {
  header: string;
  cell: (row: NamingRow) => ReactNode;
}

export const NAMING_COLUMNS: readonly NamingColumn[] = [
  { header: 'You write (prop)', cell: (row) => <Code>{row.prop}</Code> },
  { header: 'Or write (className)', cell: (row) => <Code>{row.className}</Code> },
  { header: 'Class it emits', cell: (row) => <Code>{row.emits}</Code> },
  {
    header: 'Token',
    cell: (row) =>
      row.token === null ? (
        <Text as="span" size={13} color="neutral">
          per component CSS
        </Text>
      ) : (
        <Code>{row.token}</Code>
      ),
  },
  { header: 'Result', cell: (row) => <Button {...row.result}>Save</Button> },
];

/** The prop you type is the class it emits is the token it reads, with a real Button in each row. */
export function NamingRule() {
  return (
    <Table aria-label="The naming rule">
      <TableHead>
        <TableRow>
          {NAMING_COLUMNS.map((column) => (
            <TableCell key={column.header}>{column.header}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {NAMING_ROWS.map((row) => (
          <TableRow key={row.emits}>
            {NAMING_COLUMNS.map((column) => (
              <TableCell key={column.header}>{column.cell(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
