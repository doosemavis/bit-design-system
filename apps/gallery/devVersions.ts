import type { Connect, Plugin } from 'vite';

/*
 * versions.json in dev. The deployed file is written at deploy time from the repo's tags, and locally
 * `npm run versions` copies one into public/, where it goes stale as soon as a new tag lands (the header
 * then disagreed with Getting started and Release notes). Dev builds it fresh from git on every request
 * instead, with the same code the deploy runs, so the dev site's "latest" is the newest local tag. Build and
 * preview are unchanged: they serve whatever public/ holds.
 */

/** scripts/versions.mjs, untyped JS shared with the deploy. Only what this plugin calls. */
interface VersionsScript {
  readRepoInputs: () => Record<string, unknown>;
  buildVersionsFile: (inputs: Record<string, unknown>) => unknown;
}

const SCRIPT_URL = new URL('../../scripts/versions.mjs', import.meta.url).href;

/** The versions.json the deploy would write for this checkout, as JSON text. Throws when git or the CHANGELOG can't be read. */
export async function buildDevVersionsJson(): Promise<string> {
  const script = (await import(/* @vite-ignore */ SCRIPT_URL)) as VersionsScript;
  return `${JSON.stringify(script.buildVersionsFile(script.readRepoInputs()), null, 2)}\n`;
}

/** Answers GET /versions.json; every other request goes on. A failure is a 500 the gallery treats as "unavailable". */
export function versionsMiddleware(build: () => Promise<string> = buildDevVersionsJson): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.method !== 'GET' || req.url?.split('?')[0] !== '/versions.json') {
      next();
      return;
    }
    build().then(
      (body) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(body);
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[bit] dev versions.json: ${message}`);
        res.statusCode = 500;
        res.end(message);
      },
    );
  };
}

/** Serve-only: registered before Vite's own middleware, so it wins over a stale public/versions.json. */
export function devVersionsPlugin(): Plugin {
  return {
    name: 'bit-dev-versions',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(versionsMiddleware());
    },
  };
}
