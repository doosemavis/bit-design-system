import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { alert } from './alert';
import { defaultState } from '../engine/state';
import { buildProps } from '../engine/buildProps';
import { isInteractive } from '../engine/childSpecs';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { CODE_FORMATS } from '../code/codeFormats';

const dismissible = { ...defaultState(alert), dismissible: true };

describe('Alert page: dismissible', () => {
  it('is off by default: no ×, plain code, and the HTML tab stays', () => {
    render(renderManifest(alert, defaultState(alert)));
    expect(screen.queryByRole('button')).toBeNull();
    expect(toJsx(alert, defaultState(alert))).toBe(
      "import { Alert } from '@bit-ds/react';\n\n<Alert title=\"Heads up\">Your changes were saved.</Alert>",
    );
    expect(isInteractive(alert, defaultState(alert))).toBe(false);
    expect(CODE_FORMATS.filter((f) => f.available(alert, defaultState(alert))).map((f) => f.id)).toContain('html');
  });

  it('dismissible is a page control only: never passed or printed as a prop', () => {
    expect(buildProps(alert, dismissible)).not.toHaveProperty('dismissible');
    expect(toJsx(alert, dismissible)).not.toMatch(/dismissible/);
  });

  it('prints useState and onDismiss={() => setShown(false)}, and shows the Alert only while shown', () => {
    expect(toJsx(alert, dismissible)).toBe(
      [
        "import { useState } from 'react';\nimport { Alert } from '@bit-ds/react';",
        'const [shown, setShown] = useState(true);',
        [
          '<>',
          '  {shown && (',
          '    <Alert onDismiss={() => setShown(false)} title="Heads up">Your changes were saved.</Alert>',
          '  )}',
          '</>',
        ].join('\n'),
      ].join('\n\n'),
    );
  });

  it('the full file declares the state inside Example', () => {
    expect(fullFile(toJsx(alert, dismissible))).toContain('export function Example() {\n  const [shown, setShown] = useState(true);');
  });

  it('is interactive while dismissible: no HTML tab', () => {
    expect(isInteractive(alert, { dismissible: true })).toBe(true);
    expect(CODE_FORMATS.filter((f) => f.available(alert, dismissible)).map((f) => f.id)).not.toContain('html');
  });

  it('the preview shows the ×; clicking it hides the Alert and focuses "Show alert again", which brings it back', async () => {
    const user = userEvent.setup();
    render(<StrictMode>{renderManifest(alert, dismissible)}</StrictMode>);
    expect(document.activeElement).toBe(document.body);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).toBeNull();
    const again = screen.getByRole('button', { name: 'Show alert again' });
    expect(again.className).toBe('bit-button bit-neutral bit-outline bit-sm');
    expect(again).toHaveFocus();
    await user.click(again);
    expect(screen.getByRole('status')).toHaveTextContent('Your changes were saved.');
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
  });

  it('documents onDismiss and dismissLabel', () => {
    const props = Object.fromEntries(alert.docs.props.map((p) => [p.name, p]));
    expect(props.onDismiss?.type).toBe('() => void');
    expect(props.dismissLabel).toMatchObject({ type: 'string', default: "'Dismiss'" });
    expect(alert.docs.a11y.join('\n')).toMatch(/move focus somewhere sensible/);
  });
});
