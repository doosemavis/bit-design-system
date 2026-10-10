import { Table, TableBody, TableCell, TableHead, TableRow } from '@bit-ds/react';
import type { AxisControl, ControlState, Manifest } from '../manifests/types';
import { renderManifest } from './renderManifest';

/** One row per color and one column per variant; or a single axis as one row (no `row`), or one row per value with variantsLayout 'stack'. */
interface VariantAxes {
  row?: AxisControl;
  column: AxisControl;
}

/** color × variant when both exist; otherwise the first axis alone; null when there is no axis. */
export function variantAxes(manifest: Manifest): VariantAxes | null {
  const axes = manifest.controls.filter((c): c is AxisControl => c.kind === 'axis');
  if (axes.length === 0) return null;
  const color = axes.find((a) => a.prop === 'color');
  const variant = axes.find((a) => a.prop === 'variant');
  if (color && variant) return { row: color, column: variant };
  return { column: axes[0]! };
}

interface VariantsTableProps {
  manifest: Manifest;
  axes: VariantAxes;
  /** The playground's state, so size, text and booleans carry into every cell. */
  state: ControlState;
}

/** Every combination, drawn live, in a bit Table. */
export function VariantsTable({ manifest, axes, state }: VariantsTableProps) {
  const { row, column } = axes;
  const stacked = !row && manifest.variantsLayout === 'stack';
  const cell = (rowValue: string | undefined, columnValue: string) => {
    const cellState: ControlState = {
      ...state,
      [column.prop]: columnValue,
      ...(row && rowValue !== undefined ? { [row.prop]: rowValue } : {}),
    };
    return <TableCell key={columnValue}>{renderManifest(manifest, cellState, { sample: true })}</TableCell>;
  };
  return (
    <Table aria-label={`${manifest.name} variants`} className={stacked ? 'gallery-variants-stack' : undefined}>
      <TableHead>
        {stacked ? (
          <TableRow>
            <TableCell>{column.prop}</TableCell>
            <TableCell>sample</TableCell>
          </TableRow>
        ) : (
          <TableRow>
            {row ? <TableCell>{row.prop}</TableCell> : null}
            {column.values.map((value) => (
              <TableCell key={value}>{value}</TableCell>
            ))}
          </TableRow>
        )}
      </TableHead>
      <TableBody>
        {stacked ? (
          column.values.map((value) => (
            <TableRow key={value}>
              <TableCell as="th" scope="row">
                {value}
              </TableCell>
              {cell(undefined, value)}
            </TableRow>
          ))
        ) : row ? (
          row.values.map((rowValue) => (
            <TableRow key={rowValue}>
              <TableCell as="th" scope="row">
                {rowValue}
              </TableCell>
              {column.values.map((columnValue) => cell(rowValue, columnValue))}
            </TableRow>
          ))
        ) : (
          <TableRow>{column.values.map((columnValue) => cell(undefined, columnValue))}</TableRow>
        )}
      </TableBody>
    </Table>
  );
}
