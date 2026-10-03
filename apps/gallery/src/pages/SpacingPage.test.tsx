import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SPACE_STEPS } from '@bit-ds/react';
import { renderAt } from '../test/renderRoute';

async function renderSpacing() {
  const utils = renderAt('/spacing');
  await screen.findByRole('heading', { level: 1, name: 'Spacing' });
  return { ...utils, main: screen.getByRole('main') };
}

describe('Spacing page', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it('has the outline the board drew', async () => {
    const { main } = await renderSpacing();
    const outline = within(main)
      .getAllByRole('heading')
      .map((h) => `${h.tagName} ${h.textContent}`);
    expect(outline).toEqual([
      'H1 Spacing',
      'H2 The scale',
      'H2 Stack or Box?',
      'H3 Stack: space between things',
      'H3 Box: space around one thing',
      'H2 Box props',
    ]);
  });

  it('the ruler draws each step with a Box whose paddingLeft is that step, beside its token', async () => {
    const { container } = await renderSpacing();
    const bars = [...container.querySelectorAll('.gallery-ruler__bar')];
    expect(bars.map((bar) => bar.getAttribute('data-pl'))).toEqual(SPACE_STEPS.map(String));
    for (const bar of bars) {
      expect(bar).toHaveClass('bit-box');
      expect(bar).toHaveAttribute('aria-hidden', 'true');
    }
    for (const step of SPACE_STEPS) expect(screen.getByText(`--bit-space-${step}px`)).toHaveClass('bit-code');
  });

  it('Stack or Box: each live example matches the code under it', async () => {
    const { container } = await renderSpacing();
    const stack = container.querySelector('.gallery-grid .bit-stack[data-direction="row"][data-gap="16"]')!;
    expect(within(stack as HTMLElement).getAllByText(/One|Two|Three/)).toHaveLength(3);
    const box = container.querySelector('.bit-box.gallery-outline')!;
    expect(box).toHaveAttribute('data-px', '24');
    expect(box).toHaveAttribute('data-py', '8');
    expect(box).toHaveTextContent('Banner');
    expect(screen.getByRole('region', { name: 'Stack example code' })).toHaveTextContent('<Stack direction="row" gap={16}>');
    expect(screen.getByRole('region', { name: 'Box example code' })).toHaveTextContent('<Box paddingX={24} paddingY={8}>');
  });

  it('the Box props table has a row for all sides, each axis and single sides, then the precedence note', async () => {
    await renderSpacing();
    const table = screen.getByRole('table', { name: 'Box props' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    for (const example of ['padding={16}', 'paddingX={24}', 'marginY={32}', 'marginTop={48}']) {
      expect(within(table).getByText(example)).toHaveClass('bit-code');
    }
    expect(screen.getByText(/the most specific wins/)).toHaveTextContent(
      'When props overlap, the most specific wins: paddingTop beats paddingY, which beats padding.',
    );
  });

  it('uses no raw table, code, pre or heading tags: every one comes from a bit component', async () => {
    const { main } = await renderSpacing();
    for (const el of main.querySelectorAll('table, code, pre, h1, h2, h3, h4, h5, h6')) {
      expect(el.matches('.bit-table__table, .bit-code, .bit-code__pre, .bit-code__pre code, .bit-heading'), el.outerHTML).toBe(true);
    }
  });
});
