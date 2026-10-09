import { Code, Tooltip, useCopyToClipboard } from '@bit-ds/react';

interface CopyChipProps {
  /** What the chip shows, and exactly what lands on the clipboard: a hex value or a token name. */
  text: string;
}

/**
 * A Code chip you can click to copy its own text. The hint says "Copy" on hover and focus, then "Copied" or
 * "Copy failed" for two seconds; the chip's text never changes, so nothing around it moves. The name,
 * "Copy <text>", already says what the hint says, so the hint is not added as a description.
 */
export function CopyChip({ text }: CopyChipProps) {
  const { label, copy } = useCopyToClipboard(text);
  return (
    <Tooltip content={label} describe={false}>
      {/* eslint-disable-next-line no-restricted-syntax -- a bare button around a Code chip: any Button variant adds control height and padding */}
      <button type="button" className="gallery-copy-chip" aria-label={`Copy ${text}`} onClick={() => void copy()}>
        <Code>{text}</Code>
      </button>
    </Tooltip>
  );
}
