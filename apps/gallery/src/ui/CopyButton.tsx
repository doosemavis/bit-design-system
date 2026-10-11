import { useRef, useState } from 'react';
import { announce, Button, useCopyToClipboard } from '@bit-ds/react';
import { clipboardKeys, selectText } from './keys';

interface CopyButtonProps {
  /** Exactly what lands on the clipboard. */
  text: string;
  /**
   * The button's accessible name while idle, e.g. "Copy import line". Start it with "Copy" so the visible
   * word stays in the name (WCAG 2.5.3). Pages with many Copy buttons need it to tell them apart.
   */
  label: string;
}

/** The element beside the button that shows the same text (the import chip next to its Copy), if there is one. */
function shownCopyOf(button: HTMLElement, text: string): Element | undefined {
  const siblings = button.parentElement ? [...button.parentElement.children] : [];
  return siblings.find((element) => element !== button && element.textContent === text);
}

/**
 * A small Copy button for gallery chips and table rows (CodeBlock has its own). "Copied" or "Copy failed"
 * shows for two seconds, and announce() tells screen readers; useCopyToClipboard does both. If the clipboard
 * refuses and the same text shows beside the button, that text is selected instead, and the button and
 * announcement say to copy it with the system keys.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
  const { state, label: visible, copy } = useCopyToClipboard(text);
  const [selected, setSelected] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const keys = clipboardKeys();

  async function onClick() {
    setSelected(false);
    if (await copy()) return;
    const shown = ref.current ? shownCopyOf(ref.current, text) : undefined;
    if (!shown) return;
    selectText(shown);
    setSelected(true);
    announce(`Copy failed. The text is selected: press ${keys.spoken} to copy it.`);
  }

  return (
    <Button
      ref={ref}
      size="sm"
      variant="outline"
      color={state === 'failed' ? 'danger' : 'neutral'}
      aria-label={state === 'idle' ? label : undefined}
      onClick={() => void onClick()}
    >
      {state === 'failed' && selected ? `Selected: press ${keys.shown}` : visible}
    </Button>
  );
}
