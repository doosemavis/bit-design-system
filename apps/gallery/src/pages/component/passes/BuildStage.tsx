import { useRef, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { Code, CodeBlock, Text } from '@bit-ds/react';
import type { Pass } from '../../../engine/pageParams';
import { defaultState } from '../../../engine/state';
import { toJsx } from '../../../code/toJsx';
import type { AnatomyPart, ControlState, Manifest, ManifestAnatomy } from '../../../manifests/types';
import type { BuildState } from './build';
import { Callouts } from './Callouts';
import { Instance } from './Instance';
import { measureStage, type StageGeometry } from './measureStage';
import { Ink, LensView, Paper } from './StageDiagram';
import { useDrawIn, useFreshBeat, useOverrides, useSlideIntoScene } from './stageEffects';
import { StateChips, TRY_IT } from './StateChips';
import type { BuildApi } from './useBuild';
import { useStageMeasure } from './useStageMeasure';

export const PASS_NAMES: Readonly<Record<Pass, string>> = { wireframe: 'Wireframe', tokens: 'Tokens', states: 'States', final: 'Final' };
const LIVE_NOTE = 'Point at it, press it, or Tab to it';

/**
 * What the stage must hold on the Tokens pass: a callout is its label line plus one line per token chip, and callouts
 * stack with a gap between them. Each count comes from the side with more of it, so both sides fit.
 */
export function stageSize(parts: readonly AnatomyPart[]): { lines: number; callouts: number } {
  const side = (name: AnatomyPart['side']) => parts.filter((part) => part.side === name);
  const lines = (list: readonly AnatomyPart[]) => list.reduce((sum, part) => sum + 1 + part.tokens.length, 0);
  const [left, right] = [side('left'), side('right')];
  return { lines: Math.max(lines(left), lines(right)), callouts: Math.max(left.length, right.length) };
}

/** A measure, and the build version it was taken at. */
type Measured = StageGeometry & { version: number };

function anatomyOf(manifest: Manifest): ManifestAnatomy {
  if (!manifest.anatomy) throw new Error(`bit gallery: ${manifest.name} has no anatomy, so it has no build stage`);
  return manifest.anatomy;
}

/** States picks its patch by chip label; Try it and every other pass show defaults + base only. */
function patchOf(anatomy: ManifestAnatomy, state: BuildState): Partial<ControlState> | undefined {
  if (state.chip === null || state.chip === TRY_IT) return undefined;
  return anatomy.states.find((s) => s.label === state.chip)?.state;
}

/** The hot callout's label, dropped when the pass changes (a callout that unmounts under the pointer never says it left). */
function useHot(pass: Pass): [string | null, (label: string | null) => void] {
  const [hot, setHot] = useState<{ label: string; pass: Pass } | null>(null);
  return [hot?.pass === pass ? hot.label : null, (label) => setHot(label === null ? null : { label, pass })];
}

function FinalScene({ manifest, anatomy, instance, classes }: { manifest: Manifest; anatomy: ManifestAnatomy; instance: ReactElement; classes: string }) {
  const state = { ...defaultState(manifest), ...anatomy.base } as ControlState;
  return (
    <div className="gallery-passes__final">
      {anatomy.scene.render(<div data-scene-slot="">{instance}</div>)}
      <CodeBlock code={toJsx(manifest, state)} language="jsx" label="Final code" />
      {classes ? (
        <Text>
          Reads: <Code>{classes}</Code>
        </Text>
      ) : null}
    </div>
  );
}

/**
 * The one stage: one instance built up across the passes, with the diagram drawn from its measured parts. Lines land on
 * each landed part; pointing at or focusing a callout lights its part, as does each step for a beat as it lands.
 */
export function BuildStage({ manifest, build }: { manifest: Manifest; build: BuildApi }): ReactElement {
  const anatomy = anatomyOf(manifest);
  const { state, version } = build;
  const stage = useRef<HTMLDivElement>(null);
  const ink = useRef<SVGSVGElement>(null);
  // A CSS transition (a part landing, a mode switch) ends after the step's measure: measure again when it does.
  const [settled, setSettled] = useState(0);
  const geometry = useStageMeasure<Measured | null>(stage, (el) => ({ ...measureStage(el, anatomy), version }), null, version + settled);
  const stacked = geometry?.stacked ?? false;
  // The layout flips between columns and a list after this measure, so measure again on the new layout.
  const [laidOut, setLaidOut] = useState(stacked);
  if (laidOut !== stacked) {
    setLaidOut(stacked);
    setSettled((n) => n + 1);
  }
  const [hot, setHot] = useHot(state.pass);
  const freshStep = useFreshBeat(state.fresh, version);

  const diagram = geometry !== null && !stacked;
  const ready = geometry?.version === version;
  const drawn = diagram && state.lines ? geometry.parts.filter((p) => state.landed.includes(p.step) && (ready || p.step !== state.fresh)) : [];
  const lit = new Set(hot !== null ? [hot] : drawn.filter((p) => p.step === freshStep).map((p) => p.label));

  useOverrides(stage, anatomy.parts, state.landed, state.scene);
  useDrawIn(ink, drawn.filter((p) => p.step === state.fresh).map((p) => p.label), ready, version);
  useSlideIntoScene(stage, state.scene, geometry);

  const size = stageSize(anatomy.parts);
  const instance = <Instance manifest={manifest} patch={patchOf(anatomy, state)} inert={!state.live} />;
  const callouts = (side: AnatomyPart['side']) =>
    state.lines ? (
      <Callouts side={side} parts={anatomy.parts} landed={state.landed} tops={geometry?.tops ?? null} stacked={stacked} onHot={setHot} />
    ) : null;

  return (
    <div
      ref={stage}
      role="group"
      aria-label={`${PASS_NAMES[state.pass]} pass: ${manifest.name}`}
      className="gallery-passes__stage"
      data-stacked={stacked ? '' : undefined}
      style={{ '--_gallery-passes-lines': String(size.lines), '--_gallery-passes-callouts': String(size.callouts) } as CSSProperties}
      onTransitionEnd={() => setSettled((n) => n + 1)}
    >
      {diagram && state.grid ? <Paper /> : null}
      {callouts('left')}
      {state.scene ? (
        <FinalScene key="final" manifest={manifest} anatomy={anatomy} instance={instance} classes={geometry?.classes ?? ''} />
      ) : (
        <div key="slot" className="gallery-passes__slot">
          {instance}
        </div>
      )}
      {callouts('right')}
      {drawn.map(({ label, lens }) => (lens ? <LensView key={label} manifest={manifest} landed={state.landed} label={label} lens={lens} /> : null))}
      {diagram ? <Ink ref={ink} geometry={geometry} outline={state.outline} drawn={drawn} lit={lit} hot={hot} /> : null}
      {state.chip !== null ? (
        <div className="gallery-passes__chips">
          <StateChips labels={anatomy.states.map((s) => s.label)} value={state.chip} onPick={build.pickChip} />
          {state.live ? <Text>{LIVE_NOTE}</Text> : null}
        </div>
      ) : null}
    </div>
  );
}
