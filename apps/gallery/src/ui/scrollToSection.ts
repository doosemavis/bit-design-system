/**
 * Scroll an element on this page into view and move focus to it, leaving the URL alone. Under the hash
 * router an `href="#id"` would become the route `/id`, so the skip link and the section bars call this
 * instead of following their href. A target that isn't focusable gets `tabIndex = -1`, which lets it take
 * focus without joining the Tab order. Returns false when no element has that id.
 */
export function scrollToSection(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
  // jsdom has no scrollIntoView; browsers all do.
  target.scrollIntoView?.({ block: 'start' });
  target.focus({ preventScroll: true });
  return true;
}
