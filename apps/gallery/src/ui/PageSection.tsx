import type { ReactNode } from 'react';
import { Heading, Stack } from '@bit-ds/react';
import { SectionHead } from './SectionAnchor';

export interface SectionLink {
  /** The h2's id: what a section-bar link scrolls to and focuses. */
  id: string;
  /** The h2's text, and the section-bar link's text. */
  title: string;
}

/**
 * A page section's class, and its title's. gallery.css draws the break between sections (128px, with the page's
 * Stack at gap 64) and the accent bar under each title. Steps and tile groups that are not a
 * PageSection take the same two classes.
 */
export const SECTION_CLASS = 'gallery-section';
export const SECTION_TITLE_CLASS = 'gallery-section-title';

interface PageSectionProps extends SectionLink {
  /** A short note on the right of the heading row, such as the Props tip. It wraps under the heading when narrow. */
  aside?: ReactNode;
  /**
   * A named region (a <section> labelled by its h2). Default true. Turn it off when the section's main content is
   * already a region with the same name, such as a Table labelled like the section: two would be one too many.
   */
  landmark?: boolean;
  children: ReactNode;
}

/**
 * A page section named by its h2. The h2 takes tabIndex -1, so a section bar can move focus to it, and a "#"
 * beside it links straight to the section.
 */
export function PageSection({ id, title, aside, landmark = true, children }: PageSectionProps) {
  const heading = (
    <SectionHead id={id} title={title}>
      <Heading id={id} tabIndex={-1} className={SECTION_TITLE_CLASS}>
        {title}
      </Heading>
    </SectionHead>
  );
  const body = (
    <Stack gap={16}>
      {aside ? (
        <Stack direction="row" justify="between" align="center" gap={8} wrap>
          {heading}
          {aside}
        </Stack>
      ) : (
        heading
      )}
      {children}
    </Stack>
  );
  return landmark ? (
    <section aria-labelledby={id} className={SECTION_CLASS}>
      {body}
    </section>
  ) : (
    <div className={SECTION_CLASS}>{body}</div>
  );
}
