import { cloneElement, useEffect, useRef, useState } from 'react';
import type { ReactElement, RefAttributes } from 'react';
import { Button } from '@bit-ds/react';
import type { AlertProps } from '@bit-ds/react';

type AlertElement = ReactElement<AlertProps & RefAttributes<HTMLDivElement>>;

/**
 * The Alert page's dismissible preview: the Alert the controls built, with onDismiss. The × hides it and leaves a
 * "Show alert again" Button. Focus follows, after a click only: to that Button on dismiss, and back to the × on show.
 */
export function AlertDemo({ alert }: { alert: AlertElement }) {
  const [shown, setShown] = useState(true);
  const [touched, setTouched] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!touched) return;
    const target = shown ? alertRef.current?.querySelector<HTMLElement>('.bit-alert__dismiss') : againRef.current;
    target?.focus();
  }, [shown, touched]);

  const toggle = (next: boolean) => () => {
    setTouched(true);
    setShown(next);
  };

  return shown ? (
    cloneElement(alert, { ref: alertRef, onDismiss: toggle(false) })
  ) : (
    <Button ref={againRef} color="neutral" variant="outline" size="sm" onClick={toggle(true)}>
      Show alert again
    </Button>
  );
}
