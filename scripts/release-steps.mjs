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

// verify-install's budget: 10 attempts, 15 s apart, about 2 minutes 15 s for the registry to serve a new version.
export async function retry(fn, { attempts = 10, delayMs = 15_000, sleep = defaultSleep } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
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

function verifyInstall(version) {
  const dir = mkdtempSync(join(tmpdir(), 'bit-ds-verify-'));
  const run = (cmd, args) => {
    try {
      execFileSync(cmd, args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
    } catch (error) {
      const tail = String(error.stderr ?? '').trim().split('\n').slice(-20).join('\n');
      throw new Error(`${cmd} ${args[0]} failed${tail ? `:\n${tail}` : `: ${error.message}`}`);
    }
  };
  return retry(async () => {
    run('npm', ['init', '-y']);
    run('npm', ['install', `${PACKAGE}@${version}`]);
    run('node', ['-e', "import('@bit-ds/react').then(m=>{if(!m.Button)process.exit(1)})"]);
  }).finally(() => rmSync(dir, { recursive: true, force: true }));
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
      await verifyInstall(arg);
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
