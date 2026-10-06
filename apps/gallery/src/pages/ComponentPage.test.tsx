import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { button } from '../manifests/button';
import { modeToggle } from '../manifests/modeToggle';
import { switchManifest } from '../manifests/switch';
import { importChip } from './component/ComponentHeader';
import { classTip, PROP_COLUMNS } from './component/DocsSections';

async function open(path: string, name: string) {
  const utils = renderAt(path);
  await screen.findByRole('heading', { level: 1, name });
  return utils;
}

const region = (name: string) => screen.getByRole('region', { name });
const main = () => screen.getByRole('main');

describe('SegmentedControl page: segments and multiple', () => {
  it('the controls offer a segments select (2 to 5) and a multiple switch', async () => {
    await open('/components/segmentedcontrol', 'SegmentedControl');
    const controls = region('Controls');
    const segments = within(controls).getByRole('combobox', { name: 'segments' });
    expect(within(segments).getAllByRole('option').map((o) => o.textContent)).toEqual(['2', '3', '4', '5']);
    expect(within(controls).getByRole('switch', { name: 'multiple' })).not.toBeChecked();
  });

  it('the Multi-select preset renders four checkboxes', async () => {
    await open('/components/segmentedcontrol', 'SegmentedControl');
    await userEvent.click(screen.getByRole('button', { name: 'Multi-select' }));
    const group = within(region('SegmentedControl preview')).getByRole('group', { name: 'Range' });
    expect(within(group).getAllByRole('checkbox')).toHaveLength(4);
  });

  it('the Props table documents multiple as a boolean, default false', async () => {
    await open('/components/segmentedcontrol', 'SegmentedControl');
    const row = within(main()).getAllByRole('row').find((r) => within(r).queryByText('multiple', { selector: 'code' }));
    expect(row).toBeDefined();
    expect(within(row!).getByText('boolean')).toBeInTheDocument();
    expect(within(row!).getByText('false')).toBeInTheDocument();
  });
});

