import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { element, toClasses, withClassName } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const variants = ['solid', 'outline'] as const;

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** `solid` is a filled surface with a hard shadow; `outline` is a border only. */
  variant?: (typeof variants)[number];
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ variant = 'solid', className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={toClasses('card', [{ name: 'variant', allowed: variants, value: variant }], className)}
      {...dropLegacyColor(rest)}
    />
  );
});

export type CardPartProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'>;

export const CardHeader = forwardRef<HTMLDivElement, CardPartProps>(function CardHeader({ className, ...rest }, ref) {
  return <div ref={ref} className={withClassName(element('card', 'header'), className)} {...dropLegacyColor(rest)} />;
});

export const CardBody = forwardRef<HTMLDivElement, CardPartProps>(function CardBody({ className, ...rest }, ref) {
  return <div ref={ref} className={withClassName(element('card', 'body'), className)} {...dropLegacyColor(rest)} />;
});

export const CardFooter = forwardRef<HTMLDivElement, CardPartProps>(function CardFooter({ className, ...rest }, ref) {
  return <div ref={ref} className={withClassName(element('card', 'footer'), className)} {...dropLegacyColor(rest)} />;
});
