import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, CardBody, CardFooter, Code, SegmentedControl, Stack, Text } from '@bit-ds/react';
import type { Manifest } from '../../../manifests/types';
import { parsePass, PASSES, setPageParam } from '../../../engine/pageParams';
import type { Pass } from '../../../engine/pageParams';
import { useStageMeasure } from './useStageMeasure';
import { FinalPass, measureBox, renderedClasses, StatesPass, TokensPass, WireframePass } from './passViews';

const NAMES: Readonly<Record<Pass, string>> = { wireframe: 'Wireframe', tokens: 'Tokens', states: 'States', final: 'Final' };

/** One sentence per pass, shared by every component. */
const SHOWS: Readonly<Record<Pass, string>> = {
  wireframe: 'The box only: its height and padding, measured from the page. No color, so you can see the bones.',
  tokens: 'Each part points to the tokens it reads. Change a token and this is everything that moves.',
  states: 'The states its props set, side by side. The last one is live: point at it, press it, or Tab to it.',
  final: 'The finished component and the JSX that makes it.',
};

/** Below this stage width the callouts stack under the instance and the lines go away. */
const STACK_BELOW = 600;

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

/** What the pass reads, built from data and the rendered instance, never typed per component. */
function readsFor(manifest: Manifest, pass: Pass, stage: HTMLElement | null): string {
  const anatomy = manifest.anatomy!;
  switch (pass) {
    case 'wireframe': {
      const box = stage ? measureBox(stage) : null;
      return box ? `height ${Math.round(box.height)}px, padding-left ${Math.round(box.paddingLeft)}px` : '';
    }
    case 'tokens':
      return anatomy.parts.map((part) => `${part.label}: ${part.tokens.join(', ')}`).join(' · ');
    case 'states':
      return anatomy.states.map(({ label, state }) => `${label}: ${Object.keys(state).join(', ') || 'no props'}`).join(' · ');
    case 'final':
      return stage ? renderedClasses(stage) : '';
  }
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
  const { pass, setPass } = usePassParam();
  const [seen, setSeen] = useState<ReadonlySet<Pass>>(() => new Set([pass]));
  // What Next announced, and for which pass: any other route to a pass (a radio, an arrow key, Back) clears it, so
  // the same words can be spoken again by the next Next.
  const [spoken, setSpoken] = useState<{ pass: Pass; text: string } | null>(null);
  const [reads, setReads] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const stacked = useStageMeasure(stageRef, (el) => el.getBoundingClientRect().width < STACK_BELOW, false);

  useEffect(() => {
    setSeen((current) => (current.has(pass) ? current : new Set([...current, pass])));
    setSpoken((current) => (current?.pass === pass ? current : null));
  }, [pass]);

  // Reads depends on the rendered instance (Wireframe's sizes, Final's classes), so it fills in after commit.
  useEffect(() => {
    if (manifest.anatomy) setReads(readsFor(manifest, pass, stageRef.current));
  }, [manifest, pass]);

  if (!manifest.anatomy) return null;
  const parts = manifest.anatomy.parts;
  const rows = Math.max(parts.filter((p) => p.side === 'left').length, parts.filter((p) => p.side === 'right').length);
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
        <div
          ref={stageRef}
          role="group"
          aria-label={`${NAMES[pass]} pass: ${manifest.name}`}
          className="gallery-passes__stage"
          style={{ '--_gallery-passes-rows': String(rows) } as CSSProperties}
        >
          {pass === 'wireframe' ? <WireframePass manifest={manifest} /> : null}
          {pass === 'tokens' ? <TokensPass key={String(stacked)} manifest={manifest} stacked={stacked} /> : null}
          {pass === 'states' ? <StatesPass manifest={manifest} /> : null}
          {pass === 'final' ? <FinalPass manifest={manifest} /> : null}
        </div>
      </CardBody>
      <CardFooter>
        <Stack gap={8}>
          <Text weight="bold">What this pass shows</Text>
          <Text size={16}>{`${SHOWS[pass]} The default ${manifest.name}. Change it in the Playground above.`}</Text>
          {pass === 'final' ? <Text>Default props aren&apos;t printed in the code.</Text> : null}
          <Text weight="bold">Reads</Text>
          {reads ? <Code>{reads}</Code> : null}
        </Stack>
      </CardFooter>
    </Card>
  );
}
