import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';
import type { SegmentedOption } from './SegmentedControl';
import { COLORS, SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const OPTIONS: readonly SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const radio = (name: string) => screen.getByRole('radio', { name });

describe('SegmentedControl', () => {
  it('renders a fieldset with a legend and one labelled radio per option', () => {
    const { container } = render(<SegmentedControl legend="Range" options={OPTIONS} />);
    const fieldset = container.firstElementChild as HTMLElement;
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset.className).toBe('bit-segmented-control bit-primary bit-md');
    expect(screen.getByRole('group', { name: 'Range' })).toBe(fieldset);
    expect(fieldset.querySelector('legend.bit-segmented-control__legend')).toHaveTextContent('Range');
    const options = fieldset.querySelector('.bit-segmented-control__options')!;
    expect([...options.children].map((label) => label.className)).toEqual(Array(3).fill('bit-segmented-control__option'));
    expect(radio('Week')).toHaveClass('bit-segmented-control__input');
    expect(radio('Week').nextElementSibling).toHaveClass('bit-segmented-control__label');
  });

  it.each(COLORS)('color=%s maps to bit-%s', (color) => {
    const { container } = render(<SegmentedControl legend="Range" options={OPTIONS} color={color} />);
    expect((container.firstElementChild as HTMLElement).classList.contains(`bit-${color}`)).toBe(true);
  });

  it.each(SIZES)('size=%s maps to bit-%s', (size) => {
    const { container } = render(<SegmentedControl legend="Range" options={OPTIONS} size={size} />);
    expect((container.firstElementChild as HTMLElement).classList.contains(`bit-${size}`)).toBe(true);
  });

  it('puts the ref, className and rest props on the fieldset', () => {
    const ref = createRef<HTMLFieldSetElement>();
    const { container } = render(
      <SegmentedControl ref={ref} legend="Range" options={OPTIONS} className="extra" data-testid="seg" />,
    );
    const fieldset = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(fieldset);
    expect(fieldset.className).toBe('bit-segmented-control bit-primary bit-md extra');
    expect(fieldset).toHaveAttribute('data-testid', 'seg');
  });

  it('the radios share one generated name, and two controls get different names', () => {
    render(
      <>
        <SegmentedControl legend="First" options={OPTIONS} />
        <SegmentedControl legend="Second" options={[{ value: 'a', label: 'A' }]} />
      </>,
    );
    const names = new Set(['Day', 'Week', 'Month'].map((n) => radio(n).getAttribute('name')));
    expect(names.size).toBe(1);
    expect(radio('A').getAttribute('name')).not.toBe([...names][0]);
  });

  it('name sets the shared name', () => {
    render(<SegmentedControl legend="Range" options={OPTIONS} name="range" />);
    for (const n of ['Day', 'Week', 'Month']) expect(radio(n)).toHaveAttribute('name', 'range');
  });

  it('uncontrolled: starts on the first option, or defaultValue; a click moves the choice and reports it', async () => {
    const onValueChange = vi.fn();
    const { unmount } = render(<SegmentedControl legend="Range" options={OPTIONS} onValueChange={onValueChange} />);
    expect(radio('Day')).toBeChecked();
    await userEvent.click(screen.getByText('Month'));
    expect(radio('Month')).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('month');
    unmount();
    render(<SegmentedControl legend="Range" options={OPTIONS} defaultValue="week" />);
    expect(radio('Week')).toBeChecked();
  });

  it('controlled: value decides; a click only asks the parent', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <SegmentedControl legend="Range" options={OPTIONS} value="week" onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByText('Day'));
    expect(onValueChange).toHaveBeenCalledWith('day');
    expect(radio('Week')).toBeChecked();
    rerender(<SegmentedControl legend="Range" options={OPTIONS} value="day" onValueChange={onValueChange} />);
    expect(radio('Day')).toBeChecked();
  });

  it('controlled through state works end to end', async () => {
    function Controlled() {
      const [range, setRange] = useState('day');
      return <SegmentedControl legend="Range" options={OPTIONS} value={range} onValueChange={setRange} />;
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('Week'));
    expect(radio('Week')).toBeChecked();
  });

  it('keyboard: one Tab stop on the chosen option, arrows move the choice', async () => {
    render(
      <>
        <SegmentedControl legend="Range" options={OPTIONS} defaultValue="week" />
        <button type="button">After</button>
      </>,
    );
    await userEvent.tab();
    expect(radio('Week')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(radio('Month')).toBeChecked();
    expect(radio('Month')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('a disabled option is disabled and cannot be chosen', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        legend="Range"
        options={[...OPTIONS.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    expect(radio('Month')).toBeDisabled();
    await userEvent.click(screen.getByText('Month'));
    expect(radio('Month')).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('legendHidden marks the legend data-hidden, and it still names the group', () => {
    const { container, rerender } = render(<SegmentedControl legend="Range" options={OPTIONS} legendHidden />);
    const legend = container.querySelector('legend')!;
    expect(legend).toHaveAttribute('data-hidden', '');
    expect(legend).toHaveTextContent('Range');
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    rerender(<SegmentedControl legend="Range" options={OPTIONS} />);
    expect(legend).not.toHaveAttribute('data-hidden');
  });

  it('no options renders the legend and no radios, without throwing', () => {
    render(<SegmentedControl legend="Range" options={[]} />);
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toEqual([]);
  });

  it('rejects an unknown color with a warning instead of emitting a class', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      // @ts-expect-error teal is not a color
      <SegmentedControl legend="Range" options={OPTIONS} color="teal" />,
    );
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-segmented-control bit-md');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each([false, true])('has no accessibility violations (legendHidden=%s, one option disabled)', async (legendHidden) => {
    const { container } = render(
      <SegmentedControl
        legend="Range"
        legendHidden={legendHidden}
        options={[...OPTIONS.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
