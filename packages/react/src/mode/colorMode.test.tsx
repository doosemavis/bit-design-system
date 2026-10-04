import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  ColorModeService,
  colorMode,
  resetColorModeStore,
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

/** Make every localStorage call throw, like a browser with storage blocked. */
function blockStorage() {
  for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new Error('blocked');
    });
  }
}

const root = () => document.documentElement;
const saved = () => localStorage.getItem(COLOR_MODE_STORAGE_KEY);

beforeEach(() => {
  localStorage.clear();
  delete root().dataset.mode;
  resetColorModeStore();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('colorMode: the shared service', () => {
  it('is one instance of ColorModeService', () => {
    expect(colorMode).toBeInstanceOf(ColorModeService);
  });

  it('starts lazily: nothing touches the page root until it is first used', () => {
    expect(root().dataset.mode).toBeUndefined();
    expect(colorMode.preference).toBe('system');
    expect(root().dataset.mode).toBe('system');
  });
});

describe('colorMode startup precedence', () => {
  it('a saved dark beats the attribute light, and is written to the root', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
    root().dataset.mode = 'light';
    expect(colorMode.preference).toBe('dark');
    expect(colorMode.mode).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
  });

  it.each(['light', 'dark', 'system'] as const)('respects the attribute %s when nothing is saved', (attribute) => {
    root().dataset.mode = attribute;
    expect(colorMode.preference).toBe(attribute);
    expect(root().dataset.mode).toBe(attribute);
  });

  it('with no attribute, the root gets system and the mode follows the OS', () => {
    fakeSystem(true);
    expect(colorMode.preference).toBe('system');
    expect(colorMode.mode).toBe('dark');
    expect(root().dataset.mode).toBe('system');
  });

  it("a developer's fixed light stays light on a dark OS, and an OS change does not flip it", () => {
    const system = fakeSystem(true);
    root().dataset.mode = 'light';
    const listener = vi.fn();
    colorMode.onChange(listener);
    expect(colorMode.mode).toBe('light');
    system.flip(false);
    system.flip(true);
    expect(listener).not.toHaveBeenCalled();
    expect(colorMode.mode).toBe('light');
    expect(root().dataset.mode).toBe('light');
  });

  it('ignores a garbage saved value: the attribute decides', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'blue');
    root().dataset.mode = 'dark';
    expect(colorMode.preference).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
  });

  it('ignores a garbage saved value: with no attribute, the OS decides', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'blue');
    fakeSystem(true);
    expect(colorMode.preference).toBe('system');
    expect(colorMode.mode).toBe('dark');
    expect(root().dataset.mode).toBe('system');
  });

  it('treats a garbage attribute like no attribute: the root gets system', () => {
    root().dataset.mode = 'purple';
    expect(colorMode.preference).toBe('system');
    expect(root().dataset.mode).toBe('system');
  });

  it('is light on system when matchMedia does not exist', () => {
    expect(colorMode.mode).toBe('light');
  });
});

describe('colorMode.set', () => {
  it.each(['light', 'dark'] as const)('set(%s) saves it and writes it to the root', (mode) => {
    colorMode.set(mode);
    expect(saved()).toBe(mode);
    expect(root().dataset.mode).toBe(mode);
    expect(colorMode.preference).toBe(mode);
    expect(colorMode.mode).toBe(mode);
  });

  it("set('system') forgets the saved choice, writes system and follows the OS again", () => {
    fakeSystem(true);
    colorMode.set('light');
    colorMode.set('system');
    expect(saved()).toBeNull();
    expect(root().dataset.mode).toBe('system');
    expect(colorMode.preference).toBe('system');
    expect(colorMode.mode).toBe('dark');
  });

  it('ignores an unknown value from an untyped caller', () => {
    root().dataset.mode = 'dark';
    colorMode.set('nope' as never);
    expect(saved()).toBeNull();
    expect(root().dataset.mode).toBe('dark');
    expect(colorMode.preference).toBe('dark');
  });

  it('works when pulled off the instance (for example onClick={colorMode.toggle})', () => {
    const { set, toggle } = colorMode;
    set('dark');
    expect(colorMode.mode).toBe('dark');
    toggle();
    expect(colorMode.mode).toBe('light');
  });
});

describe('colorMode.toggle', () => {
  it('flips what is showing and saves it', () => {
    fakeSystem(true);
    colorMode.toggle();
    expect(colorMode.mode).toBe('light');
    expect(saved()).toBe('light');
    expect(root().dataset.mode).toBe('light');
    colorMode.toggle();
    expect(colorMode.mode).toBe('dark');
    expect(saved()).toBe('dark');
  });
});

describe('colorMode.onChange', () => {
  it('calls the listener with the new mode, and the unsubscribe stops it', () => {
    const listener = vi.fn();
    const unsubscribe = colorMode.onChange(listener);
    colorMode.set('dark');
    expect(listener).toHaveBeenCalledExactlyOnceWith('dark');
    unsubscribe();
    colorMode.set('light');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls every listener', () => {
    const a = vi.fn();
    const b = vi.fn();
    colorMode.onChange(a);
    colorMode.onChange(b);
    colorMode.toggle();
    expect(a).toHaveBeenCalledWith('dark');
    expect(b).toHaveBeenCalledWith('dark');
  });

  it('stays quiet when what is showing does not change', () => {
    fakeSystem(true);
    colorMode.set('dark');
    const listener = vi.fn();
    colorMode.onChange(listener);
    colorMode.set('dark');
    colorMode.set('system');
    expect(listener).not.toHaveBeenCalled();
  });

  it('an OS change while on system notifies with the new mode', () => {
    const system = fakeSystem(true);
    const listener = vi.fn();
    colorMode.onChange(listener);
    system.flip(false);
    expect(listener).toHaveBeenLastCalledWith('light');
    expect(colorMode.mode).toBe('light');
    system.flip(true);
    expect(listener).toHaveBeenLastCalledWith('dark');
    expect(root().dataset.mode).toBe('system');
  });

  it.each(['light', 'dark'] as const)('an OS change while on %s does not notify', (mode) => {
    const system = fakeSystem(false);
    colorMode.set(mode);
    const listener = vi.fn();
    colorMode.onChange(listener);
    system.flip(true);
    system.flip(false);
    expect(listener).not.toHaveBeenCalled();
    expect(colorMode.mode).toBe(mode);
  });
});

