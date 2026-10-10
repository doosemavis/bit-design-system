import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { SelectOption } from './Select';
import { Field } from '../Field/Field';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const OPTIONS: readonly SelectOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter', disabled: true },
  { value: 'year', label: 'Year' },
];

const trigger = () => screen.getByRole('combobox');
const list = (container: HTMLElement) => container.querySelector<HTMLElement>('[role="listbox"]')!;
const rows = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[role="option"]')];

describe('Select: structure and ARIA', () => {
  it('wraps a combobox button and a listbox in span.bit-select with the default size', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.className).toBe('bit-select bit-md');
    const button = trigger();
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button.className).toBe('bit-select__control');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-activedescendant');
    expect(button.parentElement).toBe(wrapper);
    const listbox = list(container);
    expect(listbox.className).toBe('bit-select__list');
    expect(listbox).not.toHaveAttribute('popover');
    expect(listbox).toHaveAttribute('hidden');
    expect(button).toHaveAttribute('aria-controls', listbox.id);
    expect(wrapper).not.toHaveAttribute('data-open');
  });

  it('renders one option row per option, with stable ids, aria-selected and aria-disabled', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} defaultValue="week" />);
    const options = rows(container);
    expect(options.map((o) => o.textContent)).toEqual(['Day', 'Week', 'Month', 'Quarter', 'Year']);
    expect(options.map((o) => o.className)).toEqual(Array(5).fill('bit-select__option'));
    expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false', 'false']);
    expect(options.map((o) => o.getAttribute('aria-disabled'))).toEqual([null, null, null, 'true', null]);
    expect(new Set(options.map((o) => o.id)).size).toBe(5);
    expect(options.every((o) => o.id.startsWith(list(container).id))).toBe(true);
  });

  it.each(SIZES)('size=%s goes on the wrapper as bit-%s', (size) => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} size={size} />);
    expect((container.firstElementChild as HTMLElement).className).toBe(`bit-select bit-${size}`);
  });

  it('className goes on the wrapper; the ref and the rest go on the trigger', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <Select ref={ref} aria-label="Range" options={OPTIONS} className="extra" data-testid="control" title="Pick" />,
    );
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-select bit-md extra');
    expect(ref.current).toBe(screen.getByTestId('control'));
    expect(ref.current).toBe(trigger());
    expect(trigger()).toHaveAttribute('title', 'Pick');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of SelectProps
    render(<Select aria-label="Range" options={OPTIONS} color="danger" />);
    expect(trigger()).not.toHaveAttribute('color');
  });

  it('an aria-label names the listbox too; an aria-labelledby is passed to it', () => {
    const { container, rerender } = render(<Select aria-label="Range" options={OPTIONS} />);
    expect(list(container)).toHaveAttribute('aria-label', 'Range');
    expect(list(container)).not.toHaveAttribute('aria-labelledby');
    rerender(<Select aria-labelledby="heading" options={OPTIONS} />);
    expect(list(container)).toHaveAttribute('aria-labelledby', 'heading');
  });
});

describe('Select: value and placeholder', () => {
  it('shows the chosen label in the value span', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} defaultValue="month" />);
    const value = container.querySelector('.bit-select__value')!;
    expect(value.textContent).toBe('Month');
    expect(value).not.toHaveAttribute('data-placeholder');
    expect(value.parentElement).toBe(trigger());
  });

  it('shows the placeholder, marked data-placeholder, while nothing is chosen', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} placeholder="Choose a range" />);
    const value = container.querySelector('.bit-select__value')!;
    expect(value.textContent).toBe('Choose a range');
    expect(value).toHaveAttribute('data-placeholder');
  });

  it('the default placeholder is empty, but the value span is still there to hold the box height', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    const value = container.querySelector('.bit-select__value')!;
    expect(value.textContent).toBe('');
    expect(value).toHaveAttribute('data-placeholder');
  });

  it('a value that matches no option shows the placeholder and selects no row', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} value="decade" placeholder="None" />);
    expect(container.querySelector('.bit-select__value')!.textContent).toBe('None');
    expect(rows(container).some((o) => o.getAttribute('aria-selected') === 'true')).toBe(false);
  });

  it('labels may be elements', () => {
    render(<Select aria-label="Range" options={[{ value: 'a', label: <strong>Bold</strong> }]} defaultValue="a" />);
    expect(trigger().querySelector('strong')!.textContent).toBe('Bold');
  });
});

