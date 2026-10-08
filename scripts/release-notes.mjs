// Prints one version's CHANGELOG section, for the GitHub Release that the github-release job creates.
//   node scripts/release-notes.mjs 0.1.6 > notes.md
// Node built-ins plus the CHANGELOG heading rule the gallery already uses; no install needed.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHANGELOG_HEADING } from '../apps/gallery/src/content/versionLines.mjs';

/** The markdown under `## {version} — {date}`, up to the next `## ` heading, trimmed. */
export const releaseNotes = (changelogText, version) => {
  const lines = changelogText.split(/\r?\n/);
  const start = lines.findIndex((line) => CHANGELOG_HEADING.exec(line.trimEnd())?.[1] === version);
  if (start === -1) throw new Error(`CHANGELOG.md has no "## ${version} — <date>" section`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
};

const main = () => {
  const version = process.argv[2];
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
    console.error('usage: node scripts/release-notes.mjs X.Y.Z');
    process.exit(2);
  }
  try {
    const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
    const notes = releaseNotes(changelog, version);
    if (!notes) throw new Error(`the ${version} section of CHANGELOG.md is empty`);
    process.stdout.write(`${notes}\n`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
