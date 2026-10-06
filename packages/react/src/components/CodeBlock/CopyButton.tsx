import { element } from '../../system/toClasses';
import { useCopyToClipboard } from '../../system/useCopyToClipboard';

/** CodeBlock's Copy button. It says the result through announce(). `name` is what is copied. Internal. */
export function CopyButton({ code, name }: { code: string; name: string }) {
  const { state, label, copy } = useCopyToClipboard(code);
  return (
    <button
      type="button"
      className={element('code', 'copy')}
      data-state={state}
      aria-label={state === 'idle' ? `Copy ${name}` : undefined}
      onClick={() => void copy()}
    >
      {label}
    </button>
  );
}
