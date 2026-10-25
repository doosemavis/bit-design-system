import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pass } from '../../../engine/pageParams';
import { defaultState } from '../../../engine/state';
import { toJsx } from '../../../code/toJsx';
import { button } from '../../../manifests/button';
import type { Manifest, ManifestAnatomy } from '../../../manifests/types';
import { endOf, stepsOf, type BuildState } from './build';
import { BuildStage } from './BuildStage';
import { resolveTouch } from './geometry';
import { slide } from './motion';
import { useBuild, type BuildApi } from './useBuild';

vi.mock('./motion', async (importOriginal) => ({ ...(await importOriginal<typeof import('./motion')>()), slide: vi.fn(() => null) }));

const anatomy = button.anatomy as ManifestAnatomy;
const tokens = stepsOf(anatomy, 'tokens');
const HOLD = 960; // 6 × the 160ms fallback for --bit-duration-normal (jsdom has no theme)
const METRICS = { borderWidth: 3, radius: 10, shadowX: 4, shadowY: 4 };

const domRect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

// Layout jsdom can't do: the stage, the instance, the two callout columns and their callouts.
let stageWidth = 1000;
let buttonBox = { left: 450, top: 194 };
const SCENE_BOX = domRect(500, 100, 100, 52);
function rectFor(el: Element): DOMRect {
  if (el.matches('.gallery-passes__stage')) return domRect(0, 0, stageWidth, 440);
  if (el.matches('[data-scene-slot] [data-instance], [data-scene-slot] [data-instance] > *')) return SCENE_BOX;
  if (el.matches('[data-instance], [data-instance] > .bit-button')) return domRect(buttonBox.left, buttonBox.top, 100, 52);
  if (el.matches('[role="list"]')) return domRect(el.matches('[data-side="left"]') ? 0 : 630, 32, 370, 376);
  if (el.matches('[role="listitem"]')) return el.closest('[data-side="left"]') ? domRect(250, 0, 120, 40) : domRect(630, 0, 120, 40);
  return domRect(0, 0, 0, 0);
}

let resizeCallbacks: (() => void)[] = [];
let frames: FrameRequestCallback[] = [];
let fontsReady: () => void = () => {};
const flush = () =>
  act(() => {
    const queued = frames;
    frames = [];
    queued.forEach((frame) => frame(0));
  });
const resize = () => act(() => resizeCallbacks.forEach((callback) => callback()));

beforeEach(() => {
  stageWidth = 1000;
  buttonBox = { left: 450, top: 194 };
  resizeCallbacks = [];
  frames = [];
  vi.mocked(slide).mockClear();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resizeCallbacks = [...resizeCallbacks, callback];
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise<void>((resolve) => (fontsReady = resolve)) } });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return rectFor(this);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function api(state: BuildState, version: number, extra: Partial<BuildApi> = {}): BuildApi {
  return { state, version, markForward: () => {}, play: () => {}, stop: () => {}, playing: false, pickChip: () => {}, ...extra };
}

/** Gives the stage's Button the computed border, radius and hard shadow the theme would. */
function paintButton() {
  const el = document.querySelector<HTMLElement>('.gallery-passes__stage [data-instance] > .bit-button');
  if (!el) return;
  el.style.borderTop = '3px solid black';
  el.style.borderTopLeftRadius = '10px';
  el.style.boxShadow = '4px 4px 0 rgb(0, 0, 0)';
}

function show(state: BuildState, version = 1, manifest: Manifest = button) {
  const utils = render(<BuildStage manifest={manifest} build={api(state, version)} />);
  paintButton();
  const update = (next: BuildState, nextVersion: number) => {
    utils.rerender(<BuildStage manifest={manifest} build={api(next, nextVersion)} />);
    paintButton();
  };
  return { ...utils, update };
}

