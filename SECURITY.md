# Security

## Report a vulnerability

Please report security problems privately, not in a public issue.

1. Go to the repo's [Security tab](https://github.com/doosemavis/bit-design-system/security).
2. Click **Report a vulnerability** and fill in the form.

Only the maintainer can see the report. Include what you found, where (package version or docs page URL), and the steps to reproduce it.

If you can't use the form, open an issue that says only that you have a security report and want a private way to send it. Leave out the details.

## What's in scope

- The [`@bit-ds/react`](https://www.npmjs.com/package/@bit-ds/react) package on npm: its components, CSS, themes, fonts and icons.
- The docs site at https://doosemavis.github.io/bit-design-system/, including the archived copies of older versions.

Problems in a dependency belong with that project, but tell us too if bit ships or exposes them.

## Supported versions

| Version | Supported |
| --- | --- |
| Latest 0.1.x | Yes |
| Older 0.1.x | No, upgrade to the latest |

## How fixes ship

Fixes ship as patch releases (0.1.x) on npm, with a note in the [release notes](https://doosemavis.github.io/bit-design-system/#/release-notes). Once a fix is out, the report is published as a GitHub security advisory, crediting you if you'd like.
