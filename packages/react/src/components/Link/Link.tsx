import { forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { toClasses } from '../../system/toClasses';
import { InlineText } from '../../system/inlineText';
import { createSlot } from '../../system/Slot';

/** Only these two pass text contrast in both modes, so Link has no full color axis. */
const colors = ['primary', 'neutral'] as const;
const Slot = createSlot('Link');

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
  /** `primary` reads the link tokens (and a visited color); `neutral` is body text. Class: `bit-{color}`. */
  color?: (typeof colors)[number];
  /** Render the single child (a router link, say) with Link's classes and props merged in, instead of an `<a>`. */
  asChild?: boolean;
}

/** A bold, underlined text link. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { color = 'primary', asChild = false, className, ...rest },
  ref,
) {
  const classes = toClasses('link', [{ name: 'color', allowed: colors, value: color }], className);
  // A Text in a link renders a span, so the link stays inline in its sentence.
  return (
    <InlineText.Provider value>
      {asChild ? <Slot ref={ref} className={classes} {...rest} /> : <a ref={ref} className={classes} {...rest} />}
    </InlineText.Provider>
  );
});
