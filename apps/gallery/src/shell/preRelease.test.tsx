import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../buildVersion', () => ({ BUILD_VERSION: '1.0.0-rc.1' }));

import { renderAt } from '../test/renderRoute';
import { chosenLabel } from '../test/select';

describe('a pre-release build', () => {
  it('still renders the header, with the raw version as its line', async () => {
    renderAt('/');
    const header = await screen.findByRole('banner');
    const picker = within(header).getByRole('combobox', { name: 'Version' });
    // Options are valued by path (this copy's, the root here), so a raw version never breaks the value:
    // this copy's option is chosen, and the trigger shows it rather than the empty placeholder.
    expect(chosenLabel(picker)).not.toBeNull();
    expect(picker.querySelector('[data-placeholder]')).toBeNull();
    expect(screen.queryByText(/You're viewing the docs/)).toBeNull();
  });
});
