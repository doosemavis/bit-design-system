import { useLayoutEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { Manifest } from '../../../manifests/types';
import type { Point, Rect } from './geometry';
import { Instance } from './Instance';
import { applyOverrides } from './overrides';

const ZOOM = 4;
const MARK_GAP = 8;
const LABEL = { font: '400 12px var(--bit-font-mono)' } as const;
const HALO = 'var(--bit-color-surface)';

interface LoupeProps {
  manifest: Manifest;
  landed: readonly string[];
  at: Point;
  /** The part's thickness in px, as the measure mark says it. */
  thickness: number;
  /** The instance's box in the stage. */
  origin: Rect;
}

/** A 4x copy of the instance around `at`, with a measure mark of `thickness` px: for parts under 6px. */
export function Loupe({ manifest, landed, at, thickness, origin }: LoupeProps): ReactElement {
  const copy = useRef<HTMLDivElement>(null);
  const local = { x: at.x - origin.x, y: at.y - origin.y };
  const half = (thickness * ZOOM) / 2;
  const markX = local.x + MARK_GAP;

  useLayoutEffect(() => {
    const wrapper = copy.current?.querySelector<HTMLElement>('[data-instance]');
    if (!wrapper) return undefined;
    return applyOverrides(wrapper, manifest.anatomy?.parts ?? [], landed);
  }, [manifest, landed]);

  return (
    <div
      data-role="loupe"
      aria-hidden="true"
      inert
      style={{ position: 'absolute', left: origin.x, top: origin.y, width: origin.width, height: origin.height, pointerEvents: 'none' }}
    >
      <div ref={copy} style={{ transform: `scale(${ZOOM})`, transformOrigin: `${local.x}px ${local.y}px` }}>
        <Instance manifest={manifest} inert withBase={false} />
      </div>
      <svg width={origin.width} height={origin.height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* A surface halo under the ink, so the mark reads over the part's own dark border and shadow. */}
        <path d={`M ${markX} ${local.y - half} L ${markX} ${local.y + half}`} stroke={HALO} strokeWidth={6} fill="none" />
        <path
          d={`M ${markX} ${local.y - half} L ${markX} ${local.y + half}`}
          stroke="var(--bit-color-text)"
          strokeWidth={2}
          fill="none"
        />
        <text x={markX + MARK_GAP} y={local.y + 4} fill="var(--bit-color-text)" stroke={HALO} strokeWidth={4} paintOrder="stroke" style={LABEL}>
          {`${thickness}px`}
        </text>
      </svg>
    </div>
  );
}
