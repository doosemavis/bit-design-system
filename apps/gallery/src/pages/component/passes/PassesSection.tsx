import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, CardBody, CardFooter, Code, SegmentedControl, Stack, Text } from '@bit-ds/react';
import type { Manifest, ManifestAnatomy } from '../../../manifests/types';
import { parsePass, PASSES, setPageParam } from '../../../engine/pageParams';
import type { Pass } from '../../../engine/pageParams';
import { useStageMeasure } from './useStageMeasure';
import { BuildStage, PASS_NAMES as NAMES } from './BuildStage';
import { measureBox, renderedClasses } from './geometry';
import { useBuild } from './useBuild';

/** One sentence per pass, shared by every component. */
const SHOWS: Readonly<Record<Pass, string>> = {
  wireframe: 'The box only: its height and padding, measured from the page. No color, so you can see the bones.',
  tokens: 'Each part points to the tokens it reads. Change a token and this is everything that moves.',
  states: 'The states its props set, side by side. The last one is live: point at it, press it, or Tab to it.',
  final: 'The finished component and the JSX that makes it.',
};

/** The pass in the URL. Reads, and pushes through setPageParam, so every push is already in canonical order. */
export function usePassParam(): { pass: Pass; setPass: (next: Pass) => void } {
  const [search, setSearch] = useSearchParams();
  const pass = parsePass(search.get('pass'));
  const setPass = useCallback(
    (next: Pass) => {
      if (next !== pass) setSearch(setPageParam(search, 'pass', next));
    },
    [pass, search, setSearch],
  );
  return { pass, setPass };
}

const nextOf = (pass: Pass): Pass => PASSES[(PASSES.indexOf(pass) + 1) % PASSES.length]!;

type MeasuredPass = Extract<Pass, 'wireframe' | 'final'>;
const isMeasured = (pass: Pass): pass is MeasuredPass => pass === 'wireframe' || pass === 'final';

/** What Tokens and States read: the anatomy data, never typed per component. */
function dataReads(manifest: Manifest, pass: Exclude<Pass, MeasuredPass>): string {
  const anatomy = manifest.anatomy!;
  if (pass === 'tokens') return anatomy.parts.map((part) => `${part.label}: ${part.tokens.join(', ')}`).join(' · ');
  return anatomy.states.map(({ label, state }) => `${label}: ${Object.keys(state).join(', ') || 'no props'}`).join(' · ');
}

/** What Wireframe and Final read: the rendered instance (its sizes, its classes). */
function measuredReads(pass: MeasuredPass, stage: HTMLElement, root: string | undefined): string {
  if (pass === 'final') return renderedClasses(stage, root);
  const box = measureBox(stage, root);
  return box ? `height ${Math.round(box.height)}px, padding-left ${Math.round(box.paddingLeft)}px` : '';
}

/**
 * The measured "Reads", through the same measurement as the stage's dimensions, so it follows the instance when it
 * resizes. Keyed by pass, so each pass mounts fresh and measures its own instance.
 */
function MeasuredReads({ stage, pass, root }: { stage: RefObject<HTMLElement | null>; pass: MeasuredPass; root: string | undefined }) {
  const reads = useStageMeasure(stage, (el) => measuredReads(pass, el, root), '');
  return reads ? <Code>{reads}</Code> : null;
}

/** Four squares, filled for each pass seen. Inline svg, so the paint isn't gallery CSS. Decorative. */
function Pips({ seen }: { seen: ReadonlySet<Pass> }) {
  return (
    <svg className="gallery-passes__pips" width={58} height={10} aria-hidden="true">
      {PASSES.map((pass, i) => (
        <rect
          key={pass}
          x={i * 16 + 1}
          y={1}
          width={8}
          height={8}
          stroke="currentColor"
          strokeWidth={1.5}
          fill={seen.has(pass) ? 'currentColor' : 'none'}
        />
      ))}
    </svg>
  );
}

export function PassesSection({ manifest }: { manifest: Manifest }) {
  return manifest.anatomy ? <Passes manifest={manifest} anatomy={manifest.anatomy} /> : null;
}

function Passes({ manifest, anatomy }: { manifest: Manifest; anatomy: ManifestAnatomy }) {
  const { pass, setPass } = usePassParam();
  const build = useBuild(anatomy, pass);
  const [seen, setSeen] = useState<ReadonlySet<Pass>>(() => new Set([pass]));
  // What Next announced, and for which pass: any other route to a pass (a radio, an arrow key, Back) clears it, so
  // the same words can be spoken again by the next Next.
  const [spoken, setSpoken] = useState<{ pass: Pass; text: string } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeen((current) => (current.has(pass) ? current : new Set([...current, pass])));
    setSpoken((current) => (current?.pass === pass ? current : null));
  }, [pass]);

  const next = nextOf(pass);

  const goNext = () => {
    setPass(next);
    setSpoken({ pass: next, text: `${NAMES[next]}, pass ${PASSES.indexOf(next) + 1} of ${PASSES.length}` });
  };

  return (
    <Card className="gallery-passes">
      <CardBody>
        <div className="gallery-passes__controls">
          <SegmentedControl
            legend="Pass"
            legendHidden
            name="pass"
            options={PASSES.map((value) => ({ value, label: NAMES[value] }))}
            value={pass}
            onValueChange={(value) => setPass(parsePass(value))}
          />
          <Button variant="outline" onClick={goNext}>{`Next: ${NAMES[next]}`}</Button>
          <Pips seen={seen} />
          <Text>{seen.size === PASSES.length ? 'All 4 seen' : `${seen.size} of 4 seen`}</Text>
          <span role="status" className="gallery-visually-hidden">
            {spoken?.pass === pass ? spoken.text : ''}
          </span>
        </div>
        <div ref={stageRef}>
          <BuildStage manifest={manifest} build={build} />
        </div>
      </CardBody>
      <CardFooter>
        <Stack gap={8} className="gallery-passes__caption">
          <Text weight="bold">What this pass shows</Text>
          <Text size={16}>{`${SHOWS[pass]} The default ${manifest.name}. Change it in the Playground above.`}</Text>
          {pass === 'final' ? <Text>Default props aren&apos;t printed in the code.</Text> : null}
          <Text weight="bold">Reads</Text>
          {isMeasured(pass) ? <MeasuredReads key={pass} stage={stageRef} pass={pass} root={anatomy.root} /> : <Code>{dataReads(manifest, pass)}</Code>}
        </Stack>
      </CardFooter>
    </Card>
  );
}
