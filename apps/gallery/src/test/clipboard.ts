/**
 * jsdom has no clipboard. Install one whose writeText is the given function (or none at all, to test the
 * no-clipboard path). Each test file removes it again in afterEach.
 */
export function stubClipboard(writeText?: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
}
