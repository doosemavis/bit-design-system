import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { variantAxes, VariantsTable } from './VariantsTable';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { spinner } from '../manifests/spinner';
import { stack } from '../manifests/stack';
import { expectNoA11yViolations } from '../test/a11y';

describe('variantAxes', () => {
  it('uses color as rows and variant as columns when both exist', () => {
    expect(variantAxes(button)).toMatchObject({ row: { prop: 'color' }, column: { prop: 'variant' } });
  });

  it('falls back to the first axis alone, and to null with no axis', () => {
    expect(variantAxes(card)).toEqual({ column: card.controls[0] });
    expect(variantAxes(spinner)?.column.prop).toBe('color');
    expect(variantAxes(spinner)?.row).toBeUndefined();
    expect(variantAxes(stack)).toBeNull();
  });
});

describe('VariantsTable', () => {
  it('draws one cell per color × variant, carrying the playground state into each', async () => {
    const { container } = render(
      <VariantsTable manifest={button} axes={variantAxes(button)!} state={{ ...defaultState(button), size: 'lg', children: 'Go' }} />,
    );
    const table = screen.getByRole('table', { name: 'Button variants' });
    const cells = within(table).getAllByRole('button', { name: 'Go' });
    expect(cells).toHaveLength(5 * 3);
    expect(cells.every((c) => c.classList.contains('bit-lg'))).toBe(true);
    expect(cells.filter((c) => c.classList.contains('bit-danger') && c.classList.contains('bit-ghost'))).toHaveLength(1);
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['color', 'solid', 'outline', 'ghost']);
    expect(within(table).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    await expectNoA11yViolations(container);
  });

  it('a single axis is one row under a head of its values', () => {
    const { container } = render(<VariantsTable manifest={card} axes={variantAxes(card)!} state={defaultState(card)} />);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['solid', 'outline']);
    expect(screen.queryAllByRole('rowheader')).toEqual([]);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container.querySelectorAll('tbody .bit-card')).toHaveLength(2);
  });
});
