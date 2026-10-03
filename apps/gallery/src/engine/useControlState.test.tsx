import { render, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { useControlState } from './useControlState';
import type { ControlStateApi } from './useControlState';
import { button } from '../manifests/button';

let api: ControlStateApi | undefined;

/** Renders inside the router and hands the hook's API to the test through a module variable. */
function Probe() {
  api = useControlState(button);
  return <span data-testid="color">{String(api.state.color)}</span>;
}

function setup(initial: string) {
  const router = createMemoryRouter([{ path: '/x', element: <Probe /> }], { initialEntries: [initial] });
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}

describe('useControlState', () => {
  it('reads the initial state from the query', () => {
    setup('/x?color=danger');
    expect(api?.state.color).toBe('danger');
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
});
