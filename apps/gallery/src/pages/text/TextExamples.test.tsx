import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextExamples } from './TextExamples';
import { expectNoA11yViolations } from '../../test/a11y';

describe('TextExamples', () => {
  it('shows six use cases, each titled as an h3 under the section h2', () => {
    render(<TextExamples />);
    expect(screen.getAllByRole('heading').map((h) => `${h.tagName} ${h.textContent}`)).toEqual([
      'H3 Lead and body',
      'H3 Hint or caption',
      'H3 Inline emphasis',
      'H3 Bold, italic, underline, strikethrough',
      'H3 Big text that is not a title',
      'H3 Same look, different job',
    ]);
  });

  it('pairs every live sample, framed in a Box, with the code that makes it, under a divided header', () => {
    render(<TextExamples />);
    for (const example of screen.getAllByRole('article')) {
      const title = within(example).getByRole('heading').textContent;
      // The title and its line sit in the CardHeader, whose border divides them from the example.
      expect(example.querySelector('.bit-card__header'), `${title} header`).toContainElement(within(example).getByRole('heading'));
      const sample = example.querySelector('.bit-card__body .gallery-example__sample');
      expect(sample, `${title} sample`).toHaveClass('bit-box');
      expect(sample, `${title} sample`).toHaveAttribute('data-p', '16');
      expect(example.querySelector('.bit-card__body .bit-code__block'), `${title} code`).not.toBeNull();
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

  it('the styles example shows each style live, inline in its sentence, as its code says', () => {
    render(<TextExamples />);
    const example = screen.getByRole('article', { name: 'Bold, italic, underline, strikethrough' });
    const sample = example.querySelector('.gallery-example__sample')!;
    for (const selector of ['[data-weight="bold"]', '[data-italic]', '[data-underline]', '[data-strikethrough]', '[data-weight="bold"][data-italic]']) {
      expect(sample.querySelector(`p.bit-text > span.bit-text${selector}`), selector).not.toBeNull();
    }
    for (const prop of ['weight="bold"', '<Text italic>', '<Text underline>', '<Text strikethrough>']) expect(example).toHaveTextContent(prop);
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

  it('spaces the example cards 32px apart, so each reads as its own block', () => {
    const { container } = render(<TextExamples />);
    const list = container.firstElementChild!;
    expect(list).toHaveClass('bit-stack');
    expect(list).toHaveAttribute('data-gap', '32');
    expect([...list.children].every((child) => child.matches('.bit-card[role="article"]'))).toBe(true);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TextExamples />);
    await expectNoA11yViolations(container);
  });
});
