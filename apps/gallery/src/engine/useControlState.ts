import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { ControlState, ControlValue, Manifest } from '../manifests/types';
import { parseState, serializeState } from './state';

/** A text or number edit reaches the URL this long after the last keystroke. */
export const TYPING_DEBOUNCE_MS = 400;

export interface ControlStateApi {
  state: ControlState;
  setProp: (prop: string, value: ControlValue) => void;
  apply: (partial: Partial<ControlState>) => void;
  reset: () => void;
}

/** Text and number controls (and the children text) are typed, one keystroke at a time. */
function isTyped(manifest: Manifest, prop: string): boolean {
  if (prop === 'children') return typeof manifest.children === 'string';
  const kind = manifest.controls.find((control) => control.prop === prop)?.kind;
  return kind === 'text' || kind === 'number';
}

/** An edit not yet in the URL, and the history entry (location key) it was typed on. */
interface Draft {
  entry: string;
  state: ControlState;
}

/**
 * Page state lives in the query string, so every state is a link.
 * - Selects, switches, presets and Reset push a history entry, so Back undoes them. One that leaves the
 *   query as it is (Reset on a clean page, a preset already applied) navigates nowhere.
 * - Typing shows at once but replaces the current entry 400ms after the last keystroke, so Back skips
 *   the keystrokes and a word is one step, not five.
 * A draft only counts on the history entry it was typed on. Back, Forward, a push or a replace moves to
 * another entry (even one with the same query), which drops the draft and cancels its timer; so does
 * leaving the page.
 * A URL with invalid or unknown values is rewritten to the values shown, with replace (§E).
 */
export function useControlState(manifest: Manifest): ControlStateApi {
  const [search, setSearch] = useSearchParams();
  const query = search.toString();
  const { key: entry } = useLocation();
  const parsed = useMemo(() => parseState(manifest, search), [manifest, search]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const state = draft !== null && draft.entry === entry ? draft.state : parsed;

  useEffect(() => {
    setDraft((current) => (current !== null && current.entry !== entry ? null : current));
    return () => clearTimeout(timer.current);
  }, [entry]);

  // A shared link with bad or unknown values shows the defaults; rewrite its URL to match, in place.
  const canonical = useMemo(() => serializeState(manifest, parsed).toString(), [manifest, parsed]);
  useEffect(() => {
    if (canonical !== query) setSearch(new URLSearchParams(canonical), { replace: true });
  }, [canonical, query, setSearch]);

  const push = useCallback(
    (next: ControlState) => {
      clearTimeout(timer.current);
      setDraft(null);
      const nextSearch = serializeState(manifest, next);
      if (nextSearch.toString() !== query) setSearch(nextSearch);
    },
    [manifest, query, setSearch],
  );

  const apply = useCallback(
    (partial: Partial<ControlState>) => {
      const next: ControlState = { ...state };
      for (const [key, value] of Object.entries(partial)) if (value !== undefined) next[key] = value;
      push(next);
    },
    [state, push],
  );

  const setProp = useCallback(
    (prop: string, value: ControlValue) => {
      const next: ControlState = { ...state, [prop]: value };
      if (!isTyped(manifest, prop)) {
        push(next);
        return;
      }
      setDraft({ entry, state: next });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSearch(serializeState(manifest, next), { replace: true }), TYPING_DEBOUNCE_MS);
    },
    [manifest, entry, state, push, setSearch],
  );

  const reset = useCallback(() => push(parseState(manifest, new URLSearchParams())), [manifest, push]);

  return { state, setProp, apply, reset };
}
