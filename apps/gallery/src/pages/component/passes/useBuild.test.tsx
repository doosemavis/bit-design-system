import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pass } from '../../../engine/pageParams';
import { button } from '../../../manifests/button';
import type { ManifestAnatomy } from '../../../manifests/types';
import { stubMatchMedia } from '../../../test/matchMedia';
import { endOf, stepsOf } from './build';
import { useBuild } from './useBuild';

const anatomy = button.anatomy as ManifestAnatomy;
const HOLD = 1000;
/** A pass's end as an arrival shows it: endOf, with nothing fresh. */
const arrived = (pass: Pass) => ({ ...endOf(anatomy, pass), fresh: null });

function setup(initial: Pass) {
  return renderHook(({ pass }: { pass: Pass }) => useBuild(anatomy, pass, HOLD), { initialProps: { pass: initial } });
}

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useBuild pass changes', () => {
  it('arrives at a pass end with no replay: nothing fresh, the rest equal to endOf', () => {
    const { result } = setup('tokens');
    expect(endOf(anatomy, 'tokens').fresh).toBe('Shadow');
    expect(result.current.state.fresh).toBeNull();
    expect(result.current.state).toEqual(arrived('tokens'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('plays a later pass forward when marked', () => {
    const { result, rerender } = setup('wireframe');
    const steps = stepsOf(anatomy, 'tokens');
    const v0 = result.current.version;
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    expect(result.current.state).toEqual(steps[0]);
    const v1 = result.current.version;
    expect(v1).toBeGreaterThan(v0);
    tick(HOLD);
    expect(result.current.state).toEqual(steps[1]);
    expect(result.current.version).toBeGreaterThan(v1);
    tick(2 * HOLD);
    expect(result.current.state).toEqual(steps.at(-1));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('jumps when the marked pass is earlier', () => {
    const { result, rerender } = setup('states');
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    expect(result.current.state).toEqual(arrived('tokens'));
  });

  it('jumps on a change without markForward', () => {
    const { result, rerender } = setup('wireframe');
    rerender({ pass: 'tokens' });
    expect(result.current.state).toEqual(arrived('tokens'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('consumes the forward flag on one change only', () => {
    const { result, rerender } = setup('wireframe');
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    rerender({ pass: 'states' });
    expect(result.current.state).toEqual(arrived('states'));
  });

  it('cancels a running pass when the pass changes', () => {
    const { result, rerender } = setup('wireframe');
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    rerender({ pass: 'final' });
    expect(result.current.state).toEqual(arrived('final'));
    tick(10 * HOLD);
    expect(result.current.state).toEqual(arrived('final'));
  });

  it('stop freezes the state and clears timers', () => {
    const { result, rerender } = setup('wireframe');
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    const frozen = result.current.state;
    act(() => result.current.stop());
    expect(vi.getTimerCount()).toBe(0);
    tick(10 * HOLD);
    expect(result.current.state).toEqual(frozen);
  });

  it('clears timers on unmount', () => {
    const { result, rerender, unmount } = setup('wireframe');
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useBuild play', () => {
  it('runs all four passes in order, then calls onDone once', () => {
    const { result, rerender } = setup('wireframe');
    const onDone = vi.fn();
    const seen: Pass[] = [];
    const note = () => {
      const pass = result.current.state.pass;
      if (seen.at(-1) !== pass) seen.push(pass);
    };
    act(() => result.current.play(onDone));
    note();
    expect(result.current.playing).toBe(true);
    const total = stepsOf(anatomy, 'wireframe').length + stepsOf(anatomy, 'tokens').length + stepsOf(anatomy, 'states').length;
    for (let i = 0; i < total; i += 1) {
      expect(onDone).not.toHaveBeenCalled();
      expect(result.current.playing).toBe(true);
      tick(HOLD);
      note();
    }
    expect(seen).toEqual(['wireframe', 'tokens', 'states', 'final']);
    expect(result.current.state).toEqual(arrived('final'));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    const version = result.current.version;
    rerender({ pass: 'final' });
    expect(result.current.state).toEqual(arrived('final'));
    expect(result.current.version).toBe(version);
    tick(10 * HOLD);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('an outside pass change mid-run cancels it and shows that pass end', () => {
    const { result, rerender } = setup('wireframe');
    const onDone = vi.fn();
    act(() => result.current.play(onDone));
    tick(2 * HOLD);
    expect(result.current.state.pass).toBe('tokens');
    rerender({ pass: 'tokens' });
    expect(result.current.state).toEqual(arrived('tokens'));
    expect(result.current.playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    tick(20 * HOLD);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('after stop mid-run, an unchanged pass keeps the frozen state and a change lands the end', () => {
    const { result, rerender } = setup('wireframe');
    act(() => result.current.play(vi.fn()));
    tick(2 * HOLD);
    act(() => result.current.stop());
    const frozen = result.current.state;
    rerender({ pass: 'wireframe' });
    expect(result.current.state).toEqual(frozen);
    rerender({ pass: 'tokens' });
    expect(result.current.state).toEqual(arrived('tokens'));
  });

  it('stop ends a play', () => {
    const { result } = setup('wireframe');
    act(() => result.current.play(vi.fn()));
    act(() => result.current.stop());
    expect(result.current.playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useBuild with reduced motion', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubMatchMedia('(prefers-reduced-motion: reduce)');
  });
  afterEach(() => restore());

  it('shows the end of a forward pass at once', () => {
    const { result, rerender } = setup('wireframe');
    act(() => result.current.markForward());
    rerender({ pass: 'tokens' });
    expect(result.current.state).toEqual(arrived('tokens'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('plays each pass end for one hold', () => {
    const { result } = setup('wireframe');
    const onDone = vi.fn();
    act(() => result.current.play(onDone));
    expect(result.current.state).toEqual(arrived('wireframe'));
    tick(HOLD);
    expect(result.current.state).toEqual(arrived('tokens'));
    tick(HOLD);
    expect(result.current.state).toEqual(arrived('states'));
    expect(onDone).not.toHaveBeenCalled();
    tick(HOLD);
    expect(result.current.state).toEqual(arrived('final'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('useBuild pickChip', () => {
  it('sets a state label as a non-live chip', () => {
    const { result } = setup('states');
    act(() => result.current.pickChip('Disabled'));
    expect(result.current.state).toMatchObject({ chip: 'Disabled', live: false });
  });

  it('Try it goes live', () => {
    const { result } = setup('states');
    act(() => result.current.pickChip('Try it'));
    expect(result.current.state).toMatchObject({ chip: 'Try it', live: true });
  });

  it('cancels a running build', () => {
    const { result } = setup('wireframe');
    act(() => result.current.play(vi.fn()));
    act(() => result.current.pickChip('Disabled'));
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current.playing).toBe(false);
  });
});
