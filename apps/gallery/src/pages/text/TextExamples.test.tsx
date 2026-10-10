import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextExamples } from './TextExamples';
import { expectNoA11yViolations } from '../../test/a11y';

describe('TextExamples', () => {
  it('shows five use cases, each titled as an h3 under the section h2', () => {
    render(<TextExamples />);
    expect(screen.getAllByRole('heading').map((h) => `${h.tagName} ${h.textContent}`)).toEqual([
      'H3 Lead and body',
      'H3 Hint or caption',
      'H3 Inline emphasis',
      'H3 Big text that is not a title',
      'H3 Same look, different job',
    ]);
  });

  it('pairs every live sample with the code that makes it', () => {
    render(<TextExamples />);
    for (const example of screen.getAllByRole('article')) {
      const title = within(example).getByRole('heading').textContent;
      expect(example.querySelector('.gallery-example__sample'), `${title} sample`).not.toBeNull();
      expect(example.querySelector('.bit-code__block'), `${title} code`).not.toBeNull();
    }
  });

  it('the inline example nests a span inside the paragraph, as its code says', () => {
    render(<TextExamples />);
    const example = screen.getByRole('article', { name: 'Inline emphasis' });
    const bold = example.querySelector('.gallery-example__sample p.bit-text > span.bit-text[data-weight="bold"]');
    expect(bold).toHaveTextContent('3 coins');
    expect(example).toHaveTextContent('<Text weight="bold">3 coins</Text>');
    expect(example).not.toHaveTextContent('as=');
  });

  it('same look, different job: a Heading and a Text at 24, and a primary note on why only one is a heading', () => {
    render(<TextExamples />);
    const example = screen.getByRole('article', { name: 'Same look, different job' });
    const sample = example.querySelector('.gallery-example__sample')!;
    // role="presentation" keeps the sample out of this page's own outline; size 24 still renders an h4.
    expect(sample.querySelector('h4.bit-heading[data-size="24"]')).toHaveAttribute('role', 'presentation');
    expect(sample.querySelector('p.bit-text[data-size="24"]')).not.toBeNull();
    const note = within(example).getByRole('note');
    expect(note).toHaveClass('bit-alert', 'bit-primary', 'bit-outline');
    expect(note).toHaveTextContent('Only the Heading is a heading (an h4, picked by its size)');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TextExamples />);
    await expectNoA11yViolations(container);
  });
});
