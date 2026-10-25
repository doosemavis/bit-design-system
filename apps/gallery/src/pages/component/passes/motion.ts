const FALLBACK_MS = 160;

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** `--bit-duration-normal` in ms, or 160 when it's missing or unreadable. */
export function durationMs(el: Element): number {
  const raw = getComputedStyle(el).getPropertyValue('--bit-duration-normal').trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return FALLBACK_MS;
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : FALLBACK_MS;
}

function run(el: Element, keyframes: Keyframe[], ms: number): Animation | null {
  if (prefersReducedMotion() || typeof el.animate !== 'function') return null;
  return el.animate(keyframes, { duration: ms, easing: 'ease-out', fill: 'both' });
}

/** Draws a path by moving its dash offset from its length to 0. */
export function drawIn(path: SVGPathElement, ms: number): Animation | null {
  if (prefersReducedMotion() || typeof path.animate !== 'function') return null;
  const length = path.getTotalLength();
  path.style.strokeDasharray = String(length);
  return run(path, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], ms);
}

export function fadeIn(el: Element, ms: number): Animation | null {
  return run(el, [{ opacity: 0 }, { opacity: 1 }], ms);
}

/** The way out: null under reduced motion or without animate() (jsdom), so the caller removes the element at once. */
export function fadeOut(el: Element, ms: number): Animation | null {
  return run(el, [{ opacity: 1 }, { opacity: 0 }], ms);
}

/** FLIP: starts at the `from` box and moves to the element's own place at `to`. */
export function slide(el: Element, from: DOMRect, to: DOMRect, ms: number): Animation | null {
  if (prefersReducedMotion() || typeof el.animate !== 'function') return null;
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = to.width ? from.width / to.width : 1;
  const sy = to.height ? from.height / to.height : 1;
  if (el instanceof HTMLElement || el instanceof SVGElement) el.style.transformOrigin = '0 0';
  return run(el, [{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }, { transform: 'none' }], ms);
}
