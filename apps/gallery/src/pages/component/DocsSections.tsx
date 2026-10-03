import type { ReactNode } from 'react';
import { Alert, Box, Code, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { AxisControl, Manifest, ManifestDocs, PropDoc } from '../../manifests/types';

/** Do and Don't: soft success and soft danger, read as notes rather than live status. */
export function UsageLists({ usage }: { usage: ManifestDocs['usage'] }) {
  return (
    <Box className="gallery-grid">
      <Alert color="success" title="Do" role="note">
        <ul className="gallery-bullets">
          {usage.do.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        <ul className="gallery-bullets">
          {usage.dont.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Alert>
    </Box>
  );
}

/** A cell with nothing to show: no default, or no class. */
function None() {
  return (
    <Text as="span" color="neutral">
      —
    </Text>
  );
}

/** One Props-table column. To add a column, add an entry here. */
export interface PropColumn {
  header: string;
  cell: (prop: PropDoc) => ReactNode;
  /** Keep the cell on one line (short code); long types and descriptions wrap. */
  nowrap?: boolean;
}

export const PROP_COLUMNS: readonly PropColumn[] = [
  { header: 'Prop', cell: (prop) => <Code>{prop.name}</Code>, nowrap: true },
  { header: 'Type', cell: (prop) => <Code>{prop.type}</Code> },
  { header: 'Default', cell: (prop) => (prop.default === undefined ? <None /> : <Code>{prop.default}</Code>), nowrap: true },
  { header: 'Class', cell: (prop) => (prop.className === undefined ? <None /> : <Code>{prop.className}</Code>), nowrap: true },
  { header: 'Description', cell: (prop) => prop.description },
];

/**
 * The example the tip under the Props table uses: the color axis if there is one, otherwise the first axis,
 * at `danger` for color (when the axis offers it), otherwise at the axis's last value. Null without an axis.
 */
export function classTip(manifest: Manifest): { prop: string; value: string } | null {
  const axes = manifest.controls.filter((control): control is AxisControl => control.kind === 'axis');
  const axis = axes.find((control) => control.prop === 'color') ?? axes[0];
  if (!axis) return null;
  const value = axis.prop === 'color' && axis.values.includes('danger') ? 'danger' : axis.values[axis.values.length - 1]!;
  return { prop: axis.prop, value };
}

export function PropsTable({ manifest }: { manifest: Manifest }) {
  const tip = classTip(manifest);
  return (
    <Stack gap={8}>
      <Table aria-label={`${manifest.name} props`}>
        <TableHead>
          <TableRow>
            {PROP_COLUMNS.map((column) => (
              <TableCell key={column.header}>{column.header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {manifest.docs.props.map((prop) => (
            <TableRow key={prop.name}>
              {PROP_COLUMNS.map((column) => (
                <TableCell key={column.header} className={column.nowrap ? 'gallery-nowrap' : undefined}>
                  {column.cell(prop)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {tip ? (
        <Text size={13}>
          Prefer classes? <Code>{`className="bit-${tip.value}"`}</Code> works the same as <Code>{`${tip.prop}="${tip.value}"`}</Code>.
        </Text>
      ) : null}
    </Stack>
  );
}

export function A11yList({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="gallery-bullets">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
