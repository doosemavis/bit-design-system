import type { Control, ControlState, ControlValue, Manifest } from '../manifests/types';

const CHILDREN = 'children';

function controlDefault(control: Control): ControlValue {
  switch (control.kind) {
    case 'boolean':
      return control.default;
    case 'number':
      return String(control.default);
    default:
      return control.default;
  }
}

/** The state a fresh page starts from. Number controls are stored as strings, like the URL. */
export function defaultState(manifest: Manifest): ControlState {
  const state: ControlState = {};
  for (const control of manifest.controls) state[control.prop] = controlDefault(control);
  if (typeof manifest.children === 'string') state[CHILDREN] = manifest.children;
  return state;
}

function parseValue(control: Control, raw: string): ControlValue | undefined {
  switch (control.kind) {
    case 'axis':
    case 'select':
      return control.values.includes(raw) ? raw : undefined;
    case 'boolean':
      return raw === '1' ? true : raw === '0' ? false : undefined;
    case 'number': {
      const n = Number(raw);
      if (raw.trim() === '' || Number.isNaN(n)) return undefined;
      return String(Math.min(control.max, Math.max(control.min, n)));
    }
    case 'text':
      return raw;
  }
}

/** A new state where every control locked by the rest of the state is back at its default. */
export function applyLocks(manifest: Manifest, state: ControlState): ControlState {
  const locked = manifest.controls.filter((control) => control.kind === 'select' && control.lock?.(state) !== undefined);
  if (locked.length === 0) return state;
  return { ...state, ...Object.fromEntries(locked.map((control) => [control.prop, controlDefault(control)])) };
}

/**
 * Defaults overlaid with whatever valid values the query carries, then locks applied. Invalid or unknown
 * keys are ignored, and a locked value (?size=32&weight=bold) is dropped, so the URL is rewritten without it.
 */
export function parseState(manifest: Manifest, search: URLSearchParams): ControlState {
  return applyLocks(manifest, parseQuery(manifest, search));
}

function parseQuery(manifest: Manifest, search: URLSearchParams): ControlState {
  const state = defaultState(manifest);
  for (const control of manifest.controls) {
    const raw = search.get(control.prop);
    if (raw === null) continue;
    const value = parseValue(control, raw);
    if (value !== undefined) state[control.prop] = value;
  }
  if (typeof manifest.children === 'string') {
    const raw = search.get(CHILDREN);
    if (raw !== null) state[CHILDREN] = raw;
  }
  return state;
}

function serializeValue(value: ControlValue): string {
  return typeof value === 'boolean' ? (value ? '1' : '0') : value;
}

/** Only values that differ from the default, in control order, so URLs stay short and stable. */
export function serializeState(manifest: Manifest, state: ControlState): URLSearchParams {
  const defaults = defaultState(manifest);
  const params = new URLSearchParams();
  const keys = [...manifest.controls.map((c) => c.prop), ...(typeof manifest.children === 'string' ? [CHILDREN] : [])];
  for (const key of keys) {
    const value = state[key];
    if (value === undefined || value === defaults[key]) continue;
    params.set(key, serializeValue(value));
  }
  return params;
}
