import { useEffect, useRef, useState } from 'react';
import { Button, announce } from '@bit-ds/react';

type CopyState = 'idle' | 'copied' | 'failed';

const LABELS: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' };

/** How long "Copied" or "Copy failed" shows before the button reads "Copy" again. Same as CodeBlock's. */
export const COPY_RESET_MS = 2000;

interface CopyButtonProps {
  /** Exactly what lands on the clipboard. */
  text: string;
  /**
   * The button's accessible name while idle, e.g. "Copy import line". Start it with "Copy" so the visible
   * word stays in the name (WCAG 2.5.3). Pages with many Copy buttons need it to tell them apart.
   */
  label: string;
}

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
 * A small Copy button for gallery chips and table rows (CodeBlock has its own). "Copied" or "Copy failed"
 * shows for two seconds, and announce() tells screen readers.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
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
    const ok = await writeClipboard(text);
    if (!mounted.current) return;
    clearTimeout(timer.current);
    const next = ok ? 'copied' : 'failed';
    setState(next);
    announce(LABELS[next]);
    timer.current = setTimeout(() => setState('idle'), COPY_RESET_MS);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      color={state === 'failed' ? 'danger' : 'neutral'}
      aria-label={state === 'idle' ? label : undefined}
      onClick={() => void copy()}
    >
      {LABELS[state]}
    </Button>
  );
}
