import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { Alert, Box, Card, CardBody, Code, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { AxisControl, Manifest, ManifestDocs, PropDoc } from '../../manifests/types';
import { renderInline } from '../../ui/renderInline';

/** Do and Don't: soft success and soft danger, read as notes rather than live status. */
export function UsageLists({ usage }: { usage: ManifestDocs['usage'] }) {
  return (
    <Box className="gallery-grid">
      <Alert color="success" title="Do" role="note">
        <ul className="gallery-bullets">
          {usage.do.map((line) => (
            <li key={line}>{renderInline(line)}</li>
          ))}
        </ul>
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        <ul className="gallery-bullets">
          {usage.dont.map((line) => (
            <li key={line}>{renderInline(line)}</li>
          ))}
        </ul>
      </Alert>
    </Box>
  );
}

/** A cell with nothing to show: no default, or no class. */
function None() {
  return (
    <Text color="neutral">
      —
    </Text>
  );
}

/** How a union type's members are joined in docs.props, e.g. "'sm' | 'md' | 'lg'". */
const UNION_SEPARATOR = ' | ';

/**
 * A prop's type. A union is one unbreakable chip per member, joined by a plain "|", so a line breaks only
 * between members. The | holds to the member before it (a no-break space), so no line starts with a lone |.
 */
function TypeChips({ type }: { type: string }) {
  const members = type.split(UNION_SEPARATOR);
  if (members.length === 1) return <Code>{type}</Code>;
  return members.map((member, index) => (
    <Fragment key={member}>
      {index > 0 ? ' | ' : null}
      <Code className="gallery-nowrap">{member}</Code>
    </Fragment>
  ));
}

/** One Props-table column. To add a column, add an entry here. */
interface PropColumn {
  header: string;
  cell: (prop: PropDoc) => ReactNode;
  /**
   * A class on the column's body cells: `gallery-nowrap` keeps short code on one line, and
   * `gallery-props__description` keeps Description wide enough that a phone scrolls the table sideways, and
   * `gallery-props__type` keeps Type wide enough for about three union chips per line.
   */
  className?: string;
}

export const PROP_COLUMNS: readonly PropColumn[] = [
  { header: 'Prop', cell: (prop) => <Code>{prop.name}</Code>, className: 'gallery-nowrap' },
  { header: 'Type', cell: (prop) => <TypeChips type={prop.type} />, className: 'gallery-props__type' },
  {
    header: 'Default',
    cell: (prop) => (prop.default === undefined ? <None /> : <Code>{prop.default}</Code>),
    className: 'gallery-nowrap',
  },
  {
    header: 'Class',
    cell: (prop) => (prop.className === undefined ? <None /> : <Code>{prop.className}</Code>),
    className: 'gallery-nowrap',
  },
  { header: 'Description', cell: (prop) => renderInline(prop.description), className: 'gallery-props__description' },
];

/**
 * The example the tip beside the Props heading uses: the color axis if there is one, otherwise the first axis,
 * at `danger` for color (when the axis offers it), otherwise at the axis's last value that is not its
 * default (a default prints nothing, so it would teach nothing). Null without an axis.
 */
export function classTip(manifest: Manifest): { prop: string; value: string } | null {
  const axes = manifest.controls.filter((control): control is AxisControl => control.kind === 'axis');
  const axis = axes.find((control) => control.prop === 'color') ?? axes[0];
  if (!axis) return null;
  const changed = axis.values.filter((v) => v !== axis.default);
  const value = axis.prop === 'color' && axis.values.includes('danger') ? 'danger' : changed[changed.length - 1]!;
  return { prop: axis.prop, value };
}

/** The Props tip: the className that works the same as one prop. It sits on the right of the Props heading. */
export function ClassTip({ tip }: { tip: { prop: string; value: string } }) {
  return (
    <Text>
      Prefer classes? <Code>{`className="bit-${tip.value}"`}</Code> works the same as <Code>{`${tip.prop}="${tip.value}"`}</Code>.
    </Text>
  );
}

export function PropsTable({ manifest }: { manifest: Manifest }) {
  return (
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
                <TableCell key={column.header} className={column.className}>
                  {column.cell(prop)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
    </Table>
  );
}

/** The Accessibility notes, framed in a Card like the Props table and the Usage boxes around them. */
export function A11yList({ lines }: { lines: readonly string[] }) {
  return (
    <Card>
      <CardBody>
        <ul className="gallery-bullets">
          {lines.map((line) => (
            <li key={line}>{renderInline(line)}</li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
