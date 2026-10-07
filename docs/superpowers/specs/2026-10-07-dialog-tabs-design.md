# Dialog and Tabs (0.1.5)

Date: 2026-10-07. Branch: `feat/select-multi-0.1.5`, shipping in 0.1.5 with Select multi-select.

Boards are in `~/.gstack/projects/doosemavis-bit-design-system/designs/dialog-tabs-20261007/`:
- `board.html`: the looks.
- `tabs2.html` and `tabs3.html`: the Tabs rounds.
- `w3-power.html`: the Tabs animation, section C6.
- `dialog-live.html`: the Dialog animation, option O2.

The owner's picks:
- **Dialog:** D2 "Retro window", animation O2 "Bar, then pour", closing as its exact reverse, and a × that presses like every bit Button.
- **Tabs:** W3 "Plugged in", animation C6 (C5's seat-down movement with C1's pour-and-spread), horizontal only. Activation is automatic, with manual as an option.

## Owner's intent
- The owner wants the components "that interviewers probe on": focus handling, layering, and complex keyboard behaviour. Dialog and Tabs close the biggest gap.
- Both must feel like bit, with retro-game pixel motion, and stay fully accessible. Every animation is visual only and is off under reduced motion.
- "I don't like it when the cartridge goes above the modal it's tied to before being pressed down": nothing in Tabs moves upward.
- "The opening animation [should] match the closing animation… folding out just like it folded in."

## 1. Dialog

### API
```ts
export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose' | 'onCancel'> {
  open: boolean;                              // controlled
  onOpenChange: (open: boolean) => void;      // called with false on Esc, ×, or a backdrop click (unless alert)
  alert?: boolean;                            // role="alertdialog": a backdrop click does NOT close; Esc and × still do
  size?: Size;                                // width: sm 320px, md 420px, lg 560px (raw, commented); class bit-{size}
  children: ReactNode;                        // DialogHeader, DialogBody, DialogFooter
}
export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;                        // the title; rendered in an <h2> whose id names the dialog
  closeLabel?: string;                        // the ×'s aria-label; default 'Close'
}
export type DialogPartProps = HTMLAttributes<HTMLDivElement>; // DialogBody, DialogFooter
```
- Exports: `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogProps`, `DialogHeaderProps` and `DialogPartProps`. This follows Card's flat part names.
- `forwardRef<HTMLDialogElement>` on `Dialog`. `className` goes on the `<dialog>`.
- It's controlled only. A gallery or app keeps `open` in state. YAGNI rules out an uncontrolled mode and a `DialogTrigger`; any Button can open it.

