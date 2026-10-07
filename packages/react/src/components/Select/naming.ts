/** The text of `node`, leaving out `skip` and everything inside it. */
function textOutside(node: Node, skip: Node): string {
  if (node === skip) return '';
  if (node.nodeType === Node.TEXT_NODE) return node.textContent!;
  return [...node.childNodes].map((child) => textOutside(child, skip)).join('');
}

/**
 * The text of every <label> that points at the trigger, joined, leaving out the Select itself: a
 * Select wrapped in its label would otherwise fold its value and every option into the name.
 */
export function labelText(trigger: HTMLButtonElement, select: HTMLElement): string {
  return [...trigger.labels]
    .map((label) => textOutside(label, select))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface NameSources {
  ownLabelledBy: string | undefined;
  ownLabel: string | undefined;
  fieldLabelId: string | undefined;
  /** The text of a <label> outside a Field; '' when there is none (or the list is closed). */
  outsideLabel: string;
  triggerId: string | undefined;
}

/**
 * The listbox's name, so it is never unnamed while open: the Select's own aria-labelledby, else its
 * aria-label, else the Field label, else the text of a <label> elsewhere, else the trigger.
 */
export function listboxName(sources: NameSources): { 'aria-label'?: string; 'aria-labelledby'?: string } {
  if (sources.ownLabelledBy !== undefined) return { 'aria-labelledby': sources.ownLabelledBy };
  if (sources.ownLabel !== undefined) return { 'aria-label': sources.ownLabel };
  if (sources.fieldLabelId !== undefined) return { 'aria-labelledby': sources.fieldLabelId };
  if (sources.outsideLabel) return { 'aria-label': sources.outsideLabel };
  return { 'aria-labelledby': sources.triggerId };
}
