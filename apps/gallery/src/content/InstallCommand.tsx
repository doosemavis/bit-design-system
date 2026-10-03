import { useState } from 'react';
import { CodeBlock, SegmentedControl } from '@bit-ds/react';
import { INSTALL_COMMANDS, isPackageManager, PACKAGE_MANAGERS, readPackageManager, writePackageManager } from './install';
import type { PackageManager } from './install';

const OPTIONS = PACKAGE_MANAGERS.map((manager) => ({ value: manager, label: manager }));

/**
 * The install command in the visitor's package manager. A small SegmentedControl in the CodeBlock's bar
 * picks pnpm, npm or yarn; the pick is remembered, and Copy copies the command shown.
 */
export function InstallCommand() {
  const [manager, setManager] = useState<PackageManager>(readPackageManager);
  const choose = (value: string) => {
    if (!isPackageManager(value)) return;
    setManager(value);
    writePackageManager(value);
  };
  return (
    <CodeBlock
      code={INSTALL_COMMANDS[manager]}
      language="shell"
      label="Install command"
      actions={
        <SegmentedControl
          legend="Package manager"
          legendHidden
          size="sm"
          options={OPTIONS}
          value={manager}
          onValueChange={choose}
        />
      }
    />
  );
}
