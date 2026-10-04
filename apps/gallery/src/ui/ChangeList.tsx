import { renderInline } from './renderInline';

/** A bulleted list of changelog items. A plain list: the gallery has no List component. */
export function ChangeList({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <ul className="gallery-bullets" aria-label={label}>
      {items.map((item, index) => (
        <li key={index}>{renderInline(item)}</li>
      ))}
    </ul>
  );
}
