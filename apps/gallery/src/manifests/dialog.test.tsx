import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dialog } from './dialog';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { CODE_FORMATS } from '../code/codeFormats';
import type { ControlState } from './types';

describe('Dialog page', () => {
  it('previews an "Open dialog" Button; the dialog mounts on the first open, so its title adds no heading before', async () => {
    render(renderManifest(dialog, defaultState(dialog), { sample: true }));
    expect(document.querySelector('dialog')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    // Open, the title is the dialog's own h2 and names it, as in any Dialog.
    const box = document.querySelector('dialog')!;
    expect(box.hasAttribute('open')).toBe(true);
    const title = within(box).getByRole('heading', { level: 2, name: 'Save changes?' });
    expect(box).toHaveAttribute('aria-labelledby', title.id);
  });

  it('prints useState, the trigger Button and the Dialog with its parts', () => {
    expect(toJsx(dialog, defaultState(dialog))).toBe(
      [
        "import { useState } from 'react';\nimport { Button, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader } from '@bit-ds/react';",
        'const [open, setOpen] = useState(false);',
        [
          '<>',
          '  <Button onClick={() => setOpen(true)}>Open dialog</Button>',
          '  <Dialog open={open} onOpenChange={setOpen}>',
          '    <DialogHeader>Save changes?</DialogHeader>',
          '    <DialogBody>Your edits will be saved to the project.</DialogBody>',
          '    <DialogFooter>',
          '      <DialogClose data-autofocus={true}>Cancel</DialogClose>',
          '      <DialogClose variant="solid" color="primary">Save</DialogClose>',
          '    </DialogFooter>',
          '  </Dialog>',
          '</>',
        ].join('\n'),
      ].join('\n\n'),
    );
  });

  it('the Alert preset prints alert and a danger Delete', () => {
    const alert = { ...defaultState(dialog), ...dialog.presets!.find((p) => p.label === 'Alert')!.state } as ControlState;
    const code = toJsx(dialog, alert);
    expect(code).toContain('<Dialog open={open} onOpenChange={setOpen} alert>');
    expect(code).toContain('<DialogHeader>Delete report?</DialogHeader>');
    expect(code).toContain('<DialogClose variant="solid" color="danger">Delete</DialogClose>');
  });

  it('the full file declares the state inside Example', () => {
    expect(fullFile(toJsx(dialog, defaultState(dialog)))).toContain('export function Example() {\n  const [open, setOpen] = useState(false);');
  });

  it('is interactive: no HTML tab', () => {
    expect(CODE_FORMATS.filter((f) => f.available(dialog, defaultState(dialog))).map((f) => f.id)).not.toContain('html');
  });

  it('clicking Open dialog opens the real Dialog', async () => {
    const user = userEvent.setup();
    render(renderManifest(dialog, defaultState(dialog)));
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(true);
  });

  it('Save closes the previewed Dialog', async () => {
    const user = userEvent.setup();
    render(renderManifest(dialog, defaultState(dialog)));
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false));
  });
});
