import { useId } from 'react';
import type { ReactElement, Ref } from 'react';
import type { Manifest } from '../../../manifests/types';
import { highlightColor, type Point, type Rect } from './geometry';
import { Loupe } from './Loupe';
import type { Lens, StageGeometry, StagePart } from './measureStage';

const INK = 'var(--bit-color-text)';
const FADED = 0.3;
const LABEL = { font: '400 12px var(--bit-font-mono)' } as const;
const MARK_PAD = 6;

const toD = (points: readonly Point[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
/** The line's path: one run, or two around a loupe (the pen lifts across it). */
const lineD = (part: StagePart) => (part.lens ? `${toD(part.route)} ${toD(part.lens.onward)}` : toD(part.route));

/** Graph paper under the instance: a 16px pattern of 1px lines. Decorative, like all the diagram. */
export function Paper(): ReactElement {
  const id = `${useId()}grid`;
  return (
    <svg className="gallery-passes__svg" data-layer="paper" aria-hidden="true" pointerEvents="none">
      <defs>
        <pattern id={id} width={16} height={16} patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="var(--bit-color-primary)" strokeOpacity={0.12} strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Wireframe: the measured box, dashed, with its height and left padding. */
function Outline({ box, paddingLeft }: { box: Rect; paddingLeft: number }) {
  const { x, y, width, height } = box;
  return (
    <g>
      <rect data-role="outline" x={x} y={y} width={width} height={height} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="6 4" />
      <path d={`M${x - 16} ${y}V${y + height}`} stroke={INK} strokeWidth={2} fill="none" />
      <text x={x - 22} y={y + height / 2 + 4} textAnchor="end" fill={INK} style={LABEL}>
        {`${Math.round(height)}px`}
      </text>
      <path d={`M${x} ${y - 12}H${x + paddingLeft}`} stroke={INK} strokeWidth={2} fill="none" />
      <text x={x + paddingLeft / 2} y={y - 18} textAnchor="middle" fill={INK} style={LABEL}>
        {`${Math.round(paddingLeft)}px`}
      </text>
    </g>
  );
}

function Highlight({ part, color, hatch }: { part: StagePart; color: string; hatch: string }) {
  const { d, paint } = part.shape;
  const fill = paint === 'solid' ? color : paint === 'hatch' ? `url(#${hatch})` : 'none';
  return (
    <path
      data-role="highlight"
      data-part={part.label}
      data-kind={part.kind}
      d={d}
      fill={fill}
      stroke={paint === 'stroke' ? color : 'none'}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  );
}

interface InkProps {
  geometry: StageGeometry;
  /** Wireframe's dashed outline and dimensions. */
  outline: boolean;
  /** The parts whose lines draw: landed, and measured. */
  drawn: readonly StagePart[];
  /** The labels lit up: the hot callout's part, or the fresh step's. */
  lit: ReadonlySet<string>;
  hot: string | null;
  ref?: Ref<SVGSVGElement>;
}

/**
 * The diagram over the instance: lines, dots, highlights, the loupe's frame and the lit callout's mark. All paint is SVG
 * presentation here, never gallery CSS. The callouts and the caption carry the content, so it's aria-hidden.
 */
export function Ink({ geometry, outline, drawn, lit, hot, ref }: InkProps): ReactElement {
  const hatch = `${useId()}hatch`;
  const color = highlightColor();
  const fade = (label: string) => (hot !== null && hot !== label ? FADED : undefined);
  const hotMark = (label: string) => (hot === label ? '' : undefined);
  const litParts = drawn.filter((part) => lit.has(part.label));
  return (
    <svg ref={ref} className="gallery-passes__svg" data-layer="ink" aria-hidden="true" pointerEvents="none">
      <defs>
        <pattern id={hatch} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V6" stroke={color} strokeWidth={3} />
        </pattern>
      </defs>
      {outline ? <Outline box={geometry.instance} paddingLeft={geometry.paddingLeft} /> : null}
      {litParts.map((part) => (
        <Highlight key={part.label} part={part} color={color} hatch={hatch} />
      ))}
      {litParts.map(({ label, callout: c }) => (
        <rect
          key={label}
          data-role="mark"
          data-part={label}
          x={c.x - MARK_PAD}
          y={c.y - MARK_PAD}
          width={c.width + 2 * MARK_PAD}
          height={c.height + 2 * MARK_PAD}
          rx={MARK_PAD}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
      ))}
      {drawn.map(({ label, lens }) =>
        lens ? (
          <circle key={label} data-role="lens" cx={lens.center.x} cy={lens.center.y} r={lens.radius} fill="none" stroke={INK} strokeWidth={2} strokeOpacity={fade(label)} />
        ) : null,
      )}
      {drawn.map((part) => (
        <path
          key={part.label}
          data-role="line"
          data-part={part.label}
          data-hot={hotMark(part.label)}
          d={lineD(part)}
          fill="none"
          stroke={INK}
          strokeWidth={hot === part.label ? 3 : 2}
          strokeOpacity={fade(part.label)}
        />
      ))}
      {drawn.map(({ label, kind, anchor }) => (
        <circle
          key={label}
          data-role="dot"
          data-part={label}
          data-kind={kind}
          data-hot={hotMark(label)}
          cx={anchor.x}
          cy={anchor.y}
          r={5}
          fill={color}
          stroke={INK}
          strokeWidth={2}
          strokeOpacity={fade(label)}
          fillOpacity={fade(label)}
        />
      ))}
    </svg>
  );
}

/**
 * The loupe's picture: the Loupe's magnified copy, clipped to the lens circle the Ink frames. The clip box covers the
 * stage, so the Loupe (absolutely positioned) measures from the stage like the diagram does.
 */
export function LensView({ manifest, landed, label, lens }: { manifest: Manifest; landed: readonly string[]; label: string; lens: Lens }): ReactElement {
  const { center, radius } = lens;
  return (
    <div
      data-lens={label}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        clipPath: `circle(${radius}px at ${center.x}px ${center.y}px)`,
        background: 'var(--bit-color-surface)',
      }}
    >
      <Loupe manifest={manifest} landed={landed} at={center} thickness={lens.thickness} origin={lens.origin} />
    </div>
  );
}
