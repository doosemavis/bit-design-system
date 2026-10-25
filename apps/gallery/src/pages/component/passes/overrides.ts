import type { AnatomyPart } from '../../../manifests/types';
import { stepOf } from './build';

/** Sets each not-yet-landed part's `off` overrides; returns an undo that removes exactly what it set. */
export function applyOverrides(wrapper: HTMLElement, parts: readonly AnatomyPart[], landed: readonly string[]): () => void {
  const set: Array<{ el: HTMLElement; key: string }> = [];
  for (const part of parts) {
    if (!part.off || landed.includes(stepOf(part))) continue;
    const target = part.offOn === 'part' ? wrapper.querySelector<HTMLElement>(part.selector) : wrapper;
    if (!target) continue;
    for (const [key, value] of Object.entries(part.off)) {
      target.style.setProperty(key, value);
      set.push({ el: target, key });
    }
  }
  return () => {
    for (const { el, key } of set) el.style.removeProperty(key);
  };
}
