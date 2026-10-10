import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CheckboxExamples } from './CheckboxExamples';
import { RadioGroupExamples } from './RadioGroupExamples';
import { TextareaExamples } from './TextareaExamples';
import { expectNoA11yViolations } from '../../test/a11y';

describe.each([
  ['CheckboxExamples', CheckboxExamples, ['Select all', 'Agree in a form', 'Show a setting that can’t change here']],
  ['RadioGroupExamples', RadioGroupExamples, ['A required choice in a Field', 'Radio children', 'Show a choice that can’t change here']],
  [
    'TextareaExamples',
    TextareaExamples,
    ['A message in a Field', 'Bio with a character limit', 'Notes with a running count', 'Show text that can’t be edited here'],
  ],
] as const)('%s', (_name, Examples, titles) => {
  it('shows its use cases, each a live sample in a Box beside its code', async () => {
    const { container } = render(<Examples />);
    const examples = screen.getAllByRole('article');
    expect(examples.map((example) => within(example).getAllByRole('heading')[0]!.textContent)).toEqual(titles);
    for (const example of examples) {
      expect(example.querySelector('.gallery-example__sample.bit-box')).not.toBeNull();
      expect(example.querySelector('.bit-code__block')).not.toBeNull();
    }
    await expectNoA11yViolations(container);
  });
});

describe('Checkbox examples', () => {
  it('Select all is indeterminate while some are ticked, ticks them all, then clears them all', async () => {
    const user = userEvent.setup();
    render(<CheckboxExamples />);
    const all = screen.getByRole('checkbox', { name: 'All toppings' }) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    await user.click(all);
    expect(all).toBeChecked();
    expect(all.indeterminate).toBe(false);
    for (const name of ['Cheese', 'Mushrooms', 'Olives']) expect(screen.getByRole('checkbox', { name })).toBeChecked();
    await user.click(all);
    for (const name of ['Cheese', 'Mushrooms', 'Olives']) expect(screen.getByRole('checkbox', { name })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Olives' }));
    expect(all.indeterminate).toBe(true);
  });

  it('the read-only settings keep their state when clicked', async () => {
    const user = userEvent.setup();
    render(<CheckboxExamples />);
    const box = screen.getByRole('checkbox', { name: 'Two-step sign-in' });
    await user.click(box);
    expect(box).toBeChecked();
  });
});

describe('Textarea examples', () => {
  const countOf = (box: HTMLElement) => box.parentElement!.querySelector('.bit-textarea__count')!;

  it('the bio counts toward 140 on the hint’s row, turns warning, then stops at the limit', async () => {
    const user = userEvent.setup();
    render(<TextareaExamples />);
    const box = screen.getByRole('textbox', { name: 'Bio' });
    expect(box).toHaveAccessibleDescription('A line or two about you. Up to 140 characters');
    expect(countOf(box).firstChild?.textContent).toBe('120 / 140');
    await user.type(box, ' Yes!!');
    expect(countOf(box)).toHaveAttribute('data-state', 'near');
    await user.type(box, 'x'.repeat(30));
    expect(countOf(box).firstChild?.textContent).toBe('140 / 140');
    expect(countOf(box)).toHaveAttribute('data-state', 'limit');
  });

  it('the notes count characters with no limit', async () => {
    const user = userEvent.setup();
    render(<TextareaExamples />);
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(countOf(box)).toHaveTextContent('0 characters');
    await user.type(box, 'Hi');
    expect(countOf(box)).toHaveTextContent('2 characters');
  });
});

describe('RadioGroup examples', () => {
  it('the Field names its group, and the read-only group keeps its choice', async () => {
    const user = userEvent.setup();
    render(<RadioGroupExamples />);
    expect(screen.getByRole('radiogroup', { name: 'Shipping' })).toHaveAccessibleDescription('Arrives in 2 to 5 days.');
    await user.click(screen.getByRole('radio', { name: 'Monthly' }));
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
  });
});
