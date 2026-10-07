import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { SelectMultipleProps, SelectOption, SelectProps } from './Select';
import { Field } from '../Field/Field';
import { expectNoA11yViolations } from '../../test/a11y';

const OPTIONS: readonly SelectOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter', disabled: true },
  { value: 'year', label: 'Year' },
];

const trigger = () => screen.getByRole('combobox');
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';
const valueBox = (container: HTMLElement) => container.querySelector<HTMLElement>('.bit-select__value')!;
const row = (name: string) => screen.getByRole('option', { name, hidden: true });

function setup(props: Partial<SelectMultipleProps> = {}) {
  const user = userEvent.setup();
  const onValueChange = vi.fn();
  const utils = render(<Select multiple aria-label="Range" options={OPTIONS} onValueChange={onValueChange} {...props} />);
  return { user, onValueChange, ...utils };
}

describe('Select multiple: ARIA and the closed trigger', () => {
  it('the listbox is multiselectable and every row reports aria-selected true or false', () => {
    const { container } = setup({ defaultValue: ['week'] });
    const list = container.querySelector('[role="listbox"]')!;
    expect(list).toHaveAttribute('aria-multiselectable', 'true');
    expect(row('Week')).toHaveAttribute('aria-selected', 'true');
    expect(row('Day')).toHaveAttribute('aria-selected', 'false');
  });

  it('single mode has no aria-multiselectable', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    expect(container.querySelector('[role="listbox"]')).not.toHaveAttribute('aria-multiselectable');
  });

  it('none chosen shows the placeholder; one shows its label; two or more show the "N selected" pill', () => {
    const { container, rerender } = render(<Select multiple aria-label="Range" options={OPTIONS} placeholder="Pick" value={[]} />);
    expect(valueBox(container)).toHaveTextContent('Pick');
    expect(valueBox(container)).toHaveAttribute('data-placeholder');
    rerender(<Select multiple aria-label="Range" options={OPTIONS} placeholder="Pick" value={['month']} />);
    expect(valueBox(container)).toHaveTextContent('Month');
    expect(valueBox(container)).not.toHaveAttribute('data-placeholder');
    expect(container.querySelector('.bit-select__count')).toBeNull();
    rerender(<Select multiple aria-label="Range" options={OPTIONS} placeholder="Pick" value={['day', 'year', 'week']} />);
    const pill = container.querySelector('.bit-select__count')!;
    expect(pill.tagName).toBe('SPAN');
    expect(pill.parentElement).toBe(valueBox(container));
    expect(pill).toHaveTextContent('3 selected');
  });

  it('values no option has are not counted', () => {
    const { container } = setup({ value: ['day', 'zzz', 'nope'] });
    expect(valueBox(container)).toHaveTextContent('Day');
    expect(container.querySelector('.bit-select__count')).toBeNull();
  });

  it('a string value in multi mode chooses nothing (wrong type from JS)', () => {
    const { container } = setup({ value: 'day' as unknown as string[], placeholder: 'Pick' });
    expect(valueBox(container)).toHaveTextContent('Pick');
  });
});

