import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderManifest } from './renderManifest';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { stack } from '../manifests/stack';
import { field } from '../manifests/field';
import { table } from '../manifests/table';
import type { Manifest } from '../manifests/types';

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

  it('renders a ChildSpec with no children as a childless element (Field wraps a void Input)', () => {
    render(renderManifest(field, { ...defaultState(field), error: 'Enter your email.' }));
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveClass('bit-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter your email.');
  });

  it('renders nested ChildSpecs: Table head, rows and cells', () => {
    render(renderManifest(table, defaultState(table)));
    expect(screen.getByRole('region', { name: 'Button props' })).toHaveClass('bit-table');
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Prop', 'Type', 'Default']);
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getAllByRole('cell')[0]).toHaveTextContent('color');
  });

  it('renders a lowercase ChildSpec as a plain HTML element', () => {
    const withHtml: Manifest = {
      ...stack,
      children: [
        { component: 'span', props: { className: 'note' }, children: 'plain' },
        { component: 'Badge', children: 'bit' },
      ],
    };
    const { container } = render(renderManifest(withHtml, defaultState(withHtml)));
    const span = container.querySelector('span.note');
    expect(span).toHaveTextContent('plain');
    expect(span?.className).toBe('note');
    expect(container.querySelector('.bit-badge')).toHaveTextContent('bit');
  });
});
