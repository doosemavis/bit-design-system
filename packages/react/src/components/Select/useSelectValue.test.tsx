import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSelectValue } from './useSelectValue';
import type { SelectValueArgs } from './useSelectValue';
import type { SelectOption } from './Select';

const OPTIONS: readonly SelectOption[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

function setup(initial: Partial<SelectValueArgs> = {}) {
  // A detached input has no form, so the reset listener is never attached here; Select.form tests cover reset.
  const inputRef = { current: document.createElement('input') };
  const base: SelectValueArgs = {
    options: OPTIONS,
    multiple: false,
    value: undefined,
    defaultValue: undefined,
    onValueChange: undefined,
    inputRef,
    form: undefined,
  };
  return renderHook((props: Partial<SelectValueArgs>) => useSelectValue({ ...base, ...props }), { initialProps: initial });
}

describe('useSelectValue: single mode', () => {
  it('starts from defaultValue and picks a new option, calling onValueChange once per change', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ defaultValue: 'b', onValueChange });
    expect(result.current.chosen).toEqual([1]);
    act(() => result.current.pickOne(2));
    expect(result.current.chosen).toEqual([2]);
    expect(onValueChange).toHaveBeenCalledWith('c');
    act(() => result.current.pickOne(2));
    act(() => result.current.pickOne(-1));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('controlled: value wins and pickOne only reports', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ value: 'a', onValueChange });
    act(() => result.current.pickOne(1));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(result.current.chosen).toEqual([0]);
  });

  it('a value no option has chooses nothing', () => {
    expect(setup({ value: 'zzz' }).result.current.chosen).toEqual([]);
  });
});

describe('useSelectValue: multi mode', () => {
  it('starts empty and toggles into option order, never mutating the previous array', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ multiple: true, onValueChange });
    expect(result.current.chosen).toEqual([]);
    act(() => result.current.toggle(2));
    const first = onValueChange.mock.calls[0]![0] as string[];
    act(() => result.current.toggle(0));
    expect(onValueChange.mock.calls[1]![0]).toEqual(['a', 'c']);
    expect(first).toEqual(['c']);
    expect(result.current.chosen).toEqual([0, 2]);
    act(() => result.current.toggle(0));
    expect(onValueChange.mock.calls[2]![0]).toEqual(['c']);
    expect(result.current.chosen).toEqual([2]);
  });

  it('defaultValue in any order, with unknown values, becomes option-order indexes', () => {
    expect(setup({ multiple: true, defaultValue: ['c', 'zzz', 'a'] }).result.current.chosen).toEqual([0, 2]);
  });

  it('controlled: value wins and toggle only reports', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ multiple: true, value: ['b'], onValueChange });
    act(() => result.current.toggle(0));
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
    expect(result.current.chosen).toEqual([1]);
  });

  it('toggle(-1) (no active row) does nothing', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ multiple: true, onValueChange });
    act(() => result.current.toggle(-1));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('useSelectValue: the wrong type for the mode, and switching modes', () => {
  it('a string value in multi mode, or an array in single mode, chooses nothing', () => {
    expect(setup({ multiple: true, value: 'a' }).result.current.chosen).toEqual([]);
    expect(setup({ value: ['a'] as unknown as string }).result.current.chosen).toEqual([]);
  });

  it('switching to multi resets the own value to [] (a string defaultValue does not carry over), and back again', () => {
    const { result, rerender } = setup({ defaultValue: 'b' });
    expect(result.current.chosen).toEqual([1]);
    rerender({ defaultValue: 'b', multiple: true });
    expect(result.current.chosen).toEqual([]);
    act(() => result.current.toggle(0));
    expect(result.current.chosen).toEqual([0]);
    rerender({ defaultValue: 'b', multiple: false });
    expect(result.current.chosen).toEqual([1]);
  });

  it('an array defaultValue fits multi mode and is dropped in single mode', () => {
    const { result, rerender } = setup({ multiple: true, defaultValue: ['a'] });
    expect(result.current.chosen).toEqual([0]);
    rerender({ multiple: false, defaultValue: ['a'] });
    expect(result.current.chosen).toEqual([]);
  });
});
