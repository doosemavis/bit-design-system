import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { lengthOf } from './characterCount';

type TextValue = string | number | readonly string[] | undefined;

/**
 * How many characters the textarea holds, for its count. Controlled, it is the value prop's length. Uncontrolled,
 * it starts at defaultValue's, follows typing through `track`, and follows a form reset, which changes the value
 * without an input event. Only listens while `enabled` (showCount is on). Turning it on reads the box once, since
 * outside a Field that also wraps the box anew, which puts it back to defaultValue.
 */
export function useTextLength(
  box: RefObject<HTMLTextAreaElement | null>,
  value: TextValue,
  defaultValue: TextValue,
  enabled: boolean,
): [length: number, track: (length: number) => void] {
  const [typed, setTyped] = useState(() => lengthOf(defaultValue));

  useEffect(() => {
    if (!enabled || !box.current) return undefined;
    setTyped(box.current.value.length);
    const form = box.current.form;
    if (!form) return undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;
    // The reset event fires before the form puts the values back, so read the value once it has.
    const onReset = () => {
      clearTimeout(pending);
      pending = setTimeout(() => setTyped(box.current?.value.length ?? 0));
    };
    form.addEventListener('reset', onReset);
    return () => {
      form.removeEventListener('reset', onReset);
      clearTimeout(pending);
    };
  }, [box, enabled]);

  return [value === undefined ? typed : lengthOf(value), setTyped];
}
