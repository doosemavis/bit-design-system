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
const value = (container: HTMLElement) => container.querySelector('.bit-select__value')!.textContent;

function submitSpy() {
  return vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
}

describe('Select in a form: required', () => {
  it('an empty required Select blocks submit and focuses its trigger, which says aria-required', () => {
    const onSubmit = submitSpy();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Select aria-label="Range" options={OPTIONS} name="range" required />
        <button type="submit">Send</button>
      </form>,
    );
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    expect(trigger()).not.toHaveAttribute('required');
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });

  it('once something is chosen, the required Select lets the form submit', async () => {
    const user = userEvent.setup();
    const onSubmit = submitSpy();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Select aria-label="Range" options={OPTIONS} name="range" required />
      </form>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Week' }));
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('a Field’s required blocks submit too, even without a name', () => {
    const onSubmit = submitSpy();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Field label="Range" required>
          <Select options={OPTIONS} />
        </Field>
      </form>,
    );
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });
});

describe('Select in a form: the native input', () => {
  it('drops a change made straight to the input (autofill, say): the Select owns the value', () => {
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} name="range" defaultValue="day" />
      </form>,
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'decade' } });
    expect(input).toHaveValue('day');
    expect(value(container)).toBe('Day');
  });
});

describe('Select in a form: disabled and form=', () => {
  it('a disabled Select submits nothing, like a disabled native select', () => {
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} name="range" defaultValue="day" disabled />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).has('range')).toBe(false);
  });

  it('a disabled required Select does not block submit', () => {
    const onSubmit = submitSpy();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Select aria-label="Range" options={OPTIONS} name="range" required disabled />
      </form>,
    );
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('form="id" ties the value to a form elsewhere on the page; the trigger does not get the attribute', () => {
    const { container } = render(
      <>
        <form id="settings" />
        <Select aria-label="Range" options={OPTIONS} name="range" defaultValue="week" form="settings" />
      </>,
    );
    expect(new FormData(container.querySelector('form')!).get('range')).toBe('week');
    expect(trigger()).not.toHaveAttribute('form');
  });
});

describe('Select in a form: reset', () => {
  it('resetting the form puts an uncontrolled Select back to its defaultValue', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} name="range" defaultValue="day" onValueChange={onValueChange} />
      </form>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Week' }));
    expect(value(container)).toBe('Week');
    act(() => container.querySelector('form')!.reset());
    expect(value(container)).toBe('Day');
    expect(new FormData(container.querySelector('form')!).get('range')).toBe('day');
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('with no defaultValue, reset clears the choice back to the placeholder', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} placeholder="Pick" />
      </form>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Week' }));
    act(() => container.querySelector('form')!.reset());
    expect(value(container)).toBe('Pick');
  });

  it('a reset of the form named by form="id" resets the Select too', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <form id="f" />
        <Select aria-label="Range" options={OPTIONS} defaultValue="day" form="f" />
      </>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Week' }));
    act(() => container.querySelector('form')!.reset());
    expect(value(container)).toBe('Day');
  });

  it('a controlled Select ignores reset: its parent owns the value', () => {
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} value="week" defaultValue="day" onValueChange={() => {}} />
      </form>,
    );
    act(() => container.querySelector('form')!.reset());
    expect(value(container)).toBe('Week');
  });

  it('outside any form there is nothing to reset, and nothing breaks', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} defaultValue="day" />);
    expect(value(container)).toBe('Day');
  });
});
