import { useEffect } from 'react';

/** The site's own title: index.html's <title>, kept on the home page. */
export const SITE_TITLE = 'bit — component gallery';

/** "Button · bit" for a page, the site's title for home (null). */
export function pageTitle(name: string | null): string {
  return name ? `${name} · bit` : SITE_TITLE;
}

/**
 * Names the browser tab (and the history entry, and a bookmark) after the page. PageHeader calls it with the
 * page's h1, so every page with a header gets it; pages without one call it themselves.
 */
export function useDocumentTitle(name: string | null): void {
  useEffect(() => {
    document.title = pageTitle(name);
  }, [name]);
}
