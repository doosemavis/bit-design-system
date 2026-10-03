import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  resetColorModeStore,
  setColorMode,
  useColorMode,
} from './colorMode';

type ChangeListener = (event: { matches: boolean }) => void;

/** A controllable stand-in for matchMedia('(prefers-color-scheme: dark)'). */
function fakeSystem(dark: boolean) {
  const listeners = new Set<ChangeListener>();
  const query = {
    matches: dark,
    addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => query));
  return {
    flip(next: boolean) {
      query.matches = next;
      for (const listener of listeners) listener({ matches: next });
    },
    listenerCount: () => listeners.size,
  };
}

const root = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete root().dataset.mode;
  resetColorModeStore();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useColorMode', () => {
  it('follows the OS before any choice and writes data-mode on <html>', () => {
    fakeSystem(true);
    const { result } = renderHook(() => useColorMode());
    expect(result.current.mode).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
  });

  it('follows live OS changes while no choice has been made', () => {
    const system = fakeSystem(true);
    const { result } = renderHook(() => useColorMode());
    act(() => system.flip(false));
    expect(result.current.mode).toBe('light');
    expect(root().dataset.mode).toBe('light');
  });

  it('follows a live OS change to dark while no choice has been made', () => {
    const system = fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => system.flip(true));
    expect(result.current.mode).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
  });

  it('remembers a choice and ignores later OS changes', () => {
    const system = fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => result.current.setMode('dark'));
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
    act(() => system.flip(false));
    expect(result.current.mode).toBe('dark');
  });

  it('a stored choice wins over the OS on load', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'light');
    fakeSystem(true);
    expect(renderHook(() => useColorMode()).result.current.mode).toBe('light');
  });

  it('invalid stored value falls back to the OS preference', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'purple');
    fakeSystem(true);
    expect(renderHook(() => useColorMode()).result.current.mode).toBe('dark');
  });

  it('picks up the data-mode the head script already set', () => {
    root().dataset.mode = 'dark';
    expect(renderHook(() => useColorMode()).result.current.mode).toBe('dark');
  });

  it('is light when matchMedia does not exist', () => {
    expect(renderHook(() => useColorMode()).result.current.mode).toBe('light');
  });

  it('storage that throws: the choice still applies for the visit and nothing throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const system = fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => result.current.setMode('dark'));
    expect(result.current.mode).toBe('dark');
    act(() => system.flip(false));
    expect(result.current.mode).toBe('dark');
  });

  it('two hooks stay in sync without a provider', () => {
    fakeSystem(false);
    const a = renderHook(() => useColorMode());
    const b = renderHook(() => useColorMode());
    act(() => a.result.current.setMode('dark'));
    expect(b.result.current.mode).toBe('dark');
  });

  it('stops listening to the OS when the last hook unmounts', () => {
    const system = fakeSystem(false);
    const a = renderHook(() => useColorMode());
    const b = renderHook(() => useColorMode());
    expect(system.listenerCount()).toBe(1);
    a.unmount();
    expect(system.listenerCount()).toBe(1);
    b.unmount();
    expect(system.listenerCount()).toBe(0);
  });

  it('ignores an unknown mode passed by an untyped caller', () => {
    fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => setColorMode('purple' as never));
    expect(result.current.mode).toBe('light');
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBeNull();
  });

  it('renders light on the server, whatever the OS says', () => {
    fakeSystem(true);
    function Probe() {
      return <span>{useColorMode().mode}</span>;
    }
    expect(renderToString(<Probe />)).toBe('<span>light</span>');
  });
});

describe('COLOR_MODE_SCRIPT', () => {
  const run = () => new Function(COLOR_MODE_SCRIPT)();

  it('reads the same storage key the hook writes', () => {
    expect(COLOR_MODE_SCRIPT).toContain(`'${COLOR_MODE_STORAGE_KEY}'`);
  });

  it('applies a stored choice before render', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
    fakeSystem(false);
    run();
    expect(root().dataset.mode).toBe('dark');
  });

  it('falls back to the OS on a missing or invalid value', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'purple');
    fakeSystem(true);
    run();
    expect(root().dataset.mode).toBe('dark');
  });

  it('falls back to the OS when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    fakeSystem(true);
    run();
    expect(root().dataset.mode).toBe('dark');
  });

  it('is light with no stored value and no matchMedia', () => {
    run();
    expect(root().dataset.mode).toBe('light');
  });
});
