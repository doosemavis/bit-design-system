import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { pageTitle, SITE_TITLE } from './useDocumentTitle';

/** Read through the file system: under jsdom, Vite turns `new URL(…, import.meta.url)` into an http: URL. */
const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('page titles', () => {
  it('"<page> · bit" for a page, the site title for home', () => {
    expect(pageTitle('Button')).toBe('Button · bit');
    expect(pageTitle(null)).toBe(SITE_TITLE);
  });

  it("the site title is index.html's, so home keeps the title the first load shows", () => {
    expect(/<title>([^<]*)<\/title>/.exec(indexHtml)?.[1]).toBe(SITE_TITLE);
  });

  it.each([
    ['/', null, SITE_TITLE],
    ['/getting-started', 'Getting started', 'Getting started · bit'],
    ['/typography', 'Typography', 'Typography · bit'],
    ['/components/button', 'Button', 'Button · bit'],
    ['/components/dialog', 'Dialog', 'Dialog · bit'],
    ['/nope', 'Page not found', 'Page not found · bit'],
    ['/components/buton', 'No component called “buton”', 'Component not found · bit'],
  ])('%s is titled after its page', async (path, heading, title) => {
    renderAt(path);
    if (heading) await screen.findByRole('heading', { level: 1, name: heading });
    await waitFor(() => expect(document.title).toBe(title));
  });

  it('follows navigation', async () => {
    const { router } = renderAt('/components/button');
    await waitFor(() => expect(document.title).toBe('Button · bit'));
    await router.navigate('/components/badge');
    await waitFor(() => expect(document.title).toBe('Badge · bit'));
  });
});
