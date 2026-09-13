import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderManifest } from './renderManifest';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { stack } from '../manifests/stack';

describe('renderManifest', () => {
  it('renders a simple component with string children and the state as props', () => {
    render(renderManifest(button, { ...defaultState(button), color: 'danger', children: 'Delete' }));
    const el = screen.getByRole('button', { name: 'Delete' });
    expect(el).toHaveClass('bit-button', 'bit-danger', 'bit-solid', 'bit-md');
  });

  it('renders compound parts from ChildSpec data', () => {
    const { container } = render(renderManifest(card, defaultState(card)));
    expect(container.querySelector('.bit-card__header')).toHaveTextContent('Stats');
    expect(container.querySelector('.bit-card__body')).toHaveTextContent('3 coins collected');
    expect(container.querySelector('.bit-card__footer')).toHaveTextContent('Updated today');
  });

  it('passes ChildSpec props through', () => {
    const { container } = render(renderManifest(stack, defaultState(stack)));
    expect(container.querySelectorAll('.bit-badge')).toHaveLength(3);
    expect(container.querySelector('.bit-badge.bit-success')).toHaveTextContent('Two');
  });
});
