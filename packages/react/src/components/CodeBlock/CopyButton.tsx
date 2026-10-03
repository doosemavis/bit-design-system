import { useEffect, useRef, useState } from 'react';
import { element } from '../../system/toClasses';

type CopyState = 'idle' | 'copied' | 'failed';

const LABELS: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' };

/** How long "Copied" or "Copy failed" shows before the button reads "Copy" again. */
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

/** CodeBlock's Copy button and the visually hidden status line that announces the result. Internal. */
export function CopyButton({ code }: { code: string }) {
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

  async function copy() {
    const ok = await writeClipboard(code);
    // Unmounted while the clipboard was busy: start no timer that would outlive the component.
    if (!mounted.current) return;
    clearTimeout(timer.current);
    setState(ok ? 'copied' : 'failed');
    timer.current = setTimeout(() => setState('idle'), COPY_RESET_MS);
  }

  return (
    <>
      <button type="button" className={element('code', 'copy')} data-state={state} onClick={() => void copy()}>
        {LABELS[state]}
      </button>
      <span className={element('code', 'status')} aria-live="polite">
        {state === 'idle' ? '' : LABELS[state]}
      </span>
    </>
  );
}
