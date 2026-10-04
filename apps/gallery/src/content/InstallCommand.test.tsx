import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { InstallCommand } from './InstallCommand';
import { INSTALL_COMMANDS, PACKAGE_MANAGER_STORAGE_KEY, readPackageManager, writePackageManager } from './install';
import { expectNoA11yViolations } from '../test/a11y';

const command = () => screen.getByRole('region', { name: 'Install command' }).textContent;

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('install commands', () => {
  it('are pnpm add, npm install and yarn add, for @bit-ds/react', () => {
    expect(INSTALL_COMMANDS).toEqual({
      pnpm: 'pnpm add @bit-ds/react',
      npm: 'npm install @bit-ds/react',
      yarn: 'yarn add @bit-ds/react',
    });
    expect(PACKAGE_MANAGER_STORAGE_KEY).toBe('bit-gallery-package-manager');
  });

  it('nothing stored, an unknown value, or blocked storage all read as pnpm', () => {
    expect(readPackageManager()).toBe('pnpm');
    localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, 'bun');
    expect(readPackageManager()).toBe('pnpm');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readPackageManager()).toBe('pnpm');
  });

  it('a blocked write is silent', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writePackageManager('yarn')).not.toThrow();
  });
});

describe('InstallCommand', () => {
  it('shows pnpm by default, in a shell CodeBlock with the switcher in its bar, left of Copy', async () => {
    const { container } = render(<InstallCommand />);
    expect(command()).toBe('pnpm add @bit-ds/react');
    expect(screen.getByRole('radio', { name: 'pnpm' })).toBeChecked();
    const bar = container.querySelector('.bit-code__bar')!;
    expect(bar.querySelector('.bit-code__actions')).toContainElement(screen.getByRole('group', { name: 'Package manager' }));
    expect(bar.querySelector('.bit-code__actions + .bit-code__copy')).not.toBeNull();
    expect(container.querySelector('.bit-segmented-control')).toHaveClass('bit-sm');
    await expectNoA11yViolations(container);
  });

  it('each manager shows its command', async () => {
    render(<InstallCommand />);
    await userEvent.click(screen.getByRole('radio', { name: 'npm' }));
    expect(command()).toBe('npm install @bit-ds/react');
    await userEvent.click(screen.getByRole('radio', { name: 'yarn' }));
    expect(command()).toBe('yarn add @bit-ds/react');
  });

  it('Copy copies the selected command', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<InstallCommand />);
    await userEvent.click(screen.getByRole('radio', { name: 'yarn' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy Install command' }));
    });
    expect(writeText).toHaveBeenCalledWith('yarn add @bit-ds/react');
  });

  it('the pick persists and is restored on the next visit', async () => {
    const first = render(<InstallCommand />);
    await userEvent.click(screen.getByRole('radio', { name: 'npm' }));
    expect(localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY)).toBe('npm');
    first.unmount();
    render(<InstallCommand />);
    expect(screen.getByRole('radio', { name: 'npm' })).toBeChecked();
    expect(command()).toBe('npm install @bit-ds/react');
  });

  it('blocked storage falls back to pnpm and the switcher still works for the visit', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    render(<InstallCommand />);
    expect(command()).toBe('pnpm add @bit-ds/react');
    await userEvent.click(screen.getByRole('radio', { name: 'yarn' }));
    expect(command()).toBe('yarn add @bit-ds/react');
  });

  it('an unknown stored value falls back to pnpm', () => {
    localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, 'bun');
    render(<InstallCommand />);
    expect(command()).toBe('pnpm add @bit-ds/react');
  });
});
