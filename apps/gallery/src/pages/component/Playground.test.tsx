import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Code } from '@bit-ds/react';
import { Playground } from './Playground';
import { defaultState } from '../../engine/state';
import type { ControlStateApi } from '../../engine/useControlState';
import type { Manifest } from '../../manifests/types';
import { button } from '../../manifests/button';
import { expectNoA11yViolations } from '../../test/a11y';

/** The smallest page a manifest can make: no controls, only the children text field. */
const childrenOnly: Manifest = {
  name: 'Code',
  slug: 'probe',
  group: 'components',
  component: Code,
  description: 'A probe with only a children control.',
  controls: [],
  children: 'x',
  docs: { badges: [], usage: { do: ['a'], dont: ['b'] }, props: [{ name: 'children', type: 'ReactNode', description: 'c' }], a11y: ['d'] },
};

function renderPlayground(manifest: Manifest) {
  const controls: ControlStateApi = { state: defaultState(manifest), setProp: () => {}, apply: () => {}, reset: () => {} };
  return render(
    <MemoryRouter>
      <Playground manifest={manifest} controls={controls} />
    </MemoryRouter>,
  );
}

describe('Playground (B3: one card)', () => {
  it('one bit Card holds the preview and the controls, in that order, and nothing else', async () => {
    const { container } = renderPlayground(button);
    const cards = container.querySelectorAll('.bit-card.gallery-playground__top');
    expect(cards).toHaveLength(1);
    const card = cards[0]!;
    expect(card).toHaveClass('bit-solid');
    expect([...card.children].map((child) => child.className)).toEqual(['gallery-preview', 'gallery-controls']);
    expect(card.querySelector('.gallery-preview .bit-card')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Button preview' })).getByText('Preview')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Controls' })).toBe(card.children[1]);
    await expectNoA11yViolations(container);
  });

  it('a manifest with only a children control still gets the bar and a grid holding just that field', () => {
    const { container } = renderPlayground(childrenOnly);
    const controls = container.querySelector('.gallery-playground__top > .gallery-controls')!;
    expect([...controls.children].map((child) => child.className)).toEqual(['gallery-controls__bar', 'gallery-controls__grid']);
    expect(within(controls as HTMLElement).getByText('Controls')).toHaveAttribute('id', 'controls-heading');
    const grid = controls.querySelector('.gallery-controls__grid')!;
    expect(grid.children).toHaveLength(1);
    expect(within(grid as HTMLElement).getByLabelText('children')).toHaveValue('x');
  });
});
