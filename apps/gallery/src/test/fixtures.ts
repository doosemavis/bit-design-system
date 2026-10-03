import { bitLogo } from '../manifests/bitLogo';
import type { Manifest } from '../manifests/types';

/** The engine still supports number controls and true-default booleans; no shipped manifest uses them now. */
export const numberControlFixture: Manifest = {
  ...bitLogo,
  controls: [
    { kind: 'number', prop: 'interval', default: 5, min: 1, max: 30, step: 1 },
    { kind: 'boolean', prop: 'animated', default: true },
  ],
};
