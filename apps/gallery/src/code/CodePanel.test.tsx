import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { CodePanel } from './CodePanel';
import { CODE_FORMATS } from './codeFormats';
import { defaultState } from '../engine/state';
import { button } from '../manifests/button';
import { code as codeManifest } from '../manifests/code';
import { modeToggle } from '../manifests/modeToggle';
import { stack } from '../manifests/stack';
import { codeBlock } from '../manifests/codeBlock';
import { expectNoA11yViolations } from '../test/a11y';
import { stubClipboard } from '../test/clipboard';

const shown = () => screen.getByRole('region', { name: 'Example code' }).textContent;
const formatNames = () =>
  within(screen.getByRole('group', { name: 'Code format' }))
    .getAllByRole('radio')
    .map((radio) => radio.closest('label')!.textContent);

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CodePanel', () => {
  it('starts on Props: the toJsx snippet in a jsx CodeBlock named "Example code"', async () => {
    const { container } = render(<CodePanel manifest={button} state={{ ...defaultState(button), color: 'danger' }} />);
    expect(screen.getByRole('radio', { name: 'Props' })).toBeChecked();
    expect(shown()).toBe("import { Button } from '@bit-ds/react';\n\n<Button color=\"danger\">Save</Button>");
    expect(container.querySelector('.bit-code__block')).toHaveAttribute('data-language', 'jsx');
    await expectNoA11yViolations(container);
  });

  it('className prints the changed axes as classes', async () => {
    render(<CodePanel manifest={button} state={{ ...defaultState(button), color: 'danger', variant: 'outline' }} />);
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    expect(shown()).toBe("import { Button } from '@bit-ds/react';\n\n<Button className=\"bit-danger bit-outline\">Save</Button>");
  });

  it('HTML shows the markup the preview renders, and hides the Full file switch', async () => {
    const { container } = render(<CodePanel manifest={button} state={defaultState(button)} />);
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(shown()).toBe('<button class="bit-button bit-primary bit-solid bit-md" type="button">Save</button>');
    expect(container.querySelector('.bit-code__block')).toHaveAttribute('data-language', 'html');
    expect(screen.queryByRole('switch', { name: 'Full file' })).toBeNull();
  });

  it('Full file wraps Props and className code alike', async () => {
    render(<CodePanel manifest={button} state={{ ...defaultState(button), color: 'danger' }} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Full file' }));
    expect(shown()).toContain("// once per app: skip if already in your entry file\nimport '@bit-ds/react/themes/power-up.css';");
    expect(shown()).toContain('export function Example() {\n  return (\n    <Button color="danger">Save</Button>\n  );\n}');
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    expect(shown()).toContain('    <Button className="bit-danger">Save</Button>\n');
  });

  it('Copy copies whichever mode is showing', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CodePanel manifest={button} state={{ ...defaultState(button), size: 'lg' }} />);
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy Example code' }));
    });
    expect(writeText).toHaveBeenCalledWith("import { Button } from '@bit-ds/react';\n\n<Button className=\"bit-lg\">Save</Button>");
  });

  it.each([
    ['Button (axes, static)', button, ['Props', 'className', 'HTML']],
    ['ModeToggle (an axis, interactive)', modeToggle, ['Props', 'className']],
    ['Code (no axis, static)', codeManifest, ['Props', 'HTML']],
  ] as const)('%s offers %j', (_name, manifest, formats) => {
    render(<CodePanel manifest={manifest} state={defaultState(manifest)} />);
    expect(formatNames()).toEqual(formats);
  });

  it('CodeBlock has no axis and is interactive: only Props is left, so the switch is hidden', () => {
    render(<CodePanel manifest={codeBlock} state={defaultState(codeBlock)} />);
    expect(screen.queryByRole('group', { name: 'Code format' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Full file' })).toBeInTheDocument();
  });

  it('Stack has no axis: no className option', () => {
    render(<CodePanel manifest={stack} state={defaultState(stack)} />);
    expect(formatNames()).toEqual(['Props', 'HTML']);
  });

  it('the switcher lists CODE_FORMATS in order, so a new format is one entry', () => {
    render(<CodePanel manifest={button} state={defaultState(button)} />);
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(CODE_FORMATS.map((f) => f.id));
  });
});
