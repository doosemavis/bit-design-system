import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ControlState, ControlValue, Manifest } from '../manifests/types';
import { parseState, serializeState } from './state';

export interface ControlStateApi {
  state: ControlState;
  setProp: (prop: string, value: ControlValue) => void;
  apply: (partial: Partial<ControlState>) => void;
  reset: () => void;
}

/** Page state lives in the query string, so every state is a link and Back undoes a change. */
export function useControlState(manifest: Manifest): ControlStateApi {
  const [search, setSearch] = useSearchParams();
  const state = useMemo(() => parseState(manifest, search), [manifest, search]);

  const apply = useCallback(
    (partial: Partial<ControlState>) => {
      const next: ControlState = { ...state };
      for (const [key, value] of Object.entries(partial)) if (value !== undefined) next[key] = value;
      setSearch(serializeState(manifest, next));
    },
    [manifest, state, setSearch],
  );

  const setProp = useCallback((prop: string, value: ControlValue) => apply({ [prop]: value }), [apply]);
  const reset = useCallback(() => setSearch(new URLSearchParams()), [setSearch]);

  return { state, setProp, apply, reset };
}
