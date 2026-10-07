import type { Manifest } from '../manifests/types';

/** A minimal valid manifest for engine tests; override only what the test is about. */
export function testManifest(overrides: Partial<Manifest> = {}): Manifest {
  return {
    name: 'Demo',
    slug: 'demo',
    group: 'components',
    component: () => null,
    description: 'A test manifest.',
    controls: [],
    docs: {
      badges: [],
      usage: { do: ['Do.'], dont: ["Don't."] },
      props: [{ name: 'x', type: 'string', description: 'x' }],
      a11y: ['a11y.'],
    },
    ...overrides,
  };
}
