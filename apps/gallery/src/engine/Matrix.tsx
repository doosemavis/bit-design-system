import { Text } from '@bit-ds/react';
import type { AxisControl, ControlState, Manifest } from '../manifests/types';
import { renderManifest } from './renderManifest';

export interface MatrixAxes {
  rows: AxisControl;
  cols?: AxisControl;
}

/** color × variant when both exist; otherwise the first axis alone; null when there is no axis. */
export function matrixAxes(manifest: Manifest): MatrixAxes | null {
  const axes = manifest.controls.filter((c): c is AxisControl => c.kind === 'axis');
  if (axes.length === 0) return null;
  const color = axes.find((a) => a.prop === 'color');
  const variant = axes.find((a) => a.prop === 'variant');
  if (color && variant) return { rows: color, cols: variant };
  return { rows: axes[0]! };
}

interface MatrixProps {
  manifest: Manifest;
  state: ControlState;
}

/** Every combination on one screen, with the page's other controls (size, text, booleans) applied. */
export function Matrix({ manifest, state }: MatrixProps) {
  const axes = matrixAxes(manifest);
  if (!axes) return null;
  const cols = axes.cols?.values ?? [''];
  return (
    <section className="gallery-matrix" aria-labelledby="matrix-heading">
      <Text as="h2" size={18} id="matrix-heading">
        Matrix
      </Text>
      <div className="gallery-matrix__scroll">
        <table className="gallery-matrix__table" aria-label={`${manifest.name} matrix`}>
          <thead>
            <tr>
              <th scope="col">{axes.rows.prop}</th>
              {axes.cols ? cols.map((c) => <th key={c} scope="col">{c}</th>) : <th scope="col">preview</th>}
            </tr>
          </thead>
          <tbody>
            {axes.rows.values.map((row) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {cols.map((col) => {
                  const cell: ControlState = { ...state, [axes.rows.prop]: row };
                  if (axes.cols) cell[axes.cols.prop] = col;
                  return <td key={axes.cols ? col : 'single'}>{renderManifest(manifest, cell)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
