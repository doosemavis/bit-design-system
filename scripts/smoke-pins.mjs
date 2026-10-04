// The exact versions the smoke consumer (scripts/smoke-consumer.mjs) installs from the registry.
// The smoke test runs in the release build, so a floating range here would pull whatever is newest
// on release day (security.md C1). Each pin is the version pnpm-lock.yaml resolved when it was set.
// To bump one, change it here; smoke-pins.test.mjs checks that each pin is exact and still inside
// the range the repo itself declares, so a Dependabot bump of the repo never strands the smoke test.
export const SMOKE_PINS = Object.freeze({
  typescript: '5.9.3',
  '@types/react': '19.2.18',
  '@types/react-dom': '19.2.7',
  react: '19.2.8',
  'react-dom': '19.2.8',
  vite: '7.3.6',
  '@vitejs/plugin-react': '5.2.0',
});

// Every registry install in the smoke test uses these flags. --ignore-scripts: no lifecycle script
// of a third-party package runs; vite's esbuild and rollup find their platform binaries through
// their optional dependencies, so they need none.
export const SMOKE_INSTALL_FLAGS = Object.freeze(['--no-audit', '--no-fund', '--loglevel=error', '--save-exact', '--ignore-scripts']);

/** `name@version` for each name, from SMOKE_PINS. Throws for a name with no pin, so nothing installs unpinned. */
export const pinnedSpecs = (names) =>
  names.map((name) => {
    const version = SMOKE_PINS[name];
    if (!version) throw new Error(`smoke-pins: no pinned version for ${name}; add it to SMOKE_PINS`);
    return `${name}@${version}`;
  });
