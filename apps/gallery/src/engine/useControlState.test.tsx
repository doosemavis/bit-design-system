import { render, act, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { TYPING_DEBOUNCE_MS, useControlState } from './useControlState';
import type { ControlStateApi } from './useControlState';
import { button } from '../manifests/button';
import { numberControlFixture } from '../test/fixtures';

let api: ControlStateApi | undefined;

/** Renders inside the router and hands the hook's API to the test through a module variable. */
function Probe() {
  api = useControlState(button);
  return <span data-testid="color">{String(api.state.color)}</span>;
}

function NumberProbe() {
  api = useControlState(numberControlFixture);
  return null;
}

function setup(initial: string) {
  const router = createMemoryRouter(
    [
      { path: '/x', element: <Probe /> },
      { path: '/n', element: <NumberProbe /> },
      { path: '/elsewhere', element: <p>elsewhere</p> },
    ],
    { initialEntries: [initial] },
  );
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}

/** Let the debounce run out (fake timers) and React and the router settle. */
async function wait(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useControlState', () => {
  it('reads the initial state from the query', () => {
    setup('/x?color=danger');
    expect(api?.state.color).toBe('danger');
  });

  it('a shared link with bad values shows the defaults and is rewritten in place, keeping the good ones', async () => {
    const { router } = setup('/x?color=purple&size=lg&utm=mail');
    expect(api?.state).toMatchObject({ color: 'primary', size: 'lg' });
    await waitFor(() => expect(router.state.location.search).toBe('?size=lg'));
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('a clean URL is left alone', () => {
    const { router } = setup('/x?color=danger');
    expect(router.state.location.search).toBe('?color=danger');
    expect(router.state.historyAction).toBe('POP');
  });

  it('setProp writes the query and pushes history so Back undoes it', () => {
    const { router } = setup('/x');
    act(() => api?.setProp('variant', 'outline'));
    expect(router.state.location.search).toBe('?variant=outline');
    act(() => api?.setProp('loading', true));
    expect(router.state.location.search).toBe('?variant=outline&loading=1');
    expect(api?.state).toMatchObject({ variant: 'outline', loading: true });
  });

  it('apply merges several props and reset clears the query', () => {
    const { router } = setup('/x?size=lg');
    act(() => api?.apply({ color: 'danger', variant: 'outline' }));
    expect(router.state.location.search).toBe('?color=danger&variant=outline&size=lg');
    act(() => api?.reset());
    expect(router.state.location.search).toBe('');
    expect(api?.state.size).toBe('md');
  });

  it('a select, a preset and Reset each push: Back steps through them one at a time', async () => {
    const { router } = setup('/x');
    act(() => api?.setProp('color', 'danger'));
    act(() => api?.apply({ variant: 'ghost', size: 'sm' }));
    act(() => api?.reset());
    expect(router.state.historyAction).toBe('PUSH');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('?color=danger&variant=ghost&size=sm');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('?color=danger');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
    expect(api?.state.color).toBe('primary');
  });

  it('typing shows at once and reaches the URL 400ms after the last keystroke, as a replace', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('children', 'G'));
    await wait(TYPING_DEBOUNCE_MS - 100);
    act(() => api?.setProp('children', 'Go'));
    expect(api?.state.children).toBe('Go');
    await wait(TYPING_DEBOUNCE_MS - 1);
    expect(router.state.location.search).toBe('');
    await wait(1);
    expect(router.state.location.search).toBe('?children=Go');
    expect(router.state.historyAction).toBe('REPLACE');
    expect(api?.state.children).toBe('Go');
  });

  it('a word typed after a select replaces the select entry, so one Back undoes both', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('color', 'danger'));
    act(() => api?.setProp('children', 'Go'));
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.search).toBe('?color=danger&children=Go');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
  });

  it('number edits are typed too: debounced and replaced', async () => {
    vi.useFakeTimers();
    const { router } = setup('/n');
    act(() => api?.setProp('interval', '7'));
    expect(api?.state.interval).toBe('7');
    expect(router.state.location.search).toBe('');
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.search).toBe('?interval=7');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('a select while a word is pending pushes both at once and cancels the pending replace', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('children', 'Go'));
    act(() => api?.setProp('color', 'danger'));
    expect(router.state.location.search).toBe('?color=danger&children=Go');
    expect(router.state.historyAction).toBe('PUSH');
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.historyAction).toBe('PUSH');
  });

  it('Back during the 400ms drops the unsent word and never writes it', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('color', 'danger'));
    act(() => api?.setProp('children', 'Go'));
    await act(() => router.navigate(-1));
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.search).toBe('');
    expect(api?.state.children).toBe('Save');
  });

  it('leaving the page during the 400ms cancels the write, so the next page keeps its URL', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('children', 'Go'));
    await act(() => router.navigate('/elsewhere'));
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.pathname).toBe('/elsewhere');
    expect(router.state.location.search).toBe('');
  });
});
