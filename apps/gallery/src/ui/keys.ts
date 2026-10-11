/** True on Apple platforms, where shortcuts take ⌘ and ⌥; elsewhere Ctrl and Alt. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/** The search shortcut as shown: ⌘K on a Mac, Ctrl K elsewhere (either works everywhere). */
export const searchKeyLabel = (): string => (isApplePlatform() ? '⌘K' : 'Ctrl K');

/** The copy-the-playground-code shortcut as shown: ⌥C on a Mac, Alt C elsewhere. */
export const copyKeyLabel = (): string => (isApplePlatform() ? '⌥C' : 'Alt C');

/** The system copy keys, to copy selected text by hand: shown short, and spelled out for screen readers. */
export const clipboardKeys = (): { shown: string; spoken: string } =>
  isApplePlatform() ? { shown: '⌘C', spoken: 'Command+C' } : { shown: 'Ctrl+C', spoken: 'Ctrl+C' };

/** Puts the selection around an element's text, so the system copy keys copy exactly it. */
export function selectText(element: Element): void {
  const selection = document.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}
