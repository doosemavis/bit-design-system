import type { ReactElement, ReactNode } from 'react';

/** A non-instance piece of a Final scene: always inert, so only the instance is live. */
export function ScenePiece({ children }: { children: ReactNode }): ReactElement {
  return (
    <div inert data-scene-piece="">
      {children}
    </div>
  );
}
