import { within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** The listbox a bit Select's trigger (role combobox) controls. */
function listboxOf(trigger: HTMLElement): HTMLElement {
  const list = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
  if (!list) throw new Error('The trigger controls no listbox');
  return list;
}

/** Every option row of a bit Select, open or closed (a closed list is hidden, so rows are asked for with hidden: true). */
function optionsOf(trigger: HTMLElement): HTMLElement[] {
  return within(listboxOf(trigger)).getAllByRole('option', { hidden: true });
}

/** The label of every option row, in order. */
export function optionLabels(trigger: HTMLElement): string[] {
  return optionsOf(trigger).map((row) => row.textContent ?? '');
}

/** The label of the chosen row (aria-selected), or null when nothing is chosen. */
export function chosenLabel(trigger: HTMLElement): string | null {
  const chosen = optionsOf(trigger).find((row) => row.getAttribute('aria-selected') === 'true');
  return chosen ? (chosen.textContent ?? '') : null;
}

/** Open a bit Select with a click and click the option named `name`, as a pointer user does. */
export async function chooseOption(user: UserEvent, trigger: HTMLElement, name: string | RegExp): Promise<void> {
  await user.click(trigger);
  await user.click(within(listboxOf(trigger)).getByRole('option', { name }));
}
