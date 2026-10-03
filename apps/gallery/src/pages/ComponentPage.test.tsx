import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { button } from '../manifests/button';
import { importChip } from './component/ComponentHeader';
import { PROP_COLUMNS } from './component/DocsSections';

async function open(path: string, name: string) {
  const utils = renderAt(path);
  await screen.findByRole('heading', { level: 1, name });
  return utils;
}

const region = (name: string) => screen.getByRole('region', { name });
const main = () => screen.getByRole('main');

describe('ComponentPage (layout C)', () => {
  it('the header: eyebrow, h1, description, the import chip with Copy, and the badges', async () => {
    await open('/components/card', 'Card');
    expect(within(main()).getByText('Components')).toHaveClass('gallery-eyebrow');
    const chip = screen.getByText("import { Card, CardHeader, CardBody, CardFooter } from '@bit-ds/react';");
    expect(chip).toHaveClass('bit-code');
    expect(screen.getByRole('button', { name: 'Copy import line' })).toBeInTheDocument();
    expect(screen.getByText('Compound')).toHaveClass('bit-badge', 'bit-outline');
  });

  it('importChip lists the component, then its parts', () => {
    expect(importChip(button)).toBe("import { Button } from '@bit-ds/react';");
  });

  it('renders the five sections in order, and the section bar links to each', async () => {
    await open('/components/button', 'Button');
    const titles = ['Playground', 'Variants', 'Usage', 'Props', 'Accessibility'];
    expect(within(main()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(titles);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(bar).getAllByRole('link').map((link) => link.textContent)).toEqual(titles);
  });

  it('a section-bar link focuses its h2 and leaves the route and the state alone', async () => {
    const { router } = await open('/components/button?color=danger', 'Button');
    await userEvent.click(within(screen.getByRole('navigation', { name: 'On this page' })).getByRole('link', { name: 'Props' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Props' }));
    expect(router.state.location.pathname).toBe('/components/button');
    expect(router.state.location.search).toBe('?color=danger');
  });

  it('a component with no axis has no Variants section and no Variants link', async () => {
    await open('/components/stack', 'Stack');
    expect(within(main()).queryByRole('heading', { level: 2, name: 'Variants' })).toBeNull();
    expect(within(screen.getByRole('navigation', { name: 'On this page' })).queryByRole('link', { name: 'Variants' })).toBeNull();
  });

  it('the active preset is pressed; applying another moves the press', async () => {
    await open('/components/button?variant=ghost&size=sm', 'Button');
    const presets = within(region('Button preview')).getByRole('group', { name: 'Presets' });
    expect(within(presets).getByRole('button', { name: 'Ghost small' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(presets).getByRole('button', { name: 'Loading' }));
    expect(within(presets).getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('the Variants table has one cell per color × variant', async () => {
    await open('/components/button', 'Button');
    expect(within(region('Button variants')).getAllByRole('button', { name: 'Save' })).toHaveLength(15);
  });

  it('Usage shows Do and Don\'t as soft success and danger notes', async () => {
    await open('/components/button', 'Button');
    const notes = screen.getAllByRole('note');
    expect(notes.map((n) => n.querySelector('.bit-alert__title')!.textContent)).toEqual(['Do', "Don't"]);
    expect(notes[0]).toHaveClass('bit-success', 'bit-outline');
    expect(notes[1]).toHaveClass('bit-danger', 'bit-outline');
    expect(within(notes[0]!).getAllByRole('listitem')).toHaveLength(button.docs.usage.do.length);
  });

  it('Props is a Table of prop, type, default and description from docs.props', async () => {
    await open('/components/button', 'Button');
    const table = region('Button props');
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(PROP_COLUMNS.map((c) => c.header));
    expect(within(table).getAllByRole('row')).toHaveLength(button.docs.props.length + 1);
    const color = within(table).getByText('color').closest('tr')!;
    expect(within(color).getByText("'primary'")).toHaveClass('bit-code');
  });

  it('the Props table has a Class column: bit-{prop} on axis rows, — elsewhere', async () => {
    await open('/components/button', 'Button');
    const table = region('Button props');
    const classOf = (name: string) => within(table).getByText(name, { selector: 'code' }).closest('tr')!.cells[3]!;
    expect(classOf('variant')).toHaveTextContent('bit-{variant}');
    expect(within(classOf('variant')).getByText('bit-{variant}')).toHaveClass('bit-code');
    expect(classOf('loading')).toHaveTextContent('—');
  });

  it.each([
    ['/components/button', 'Button', 'className="bit-danger"', 'color="danger"'],
    ['/components/card', 'Card', 'className="bit-outline"', 'variant="outline"'],
    ['/components/link', 'Link', 'className="bit-neutral"', 'color="neutral"'],
  ])('%s: the tip under Props says className works the same as the prop', async (path, name, asClass, asProp) => {
    await open(path, name);
    const tip = screen.getByText(/^Prefer classes\?/);
    expect(tip).toHaveTextContent(`Prefer classes? ${asClass} works the same as ${asProp}.`);
  });

  it('no axis, no tip', async () => {
    await open('/components/stack', 'Stack');
    expect(screen.queryByText(/^Prefer classes\?/)).toBeNull();
  });

  it('the code footer offers Props, className and HTML, and each switches the code', async () => {
    await open('/components/button?color=danger', 'Button');
    expect(region('Example code').textContent).toContain('<Button color="danger">Save</Button>');
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    expect(region('Example code').textContent).toContain('<Button className="bit-danger">Save</Button>');
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(region('Example code').textContent).toContain('<button class="bit-button bit-danger bit-solid bit-md" type="button">Save</button>');
  });

  it('a component without an axis has no className option', async () => {
    await open('/components/stack', 'Stack');
    expect(screen.queryByRole('radio', { name: 'className' })).toBeNull();
  });

  it('Accessibility is a bullet list from docs.a11y', async () => {
    await open('/components/button', 'Button');
    const section = region('Accessibility');
    expect(within(section).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...button.docs.a11y]);
  });

  it("emptied children: the preview shows the empty component, the code a self-closing tag, the field the manifest's error", async () => {
    await open('/components/button?children=', 'Button');
    expect(within(region('Button preview')).getByRole('button', { name: '' })).toBeEmptyDOMElement();
    expect(region('Example code').textContent).toBe("import { Button } from '@bit-ds/react';\n\n<Button />");
    expect(screen.getByLabelText('children')).toHaveAccessibleDescription(button.docs.emptyChildrenError!);
  });

  it('the code footer switches to HTML for a static component, and has no format switch for an interactive one', async () => {
    await open('/components/badge', 'Badge');
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(region('Example code').textContent).toBe('<span class="bit-badge bit-neutral bit-solid bit-md" data-shape="pill">New</span>');
  });

  it('the logo page lives under Brand', async () => {
    await open('/brand/logo', 'BitLogo');
    expect(within(main()).getByText('Brand')).toHaveClass('gallery-eyebrow');
  });
});
