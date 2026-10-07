import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { SelectOption, SelectProps } from './Select';

const FRUIT: readonly SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date', disabled: true },
  { value: 'icecream', label: 'Ice cream' },
  { value: 'icetea', label: 'Ice tea' },
];

const LONG: readonly SelectOption[] = Array.from({ length: 30 }, (_, i) => ({ value: `v${i}`, label: `Item ${i}` }));

const trigger = () => screen.getByRole('combobox');
const activeLabel = () => {
  const id = trigger().getAttribute('aria-activedescendant');
  return id === null ? null : document.getElementById(id)!.textContent;
};
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';

function setup(props: Partial<SelectProps> = {}) {
  const user = userEvent.setup();
  const onValueChange = vi.fn();
  const utils = render(<Select aria-label="Fruit" options={FRUIT} onValueChange={onValueChange} {...props} />);
  trigger().focus();
  return { user, onValueChange, ...utils };
}

let now = 10_000;
beforeEach(() => {
  now = 10_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Select keyboard: closed', () => {
  it.each(['{Enter}', ' ', '{ArrowDown}', '{ArrowUp}'])('%s opens with the chosen option active', async (key) => {
    const { user } = setup({ defaultValue: 'cherry' });
    await user.keyboard(key);
    expect(isOpen()).toBe(true);
    expect(activeLabel()).toBe('Cherry');
  });

  it('with nothing chosen, opening makes the first enabled option active', async () => {
    const { user } = setup({ options: [{ value: 'x', label: 'X', disabled: true }, ...FRUIT] });
    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Apple');
  });

  it('a chosen option that is disabled is not made active', async () => {
    const { user } = setup({ defaultValue: 'date' });
    await user.keyboard('{Enter}');
    expect(activeLabel()).toBe('Apple');
  });

  it('Alt+ArrowDown opens without moving off the chosen option', async () => {
    const { user } = setup({ defaultValue: 'banana' });
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(isOpen()).toBe(true);
    expect(activeLabel()).toBe('Banana');
  });

  it('typing a letter opens the list and moves to the first match, without choosing', async () => {
    const { user, onValueChange } = setup({ defaultValue: 'apple' });
    await user.keyboard('c');
    expect(isOpen()).toBe(true);
    expect(activeLabel()).toBe('Cherry');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('typing a letter nothing matches opens on the chosen option', async () => {
    const { user } = setup({ defaultValue: 'banana' });
    await user.keyboard('z');
    expect(isOpen()).toBe(true);
    expect(activeLabel()).toBe('Banana');
  });

  it('Enter and Space are default-prevented, so no click toggles the list shut again', () => {
    setup();
    expect(fireEvent.keyDown(trigger(), { key: 'Enter' })).toBe(false);
    fireEvent.keyDown(trigger(), { key: 'Escape' });
    expect(fireEvent.keyDown(trigger(), { key: ' ' })).toBe(false);
    expect(fireEvent.keyUp(trigger(), { key: ' ' })).toBe(false);
    expect(fireEvent.keyUp(trigger(), { key: 'Enter' })).toBe(true);
  });

  it('other keys leave it closed and keep their default: Escape, Tab, modifiers, Ctrl+letter', () => {
    setup();
    for (const init of [
      { key: 'Escape' },
      { key: 'Tab' },
      { key: 'Shift' },
      { key: 'a', ctrlKey: true },
      { key: 'a', metaKey: true },
      { key: 'a', altKey: true },
    ]) {
      expect(fireEvent.keyDown(trigger(), init)).toBe(true);
    }
    expect(isOpen()).toBe(false);
  });
});

describe('Select keyboard: open', () => {
  it('ArrowDown and ArrowUp move over enabled options without wrapping', async () => {
    const { user } = setup({ defaultValue: 'cherry' });
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    expect(activeLabel()).toBe('Ice cream');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeLabel()).toBe('Ice tea');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(activeLabel()).toBe('Cherry');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(activeLabel()).toBe('Apple');
  });

  it('Home and End go to the first and last enabled options', async () => {
    const { user } = setup({ options: [...FRUIT, { value: 'z', label: 'Zucchini', disabled: true }] });
    await user.keyboard('{Enter}{End}');
    expect(activeLabel()).toBe('Ice tea');
    await user.keyboard('{Home}');
    expect(activeLabel()).toBe('Apple');
  });

  it('PageDown and PageUp move ten rows', async () => {
    const { user } = setup({ options: LONG });
    await user.keyboard('{Enter}{PageDown}');
    expect(activeLabel()).toBe('Item 10');
    await user.keyboard('{PageDown}{PageDown}{PageDown}');
    expect(activeLabel()).toBe('Item 29');
    await user.keyboard('{PageUp}');
    expect(activeLabel()).toBe('Item 19');
  });

  it('Enter chooses the active option, closes and reports it', async () => {
    const { user, onValueChange, container } = setup();
    await user.keyboard('{Enter}{ArrowDown}{Enter}');
    expect(isOpen()).toBe(false);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
    expect(container.querySelector('.bit-select__value')!.textContent).toBe('Banana');
    expect(trigger()).toHaveFocus();
  });

  it('Space chooses the active option and closes', async () => {
    const { user, onValueChange } = setup();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.keyboard(' ');
    expect(isOpen()).toBe(false);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
  });

  it('Alt+ArrowUp chooses and closes', async () => {
    const { user, onValueChange } = setup();
    await user.keyboard('{Enter}{End}{Alt>}{ArrowUp}{/Alt}');
    expect(isOpen()).toBe(false);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('icetea');
  });

  it('Escape closes without choosing and keeps focus on the trigger', async () => {
    const { user, onValueChange } = setup({ defaultValue: 'apple' });
    await user.keyboard('{Enter}{ArrowDown}');
    expect(fireEvent.keyDown(trigger(), { key: 'Escape' })).toBe(false);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });

  it('Tab chooses the active option, closes, and does not stop focus moving on', async () => {
    const { onValueChange, user } = setup();
    await user.keyboard('{Enter}{ArrowDown}');
    expect(fireEvent.keyDown(trigger(), { key: 'Tab' })).toBe(true);
    expect(isOpen()).toBe(false);
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
  });

  it('keys it does not use do nothing and keep their default', async () => {
    const { user } = setup();
    await user.keyboard('{Enter}');
    expect(fireEvent.keyDown(trigger(), { key: 'ArrowLeft' })).toBe(true);
    expect(fireEvent.keyDown(trigger(), { key: 'b', ctrlKey: true })).toBe(true);
    expect(isOpen()).toBe(true);
    expect(activeLabel()).toBe('Apple');
  });

  it('with every option disabled there is no active option, and Enter just closes', async () => {
    const options = FRUIT.map((o) => ({ ...o, disabled: true }));
    const { user, onValueChange } = setup({ options });
    await user.keyboard('{Enter}');
    expect(isOpen()).toBe(true);
    expect(trigger()).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('Select keyboard: typeahead', () => {
  it('matches the label prefix typed within 500ms', async () => {
    const { user } = setup();
    await user.keyboard('{Enter}');
    await user.keyboard('b');
    expect(activeLabel()).toBe('Banana');
    now += 200;
    await user.keyboard('l');
    expect(activeLabel()).toBe('Blueberry');
  });

  it('a repeated letter cycles through the options starting with it', async () => {
    const { user } = setup();
    await user.keyboard('{Enter}b');
    now += 100;
    await user.keyboard('b');
    expect(activeLabel()).toBe('Blueberry');
    now += 100;
    await user.keyboard('b');
    expect(activeLabel()).toBe('Banana');
  });

  it('after a 500ms pause the search starts again', async () => {
    const { user } = setup();
    await user.keyboard('{Enter}b');
    now += 600;
    await user.keyboard('c');
    expect(activeLabel()).toBe('Cherry');
  });

  it('Space during a search is part of it rather than choosing', async () => {
    const { user, onValueChange } = setup();
    await user.keyboard('{Enter}');
    await user.keyboard('ice');
    now += 100;
    await user.keyboard(' ');
    now += 100;
    await user.keyboard('t');
    expect(isOpen()).toBe(true);
    expect(activeLabel()).toBe('Ice tea');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a search nothing matches leaves the active option where it was', async () => {
    const { user } = setup({ defaultValue: 'cherry' });
    await user.keyboard('{Enter}x');
    expect(activeLabel()).toBe('Cherry');
  });
});

describe('Select keyboard: scrolling the active row into view', () => {
  it('scrolls the active row into view with block "nearest" where the browser can', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: scrollIntoView, configurable: true, writable: true });
    try {
      const { user } = setup({ options: LONG });
      await user.keyboard('{Enter}{End}');
      expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts.at(-1)).toHaveProperty('textContent', 'Item 29');
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    }
  });
});