describe('ComponentPage (layout C)', () => {
  it('the header: eyebrow, h1, description, the import chip with Copy, and the badges', async () => {
    await open('/components/card', 'Card');
    expect(within(main()).getByText('Components')).toHaveClass('gallery-eyebrow');
    const chip = screen.getByText("import { Card, CardHeader, CardBody, CardFooter } from '@bit-ds/react';");
    expect(chip).toHaveClass('bit-code', 'gallery-import-code');
    expect(screen.getByRole('button', { name: 'Copy import line' })).toBeInTheDocument();
    // The row stretches its children, so the chip's background takes the Copy button's height.
    expect(chip.parentElement).toHaveAttribute('data-align', 'stretch');
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

  it('B3: the preview and the controls share one bit Card, and the preview has no card of its own', async () => {
    await open('/components/button', 'Button');
    const cards = main().querySelectorAll('.bit-card.gallery-playground__top');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toContainElement(region('Button preview'));
    expect(cards[0]).toContainElement(region('Controls'));
    expect(region('Button preview').querySelector('.bit-card')).toBeNull();
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
    // The Default cell; the Type cell has its own 'primary' chip (see the union test below).
    expect(within(color.cells[2]!).getByText("'primary'")).toHaveClass('bit-code');
  });

  it('a union type is one unbreakable chip per member, joined by a plain " | ", so lines break only between members', async () => {
    await open('/components/button', 'Button');
    const table = region('Button props');
    const typeCell = (name: string) => within(table).getByText(name, { selector: 'code' }).closest('tr')!.cells[1]!;
    const chips = [...typeCell('color').querySelectorAll('.bit-code')];
    expect(chips.map((chip) => chip.textContent)).toEqual(["'primary'", "'neutral'", "'success'", "'warning'", "'danger'"]);
    for (const chip of chips) expect(chip).toHaveClass('gallery-nowrap');
    // The separators are plain text, not code; the cell still reads as the whole union.
    expect(typeCell('color')).toHaveTextContent("'primary' | 'neutral' | 'success' | 'warning' | 'danger'");
    // The | holds to the member before it (a no-break space), so no line starts with a lone |.
    expect(typeCell('color').textContent).toContain("'primary' | 'neutral'");
    // A non-union type stays one plain chip.
    const loading = [...typeCell('loading').querySelectorAll('.bit-code')];
    expect(loading.map((chip) => chip.textContent)).toEqual(['boolean']);
    expect(loading[0]).not.toHaveClass('gallery-nowrap');
  });

  it('the Props Description column keeps a minimum width, so a phone scrolls the table instead of stacking tall rows', async () => {
    await open('/components/button', 'Button');
    const rows = within(region('Button props')).getAllByRole('row').slice(1) as HTMLTableRowElement[];
    // gallery-css.test.ts pins the 16rem this class sets.
    for (const row of rows) expect(row.cells[4]).toHaveClass('gallery-props__description');
    expect(rows[0]!.cells[1]).not.toHaveClass('gallery-props__description');
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
    ['/components/switch', 'Switch', 'className="bit-sm"', 'size="sm"'],
  ])('%s: the tip under Props says className works the same as the prop', async (path, name, asClass, asProp) => {
    await open(path, name);
    const tip = screen.getByText(/^Prefer classes\?/);
    expect(tip).toHaveTextContent(`Prefer classes? ${asClass} works the same as ${asProp}.`);
  });

  it('the tip sits above the Props table, on the right of the heading row, not under the table', async () => {
    await open('/components/button', 'Button');
    const heading = screen.getByRole('heading', { level: 2, name: 'Props' });
    const row = heading.closest<HTMLElement>('[data-justify="between"]')!;
    const tip = screen.getByText(/^Prefer classes\?/);
    expect(row).toContainElement(tip);
    expect(row).toHaveAttribute('data-direction', 'row');
    expect(row).toHaveAttribute('data-wrap');
    const table = screen.getByRole('table', { name: 'Button props' });
    expect(row.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("the tip never teaches an axis's default: Switch and ModeToggle (sm | md, default md) use sm", () => {
    expect(classTip(switchManifest)).toEqual({ prop: 'size', value: 'sm' });
    expect(classTip(modeToggle)).toEqual({ prop: 'size', value: 'sm' });
    expect(classTip(button)).toEqual({ prop: 'color', value: 'danger' });
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

  it('Accessibility frames its list in a Card, like the Props table and Usage beside it', async () => {
    await open('/components/button', 'Button');
    const list = within(region('Accessibility')).getByRole('list');
    expect(list.parentElement).toHaveClass('bit-card__body');
    expect(list.parentElement!.parentElement).toHaveClass('bit-card');
  });

  // Value: protects=the Full file note's Getting started link opens that page in the real route table; fails_when=the route path or the link's to= changes without the other; why_new=CodePanel.test pins href in a bare MemoryRouter with no routes; seam=none
  it("the Full file note's Getting started link opens Getting started", async () => {
    await open('/components/button', 'Button');
    const note = screen.getByText(/^Styles aren't in this file/);
    await userEvent.click(within(note).getByRole('link', { name: 'Getting started' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Getting started' })).toBeInTheDocument();
  });

  it("emptied children: the preview shows the empty component, the code a self-closing tag, the field the manifest's error", async () => {
    await open('/components/button?children=', 'Button');
    expect(within(region('Button preview')).getByRole('button', { name: '' })).toBeEmptyDOMElement();
    expect(region('Example code').textContent).toContain("import { Button } from '@bit-ds/react';\n\nexport function Example() {\n  return (\n    <Button />\n  );\n}");
    expect(screen.getByLabelText('children')).toHaveAccessibleDescription(button.docs.emptyChildrenError!);
  });

  it('the code footer switches to HTML for a static component', async () => {
    await open('/components/badge', 'Badge');
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(region('Example code').textContent).toBe('<span class="bit-badge bit-neutral bit-solid bit-md" data-shape="pill">New</span>');
  });

  it('an interactive component with no axis (CodeBlock) has no format switch, only Props and Full file', async () => {
    await open('/components/codeblock', 'CodeBlock');
    expect(screen.queryByRole('group', { name: 'Code format' })).toBeNull();
    expect(screen.queryByRole('radio', { name: 'HTML' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Full file' })).toBeInTheDocument();
  });

  it('the logo page lives under Brand', async () => {
    await open('/brand/logo', 'BitLogo');
    expect(within(main()).getByText('Brand')).toHaveClass('gallery-eyebrow');
  });
});
