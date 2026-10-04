import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../buildVersion', () => ({ BUILD_VERSION: '1.0.0-rc.1' }));

import { renderAt } from '../test/renderRoute';

describe('a pre-release build', () => {
  it('still renders the header, with the raw version as its line', async () => {
    renderAt('/');
    const header = await screen.findByRole('banner');
    const picker = within(header).getByLabelText('Version');
    expect(picker).toHaveValue('1.0.0-rc.1');
    expect(screen.queryByText(/You're viewing the docs/)).toBeNull();
  });
});
