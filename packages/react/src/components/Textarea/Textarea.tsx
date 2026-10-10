import { forwardRef, useId, useMemo, useRef } from 'react';
import type { ChangeEvent, TextareaHTMLAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { announce } from '../../system/announce';
import { composeRefs } from '../../system/Slot';
import { useFieldControl, useInsideField } from '../Field/FieldContext';
import { characters, countState, countText, crossing, limitOf } from './characterCount';
import { useTextLength } from './useTextLength';

const sizes = SIZES;

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color'> {
  /** Text size and side padding. Class: `bit-{size}`. */
  size?: Size;
  /** Marks the value wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
  /**
   * Shows a live character count under the box: "136 / 140" with `maxLength`, "42 characters" without. Inside a
   * Field it sits on the hint's row, at the right; elsewhere the box and the count share a `div.bit-textarea__wrap`,
   * so the count stays under the box's end in any layout. Class: `bit-textarea__count`.
   */
  showCount?: boolean;
}

/**
 * A native multi-line text box, recessed into the page like Input. It is `rows` lines tall (default 3) and can be
 * dragged taller, never wider. Inside a Field it takes the Field's id, hint, error and required.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = 'md', invalid, rows = 3, showCount = false, className, onChange, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  const insideField = useInsideField();
  const box = useRef<HTMLTextAreaElement>(null);
  const setRef = useMemo(() => composeRefs(ref, box), [ref]);
  const [length, track] = useTextLength(box, rest.value, rest.defaultValue, showCount);
  const limit = showCount ? limitOf(rest.maxLength) : undefined;
  const limitId = `${useId()}-limit`;
  const describedBy = [wired['aria-describedby'], limit === undefined ? null : limitId].filter(Boolean).join(' ');

  const change = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const message = showCount ? crossing(length, event.currentTarget.value.length, limit) : null;
    if (message) announce(message);
    // Tracked even while the count is off, so turning showCount on later starts from the real length.
    track(event.currentTarget.value.length);
    onChange?.(event);
  };

  const textarea = (
    <textarea
      ref={setRef}
      rows={rows}
      className={toClasses('textarea', [{ name: 'size', allowed: sizes, value: size }], className)}
      onChange={change}
      {...dropLegacyColor(rest)}
      {...wired}
      aria-describedby={describedBy || undefined}
    />
  );
  if (!showCount) return textarea;

  // The count is for the eye. Screen readers hear the limit in the description, and the thresholds through announce().
  const count = (
    <div className={element('textarea', 'count')} data-state={countState(length, limit)} aria-hidden="true">
      {countText(length, limit)}
      {limit === undefined ? null : (
        <span id={limitId} hidden>
          {`Up to ${characters(limit)}`}
        </span>
      )}
    </div>
  );
  // Inside a Field both are its children, so its grid can put the count on the hint's row.
  return insideField ? (
    <>
      {textarea}
      {count}
    </>
  ) : (
    <div className={element('textarea', 'wrap')}>
      {textarea}
      {count}
    </div>
  );
});
