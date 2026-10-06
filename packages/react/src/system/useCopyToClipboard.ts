import { useCallback, useEffect, useRef, useState } from 'react';
import { announce } from './announce';

/** Where a Copy control is: ready, just copied, or just failed. */
export type CopyState = 'idle' | 'copied' | 'failed';

const LABELS = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' } as const satisfies Record<CopyState, string>;

/** How long "Copied" or "Copy failed" shows before the state is "idle" again. Internal. */
export const COPY_RESET_MS = 2000;

/** True when the text reached the clipboard. A missing or refusing clipboard is false, never a throw. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy `text` to the clipboard from your own button. `copy()` writes it, shows "Copied" or "Copy failed" for
 * two seconds, says the result with announce(), and resolves true if the text reached the clipboard. It never
 * rejects, and it always copies the latest `text`. Copying again restarts the two seconds. Render `label` as
 * the button's text.
 */
export function useCopyToClipboard(text: string): {
  state: CopyState;
  label: (typeof LABELS)[CopyState];
  copy: () => Promise<boolean>;
} {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    const ok = await writeClipboard(text);
    // Unmounted while the clipboard was busy: start no timer that would outlive the component.
    if (!mounted.current) return ok;
    clearTimeout(timer.current);
    const next = ok ? 'copied' : 'failed';
    setState(next);
    announce(LABELS[next]);
    timer.current = setTimeout(() => setState('idle'), COPY_RESET_MS);
    return ok;
  }, [text]);

  return { state, label: LABELS[state], copy };
}
