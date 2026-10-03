import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SPACE_STEPS } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const ELEMENTS = ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'span'] as const;

export type BoxElement = (typeof ELEMENTS)[number];

/** 0, then the space scale (4, 8, 12, 16, 24, 32, 48, 64). */
const SPACES = [0, ...SPACE_STEPS] as const;

type Space = (typeof SPACES)[number];

/** Each spacing prop and the short data attribute it renders. The prop names are the public API. */
const ATTRIBUTES = {
  padding: 'p',
  paddingX: 'px',
  paddingY: 'py',
  paddingTop: 'pt',
  paddingRight: 'pr',
  paddingBottom: 'pb',
  paddingLeft: 'pl',
  margin: 'm',
  marginX: 'mx',
  marginY: 'my',
  marginTop: 'mt',
  marginRight: 'mr',
  marginBottom: 'mb',
  marginLeft: 'ml',
} as const;

type SpacingProp = keyof typeof ATTRIBUTES;

const SPACING_PROPS = Object.keys(ATTRIBUTES) as SpacingProp[];

/**
 * Every spacing prop is 0 or a px value on the space scale, rendered as a short data attribute that reads
 * `--bit-space-{n}px`. When props overlap, the most specific wins: a side beats an axis beats all four.
 */
export interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /**
   * Which element to render. Default `div`. `span` is inline: vertical margins (marginY/Top/Bottom) don't apply and
   * vertical padding doesn't move layout.
   */
  as?: BoxElement;
  /** All four sides. `data-p`. */
  padding?: Space;
  /** Left and right. `data-px`. */
  paddingX?: Space;
  /** Top and bottom. `data-py`. */
  paddingY?: Space;
  /** `data-pt`. */
  paddingTop?: Space;
  /** `data-pr`. */
  paddingRight?: Space;
  /** `data-pb`. */
  paddingBottom?: Space;
  /** `data-pl`. */
  paddingLeft?: Space;
  /** All four sides. `data-m`. */
  margin?: Space;
  /** Left and right. `data-mx`. */
  marginX?: Space;
  /** Top and bottom. `data-my`. */
  marginY?: Space;
  /** `data-mt`. */
  marginTop?: Space;
  /** `data-mr`. */
  marginRight?: Space;
  /** `data-mb`. */
  marginBottom?: Space;
  /** `data-ml`. */
  marginLeft?: Space;
}

/** Padding and margin on the space scale, for one element. Sets nothing else: no colors, borders or shadows. */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box({ as = 'div', className, ...props }, ref) {
  const spacing = Object.fromEntries(
    SPACING_PROPS.map((prop) => [
      `data-${ATTRIBUTES[prop]}`,
      dataValue('box', { name: prop, allowed: SPACES, value: props[prop] }),
    ]),
  );
  const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !SPACING_PROPS.includes(key as SpacingProp)));
  const tag = dataValue('box', { name: 'as', allowed: ELEMENTS, value: as }) ?? 'div';
  return createElement(tag, { ref, className: toClasses('box', [], className), ...spacing, ...dropLegacyColor(rest) });
});