describe('Select: pointer', () => {
  it('clicking the trigger opens the list with the chosen option active, and clicking again closes it', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select aria-label="Range" options={OPTIONS} defaultValue="week" />);
    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-open');
    expect(list(container)).not.toHaveAttribute('hidden');
    const week = rows(container)[1]!;
    expect(trigger()).toHaveAttribute('aria-activedescendant', week.id);
    expect(week).toHaveAttribute('data-active');
    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(list(container)).toHaveAttribute('hidden');
    expect(trigger()).not.toHaveAttribute('aria-activedescendant');
    expect(container.firstElementChild).not.toHaveAttribute('data-open');
  });

  it('with nothing chosen, the first enabled option is active', async () => {
    const user = userEvent.setup();
    const options = [{ value: 'a', label: 'A', disabled: true }, ...OPTIONS];
    const { container } = render(<Select aria-label="Range" options={options} />);
    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-activedescendant', rows(container)[1]!.id);
  });

  it('clicking an option chooses it, closes the list, reports the value and keeps focus on the trigger', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<Select aria-label="Range" options={OPTIONS} onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Month' }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('month');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.bit-select__value')!.textContent).toBe('Month');
    expect(rows(container)[2]).toHaveAttribute('aria-selected', 'true');
    expect(trigger()).toHaveFocus();
  });

  it('choosing the option that is already chosen closes without calling onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select aria-label="Range" options={OPTIONS} defaultValue="week" onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Week' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a disabled option cannot be chosen and the list stays open', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select aria-label="Range" options={OPTIONS} onValueChange={onValueChange} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Quarter' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('hovering moves the active row, but not onto a disabled option', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select aria-label="Range" options={OPTIONS} defaultValue="day" />);
    await user.click(trigger());
    await user.hover(screen.getByRole('option', { name: 'Year' }));
    expect(trigger()).toHaveAttribute('aria-activedescendant', rows(container)[4]!.id);
    expect(rows(container)[0]).not.toHaveAttribute('data-active');
    await user.hover(screen.getByRole('option', { name: 'Quarter' }));
    expect(trigger()).toHaveAttribute('aria-activedescendant', rows(container)[4]!.id);
  });

  it('pressing on the list keeps focus on the trigger', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    expect(fireEvent.mouseDown(list(container))).toBe(false);
  });

  it('a press outside closes the list without choosing; a press inside the list does not close it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <Select aria-label="Range" options={OPTIONS} onValueChange={onValueChange} />
        <p>outside</p>
      </>,
    );
    await user.click(trigger());
    fireEvent.pointerDown(screen.getByRole('option', { name: 'Quarter' }));
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByText('outside'));
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('after closing, a press outside does nothing', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    await user.click(trigger());
    fireEvent.pointerDown(document.body);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('runs the caller’s onClick, onKeyDown and onKeyUp too; a caller preventDefault on keydown skips the Select’s keys', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onKeyUp = vi.fn();
    const onKeyDown = vi.fn((event: { key: string; preventDefault: () => void }) => {
      if (event.key === 'ArrowDown') event.preventDefault();
    });
    render(<Select aria-label="Range" options={OPTIONS} onClick={onClick} onKeyDown={onKeyDown} onKeyUp={onKeyUp} />);
    await user.click(trigger());
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger());
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    expect(onKeyDown).toHaveBeenCalled();
    expect(onKeyUp).toHaveBeenCalled();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Select: two on a page', () => {
  it('pressing B’s trigger while A is open closes A and opens B in one click; their option ids differ', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Select aria-label="A" options={OPTIONS} />
        <Select aria-label="B" options={OPTIONS} />
      </>,
    );
    const a = screen.getByRole('combobox', { name: 'A' });
    const b = screen.getByRole('combobox', { name: 'B' });
    await user.click(a);
    expect(a).toHaveAttribute('aria-expanded', 'true');
    await user.click(b);
    expect(a).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveAttribute('aria-expanded', 'true');
    expect(a.getAttribute('aria-controls')).not.toBe(b.getAttribute('aria-controls'));
    const ids = rows(container).map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Select: naming the listbox without a Field', () => {
  it('an external <label for> names the open listbox, and axe is clean', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <label htmlFor="range">Time range</label>
        <Select id="range" options={OPTIONS} />
      </>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Time range' }));
    expect(list(container)).toHaveAttribute('aria-label', 'Time range');
    await expectNoA11yViolations(container);
    await user.click(trigger());
    expect(list(container)).toHaveAttribute('hidden');
    expect(list(container)).not.toHaveAttribute('aria-label');
  });

  it('with only aria-label, the open listbox has that name and axe is clean', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    expect(list(container)).toHaveAttribute('aria-label', 'Range');
    await expectNoA11yViolations(container);
  });

  it('with no label at all but an id, the listbox falls back to the trigger', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select id="bare" options={OPTIONS} />);
    await user.click(trigger());
    expect(list(container)).toHaveAttribute('aria-labelledby', 'bare');
  });

  it('with no label and no id, the listbox gets no name attributes', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select options={OPTIONS} />);
    await user.click(trigger());
    expect(list(container)).not.toHaveAttribute('aria-label');
    expect(list(container)).not.toHaveAttribute('aria-labelledby');
  });
});

