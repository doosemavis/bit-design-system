import { IconButton, useCopyToClipboard } from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import { copyText } from './iconCatalog';
import type { CopyFormat } from './iconCatalog';

const TIP = { idle: undefined, copied: 'Copied', failed: 'Copy failed' } as const;
const COLOR = { idle: 'neutral', copied: 'success', failed: 'danger' } as const;

/** One icon as a 56px button: its name in a tooltip, and a click copies its code (board tiles-v2). */
export function IconTile({ icon, filled, format }: { icon: IconData; filled: boolean; format: CopyFormat }) {
  const { state, copy } = useCopyToClipboard(copyText(icon, format, filled));
  return (
    <IconButton
      icon={icon}
      iconFilled={filled}
      label={`Copy ${icon.name}`}
      tooltip={TIP[state] ?? icon.name}
      color={COLOR[state]}
      variant={state === 'idle' ? 'outline' : 'solid'}
      size="lg"
      onClick={() => void copy()}
    />
  );
}
