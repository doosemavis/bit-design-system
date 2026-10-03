import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Matrix, matrixAxes } from './Matrix';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { stack } from '../manifests/stack';

describe('matrixAxes', () => {
  it('uses color as rows and variant as columns when both exist', () => {
    const axes = matrixAxes(button);
    expect(axes?.rows.prop).toBe('color');
    expect(axes?.cols?.prop).toBe('variant');
  });

  it('falls back to the single axis and to null', () => {
    expect(matrixAxes(card)?.rows.prop).toBe('variant');
    expect(matrixAxes(card)?.cols).toBeUndefined();
    expect(matrixAxes(stack)).toBeNull();
  });
});

describe('Matrix', () => {
  it('renders every color × variant cell and carries the other state', () => {
    render(<Matrix manifest={button} state={{ ...defaultState(button), size: 'lg', children: 'Go' }} />);
    const cells = screen.getAllByRole('button', { name: 'Go' });
    expect(cells).toHaveLength(5 * 3);
    expect(cells.every((c) => c.classList.contains('bit-lg'))).toBe(true);
    expect(cells.filter((c) => c.classList.contains('bit-danger') && c.classList.contains('bit-ghost'))).toHaveLength(1);
    expect(screen.getByRole('table', { name: 'Button matrix' })).toBeInTheDocument();
  });

  it('renders a single row for a one-axis manifest', () => {
    const { container } = render(<Matrix manifest={card} state={defaultState(card)} />);
    expect(container.querySelectorAll('.bit-card')).toHaveLength(2);
  });
});