const stage = () => document.querySelector<HTMLElement>('.gallery-passes__stage')!;
const instance = () => stage().querySelector<HTMLElement>('[data-instance]')!;
const all = (role: string) => [...stage().querySelectorAll<SVGElement>(`[data-role="${role}"]`)];
const parts = (role: string) => all(role).map((el) => el.dataset.part);
const one = (role: string, part: string) => stage().querySelector<SVGElement>(`[data-role="${role}"][data-part="${part}"]`);
const callout = (part: string) => stage().querySelector<HTMLElement>(`[role="listitem"][data-part="${part}"]`)!;
const partOf = (label: string) => anatomy.parts.find((p) => p.label === label)!;
const box = { x: 450, y: 194, width: 100, height: 52 };
const touchOf = (label: string) => resolveTouch(box, METRICS, partOf(label).touch);
/** The points a path's d visits, in order, each with the command that reaches it. */
const points = (d: string) => [...d.matchAll(/([ML])\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => ({ cmd: m[1], x: Number(m[2]), y: Number(m[3]) }));
const quiet = (state: BuildState): BuildState => ({ ...state, fresh: null });

describe('BuildStage', () => {
  it('is a group named for the pass and the component', () => {
    show(endOf(anatomy, 'tokens'));
    expect(screen.getByRole('group', { name: 'Tokens pass: Button' })).toBe(stage());
  });

  it('keeps one instance from Wireframe through Tokens to States', () => {
    const { update } = show(endOf(anatomy, 'wireframe'), 1);
    const first = instance();
    update(tokens[0]!, 2);
    expect(instance()).toBe(first);
    update(endOf(anatomy, 'states'), 3);
    expect(instance()).toBe(first);
  });

  it('first paint: callouts hide and no diagram draws until the first measure', () => {
    show(endOf(anatomy, 'tokens'));
    expect(screen.getAllByRole('listitem', { hidden: true }).map((item) => item.style.visibility)).toEqual(['hidden', 'hidden', 'hidden', 'hidden']);
    expect(stage().querySelector('svg')).toBeNull();
    flush();
    expect(screen.getAllByRole('listitem').map((item) => item.style.visibility)).toEqual(['', '', '', '']);
    expect(stage().querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('Wireframe draws the graph paper, the dashed outline and the box dimensions, with no callouts', () => {
    show(endOf(anatomy, 'wireframe'));
    flush();
    expect(stage().querySelector('[data-layer="paper"] pattern')).not.toBeNull();
    expect(stage().querySelector('[data-role="outline"]')).toHaveAttribute('stroke-dasharray');
    expect([...stage().querySelectorAll('text')].map((t) => t.textContent)).toContain('52px');
    expect(screen.queryAllByRole('listitem')).toEqual([]);
    expect(all('line')).toEqual([]);
  });

  describe('Tokens step 2 (Edge and Face landed)', () => {
    it('draws a line and a dot for each landed part, each dot on its touch point', () => {
      show(quiet(tokens[1]!));
      flush();
      expect(parts('line')).toEqual(['Edge', 'Face']);
      expect(parts('dot')).toEqual(['Edge', 'Face']);
      for (const label of ['Edge', 'Face']) {
        const dot = one('dot', label)!;
        const at = touchOf(label);
        expect([Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy'))]).toEqual([at.x, at.y]);
        expect(dot).toHaveAttribute('data-kind', partOf(label).touch.kind);
        expect(dot).toHaveAttribute('r', '5');
        expect(points(one('line', label)!.getAttribute('d')!)[0]).toMatchObject(at);
      }
    });

    it('lists every part as a focusable callout, in two lists', () => {
      show(quiet(tokens[1]!));
      flush();
      expect(screen.getAllByRole('list')).toHaveLength(2);
      expect(screen.getAllByRole('listitem').map((item) => [item.dataset.part, item.tabIndex])).toEqual([
        ['Face', 0],
        ['Size', 0],
        ['Edge', 0],
        ['Shadow', 0],
      ]);
      expect(within(callout('Face')).getByText('--bit-color-primary')).toBeInTheDocument();
    });

    it('turns off the parts not landed yet on the wrapper, and undoes on change and unmount', () => {
      const { update, unmount } = show(quiet(tokens[1]!));
      const wrapper = instance();
      expect(wrapper.style.getPropertyValue('--bit-shadow-md')).toBe('none');
      expect(wrapper.style.getPropertyValue('--bit-border-width')).toBe('');
      expect(wrapper.style.getPropertyValue('--bit-color-primary')).toBe('');
      update(endOf(anatomy, 'tokens'), 2);
      expect(wrapper.style.getPropertyValue('--bit-shadow-md')).toBe('');
      update(tokens[0]!, 3);
      expect(wrapper.style.getPropertyValue('--bit-color-primary')).toBe('transparent');
      unmount();
      expect(wrapper.style.cssText).toBe('');
    });

    it('places each callout from its target: Size level with its touch point, so its line is one straight run', () => {
      show(quiet(tokens[2]!));
      flush();
      // Size's target is its touch point (y 220) less half its 40px height: 200 in the stage, 168 in its column (top 32).
      expect(callout('Size').style.top).toBe('168px');
      expect(points(one('line', 'Size')!.getAttribute('d')!)).toEqual([
        { cmd: 'M', ...touchOf('Size') },
        { cmd: 'L', x: 370, y: 220 },
      ]);
    });
  });

  it('a hot callout lights its part, marks its line and dot hot, and fades the rest until it blurs', () => {
    show(quiet(tokens[1]!));
    flush();
    expect(all('highlight')).toEqual([]);
    act(() => callout('Face').focus());
    expect(one('line', 'Face')).toHaveAttribute('data-hot');
    expect(one('dot', 'Face')).toHaveAttribute('data-hot');
    expect(one('line', 'Face')).not.toHaveAttribute('stroke-opacity');
    expect(one('line', 'Edge')).toHaveAttribute('stroke-opacity', '0.3');
    expect(one('dot', 'Edge')).toHaveAttribute('stroke-opacity', '0.3');
    expect(parts('highlight')).toEqual(['Face']);
    expect(one('highlight', 'Face')).toHaveAttribute('data-kind', 'fill');
    expect(parts('mark')).toEqual(['Face']);
    act(() => callout('Face').blur());
    expect(one('line', 'Face')).not.toHaveAttribute('data-hot');
    expect(one('line', 'Edge')).not.toHaveAttribute('stroke-opacity');
    expect(all('highlight')).toEqual([]);
    expect(all('mark')).toEqual([]);
  });

  it('pointing at a callout lights its part too', async () => {
    show(quiet(tokens[1]!));
    flush();
    await userEvent.hover(callout('Edge'));
    expect(parts('highlight')).toEqual(['Edge']);
    await userEvent.unhover(callout('Edge'));
    expect(all('highlight')).toEqual([]);
  });

  it('the fresh step lights up for one step-hold, then goes', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { update } = show(tokens[0]!, 1);
    flush();
    update(tokens[1]!, 2);
    flush();
    expect(parts('highlight')).toEqual(['Face']);
    expect(parts('mark')).toEqual(['Face']);
    act(() => void vi.advanceTimersByTime(HOLD - 1));
    expect(parts('highlight')).toEqual(['Face']);
    act(() => void vi.advanceTimersByTime(1));
    expect(all('highlight')).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("the next step clears the last beat's timer and starts its own", () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { update, unmount } = show(tokens[0]!, 1);
    flush();
    act(() => void vi.advanceTimersByTime(HOLD / 2));
    update(tokens[1]!, 2);
    flush();
    act(() => void vi.advanceTimersByTime(HOLD / 2));
    expect(parts('highlight')).toEqual(['Face']);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("the fresh step's line waits for its own measure, so it never draws from an old layout", () => {
    const { update } = show(quiet(tokens[0]!), 1);
    flush();
    update(tokens[1]!, 2);
    expect(parts('line')).toEqual(['Edge']);
    flush();
    expect(parts('line')).toEqual(['Edge', 'Face']);
  });

  it('a strip under 6px gets the loupe, and its line runs strip → loupe → callout; an edge gets none', () => {
    show(quiet(endOf(anatomy, 'tokens')));
    flush();
    expect(all('loupe')).toHaveLength(1);
    expect(stage().querySelector('[data-lens="Shadow"] [data-role="loupe"]')).not.toBeNull();
    const shadow = points(one('line', 'Shadow')!.getAttribute('d')!);
    expect(shadow[0]).toEqual({ cmd: 'M', ...touchOf('Shadow') });
    expect(shadow.filter((p) => p.cmd === 'M')).toHaveLength(2);
    expect(shadow.at(-1)).toMatchObject({ x: 630 });
    const frame = stage().querySelector('[data-role="lens"]')!;
    const [cx, cy, r] = ['cx', 'cy', 'r'].map((a) => Number(frame.getAttribute(a)));
    const lift = shadow.findIndex((p, i) => i > 0 && p.cmd === 'M');
    expect(shadow[lift - 1]).toEqual({ cmd: 'L', x: cx, y: cy! - r! });
    expect(shadow[lift]).toEqual({ cmd: 'M', x: cx! + r!, y: cy });
    expect(points(one('line', 'Edge')!.getAttribute('d')!).filter((p) => p.cmd === 'M')).toHaveLength(1);
  });

  it('an unseen part is listed with its reason, with no line or dot', () => {
    const unseen: Manifest = {
      ...button,
      anatomy: {
        ...anatomy,
        parts: [
          ...anatomy.parts,
          { label: 'List', selector: '.nope', tokens: ['--bit-shadow-md'], side: 'right', touch: { kind: 'box', edge: 'right' }, unseen: 'It opens in the top layer.' },
        ],
      },
    };
    show(quiet(endOf(unseen.anatomy!, 'tokens')), 1, unseen);
    flush();
    expect(within(callout('List')).getByText('It opens in the top layer.')).toBeInTheDocument();
    expect(callout('List').style.visibility).toBe('');
    expect(one('line', 'List')).toBeNull();
    expect(one('dot', 'List')).toBeNull();
    expect(parts('line')).toEqual(['Edge', 'Face', 'Size', 'Shadow']);
  });

  it('stacked under 600px: no lines, highlights, loupe or paper, and every callout still listed', () => {
    stageWidth = 599;
    show(tokens[3]!);
    flush();
    expect(stage()).toHaveAttribute('data-stacked');
    expect(all('line')).toEqual([]);
    expect(all('dot')).toEqual([]);
    expect(all('highlight')).toEqual([]);
    expect(all('loupe')).toEqual([]);
    expect(stage().querySelector('[data-layer="paper"]')).toBeNull();
    expect(screen.getAllByRole('listitem').map((item) => [item.dataset.part, item.style.visibility, item.style.top])).toEqual([
      ['Face', '', ''],
      ['Size', '', ''],
      ['Edge', '', ''],
      ['Shadow', '', ''],
    ]);
  });

  it('crossing back to 640 mid-run re-measures and draws the lines for the current landed', () => {
    stageWidth = 599;
    const { update } = show(quiet(tokens[0]!), 1);
    flush();
    update(quiet(tokens[1]!), 2);
    flush();
    expect(all('line')).toEqual([]);
    stageWidth = 640;
    resize();
    flush();
    flush();
    expect(stage()).not.toHaveAttribute('data-stacked');
    expect(parts('line')).toEqual(['Edge', 'Face']);
    expect(callout('Face').style.top).not.toBe('');
  });

  it('narrowing mid-run drops the lines in the same render', () => {
    show(quiet(tokens[1]!));
    flush();
    expect(parts('line')).toEqual(['Edge', 'Face']);
    stageWidth = 599;
    resize();
    flush();
    expect(all('line')).toEqual([]);
    expect(all('loupe')).toEqual([]);
  });

  it('a resize mid-step re-measures, and the lines follow the instance for the current landed', () => {
    const { update } = show(quiet(tokens[0]!), 1);
    flush();
    update(quiet(tokens[1]!), 2);
    buttonBox = { left: 400, top: 180 };
    resize();
    flush();
    expect(parts('line')).toEqual(['Edge', 'Face']);
    const moved = resolveTouch({ ...box, x: 400, y: 180 }, METRICS, partOf('Face').touch);
    expect(Number(one('dot', 'Face')!.getAttribute('cx'))).toBe(moved.x);
    expect(Number(one('dot', 'Face')!.getAttribute('cy'))).toBe(moved.y);
  });

  it('fonts finishing mid-step re-measure too', async () => {
    show(quiet(tokens[1]!));
    flush();
    buttonBox = { left: 420, top: 200 };
    await act(async () => fontsReady());
    flush();
    expect(Number(one('dot', 'Edge')!.getAttribute('cy'))).toBe(resolveTouch({ ...box, x: 420, y: 200 }, METRICS, partOf('Edge').touch).y);
  });

  describe('States', () => {
    function Live({ pass }: { pass: Pass }) {
      const build = useBuild(anatomy, pass);
      return <BuildStage manifest={button} build={build} />;
    }

    it('shows the chips, applies a chip, and Try it makes the instance live with its note', async () => {
      render(<Live pass="states" />);
      expect(screen.getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual(['Default', 'Disabled', 'Loading', 'Try it']);
      expect(instance()).toHaveAttribute('inert');
      expect(screen.queryAllByRole('listitem')).toEqual([]);
      await userEvent.click(screen.getByRole('radio', { name: 'Disabled' }));
      expect(instance().querySelector('.bit-button')).toBeDisabled();
      expect(screen.queryByText('Point at it, press it, or Tab to it')).toBeNull();
      await userEvent.click(screen.getByRole('radio', { name: 'Try it' }));
      expect(instance()).not.toHaveAttribute('inert');
      expect(instance().querySelector('.bit-button')).not.toBeDisabled();
      expect(screen.getByText('Point at it, press it, or Tab to it')).toBeInTheDocument();
    });
  });

  describe('Final', () => {
    it('builds the scene around the slot, with no paper or lines, and the code and classes below', () => {
      const { update } = show(endOf(anatomy, 'states'), 1);
      flush();
      expect(stage().querySelector('[data-layer="paper"]')).not.toBeNull();
      update(endOf(anatomy, 'final'), 2);
      flush();
      const slot = stage().querySelector('[data-scene-slot]')!;
      expect(slot.querySelector('[data-instance]')).not.toHaveAttribute('inert');
      expect(screen.getByText('Save changes?')).toBeInTheDocument();
      expect(stage().querySelector('[data-layer="paper"]')).toBeNull();
      expect(all('line')).toEqual([]);
      expect(screen.getByRole('region', { name: 'Final code' })).toHaveTextContent(toJsx(button, defaultState(button)).replace(/\s+/g, ' '));
      const reads = screen.getByText(/bit-button/);
      expect(reads.textContent!.split(' ')).toEqual(expect.arrayContaining(['bit-button', 'bit-primary', 'bit-solid', 'bit-md']));
    });

    it("slides the instance from its last place into the scene's slot", () => {
      const { update } = show(endOf(anatomy, 'states'), 1);
      flush();
      update(endOf(anatomy, 'final'), 2);
      expect(slide).toHaveBeenCalledTimes(1);
      const [el, from, to] = vi.mocked(slide).mock.calls[0]!;
      expect(el).toBe(stage().querySelector('[data-scene-slot] [data-instance]'));
      expect(from).toMatchObject({ left: 450, top: 194 });
      expect(to).toMatchObject({ left: 500, top: 100 });
      update({ ...endOf(anatomy, 'final') }, 3);
      expect(slide).toHaveBeenCalledTimes(1);
    });
  });
});
