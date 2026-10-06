import type { ControlState, LiteralValue, Manifest } from '../manifests/types';

/**
 * The props a page passes besides its controls' own: today the manifest's fixed props. They take the state so
 * props worked out from it can join them here, and every reader (the printed code first) picks them up. Pure;
 * the result is a new object.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the state is part of the contract; derived props read it
export function staticProps(manifest: Manifest, state: ControlState): Record<string, LiteralValue> {
  return { ...manifest.fixedProps };
}
