import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { SelectOption } from './Select';
import { Field } from '../Field/Field';

const OPTIONS: readonly SelectOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
];

const trigger = () => screen.getByRole('combobox');
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';
const list = () => document.querySelector<HTMLElement>('[role="listbox"]')!;

describe('Select closes when focus leaves', () => {
  it('closes when the trigger loses focus to something outside the list', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Select aria-label="Range" options={OPTIONS} />
        <button type="button">Next</button>
      </>,
    );
    await user.click(trigger());
    act(() => screen.getByRole('button', { name: 'Next' }).focus());
    expect(isOpen()).toBe(false);
  });

  it('stays open when focus moves into the list', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    fireEvent.blur(trigger(), { relatedTarget: list().firstElementChild });
    expect(isOpen()).toBe(true);
  });

  it('closes when the window loses focus', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    fireEvent(window, new Event('blur'));
    expect(isOpen()).toBe(false);
  });

  it('runs the caller’s onBlur and onPointerDown too', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    const onPointerDown = vi.fn();
    render(<Select aria-label="Range" options={OPTIONS} onBlur={onBlur} onPointerDown={onPointerDown} />);
    await user.click(trigger());
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    trigger().blur();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

describe('Select and label clicks', () => {
  it('clicking the Field label while open closes the list instead of reopening it', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Range">
        <Select options={OPTIONS} />
      </Field>,
    );
    await user.click(trigger());
    await user.click(screen.getByText('Range'));
    expect(isOpen()).toBe(false);
    await user.click(trigger());
    expect(isOpen()).toBe(true);
  });

  it('clicking an outside <label for> while open closes the list', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="r">Range</label>
        <Select id="r" options={OPTIONS} />
      </>,
    );
    await user.click(trigger());
    await user.click(screen.getByText('Range'));
    expect(isOpen()).toBe(false);
  });

  it('clicking the label while closed still opens it, as before', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Range">
        <Select options={OPTIONS} />
      </Field>,
    );
    await user.click(screen.getByText('Range'));
    expect(isOpen()).toBe(true);
  });

  it('after an ordinary outside click, a click with no press (a screen reader’s) still opens it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Select aria-label="Range" options={OPTIONS} />
        <p>outside</p>
      </>,
    );
    await user.click(trigger());
    await user.click(screen.getByText('outside'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.click(trigger());
    expect(isOpen()).toBe(true);
  });

  it('a press outside that turns into a touch scroll (pointercancel, no click) does not swallow the next activation', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Select aria-label="Range" options={OPTIONS} />
        <p>outside</p>
      </>,
    );
    await user.click(trigger());
    const outside = screen.getByText('outside');
    fireEvent.pointerDown(outside);
    expect(isOpen()).toBe(false);
    fireEvent.pointerCancel(outside);
    fireEvent.click(trigger());
    expect(isOpen()).toBe(true);
  });

  describe('inside an implicit <label>', () => {
    function renderWrapped() {
      const onValueChange = vi.fn();
      const utils = render(
        <label>
          Time range
          <Select options={OPTIONS} onValueChange={onValueChange} />
        </label>,
      );
      return { onValueChange, ...utils };
    }

    it('choosing an option closes the list and does not reopen it through the label', async () => {
      const user = userEvent.setup();
      const { onValueChange } = renderWrapped();
      await user.click(trigger());
      await user.click(screen.getByRole('option', { name: 'Week' }));
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('week');
      expect(isOpen()).toBe(false);
    });

    it('names the listbox from the label text only, not the options or the value inside it', async () => {
      const user = userEvent.setup();
      renderWrapped();
      await user.click(trigger());
      expect(list()).toHaveAttribute('aria-label', 'Time range');
    });
  });
});

describe('Select and Escape', () => {
  it('Escape on an open list stops there, so a surrounding modal does not close too', async () => {
    const user = userEvent.setup();
    const onDocumentKey = vi.fn();
    document.addEventListener('keydown', onDocumentKey);
    try {
      render(<Select aria-label="Range" options={OPTIONS} />);
      await user.click(trigger());
      await user.keyboard('{Escape}');
      expect(isOpen()).toBe(false);
      expect(onDocumentKey).not.toHaveBeenCalled();
      await user.keyboard('{Escape}');
      expect(onDocumentKey).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', onDocumentKey);
    }
  });
});