describe('Select: controlled and uncontrolled', () => {
  it('controlled: shows value, reports a choice, and changes only when the parent passes the new value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container, rerender } = render(
      <Select aria-label="Range" options={OPTIONS} value="day" onValueChange={onValueChange} />,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Year' }));
    expect(onValueChange).toHaveBeenCalledWith('year');
    expect(container.querySelector('.bit-select__value')!.textContent).toBe('Day');
    rerender(<Select aria-label="Range" options={OPTIONS} value="year" onValueChange={onValueChange} />);
    expect(container.querySelector('.bit-select__value')!.textContent).toBe('Year');
  });

  it('uncontrolled without onValueChange still updates its own value', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Day' }));
    expect(container.querySelector('.bit-select__value')!.textContent).toBe('Day');
  });
});

describe('Select: forms', () => {
  it('always renders one native form input: visually hidden, hidden from assistive tech, out of the tab order', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} defaultValue="day" />);
    const input = container.querySelector('input')!;
    expect(input.className).toBe('bit-select__input');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).not.toHaveAttribute('name');
    expect(input).toHaveValue('day');
  });

  it('without a name it submits nothing', () => {
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} defaultValue="day" />
      </form>,
    );
    expect([...new FormData(container.querySelector('form')!).keys()]).toEqual([]);
  });

  it('with a name, the input carries the chosen value into the form data', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} name="range" defaultValue="week" />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(new FormData(form).get('range')).toBe('week');
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Year' }));
    expect(new FormData(form).get('range')).toBe('year');
  });

  it('with a name and an unknown value, the form gets an empty string', () => {
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} name="range" value="decade" />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('range')).toBe('');
  });

  it('Enter on the closed trigger opens the list and does not submit the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Select aria-label="Range" options={OPTIONS} />
      </form>,
    );
    trigger().focus();
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Select: invalid, disabled and Field', () => {
  it('invalid sets aria-invalid="true"; without it there is no aria-invalid', () => {
    const { rerender } = render(<Select aria-label="Range" options={OPTIONS} invalid />);
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    rerender(<Select aria-label="Range" options={OPTIONS} />);
    expect(trigger()).not.toHaveAttribute('aria-invalid');
  });

  it('disabled disables the trigger, so it cannot open', async () => {
    const user = userEvent.setup();
    render(<Select aria-label="Range" options={OPTIONS} disabled />);
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('readOnly shows the choice, keeps focus and submits it, but neither a click nor a key opens it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Select aria-label="Range" options={OPTIONS} defaultValue="week" readOnly name="range" required onValueChange={onValueChange} />
      </form>,
    );
    expect(trigger()).toHaveAttribute('aria-readonly', 'true');
    expect(trigger()).not.toBeDisabled();
    expect(trigger()).toHaveTextContent('Week');
    await user.click(trigger());
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    for (const key of ['{ArrowDown}', '{Enter}', ' ', 'y']) {
      await user.keyboard(key);
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    }
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent('Week');
    const form = container.querySelector('form')!;
    expect(new FormData(form).get('range')).toBe('week');
    // Like a read-only native input, it is not checked for required.
    expect(form.checkValidity()).toBe(true);
  });

  it('making an open Select read-only closes it', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    rerender(<Select aria-label="Range" options={OPTIONS} readOnly />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(list(container)).toHaveAttribute('hidden');
  });

  it('read-only has no accessibility violations', async () => {
    const { container } = render(
      <Field label="Range">
        <Select options={OPTIONS} defaultValue="week" readOnly />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });

  it('disabling an open Select closes it', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Select aria-label="Range" options={OPTIONS} />);
    await user.click(trigger());
    rerender(<Select aria-label="Range" options={OPTIONS} disabled />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(list(container)).toHaveAttribute('hidden');
  });

  it('inside a Field it takes the label, the description, the invalid state and required', () => {
    const { container } = render(
      <Field label="Range" hint="How far back." error="Pick a range." required>
        <Select options={OPTIONS} />
      </Field>,
    );
    const button = screen.getByRole('combobox', { name: 'Range' });
    const hint = container.querySelector('.bit-field__hint')!;
    const error = container.querySelector('.bit-field__error')!;
    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(button).toHaveAttribute('aria-describedby', `${hint.id} ${error.id}`);
    expect(button).toHaveAttribute('aria-required', 'true');
    expect(button).not.toHaveAttribute('required');
    const label = container.querySelector('label')!;
    expect(label.id).not.toBe('');
    expect(list(container)).toHaveAttribute('aria-labelledby', label.id);
  });

  it('without a Field there is no aria-required', () => {
    render(<Select aria-label="Range" options={OPTIONS} />);
    expect(trigger()).not.toHaveAttribute('aria-required');
  });

  it('in a Field, its own aria-label names the listbox instead of the Field label', () => {
    const { container } = render(
      <Field label="Range">
        <Select aria-label="Time range" options={OPTIONS} />
      </Field>,
    );
    expect(list(container)).toHaveAttribute('aria-label', 'Time range');
    expect(list(container)).not.toHaveAttribute('aria-labelledby');
  });
});

describe('Select: accessibility', () => {
  it('has no violations while closed, alone or in a Field with an error', async () => {
    const { container } = render(
      <>
        <Select aria-label="Size" options={OPTIONS} />
        <Field label="Range" error="Pick a range.">
          <Select options={OPTIONS} defaultValue="week" />
        </Field>
      </>,
    );
    await expectNoA11yViolations(container);
  });

  it('has no violations while open, alone and in a Field', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Select aria-label="Size" options={OPTIONS} />
        <Field label="Range">
          <Select options={OPTIONS} defaultValue="week" />
        </Field>
      </>,
    );
    const [alone, inField] = screen.getAllByRole('combobox');
    await user.click(alone!);
    await expectNoA11yViolations(container);
    await user.click(inField!);
    await expectNoA11yViolations(container);
  });
});
