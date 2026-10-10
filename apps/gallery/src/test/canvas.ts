import { vi } from 'vitest';

/** One drawing call: the method, its arguments, and the fill color at the time. */
export interface DrawCall {
  readonly op: string;
  readonly args: readonly unknown[];
  readonly fillStyle: string;
}

/**
 * A stand-in 2D context (jsdom has none) that records what is drawn: fillRect, strokeRect and fillText, each with
 * the fill color in force. measureText says every character is 8px wide per 8px of font size.
 */
export function recordingContext(): { ctx: CanvasRenderingContext2D; calls: DrawCall[] } {
  const calls: DrawCall[] = [];
  const state = { fillStyle: '', font: '8px monospace' };
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({ op, args, fillStyle: state.fillStyle });
    };
  const ctx = {
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(value: string) {
      state.fillStyle = value;
    },
    get font() {
      return state.font;
    },
    set font(value: string) {
      state.font = value;
    },
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: 'start',
    textBaseline: 'alphabetic',
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    fillText: record('fillText'),
    setTransform: record('setTransform'),
    measureText: (text: string) => ({ width: text.length * Number.parseInt(state.font, 10) }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

/** Every canvas in the test gets one recording context; returns the calls and an undo. */
export function stubCanvas(): { calls: DrawCall[]; restore: () => void } {
  const { ctx, calls } = recordingContext();
  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctx) as never);
  return { calls, restore: () => spy.mockRestore() };
}