describe('colorMode when storage throws', () => {
  it('set still applies for this visit, and nothing throws', () => {
    blockStorage();
    fakeSystem(false);
    expect(() => colorMode.set('dark')).not.toThrow();
    expect(colorMode.mode).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
    expect(() => colorMode.set('system')).not.toThrow();
    expect(root().dataset.mode).toBe('system');
  });

  it('reads fall back to the attribute', () => {
    blockStorage();
    root().dataset.mode = 'dark';
    expect(colorMode.preference).toBe('dark');
  });

  it('reads fall back to the OS with no attribute', () => {
    blockStorage();
    fakeSystem(true);
    expect(colorMode.preference).toBe('system');
    expect(colorMode.mode).toBe('dark');
  });
});

describe('resetColorModeStore (tests only)', () => {
  it('forgets the state and removes the OS listener', () => {
    const system = fakeSystem(false);
    const listener = vi.fn();
    colorMode.onChange(listener);
    colorMode.set('dark');
    expect(system.listenerCount()).toBe(1);
    resetColorModeStore();
    expect(system.listenerCount()).toBe(0);
    localStorage.clear();
    delete root().dataset.mode;
    expect(colorMode.preference).toBe('system');
    colorMode.toggle();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('useColorMode', () => {
  it('follows the OS before any choice and marks <html> as system', () => {
    fakeSystem(true);
    const { result } = renderHook(() => useColorMode());
    expect(result.current.mode).toBe('dark');
    expect(root().dataset.mode).toBe('system');
  });

  it('returns exactly { mode, setMode }', () => {
    const { result } = renderHook(() => useColorMode());
    expect(Object.keys(result.current).sort()).toEqual(['mode', 'setMode']);
  });

  it('follows live OS changes while no choice has been made', () => {
    const system = fakeSystem(true);
    const { result } = renderHook(() => useColorMode());
    act(() => system.flip(false));
    expect(result.current.mode).toBe('light');
  });

  it('follows a live OS change to dark while no choice has been made', () => {
    const system = fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => system.flip(true));
    expect(result.current.mode).toBe('dark');
  });

  it('remembers a choice and ignores later OS changes', () => {
    const system = fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => result.current.setMode('dark'));
    expect(saved()).toBe('dark');
    expect(root().dataset.mode).toBe('dark');
    act(() => system.flip(false));
    expect(result.current.mode).toBe('dark');
  });

  it('re-renders when any file calls colorMode.set', () => {
    const { result } = renderHook(() => useColorMode());
    act(() => colorMode.set('dark'));
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
    blockStorage();
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

  it('keeps following the OS while no hook is mounted', () => {
    const system = fakeSystem(false);
    const a = renderHook(() => useColorMode());
    const b = renderHook(() => useColorMode());
    expect(system.listenerCount()).toBe(1);
    a.unmount();
    b.unmount();
    expect(system.listenerCount()).toBe(1);
    act(() => system.flip(true));
    expect(colorMode.mode).toBe('dark');
    expect(renderHook(() => useColorMode()).result.current.mode).toBe('dark');
    expect(system.listenerCount()).toBe(1);
  });

  it('a choice stored on an earlier visit ignores OS flips', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
    const system = fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => system.flip(false));
    expect(result.current.mode).toBe('dark');
  });

  it('StrictMode: one OS listener and the right mode', () => {
    const system = fakeSystem(true);
    const { result } = renderHook(() => useColorMode(), { wrapper: StrictMode });
    expect(result.current.mode).toBe('dark');
    expect(system.listenerCount()).toBe(1);
  });

  it('ignores an unknown mode passed by an untyped caller', () => {
    fakeSystem(false);
    const { result } = renderHook(() => useColorMode());
    act(() => result.current.setMode('purple' as never));
    expect(result.current.mode).toBe('light');
    expect(saved()).toBeNull();
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

  it('is exactly the snippet from the spec', () => {
    expect(COLOR_MODE_SCRIPT).toBe(
      "(function(){var d=document.documentElement,m=null;try{m=localStorage.getItem('bit-color-mode')}catch(e){}if(m==='light'||m==='dark'){d.dataset.mode=m}else if(!d.dataset.mode){d.dataset.mode='system'}})();",
    );
  });

  it('reads the same storage key the service writes', () => {
    expect(COLOR_MODE_SCRIPT).toContain(`'${COLOR_MODE_STORAGE_KEY}'`);
  });

  it('applies a saved dark, even over the attribute', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark');
    root().dataset.mode = 'light';
    run();
    expect(root().dataset.mode).toBe('dark');
  });

  it('sets system when nothing is saved and there is no attribute', () => {
    run();
    expect(root().dataset.mode).toBe('system');
  });

  it("leaves the developer's light alone when nothing is saved", () => {
    root().dataset.mode = 'light';
    run();
    expect(root().dataset.mode).toBe('light');
  });

  it('ignores a garbage saved value', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'purple');
    run();
    expect(root().dataset.mode).toBe('system');
  });

  it('sets system when storage throws and there is no attribute', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    run();
    expect(root().dataset.mode).toBe('system');
  });
});
