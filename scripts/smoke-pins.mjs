// The exact versions the smoke consumer (scripts/smoke-consumer.mjs) installs from the registry.
// The smoke test runs in the release build, so a floating range here would pull whatever is newest
// on release day (security.md C1). Each pin is the version the repo's lockfile resolved when it was set.
// To bump one, change it here; smoke-pins.test.mjs checks that each pin is exact and still inside
// the range the repo itself declares, so a Dependabot bump of the repo never strands the smoke test.
export const SMOKE_PINS = Object.freeze({
  typescript: '6.0.3',
  '@types/react': '19.3.0',
  '@types/react-dom': '19.3.0',
  react: '19.3.0',
  'react-dom': '19.3.0',
  vite: '8.3.1',
  '@vitejs/plugin-react': '6.1.1',
});

// Every registry install in the smoke test uses these flags. --ignore-scripts: no lifecycle script
// of a third-party package runs; vite's esbuild and rollup find their platform binaries through
// their optional dependencies, so they need none.
export const SMOKE_INSTALL_FLAGS = Object.freeze(['--no-audit', '--no-fund', '--loglevel=error', '--save-exact', '--ignore-scripts']);

// The docs give three install commands (pnpm add, npm install, yarn add), so the smoke test installs the
// tarball with each. npm is the one the repo runs; these are the other two, run through npx at exact
// versions, each at least 7 days old when pinned (Dependabot's cooldown). yarn is Yarn 4 (Berry), whose
// Plug'n'Play install is the strictest of the three. Bump them here by hand; no repo package.json
// declares either, so Dependabot never sees them.
export const SMOKE_PACKAGE_MANAGERS = Object.freeze({ pnpm: '12.12.1', yarn: '4.18.1' });

/** `name@version` for each name, from SMOKE_PINS. Throws for a name with no pin, so nothing installs unpinned. */
export const pinnedSpecs = (names) =>
  names.map((name) => {
    const version = SMOKE_PINS[name];
    if (!version) throw new Error(`smoke-pins: no pinned version for ${name}; add it to SMOKE_PINS`);
    return `${name}@${version}`;
  });
