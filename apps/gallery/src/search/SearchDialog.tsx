import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge, Dialog, DialogBody, DialogFooter, DialogHeader, Input, Stack, Text } from '@bit-ds/react';
import type { BadgeProps } from '@bit-ds/react';
import { useNavigate } from 'react-router-dom';
import { MANIFESTS } from '../manifests';
import { GAMES } from '../arcade/games';
import type { GameId } from '../arcade/games';
import { NAV } from '../shell/Sidebar';
import { focusRouteTarget, sectionIdOf } from '../shell/useFocusHeading';
import { renderInline } from '../ui/renderInline';
import { NARROW_QUERY, useMediaQuery } from '../ui/useMediaQuery';
import { buildSearchIndex, groupResults, KIND_LABEL, searchEntries } from './searchIndex';
import type { SearchEntry, SearchKind } from './searchIndex';
import { copyKeyLabel, searchKeyLabel } from '../ui/keys';

/** Every page and every component prop, built once: the docs don't change while the page is open. */
const INDEX = buildSearchIndex(NAV, MANIFESTS, GAMES);

/** A result's chip says what it is, one color per kind: a page, a component, one of a component's props, a game. */
const KIND_COLOR: Readonly<Record<SearchKind, BadgeProps['color']>> = {
  page: 'neutral',
  component: 'primary',
  prop: 'success',
  game: 'warning',
};

/**
 * What an option is called: its title and kind ("Button, component"), a prop's component ("dismissLabel, Alert
 * prop"), and for a game the sidebar section it opens in ("Snake, Arcade").
 */
export function optionName(entry: SearchEntry): string {
  if (entry.owner) return `${entry.title}, ${entry.owner} prop`;
  if (entry.kind === 'game') return `${entry.title}, ${entry.group}`;
  return `${entry.title}, ${KIND_LABEL[entry.kind].toLowerCase()}`;
}

/** The next active index for an arrow key, wrapping at both ends; null for any other key. */
export function moveActive(key: string, active: number, count: number): number | null {
  if (count === 0) return null;
  if (key === 'ArrowDown') return (active + 1) % count;
  if (key === 'ArrowUp') return (active - 1 + count) % count;
  return null;
}

interface SearchPanelProps {
  onGo: (entry: SearchEntry) => void;
  /** The id of the keys hint in the dialog's footer, which describes the query box. */
  hintId: string;
}

/**
 * The query box and its results: a combobox that owns a listbox. Focus stays in the box; Up and Down move the
 * active result (aria-activedescendant), Enter opens it, and the pointer can pick one too.
 */
function SearchPanel({ onGo, hintId }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  // Grouped by kind; the flat list, read group by group, is the order the arrows move in.
  const groups = useMemo(() => groupResults(searchEntries(INDEX, query)), [query]);
  const results = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const listId = useId();
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
        // One listbox, a group per kind (APG "listbox with grouped options"): each group is named by its heading,
        // and the options run on across groups, so the arrows never stop at a heading.
        <div id={listId} role="listbox" aria-label="Results" className="gallery-search__results">
          {groups.map((group) => (
            <div key={group.kind} role="group" aria-labelledby={`${listId}-${group.kind}`} className="gallery-search__group">
              <Text id={`${listId}-${group.kind}`} color="neutral" className="gallery-search__heading">
                {group.label}
              </Text>
              {group.entries.map((entry) => (
                <div
                  key={entry.id}
                  id={entry.id}
                  role="option"
                  aria-selected={entry === current}
                  aria-label={optionName(entry)}
                  aria-describedby={`${entry.id}-detail`}
                  className="gallery-search__option"
                  onMouseMove={() => setActive(results.indexOf(entry))}
                  onClick={() => onGo(entry)}
                >
                  <Stack direction="row" gap={8} align="center">
                    <Text weight="bold">
                      {entry.title}
                      {entry.owner ? <Text color="neutral">{` · ${entry.owner}`}</Text> : null}
                    </Text>
                    <Badge size="lg" variant="outline" color={KIND_COLOR[entry.kind]}>
                      {KIND_LABEL[entry.kind]}
                    </Badge>
                  </Stack>
                  <Text id={`${entry.id}-detail`} color="neutral" className="gallery-search__detail">
                    {renderInline(entry.detail)}
                  </Text>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {/* Announced as it changes; shown only when nothing matches. */}
      <div role="status">{results.length === 0 ? <Text>{`No results for “${query.trim()}”. Try a component or prop name.`}</Text> : null}</div>
    </Stack>
  );
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens an Arcade game in the sidebar. */
  onPlay?: (game: GameId) => void;
}

/**
 * The site search: a bit Dialog with a query box and a results list. It mounts on the first open, so its title
 * isn't in the page's headings before then, and each open starts with an empty query. A result navigates at
 * once (the page changes behind the folding dialog); focus moves to that page, or that section, once the dialog
 * has closed and the page can take it.
 */
export function SearchDialog({ open, onOpenChange, onPlay }: SearchDialogProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Where focus goes once the dialog has closed: a section id, '' for the page's h1, null for nowhere new.
  const focusAfterClose = useRef<string | null>(null);
  // A game chosen here opens once the dialog has closed and handed focus back, so the game's board can take it.
  const playAfterClose = useRef<GameId | null>(null);
  const play = useRef(onPlay);
  useEffect(() => {
    play.current = onPlay;
  });
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
      const game = playAfterClose.current;
      focusAfterClose.current = null;
      playAfterClose.current = null;
      if (target !== null) stop = focusRouteTarget(target, true);
      if (game !== null) play.current?.(game);
    };
    dialog.addEventListener('close', onClose);
    return () => {
      dialog.removeEventListener('close', onClose);
      stop();
    };
  }, [mounted]);

  function go(entry: SearchEntry) {
    if (entry.game) {
      playAfterClose.current = entry.game;
      onOpenChange(false);
      return;
    }
    const [, hash = ''] = entry.to.split('#');
    focusAfterClose.current = sectionIdOf(hash ? `#${hash}` : '');
    onOpenChange(false);
    navigate(entry.to);
  }

  const hintId = useId();
  const narrow = useMediaQuery(NARROW_QUERY);
  if (!mounted) return null;
  return (
    <Dialog ref={dialogRef} open={open} onOpenChange={onOpenChange} size="lg" className="gallery-search">
      <DialogHeader>Search</DialogHeader>
      <DialogBody>
        <SearchPanel key={session} onGo={go} hintId={hintId} />
      </DialogBody>
      {/* The keys hint sits in a purple band, closing the window the way the title bar opens it. */}
      <DialogFooter className="gallery-search__footer">
        <Text id={hintId}>↑ ↓ to move, Enter to open, Esc to close.</Text>
        {/* The page-wide shortcuts, for next time (Shell's useShortcuts wires them). A phone has no keyboard for them. */}
        {narrow ? null : <Text>{`/ or ${searchKeyLabel()}: search. ${copyKeyLabel()}: copy the playground code.`}</Text>}
      </DialogFooter>
    </Dialog>
  );
}
