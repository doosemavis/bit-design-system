/**
 * jsdom has no matchMedia. Install one where only `query` matches (every other query, such as the color
 * mode's prefers-color-scheme, stays false), and return a function that removes it again.
 */
export function stubMatchMedia(query: string): () => void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (asked: string) => ({
      matches: asked === query,
      media: asked,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return () => {
    Reflect.deleteProperty(window, 'matchMedia');
  };
}
