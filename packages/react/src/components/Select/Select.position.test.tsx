import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { SelectOption } from './Select';

const OPTIONS: readonly SelectOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
];

const trigger = () => screen.getByRole('combobox');
const list = () => document.querySelector<HTMLElement>('[role="listbox"]')!;
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';

let triggerBox = { top: 100, left: 50, width: 200, height: 40 };
let listBox = { width: 150, height: 200 };

function rect(box: { top?: number; left?: number; width: number; height: number }): DOMRect {
  const top = box.top ?? 0;
  const left = box.left ?? 0;
  return { top, left, width: box.width, height: box.height, bottom: top + box.height, right: left + box.width, x: left, y: top, toJSON: () => ({}) };
}

let measure: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  triggerBox = { top: 100, left: 50, width: 200, height: 40 };
  listBox = { width: 150, height: 200 };
  measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return rect(this.getAttribute('role') === 'listbox' ? listBox : triggerBox);
  });
  vi.stubGlobal('innerWidth', 1000);
  vi.stubGlobal('innerHeight', 800);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function open() {
  const user = userEvent.setup();
  render(<Select aria-label="Range" options={OPTIONS} />);
  await user.click(trigger());
  return user;
}

describe('Select position', () => {
  it('opens 6px below the trigger, at least as wide as it, then marks the list entered', async () => {
    await open();
    const style = list().style;
    expect(style.top).toBe('146px');
    expect(style.left).toBe('50px');
    expect(style.minWidth).toBe('200px');
    expect(style.maxWidth).toBe('984px');
    expect(style.getPropertyValue('--_bit-select-room')).toBe('646px');
    expect(list()).toHaveAttribute('data-placement', 'bottom');
    expect(list()).toHaveAttribute('data-entered');
  });

  it('opens above when there is no room below and more above', async () => {
    triggerBox = { ...triggerBox, top: 700 };
    await open();
    expect(list()).toHaveAttribute('data-placement', 'top');
    expect(list().style.top).toBe('494px');
    expect(list().style.getPropertyValue('--_bit-select-room')).toBe('686px');
  });

  it('follows the trigger when anything scrolls, and when the window resizes', async () => {
    await open();
    triggerBox = { ...triggerBox, top: 200 };
    fireEvent.scroll(document.body);
    expect(list().style.top).toBe('246px');
    vi.stubGlobal('innerWidth', 400);
    triggerBox = { ...triggerBox, left: 300 };
    fireEvent(window, new Event('resize'));
    expect(list().style.left).toBe('192px');
  });

  it.each([
    ['above', -100],
    ['below', 900],
  ])('closes when the trigger scrolls out of the viewport (%s)', async (_, top) => {
    await open();
    triggerBox = { ...triggerBox, top };
    fireEvent.scroll(document.body);
    expect(isOpen()).toBe(false);
  });

  it('closing clears the placement and stops following scrolls', async () => {
    const user = await open();
    await user.click(trigger());
    expect(list()).not.toHaveAttribute('data-entered');
    expect(list()).not.toHaveAttribute('data-placement');
    measure.mockClear();
    fireEvent.scroll(document.body);
    fireEvent(window, new Event('resize'));
    expect(measure).not.toHaveBeenCalled();
  });
});

describe('Select position: scrolling and changing options', () => {
  it('scrolling the list itself (or a row in it) does not re-place it', async () => {
    triggerBox = { ...triggerBox, top: 700 };
    await open();
    const before = list().style.cssText;
    measure.mockClear();
    fireEvent.scroll(list());
    fireEvent.scroll(list().firstElementChild!);
    expect(measure).not.toHaveBeenCalled();
    expect(list().style.cssText).toBe(before);
  });

  it('a scroll event dispatched on window still makes the list follow, without throwing', async () => {
    await open();
    triggerBox = { ...triggerBox, top: 200 };
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow();
    expect(list().style.top).toBe('246px');
  });

  it('measures the list once when it opens, and not again for an equal inline options array', async () => {
    const measuredList = () => measure.mock.contexts.filter((el: unknown) => (el as HTMLElement).getAttribute('role') === 'listbox').length;
    const user = userEvent.setup();
    const { rerender } = render(<Select aria-label="Range" options={[...OPTIONS]} />);
    await user.click(trigger());
    expect(measuredList()).toBe(1);
    rerender(<Select aria-label="Range" options={OPTIONS.map((o) => ({ ...o }))} />);
    expect(measuredList()).toBe(1);
    rerender(<Select aria-label="Range" options={OPTIONS.map((o, i) => ({ ...o, disabled: i === 0 }))} />);
    expect(measuredList()).toBe(2);
  });

  it('re-places the list when the options change while open, so a list above grows upward', async () => {
    triggerBox = { ...triggerBox, top: 700 };
    const user = userEvent.setup();
    const { rerender } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    expect(list().style.top).toBe('494px');
    listBox = { ...listBox, height: 300 };
    rerender(<Select aria-label="Range" options={[...OPTIONS, { value: 'month', label: 'Month' }]} />);
    expect(list().style.top).toBe('394px');
  });

  it('placing again keeps the list’s scroll position, even if measuring clamped it', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    let scrollTop = 120;
    Object.defineProperty(list(), 'scrollTop', { configurable: true, get: () => scrollTop, set: (v: number) => (scrollTop = v) });
    // Measuring lifts the room cap; a browser would clamp scrollTop to the taller list's range.
    measure.mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('role') === 'listbox') scrollTop = Math.min(scrollTop, 50);
      return rect(this.getAttribute('role') === 'listbox' ? listBox : triggerBox);
    });
    rerender(<Select aria-label="Range" options={[...OPTIONS, { value: 'month', label: 'Month' }]} />);
    expect(scrollTop).toBe(120);
  });

  it('closes if the options change while the trigger is out of view', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    triggerBox = { ...triggerBox, top: -500 };
    rerender(<Select aria-label="Range" options={[...OPTIONS, { value: 'month', label: 'Month' }]} />);
    expect(isOpen()).toBe(false);
  });
});

describe('Select popover', () => {
  let showPopover: ReturnType<typeof vi.fn>;
  let hidePopover: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    showPopover = vi.fn();
    hidePopover = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { value: showPopover, configurable: true, writable: true });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', { value: hidePopover, configurable: true, writable: true });
  });
  afterEach(() => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
    delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
  });

  it('shows the list in the top layer when it opens and hides it when it closes', async () => {
    const user = await open();
    expect(list()).toHaveAttribute('popover', 'manual');
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(showPopover.mock.contexts[0]).toBe(list());
    expect(hidePopover).not.toHaveBeenCalled();
    await user.click(trigger());
    expect(hidePopover).toHaveBeenCalledTimes(1);
    expect(hidePopover.mock.contexts[0]).toBe(list());
  });

  it('hides the popover if the Select unmounts while open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    unmount();
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it('never calls the Popover API while closed', () => {
    render(<Select aria-label="Range" options={OPTIONS} />);
    expect(showPopover).not.toHaveBeenCalled();
    expect(hidePopover).not.toHaveBeenCalled();
  });
});

describe('Select without the Popover API', () => {
  it('falls back to the hidden attribute', async () => {
    expect(typeof (HTMLElement.prototype as Partial<HTMLElement>).showPopover).toBe('undefined');
    const user = await open();
    expect(list()).not.toHaveAttribute('hidden');
    expect(list()).not.toHaveAttribute('popover');
    await user.click(trigger());
    expect(list()).toHaveAttribute('hidden');
  });
});
