import type { ReactNode } from 'react';
import { Heading, Stack } from '@bit-ds/react';

export interface SectionLink {
  /** The h2's id: what a section-bar link scrolls to and focuses. */
  id: string;
  /** The h2's text, and the section-bar link's text. */
  title: string;
}

interface PageSectionProps extends SectionLink {
  children: ReactNode;
}

/** A page section named by its h2. The h2 takes tabIndex -1, so a section bar can move focus to it. */
export function PageSection({ id, title, children }: PageSectionProps) {
  return (
    <section aria-labelledby={id}>
      <Stack gap={12}>
        <Heading level={2} id={id} tabIndex={-1}>
          {title}
        </Heading>
        {children}
      </Stack>
    </section>
  );
}
