/** The id of the one live region every bit announcement uses. */
export const ANNOUNCER_ID = 'bit-announcer';

/** How long the region stays empty before the new text goes in, so a repeated message is re-read. */
const CLEAR_MS = 50;

let pending: ReturnType<typeof setTimeout> | undefined;

function region(): HTMLElement {
  const existing = document.getElementById(ANNOUNCER_ID);
  if (existing) return existing;
  const created = document.createElement('div');
  created.id = ANNOUNCER_ID;
  created.className = 'bit-visually-hidden';
  created.setAttribute('role', 'status');
  created.setAttribute('aria-live', 'polite');
  document.body.append(created);
  return created;
}

/**
 * Says `message` to screen readers through one shared, visually hidden live region. Many Copy buttons
 * on a page share it, so there is never a pile of live regions. Safe to call during server rendering.
 */
export function announce(message: string): void {
  if (typeof document === 'undefined') return;
  const target = region();
  target.textContent = '';
  clearTimeout(pending);
  pending = setTimeout(() => {
    target.textContent = message;
  }, CLEAR_MS);
}
