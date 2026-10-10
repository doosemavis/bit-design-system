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
  ['TextareaExamples', TextareaExamples, ['A message in a Field', 'Count what is left', 'Show text that can’t be edited here']],
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
  it('the hint counts down the characters left as you type', async () => {
    const user = userEvent.setup();
    render(<TextareaExamples />);
    const box = screen.getByRole('textbox', { name: 'Feedback' });
    expect(box).toHaveAccessibleDescription('200 characters left.');
    await user.type(box, 'Great');
    expect(box).toHaveAccessibleDescription('195 characters left.');
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
