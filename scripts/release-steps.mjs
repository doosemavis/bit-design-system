#!/usr/bin/env node
// Release workflow helpers: tag guard, publish-skip decision, post-publish install check.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PACKAGE = '@bit-ds/react';
const PACKAGE_JSON = fileURLToPath(new URL('../packages/react/package.json', import.meta.url));

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function expectedTag(version) {
  return `v${version}`;
}

export function checkTag({ tag, version }) {
  if (tag !== expectedTag(version)) {
    throw new Error(`tag ${tag} does not match package version ${version} (expected ${expectedTag(version)})`);
  }
}

// True only for npm's own not-found code (stderr "code E404" or the --json error shape).
export function isNotFound(text) {
  return /\bcode E404\b/.test(text) || /"code":\s*"E404"/.test(text);
}

export function shouldPublish({ publishedVersions, version }) {
  return !publishedVersions.includes(version);
}

// The install check's budget: 10 attempts, 15 s apart, about 2 minutes 15 s for the registry to serve a new version.
export async function retry(fn, { attempts = 10, delayMs = 15_000, sleep = defaultSleep } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      // An error marked `fatal` is not worth another try: stop and report it as it is.
      if (error?.fatal) throw error;
      lastError = error;
      if (attempt < attempts) await sleep(delayMs);
    }
  }
  throw new Error(`failed after ${attempts} attempts: ${lastError?.message ?? lastError}`);
}

function packageVersion() {
  return JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')).version;
}

function fetchPublishedVersions() {
  try {
    const out = execFileSync('npm', ['view', PACKAGE, 'versions', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(out || '[]');
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    const text = `${error.stderr ?? ''}${error.stdout ?? ''}`;
    if (isNotFound(text)) return [];
    throw new Error(`npm view ${PACKAGE} failed: ${(text || error.message).trim()}`);
  }
}

// The last 20 lines of a failed command's stderr, enough to see why without flooding the log.
function stderrTail(error) {
  return String(error.stderr ?? '').trim().split('\n').slice(-20).join('\n');
}

function runCommand(cmd, args, cwd) {
  try {
    return execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
  } catch (error) {
    const tail = stderrTail(error);
    throw Object.assign(new Error(`${cmd} ${args[0]} failed${tail ? `:\n${tail}` : `: ${error.message}`}`), {
      stderr: error.stderr,
      stdout: error.stdout,
    });
  }
}

// The wait for npm to show a new version: 40 attempts, 15 s apart, about 10 minutes. On the 0.1.0 release
// npm's CDN served a cached 404 for the package for about 5 minutes after the publish.
export const VERSION_WAIT = { attempts: 40, delayMs: 15_000 };

// Polls `npm view PACKAGE@VERSION version` until it prints VERSION. An E404 or empty output means "not
// yet". Any other npm error fails at once, with the last 20 lines of stderr. `run` and `sleep` are injected
// so tests never touch the network.
export function waitForVersion(version, { run = (cmd, args) => runCommand(cmd, args), sleep = defaultSleep, ...wait } = {}) {
  return retry(
    async () => {
      let out;
      try {
        out = run('npm', ['view', `${PACKAGE}@${version}`, 'version']);
      } catch (error) {
        const text = `${error.stderr ?? ''}${error.stdout ?? ''}`;
        if (isNotFound(text)) throw new Error('npm does not list the version yet (E404)');
        const tail = stderrTail(error);
        throw Object.assign(new Error(`npm view ${PACKAGE}@${version} failed${tail ? `:\n${tail}` : `: ${error.message}`}`), {
          fatal: true,
        });
      }
      if (String(out ?? '').trim() !== version) throw new Error(`npm does not show ${version} yet`);
    },
    { ...VERSION_WAIT, ...wait, sleep },
  );
}

const SHA512_SRI = /^sha512-[A-Za-z0-9+/]{86}==$/;

/**
 * Throws unless npm's dist.integrity for the version equals the sha512 integrity the build job
 * computed from the tarball it packed, so the install check below tests the bytes that were built.
 */
export function checkIntegrity({ version, expected, published }) {
  if (!SHA512_SRI.test(String(expected ?? ''))) throw new Error(`the expected value is not a sha512 integrity: "${expected}"`);
  const actual = String(published ?? '').trim();
  if (actual !== expected) {
    throw new Error(`${PACKAGE}@${version} on npm has integrity ${actual || '(none)'}, but the build job packed ${expected}`);
  }
}

// Waits for npm to show the version, checks its integrity against the build's, then installs it in a
// scratch project with no lifecycle scripts and imports it. `run` and `sleep` are injectable for tests.
export async function verifyInstall(version, { expectedIntegrity, run = runCommand, sleep = defaultSleep } = {}) {
  if (!expectedIntegrity) throw new Error('verify-install needs EXPECTED_INTEGRITY, the sha512 integrity of the packed tarball');
  // First wait until npm shows the version, so a cached 404 does not use up the install retries.
  await waitForVersion(version, { run: (cmd, args) => run(cmd, args), sleep });
  await retry(
    async () => {
      const published = run('npm', ['view', `${PACKAGE}@${version}`, 'dist.integrity']);
      try {
        checkIntegrity({ version, expected: expectedIntegrity, published });
      } catch (error) {
        throw Object.assign(error, { fatal: true });
      }
    },
    { sleep },
  );
  const dir = mkdtempSync(join(tmpdir(), 'bit-ds-verify-'));
  const inDir = (cmd, args) => void run(cmd, args, dir);
  return retry(
    async () => {
      inDir('npm', ['init', '-y']);
      inDir('npm', ['install', '--ignore-scripts', `${PACKAGE}@${version}`]);
      inDir('node', ['-e', "import('@bit-ds/react').then(m=>{if(!m.Button)process.exit(1)})"]);
    },
    { sleep },
  ).finally(() => rmSync(dir, { recursive: true, force: true }));
}

async function main([command, arg]) {
  switch (command) {
    case 'check-tag': {
      if (!arg) throw new Error('usage: check-tag TAG');
      checkTag({ tag: arg, version: packageVersion() });
      return;
    }
    case 'should-publish': {
      const result = shouldPublish({ publishedVersions: fetchPublishedVersions(), version: packageVersion() });
      console.log(String(result));
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `publish=${result}\n`);
      return;
    }
    case 'verify-install': {
      if (!arg) throw new Error('usage: verify-install VERSION');
      await verifyInstall(arg, { expectedIntegrity: process.env.EXPECTED_INTEGRITY });
      return;
    }
    default:
      throw new Error('usage: release-steps.mjs <check-tag TAG | should-publish | verify-install VERSION>');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