### Behaviour: built on the native `<dialog>` and `showModal()`
- **Opening and closing:**
  - `open` turning true calls `showModal()`. The browser puts the dialog in the top layer, makes the rest of the page inert (it can't be clicked, focused or read), and sets `:modal`.
  - `open` turning false plays the close animation, then calls `close()`.
- **Focus in:** the browser's dialog focusing steps apply, so the first element with `autoFocus`, or else the first focusable element, gets focus.
  - Docs tell authors to put `autoFocus` on the least destructive action, such as Cancel, which the APG requires for an alertdialog.
  - The × comes first in the DOM, so without `autoFocus` focus lands on ×. That's acceptable and documented.
- **Focus back:** on close, focus returns to the element that was focused when it opened. Browsers do this for `showModal()`. As a fallback, Dialog remembers `document.activeElement` at open and focuses it after `close()` if focus has landed on `<body>`.
- **Esc:** the native `cancel` event is prevented (so the browser doesn't close without the animation) and calls `onOpenChange(false)`.
- **Backdrop click:** a click whose target is the `<dialog>` itself, which is the backdrop area since the content fills the box, calls `onOpenChange(false)` unless `alert`.
- **× button:** a bit `Button` (outline, `sm`, square) with `aria-label={closeLabel}`. It calls `onOpenChange(false)` and presses like every Button.
- **Naming:**
  - `aria-labelledby` points to DialogHeader's `<h2>` id, through a private context.
  - If DialogBody is present, `aria-describedby` points to its id.
  - With `alert`, `role="alertdialog"`.
- **Scroll lock:** core CSS `html:has(.bit-dialog:modal) { overflow: hidden; }`, with no JS. The page behind doesn't scroll while a dialog is open.
- **Unmounting while open** calls `close()`, so the page never stays inert.
- **SSR:** nothing touches `document` during render; `showModal()` runs in an effect.

### Look (D2)
- **Box:** `--bit-color-surface`, a `--bit-border-width` `--bit-color-line` border, `--bit-radius-10px`, `--bit-shadow-lg`, `overflow: hidden`, and `max-width: calc(100vw - 32px)`.
- **Backdrop** (`::backdrop`): `color-mix(in srgb, var(--bit-color-ink) 55%, transparent)`.
- **Header:** a flex row with the title on the left and × on the right, `--bit-color-primary` background, `--bit-color-primary-contrast` text, and a bottom border in line. The title is `--bit-font-pixel`, uppercase, `letter-spacing: 0.06em` and 11px (raw, commented: pixel font sub-scale, as Badge). Long titles wrap.
- **Body:** `--bit-space-16px` padding and body text.
- **Footer:** flex, end-aligned, `--bit-space-8px` gap, padding `0 16px 16px` in tokens.
- **Forced colours:** the header becomes `Canvas`/`CanvasText` with a `CanvasText` bottom border, the box border is `CanvasText`, and the backdrop is left to the system.

### Motion (O2: "Bar, then pour"; close is the exact reverse)
- **Opening** (`data-state="opening"`), 440ms, `steps(1, end)` keyframes on `clip-path: inset(...)`:
  - 0–40%: the title bar (its real height) widens from the centre in 4 steps (50% → 38% → 25% → 12% → 0 side insets).
  - 40–100%: the body pours down in 4 steps (bottom inset 60% → 35% → 12% → 0).
- **Closing** (`data-state="closing"`): a separate keyframe set (a browser won't restart an animation whose name didn't change) with exactly the reverse frames, also 440ms. Then `close()`.
- **Backdrop:** dims in 2 steps (`--bit-duration-normal`) on open and undims in 2 steps at the end of close.
- **Timing:** 440ms is raw and commented (no token that long). The bar height in the keyframes is a custom property, `--_bit-dialog-bar`, set from the header's real height in an effect, with 46px as the default.
- **Finishing:** close waits for `animationend` on the `<dialog>`, with a 600ms timeout fallback, before calling `close()`. Under `prefers-reduced-motion: reduce`, or when `matchMedia` is unavailable, it calls `close()` at once and no animation runs.

## 2. Tabs

### API
```ts
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string;                              // controlled
  defaultValue?: string;                       // uncontrolled; default: the first enabled Tab
  onValueChange?: (value: string) => void;     // when a different tab is chosen
  activation?: 'automatic' | 'manual';         // default 'automatic'
  children: ReactNode;                         // one TabList, then TabPanels
}
export type TabListProps = HTMLAttributes<HTMLDivElement>;  // needs aria-label or aria-labelledby (dev warning when missing)
export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> { value: string; disabled?: boolean }
export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> { value: string }
```
- Exports: `Tabs`, `TabList`, `Tab`, `TabPanel` and their props types.
- Parts talk through a private context. Tab and panel ids come from `useId` plus the value.

### Behaviour (WAI-ARIA APG Tabs)
- **Roles:**
  - `role="tablist"` on TabList.
  - Each Tab is a `<button type="button" role="tab" aria-selected aria-controls={panelId} id={tabId}>`.
  - Each TabPanel has `role="tabpanel" aria-labelledby={tabId} tabIndex={0}`.
- **Roving tab stop:** only the chosen Tab is in the Tab order (`tabIndex 0`); the others are `-1`. With `activation="manual"`, the focused tab is the stop until a choice is made.
- **Keys on a Tab:**
  - ArrowRight and ArrowLeft move to the next and previous enabled tab, wrapping. In `dir="rtl"` (computed direction) they swap.
  - Home and End go to the first and last enabled tab.
  - With automatic activation, moving focus also chooses the tab. With manual, Enter or Space chooses it.
  - Disabled tabs are skipped and can't be chosen.
- **Clicking** a tab chooses it.
- **Panels:** every TabPanel stays mounted; the inactive ones get `hidden`, so their state persists. Only the chosen panel is visible.
- **Value:**
  - Uncontrolled starts from `defaultValue`, or the first enabled Tab.
  - Controlled: `value` wins. Choosing the current tab doesn't call `onValueChange`.
  - A `value` that no tab has shows no panel, and the first enabled tab becomes the Tab stop.

### Look (W3 "Plugged in")
- **Cartridges:**
  - Each Tab is a cartridge: `--bit-border-width` line border without the bottom edge, `6px 6px 0 0` radius, and padding `10px 14px 8px`.
  - The top-edge notch is `clip-path: polygon(0 0,36% 0,40% 6px,60% 6px,64% 0,100% 0,100% 100%,0 100%)` (raw, commented).
  - Unchosen: `--bit-color-neutral-soft` background and `--bit-color-text-muted` text.
  - Chosen: a `--bit-color-primary` fill layer (`::before`) and `--bit-color-primary-contrast` text. It's taller (padding-top 14px) and seated, with bottoms aligned.
- **Hover** only changes the text to `--bit-color-text`. Nothing moves up, ever.
- **Focus ring:** drawn inside the cartridge, because the notch clips anything outside. The tab's label `<span>` gets the system ring (the same width and colour reset.css uses) with an inset offset. Tested.
- **Slot:**
  - TabList renders, after the tablist row, a `span.bit-tabs__slot` (`aria-hidden`): a 10px strip with line borders on the top and sides, a top radius, a neutral-soft background, and a primary fill layer.
  - TabPanels sit under it with no top border, a bottom radius, `--bit-shadow-md` and `--bit-color-surface`.
  - `--_bit-tabs-x`, the chosen tab's centre across the slot, is set by an effect and a ResizeObserver.
- **Disabled tab:** 0.5 opacity and `cursor: not-allowed`.
- **Overflow:** when the tabs don't fit, the tablist row scrolls horizontally with the themed scrollbar (as Table), and `--_bit-tabs-x` follows the scroll.
- **Forced colours:**
  - Cartridge borders are `CanvasText`.
  - The chosen fill and the slot fill are `Highlight`, with `HighlightText` text.
  - The focus ring is `Highlight`.

### Motion (C6: seat, pour, spread)
- When the chosen tab changes (not on first render), the newly chosen Tab and the slot get `data-boot` until their animations end. All steps are hard (`steps()`).
  1. **Seat (0–120ms):** the cartridge presses down 3px and back, `translateY(3px)` then 0, in 2 steps. Down only.
  2. **Pour (120–300ms):** the purple fill drops down the cartridge in 4 pixel rows (`clip-path: inset(0 0 100% 0)` → `inset(0)`).
  3. **Spread (300–540ms):** the slot's purple layer opens from under the cartridge's centre outward in 6 blocks (`clip-path: inset(0 calc(100% - x) 0 x)` → `inset(0)`).
- The panel content swaps at once, and screen readers get it straight away.
- Durations are raw and commented. Under reduced motion there's no animation, and the end state shows at once.

## 3. Gallery

**Engine: a stateful demo wrapper.**
- Dialog needs a trigger and `open` state, so `Manifest` gains:
  ```ts
  demo?: {
    /** Renders around the built element in the preview (a Button that opens a Dialog), keeping its own state. */
    render: (element: ReactElement) => ReactElement;
    /** How the printed code wraps the element: extra imports, lines at the top of the component, and the JSX around it. */
    code: { imports: readonly string[]; setup: readonly string[]; wrap: (elementJsx: string) => string };
  };
  ```
- `toJsx` with `demo`:
  - It adds `code.imports` to the import line (deduplicated, sorted).
  - It prints the element through `code.wrap`.
  - It puts `code.setup` lines inside `export function Example() { … }` in the full file. Snippet mode prints them above the JSX.
  - The import of `useState` from `react` is its own line.
- **Dialog page:**
  - The preview shows an "Open dialog" Button. Clicking it opens the real modal Dialog over the gallery.
  - The printed code is `const [open, setOpen] = useState(false);` plus the Button and `<Dialog open={open} onOpenChange={setOpen}>…</Dialog>`.
  - Controls: `title` (text), `alert` (boolean), `size` (axis).
  - Presets: "Alert" (`alert: true`, title "Delete report?", a danger action).
  - Parts are shown through `deriveChildren`: DialogHeader with the title, DialogBody, and DialogFooter with Cancel (`autoFocus`) and a confirm Button.
  - It's interactive, so there's no HTML tab.
- **Tabs page:**
  - Controls:
    - `tabCount`: a virtual number control, 2–5, default 3.
    - `activation`: a select of `automatic` and `manual`.
    - `disabledTab`: a virtual boolean that disables the last tab.
  - `deriveChildren` builds TabList, Tabs and TabPanels from the first N of Overview, Usage, Props, Accessibility and Examples, each with a one-line panel.
  - `TabList` gets `aria-label="Component docs"`.
  - It's interactive, so there's no HTML tab.
- **Docs for both:** usage do and don't lines, a props table, and a11y notes covering the keyboard, focus, naming, alertdialog, scroll lock, forced colours and reduced motion.
- Sidebar: both go in the `components` group.

## 4. Tests
**React, Dialog** (`Dialog.test.tsx`):
- **jsdom has no `showModal()`.** A test setup file adds a minimal stand-in, `showModal`/`close` that set `open` and dispatch `close`, and `:modal` isn't used in unit tests.
- **Covered:**
  - open and close calling `showModal` and `close`;
  - Esc preventing the `cancel` event and calling `onOpenChange(false)`;
  - a backdrop click closing, except with `alert`;
  - the ×;
  - `aria-labelledby` and `aria-describedby`, and role `alertdialog`;
  - the focus-return fallback;
  - unmounting while open calling `close`;
  - the close waiting for `animationend`, with the timeout fallback;
  - reduced motion closing at once;
  - the ref;
  - axe while open.
- Coverage stays at 100%.

**React, Tabs** (`Tabs.test.tsx`):
- roles, ids and their links;
- the roving tabindex;
- every key, including wrap, Home, End, skipping disabled tabs, and RTL;
- automatic and manual activation;
- controlled and uncontrolled use;
- `onValueChange` only on a change;
- an unknown value;
- panels mounted and hidden;
- `data-boot` not set on first render and set on a change;
- axe.

**Core CSS:** tokens-only rules, the reduced-motion and forced-colours blocks, the scroll lock, the focus ring inside the tab, and nothing in Tabs translating upward (no negative `translateY` in tabs.css).

**Gallery:**
- engine `demo` printing (snippet and full file);
- both manifests;
- the Tabs tab count clamped to 2–5.

**e2e (Playwright, real browser):**
- **Dialog:**
  - opening moves focus inside, Tab stays inside, and the page behind is inert;
  - Esc closes and focus returns to the trigger;
  - a backdrop click closes, except with Alert;
  - the page doesn't scroll while it's open;
  - axe while open, in light and dark;
  - the close animation runs: the dialog stays open, with `data-state="closing"`, until it ends.
- **Tabs:**
  - arrows, Home and End with automatic activation;
  - manual activation;
  - the panel follows;
  - axe in light and dark.
- Screenshots in headed Chromium for the owner: the Dialog open, and the Tabs mid-animation and at rest, in both modes.

**Smoke and verify:** the new exports, and a type-check of both components in the smoke consumer.

## 5. Release
- They join 0.1.5's CHANGELOG "Added" section: Dialog and Tabs with their props types.
- The README component list gains `- **Overlays and navigation:** Dialog (+ DialogHeader, DialogBody, DialogFooter), Tabs (+ TabList, Tab, TabPanel)` after the Choice line, and its paragraph gains one sentence each on Dialog (native modal `<dialog>`: focus moves in, the page behind is inert, Esc closes, focus returns) and Tabs (WAI-ARIA tabs, a roving Tab stop with arrow keys). The "How it's tested" keyboard line gains Dialog's focus, inert and Esc checks and Tabs' arrow-key checks.
- After merge, `v0.1.5` is tagged and the owner approves `publish`.

## Out of scope
- Non-modal dialogs, nested dialogs, drawers and sheets.
- Vertical tabs, closable or reorderable tabs, and lazily mounted panels.
- Tooltip and Menu, which the owner said to stop at.
