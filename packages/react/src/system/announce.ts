/** The id of the one live region every bit announcement uses. */
export const ANNOUNCER_ID = 'bit-announcer';

/** How long the region stays empty before the new text goes in, so a repeated message is re-read. */
const CLEAR_MS = 50;

let pending: ReturnType<typeof setTimeout> | undefined;

/** Hidden from sight, still read by screen readers. Inline, so bit ships no utility class. */
const HIDDEN_STYLE = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: '0',
} as const;

/** Inside an open modal everything else is inert, so the region has to live in the modal. */
function host(): HTMLElement {
  const modal = document.activeElement?.closest<HTMLElement>('dialog[open], [aria-modal="true"]');
  return modal ?? document.body;
}

function region(): HTMLElement {
  const target = host();
  const existing = document.getElementById(ANNOUNCER_ID);
  const created = existing ?? document.createElement('div');
  if (!existing) {
    created.id = ANNOUNCER_ID;
    created.setAttribute('role', 'status');
    created.setAttribute('aria-live', 'polite');
    Object.assign(created.style, HIDDEN_STYLE);
  }
  // append moves the node, so one region follows the focus in and out of a modal.
  if (created.parentElement !== target) target.append(created);
  return created;
}

/**
 * Says `message` to screen readers through one shared, visually hidden live region. Many Copy buttons
 * on a page share it, so there is never a pile of live regions. While a modal holds focus the region
 * moves into the modal, which keeps it audible. When calls overlap, the last message wins. Safe to call during server rendering.
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
