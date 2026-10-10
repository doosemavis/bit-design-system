import type { ReactNode } from 'react';
import { Heading, Stack } from '@bit-ds/react';

export interface SectionLink {
  /** The h2's id: what a section-bar link scrolls to and focuses. */
  id: string;
  /** The h2's text, and the section-bar link's text. */
  title: string;
}

interface PageSectionProps extends SectionLink {
  /** A short note on the right of the heading row, such as the Props tip. It wraps under the heading when narrow. */
  aside?: ReactNode;
  children: ReactNode;
}

/** A page section named by its h2. The h2 takes tabIndex -1, so a section bar can move focus to it. */
export function PageSection({ id, title, aside, children }: PageSectionProps) {
  const heading = (
    <Heading id={id} tabIndex={-1}>
      {title}
    </Heading>
  );
  return (
    <section aria-labelledby={id}>
      <Stack gap={12}>
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
    </section>
  );
}
