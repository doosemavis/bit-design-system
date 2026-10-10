import { useEffect, useReducer, useRef, useState } from 'react';
import type { RefCallback } from 'react';
import { readPalette } from './palette';
import type { Palette } from './palette';

/** Draws one frame. `width` and `height` are CSS pixels; the context is already scaled for the screen. */
export type Painter = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, palette: Palette) => void;

/** The html attributes a color mode or theme switch changes. */
const THEME_ATTRIBUTES = ['class', 'data-mode', 'data-theme', 'style'];
const THEME_QUERIES = ['(prefers-color-scheme: dark)', '(forced-colors: active)'];

/** Bumps a counter whenever the canvas resizes, the mode or theme changes, or the fonts finish loading. */
function useRepaintSignals(canvas: HTMLCanvasElement | null): number {
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!canvas) return;
    let live = true;
    const repaint = () => {
      if (live) bump();
    };
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(repaint) : null;
    resize?.observe(canvas);
    const theme = new MutationObserver(repaint);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
    const queries = typeof window.matchMedia === 'function' ? THEME_QUERIES.map((q) => window.matchMedia(q)) : [];
    queries.forEach((query) => query.addEventListener('change', repaint));
    document.fonts?.ready.then(repaint, () => {});
    return () => {
      live = false;
      resize?.disconnect();
      theme.disconnect();
      queries.forEach((query) => query.removeEventListener('change', repaint));
    };
  }, [canvas]);
  return version;
}

/**
 * A canvas that repaints with `paint` after every render, sized to its box at the screen's pixel ratio, in the
 * palette read from bit's tokens where it sits (re-read on a mode, theme or forced-colors change). Returns the
 * ref for the <canvas>. Where there is no 2D context (unit tests' jsdom), it paints nothing.
 */
export function useBoardCanvas(paint: Painter): RefCallback<HTMLCanvasElement> {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const version = useRepaintSignals(canvas);
  const palette = useRef<{ version: number; value: Palette } | null>(null);
  useEffect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (palette.current?.version !== version) palette.current = { version, value: readPalette(canvas) };
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(box.width * ratio));
    const height = Math.max(1, Math.round(box.height * ratio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    ctx.setTransform(width / Math.max(box.width, 1), 0, 0, height / Math.max(box.height, 1), 0, 0);
    paint(ctx, { width: Math.max(box.width, 1), height: Math.max(box.height, 1) }, palette.current.value);
  });
  return setCanvas;
}
