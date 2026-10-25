import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MANIFESTS } from '../../../manifests';
import { ScenePiece } from './ScenePiece';

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]';

describe('ScenePiece', () => {
  it('is an inert div[data-scene-piece]', () => {
    const { container } = render(<ScenePiece>x</ScenePiece>);
    expect(container.firstElementChild).toHaveAttribute('inert');
    expect(container.firstElementChild).toHaveAttribute('data-scene-piece');
  });
});

describe('every scene', () => {
  const withScene = MANIFESTS.filter((m) => m.anatomy);
  it.each(withScene.map((m) => [m.name, m] as const))('%s: only the slot can take focus, and no Card nests', (_name, manifest) => {
    const { container } = render(manifest.anatomy!.scene.render(<span data-scene-slot="" />));
    for (const el of container.querySelectorAll(FOCUSABLE)) {
      if (el.closest('[data-scene-slot]')) continue;
      expect(el.closest('[inert]'), el.outerHTML).not.toBeNull();
    }
    expect(container.querySelector('.bit-card .bit-card')).toBeNull();
  });
});
