/**
 * Hand a new value to the range input as the browser would: set it, then fire input and change, so React's
 * onChange and any native listener run. Nothing fires when the value is the same. The blocks and the number box
 * move the slider this way, so every change goes through the one input.
 */
export function setInputValue(input: HTMLInputElement, next: number): void {
  const text = String(next);
  if (input.value === text) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
