/**
 * jsdom has no clipboard. Install one whose writeText is the given function (or none at all, to test the
 * no-clipboard path), and return a function that removes it again.
 */
export function stubClipboard(writeText?: (text: string) => Promise<void>): () => void {
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
  return () => {
    Reflect.deleteProperty(navigator, 'clipboard');
  };
}
