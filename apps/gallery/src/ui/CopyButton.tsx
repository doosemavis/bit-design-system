import { Button, useCopyToClipboard } from '@bit-ds/react';

interface CopyButtonProps {
  /** Exactly what lands on the clipboard. */
  text: string;
  /**
   * The button's accessible name while idle, e.g. "Copy import line". Start it with "Copy" so the visible
   * word stays in the name (WCAG 2.5.3). Pages with many Copy buttons need it to tell them apart.
   */
  label: string;
}

/**
 * A small Copy button for gallery chips and table rows (CodeBlock has its own). "Copied" or "Copy failed"
 * shows for two seconds, and announce() tells screen readers; useCopyToClipboard does both.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
  const { state, label: visible, copy } = useCopyToClipboard(text);
  return (
    <Button
      size="sm"
      variant="outline"
      color={state === 'failed' ? 'danger' : 'neutral'}
      aria-label={state === 'idle' ? label : undefined}
      onClick={() => void copy()}
    >
      {visible}
    </Button>
  );
}
