import { cloneElement, useState } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import type { NavbarProps } from '@bit-ds/react';

/** How many Navbar samples have mounted, so each one's nav has its own name. */
let samples = 0;

/**
 * A Navbar sample on the page (the preview, a Variants row, a tile): its links point at an imaginary app's pages,
 * so a click on one stays here (the folded Menu still closes). Several samples share a page, so each nav gets
 * its own name ("Main, sample 2"), as landmarks must.
 */
export function NavbarDemo({ navbar }: { navbar: ReactElement<NavbarProps> }) {
  const [number] = useState(() => (samples += 1));
  const stay = (event: MouseEvent) => {
    if ((event.target as Element).closest('a')) event.preventDefault();
  };
  const label = `${navbar.props.label ?? 'Main'}, sample ${number}`;
  // Full width: a Navbar takes its container's width, so a wrapper shrunk to fit (the centered preview) would
  // fold it into its Menu and squeeze even that.
  return (
    <div className="gallery-navbar-demo" onClickCapture={stay}>
      {cloneElement(navbar, { label })}
    </div>
  );
}