describe('Select multiple: toggling keeps the list open', () => {
  it('clicking rows toggles them in option order, the list stays open, and focus stays on the trigger', async () => {
    const { user, onValueChange, container } = setup();
    await user.click(trigger());
    await user.click(row('Year'));
    await user.click(row('Day'));
    expect(isOpen()).toBe(true);
    expect(trigger()).toHaveFocus();
    expect(onValueChange).toHaveBeenNthCalledWith(1, ['year']);
    expect(onValueChange).toHaveBeenNthCalledWith(2, ['day', 'year']);
    expect(container.querySelector('.bit-select__count')).toHaveTextContent('2 selected');
    await user.click(row('Day'));
    expect(onValueChange).toHaveBeenNthCalledWith(3, ['year']);
  });

  it('Enter and Space toggle the active row and keep the list open', async () => {
    const { user, onValueChange } = setup();
    trigger().focus();
    await user.keyboard('{Enter}');
    expect(isOpen()).toBe(true);
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');
    expect(isOpen()).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith(['day', 'week']);
  });

  it('a disabled row is refused', async () => {
    const { user, onValueChange } = setup();
    await user.click(trigger());
    await user.click(row('Quarter'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it('a chosen disabled option stays chosen and toggling others keeps it', async () => {
    const { user, onValueChange } = setup({ defaultValue: ['quarter'] });
    await user.click(trigger());
    await user.click(row('Day'));
    expect(onValueChange).toHaveBeenCalledWith(['day', 'quarter']);
  });

  it('opens with the first chosen enabled option active', async () => {
    const { user } = setup({ defaultValue: ['quarter', 'year'] });
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    const active = document.getElementById(trigger().getAttribute('aria-activedescendant')!);
    expect(active).toHaveTextContent('Year');
  });

  it('with every option disabled, Enter, Space and Tab call nothing', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select multiple aria-label="Range" options={[{ value: 'x', label: 'X', disabled: true }]} onValueChange={onValueChange} />,
    );
    trigger().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.keyboard('{Tab}');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('Select multiple: closing never toggles', () => {
  it.each([
    ['Escape', '{Escape}'],
    ['Alt+ArrowUp', '{Alt>}{ArrowUp}{/Alt}'],
  ])('%s closes without toggling and keeps focus on the trigger', async (_name, keys) => {
    const { user, onValueChange } = setup();
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard(keys);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });

  it('Tab closes without toggling and is not prevented', () => {
    const { onValueChange } = setup();
    trigger().focus();
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => {
      trigger().dispatchEvent(tab);
    });
    expect(tab.defaultPrevented).toBe(false);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a press outside closes without toggling', async () => {
    const { user, onValueChange } = setup();
    await user.click(trigger());
    await user.click(document.body);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('single mode still chooses on Alt+ArrowUp (unchanged)', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Select aria-label="Range" options={OPTIONS} onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Alt>}{ArrowUp}{/Alt}');
    expect(onValueChange).toHaveBeenLastCalledWith('week');
  });
});

describe('Select multiple: switching mode at runtime', () => {
  it('single → multi drops the string; multi → single drops the array', async () => {
    const user = userEvent.setup();
    const view = (multiple: boolean) =>
      multiple ? (
        <Select multiple aria-label="Range" options={OPTIONS} name="r" placeholder="Pick" />
      ) : (
        <Select aria-label="Range" options={OPTIONS} name="r" placeholder="Pick" defaultValue="day" />
      );
    const { container, rerender } = render(<form>{view(false)}</form>);
    expect(valueBox(container)).toHaveTextContent('Day');
    rerender(<form>{view(true)}</form>);
    expect(valueBox(container)).toHaveTextContent('Pick');
    expect(new FormData(container.querySelector('form')!).getAll('r')).toEqual([]);
    await user.click(trigger());
    await user.click(row('Week'));
    await user.click(row('Year'));
    rerender(<form>{view(false)}</form>);
    expect(valueBox(container)).toHaveTextContent('Day');
    expect(new FormData(container.querySelector('form')!).getAll('r')).toEqual(['day']);
  });
});

describe('Select multiple in a form', () => {
  it('submits every chosen value under name, in option order', () => {
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" defaultValue={['year', 'day']} />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day', 'year']);
  });

  it('without a name submits nothing', () => {
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} defaultValue={['day']} />
      </form>,
    );
    expect([...new FormData(container.querySelector('form')!).keys()]).toEqual([]);
  });

  it('required blocks an empty submit and passes with one chosen', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { container, rerender } = render(
      <form onSubmit={onSubmit}>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" required value={[]} />
      </form>,
    );
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    rerender(
      <form onSubmit={onSubmit}>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" required value={['week']} />
      </form>,
    );
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('the validation input has no name in multi mode, so it adds no extra entry', () => {
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" defaultValue={['week']} />
      </form>,
    );
    expect(container.querySelector('.bit-select__input')).not.toHaveAttribute('name');
  });

  it('disabled submits nothing and never blocks', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Select multiple disabled required aria-label="Range" options={OPTIONS} name="range" defaultValue={['day']} />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual([]);
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('form="id" ties every hidden input to that form', () => {
    const { container } = render(
      <>
        <form id="f" />
        <Select multiple aria-label="Range" options={OPTIONS} name="range" form="f" defaultValue={['day', 'week']} />
      </>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day', 'week']);
  });

  it('reset puts an uncontrolled multi Select back to defaultValue without calling onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" defaultValue={['day']} onValueChange={onValueChange} />
      </form>,
    );
    await user.click(trigger());
    await user.click(row('Week'));
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day', 'week']);
    act(() => container.querySelector('form')!.reset());
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day']);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

describe('Select multiple: Field, axe and types', () => {
  it('inside a Field takes its label, and required from the Field', () => {
    render(
      <Field label="Ranges" required>
        <Select multiple options={OPTIONS} />
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: /Ranges/ })).toHaveAttribute('aria-required', 'true');
  });

  it('has no axe violations closed with the pill, or open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select multiple aria-label="Range" options={OPTIONS} defaultValue={['day', 'week']} />);
    await expectNoA11yViolations(container);
    await user.click(trigger());
    await expectNoA11yViolations(document.body);
  });

  it('types: multiple takes string[] and reports string[]; single is unchanged', () => {
    const onMany: SelectMultipleProps['onValueChange'] = (v) => void v.join();
    const onOne: SelectProps['onValueChange'] = (v) => void v.toUpperCase();
    void (<Select multiple aria-label="x" options={OPTIONS} value={['day']} onValueChange={onMany} />);
    void (<Select aria-label="x" options={OPTIONS} value="day" onValueChange={onOne} />);
    // @ts-expect-error multiple takes string[]
    void (<Select multiple aria-label="x" options={OPTIONS} value="day" />);
    // @ts-expect-error single takes string
    void (<Select aria-label="x" options={OPTIONS} value={['day']} />);
    interface WithHint extends SelectProps {
      hint?: string;
    }
    const withHint: WithHint = { options: OPTIONS, hint: 'h' };
    expect(withHint.hint).toBe('h');
  });
});
