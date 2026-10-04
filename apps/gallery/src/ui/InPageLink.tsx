import { Link } from '@bit-ds/react';
import type { LinkProps } from '@bit-ds/react';
import { scrollToSection } from './scrollToSection';

export interface InPageLinkProps extends Omit<LinkProps, 'href' | 'onClick' | 'asChild'> {
  /** The id of the element on this page to scroll to and focus. */
  targetId: string;
}

/**
 * A bit Link to a spot on the current page. It scrolls there and moves focus, and never changes the
 * route. The href stays `#id` so the link still reads as a link and shows where it goes.
 */
export function InPageLink({ targetId, ...rest }: InPageLinkProps) {
  return (
    <Link
      {...rest}
      href={`#${targetId}`}
      onClick={(event) => {
        event.preventDefault();
        scrollToSection(targetId);
      }}
    />
  );
}
