import { useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Code, CodeBlock, Text } from '@bit-ds/react';
import type { AnatomyPart, AnchorPoint, Manifest } from '../../../manifests/types';
import { defaultState } from '../../../engine/state';
import { toJsx } from '../../../code/toJsx';
import { Instance } from './Instance';
import { useStageMeasure } from './useStageMeasure';

export interface Point {
  x: number;
  y: number;
}
export interface Line {
  part: string;
  from: Point;
  to: Point;
}
export interface BoxMeasure {
  x: number;
  y: number;
  width: number;
  height: number;
  paddingLeft: number;
}

/** A point on a box. */
export function anchorPoint(box: DOMRect, anchor: AnchorPoint): Point {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  switch (anchor) {
    case 'center':
      return { x: cx, y: cy };
    case 'top':
      return { x: cx, y: box.top };
    case 'bottom':
      return { x: cx, y: box.bottom };
    case 'left':
      return { x: box.left, y: cy };
    case 'left-upper':
      return { x: box.left, y: box.top + box.height / 4 };
    case 'right':
      return { x: box.right, y: cy };
    case 'bottom-right':
      return { x: box.right, y: box.bottom };
  }
}

const relative = (point: Point, origin: DOMRect): Point => ({ x: point.x - origin.left, y: point.y - origin.top });

/** One line per part: from its callout's edge facing the instance to its anchor on the part, relative to the stage. */
export function measureLines(stage: HTMLElement, parts: readonly AnatomyPart[]): Line[] {
  const origin = stage.getBoundingClientRect();
  const instance = stage.querySelector('[data-instance]');
  if (!instance) return [];
  const callouts = [...stage.querySelectorAll<HTMLElement>('[data-part]')];
  return parts.flatMap((part) => {
    const target = instance.querySelector(part.selector);
    const callout = callouts.find((el) => el.dataset.part === part.label);
    if (!target || !callout) return [];
    const edge = callout.getBoundingClientRect();
    const from = { x: part.side === 'left' ? edge.right : edge.left, y: edge.top + edge.height / 2 };
    const to = anchorPoint(target.getBoundingClientRect(), part.anchor ?? (part.side === 'left' ? 'left' : 'right'));
    return [{ part: part.label, from: relative(from, origin), to: relative(to, origin) }];
  });
}

/** The instance's box relative to the stage, and its left padding, for the Wireframe dimensions. */
export function measureBox(stage: HTMLElement): BoxMeasure | null {
  const target = stage.querySelector<HTMLElement>('[data-instance] > *');
  if (!target) return null;
  const origin = stage.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  return {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
    paddingLeft: parseFloat(getComputedStyle(target).paddingLeft) || 0,
  };
}

/** The classes the rendered element really has: the Final pass's "Reads". */
export function renderedClasses(stage: HTMLElement): string {
  return stage.querySelector('[data-instance] > *')?.className ?? '';
}

const LINE = { stroke: 'currentColor', strokeWidth: 1.5, fill: 'none' } as const;
const LABEL = { font: '400 12px var(--bit-font-mono)' } as const;

/** The diagram layer over a canvas: decorative, since the callouts and the caption carry the content. */
function Overlay({ children }: { children: ReactNode }) {
  return (
    <svg className="gallery-passes__svg" aria-hidden="true" pointerEvents="none">
      {children}
    </svg>
  );
}

export function WireframePass({ manifest }: { manifest: Manifest }) {
  const canvas = useRef<HTMLDivElement>(null);
  const box = useStageMeasure(canvas, measureBox, null);
  return (
    <div ref={canvas} className="gallery-passes__canvas">
      <Instance manifest={manifest} inert />
      {box ? (
        <Overlay>
          <path d={`M ${box.x - 16} ${box.y} L ${box.x - 16} ${box.y + box.height}`} {...LINE} />
          <text x={box.x - 22} y={box.y + box.height / 2 + 4} textAnchor="end" fill="currentColor" style={LABEL}>
            {`${Math.round(box.height)}px`}
          </text>
          <path d={`M ${box.x} ${box.y - 12} L ${box.x + box.paddingLeft} ${box.y - 12}`} {...LINE} />
          <text x={box.x + box.paddingLeft / 2} y={box.y - 18} textAnchor="middle" fill="currentColor" style={LABEL}>
            {`${Math.round(box.paddingLeft)}px`}
          </text>
        </Overlay>
      ) : null}
    </div>
  );
}

function Callout({ part }: { part: AnatomyPart }) {
  return (
    <div role="listitem" data-part={part.label} className="gallery-passes__callout">
      <Text weight="bold">
        {part.label}
      </Text>
      {part.tokens.map((token) => (
        <Code key={token}>{token}</Code>
      ))}
    </div>
  );
}

export function TokensPass({ manifest, stacked }: { manifest: Manifest; stacked: boolean }) {
  const parts = manifest.anatomy?.parts ?? [];
  const canvas = useRef<HTMLDivElement>(null);
  const lines = useStageMeasure<Line[]>(canvas, (stage) => (stacked ? [] : measureLines(stage, parts)), []);
  const column = (side: AnatomyPart['side']) => (
    <div role="list" aria-label={side === 'left' ? 'Parts, left' : 'Parts, right'} className="gallery-passes__callouts" data-side={side}>
      {parts
        .filter((part) => part.side === side)
        .map((part) => (
          <Callout key={part.label} part={part} />
        ))}
    </div>
  );
  return (
    <div ref={canvas} className="gallery-passes__canvas gallery-passes__canvas--tokens" data-stacked={stacked ? '' : undefined}>
      {column('left')}
      <Instance manifest={manifest} inert />
      {column('right')}
      {!stacked && lines.length > 0 ? (
        <Overlay>
          {lines.map((line) => (
            <g key={line.part}>
              <path d={`M ${line.from.x} ${line.from.y} L ${line.to.x} ${line.to.y}`} {...LINE} />
              <circle cx={line.to.x} cy={line.to.y} r={3} fill="currentColor" />
            </g>
          ))}
        </Overlay>
      ) : null}
    </div>
  );
}

function Tile({ label, note, children }: { label: string; note?: string; children: ReactElement }) {
  return (
    <div data-tile="" className="gallery-passes__tile">
      {children}
      <Text weight="bold">
        {label}
      </Text>
      {note ? <Text>{note}</Text> : null}
    </div>
  );
}

export function StatesPass({ manifest }: { manifest: Manifest }) {
  const states = manifest.anatomy?.states ?? [];
  return (
    <div className="gallery-passes__canvas gallery-passes__canvas--states">
      {states.map(({ label, state }) => (
        <Tile key={label} label={label}>
          <Instance manifest={manifest} patch={state} inert />
        </Tile>
      ))}
      <Tile label="Try it" note="Point at it, press it, or Tab to it">
        <Instance manifest={manifest} />
      </Tile>
    </div>
  );
}

export function FinalPass({ manifest }: { manifest: Manifest }) {
  return (
    <div className="gallery-passes__canvas gallery-passes__canvas--final">
      <Instance manifest={manifest} />
      <CodeBlock code={toJsx(manifest, defaultState(manifest))} language="jsx" label="Final code" />
    </div>
  );
}
