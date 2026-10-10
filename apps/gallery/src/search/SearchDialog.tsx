import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge, Dialog, DialogBody, DialogHeader, Input, Stack, Text } from '@bit-ds/react';
import type { BadgeProps } from '@bit-ds/react';
import { useNavigate } from 'react-router-dom';
import { MANIFESTS } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { focusRouteTarget, sectionIdOf } from '../shell/useFocusHeading';
import { renderInline } from '../ui/renderInline';
import { buildSearchIndex, searchEntries } from './searchIndex';
import type { SearchEntry } from './searchIndex';

/** Every page and every component prop, built once: the docs don't change while the page is open. */
const INDEX = buildSearchIndex(NAV, MANIFESTS);

/** A result's badge names its sidebar section, one color per section, so a result reads like the menu it's in. */
const GROUP_COLOR: Readonly<Record<string, BadgeProps['color']>> = {
  'Start here': 'neutral',
  Foundations: 'warning',
  Components: 'primary',
  Forms: 'success',
  Brand: 'danger',
};

/** The next active index for an arrow key, wrapping at both ends; null for any other key. */
export function moveActive(key: string, active: number, count: number): number | null {
  if (count === 0) return null;
  if (key === 'ArrowDown') return (active + 1) % count;
  if (key === 'ArrowUp') return (active - 1 + count) % count;
  return null;
}

interface SearchPanelProps {
  onGo: (entry: SearchEntry) => void;
}

/**
 * The query box and its results: a combobox that owns a listbox. Focus stays in the box; Up and Down move the
 * active result (aria-activedescendant), Enter opens it, and the pointer can pick one too.
 */
function SearchPanel({ onGo }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchEntries(INDEX, query), [query]);
  const listId = useId();
  const hintId = useId();
  const current = results[Math.min(active, results.length - 1)];

  useEffect(() => {
    if (current) document.getElementById(current.id)?.scrollIntoView?.({ block: 'nearest' });
  }, [current]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const next = moveActive(event.key, active, results.length);
    if (next !== null) {
      event.preventDefault();
      setActive(next);
    } else if (event.key === 'Enter' && current) {
      event.preventDefault();
      onGo(current);
    }
  }

  return (
    <Stack gap={12}>
      <Input
        data-autofocus
        // Text, not search: a search box spends the first Esc clearing itself, and Esc should close the dialog.
        type="text"
        enterKeyHint="go"
        role="combobox"
        aria-label="Search pages, components and props"
        aria-describedby={hintId}
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
        aria-controls={results.length > 0 ? listId : undefined}
        aria-activedescendant={current?.id}
        autoComplete="off"
        spellCheck={false}
        placeholder="Button, color, spacing…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
      />
      {results.length > 0 ? (
        <ul id={listId} role="listbox" aria-label="Results" className="gallery-search__results">
          {results.map((entry, index) => (
            <li
              key={entry.id}
              id={entry.id}
              role="option"
              aria-selected={entry === current}
              aria-label={`${entry.title}, ${entry.group}`}
              aria-describedby={`${entry.id}-detail`}
              className="gallery-search__option"
              onMouseMove={() => setActive(index)}
              onClick={() => onGo(entry)}
            >
              <Stack direction="row" gap={8} align="center">
                <Text weight="bold">{entry.title}</Text>
                <Badge size="sm" variant="outline" color={GROUP_COLOR[entry.group] ?? 'neutral'}>
                  {entry.group}
                </Badge>
              </Stack>
              <Text id={`${entry.id}-detail`} color="neutral" className="gallery-search__detail">
                {renderInline(entry.detail)}
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
      {/* Announced as it changes; shown only when nothing matches. */}
      <div role="status">{results.length === 0 ? <Text>{`No results for “${query.trim()}”. Try a component or prop name.`}</Text> : null}</div>
      <Text id={hintId} color="neutral">
        ↑ ↓ to move, Enter to open, Esc to close.
      </Text>
    </Stack>
  );
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The site search: a bit Dialog with a query box and a results list. It mounts on the first open, so its title
 * isn't in the page's headings before then, and each open starts with an empty query. A result navigates at
 * once (the page changes behind the folding dialog); focus moves to that page, or that section, once the dialog
 * has closed and the page can take it.
 */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Where focus goes once the dialog has closed: a section id, '' for the page's h1, null for nowhere new.
  const focusAfterClose = useRef<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const [session, setSession] = useState(0);
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setMounted(true);
      setSession((n) => n + 1);
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let stop = () => {};
    const onClose = () => {
      const target = focusAfterClose.current;
      focusAfterClose.current = null;
      if (target !== null) stop = focusRouteTarget(target, true);
    };
    dialog.addEventListener('close', onClose);
    return () => {
      dialog.removeEventListener('close', onClose);
      stop();
    };
  }, [mounted]);

  function go(entry: SearchEntry) {
    const [, hash = ''] = entry.to.split('#');
    focusAfterClose.current = sectionIdOf(hash ? `#${hash}` : '');
    onOpenChange(false);
    navigate(entry.to);
  }

  if (!mounted) return null;
  return (
    <Dialog ref={dialogRef} open={open} onOpenChange={onOpenChange} size="lg" className="gallery-search">
      <DialogHeader>Search</DialogHeader>
      <DialogBody>
        <SearchPanel key={session} onGo={go} />
      </DialogBody>
    </Dialog>
  );
}
