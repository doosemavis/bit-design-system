import { useState } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  Stack,
  Text,
  iconAdd,
  iconContentCopy,
  iconDelete,
  iconDownload,
  iconEdit,
  iconMoreVert,
  iconSave,
  iconShare,
} from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

/** What the sample's last choice was, so a choice visibly does something. */
function LastChoice({ choice }: { choice: string }) {
  return (
    <Text color="neutral" role="status">
      {choice ? `Chose: ${choice}` : 'Nothing chosen yet.'}
    </Text>
  );
}

function FileMenu() {
  const [choice, setChoice] = useState('');
  return (
    <Stack gap={12} align="start">
      <Menu title="File" trigger={<Button variant="outline" color="neutral">File</Button>}>
        <MenuItem icon={iconAdd} shortcut="⌘N" onSelect={() => setChoice('New game')}>
          New game
        </MenuItem>
        <MenuItem icon={iconSave} shortcut="⌘S" onSelect={() => setChoice('Save')}>
          Save
        </MenuItem>
        <MenuItem icon={iconContentCopy} onSelect={() => setChoice('Duplicate')}>
          Duplicate
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={iconDelete} danger onSelect={() => setChoice('Delete save')}>
          Delete save
        </MenuItem>
      </Menu>
      <LastChoice choice={choice} />
    </Stack>
  );
}

function MoreMenu() {
  const [choice, setChoice] = useState('');
  return (
    <Stack direction="row" gap={12} align="center" justify="between">
      <LastChoice choice={choice} />
      <Menu title="Level 3" align="end" trigger={<IconButton icon={iconMoreVert} label="More actions" tooltip="More actions" />}>
        <MenuItem icon={iconEdit} onSelect={() => setChoice('Rename')}>
          Rename
        </MenuItem>
        <MenuItem icon={iconShare} onSelect={() => setChoice('Share')}>
          Share
        </MenuItem>
        <MenuItem icon={iconDownload} disabled>
          Download
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={iconDelete} danger onSelect={() => setChoice('Delete level')}>
          Delete level
        </MenuItem>
      </Menu>
    </Stack>
  );
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'File menu with shortcuts',
    when: 'The actions of one object, in groups, with the keyboard shortcuts your app binds shown at the end. A separator sets the destructive one apart.',
    sample: <FileMenu />,
    code: `<Menu title="File" trigger={<Button variant="outline" color="neutral">File</Button>}>
  <MenuItem icon={iconAdd} shortcut="⌘N" onSelect={newGame}>New game</MenuItem>
  <MenuItem icon={iconSave} shortcut="⌘S" onSelect={save}>Save</MenuItem>
  <MenuItem icon={iconContentCopy} onSelect={duplicate}>Duplicate</MenuItem>
  <MenuSeparator />
  <MenuItem icon={iconDelete} danger onSelect={deleteSave}>Delete save</MenuItem>
</Menu>`,
    note: 'shortcut only shows the keys: bind them yourself (a keydown listener on the page). The menu is for finding the action; the shortcut is for doing it again.',
  },
  {
    title: 'A "more" menu on an IconButton',
    when: 'A row or card with too many actions for buttons: one IconButton opens the rest. align="end" lines the window up with the button’s end edge, so it stays over the card.',
    sample: <MoreMenu />,
    code: `<Menu
  title="Level 3"
  align="end"
  trigger={<IconButton icon={iconMoreVert} label="More actions" tooltip="More actions" />}
>
  <MenuItem icon={iconEdit} onSelect={rename}>Rename</MenuItem>
  <MenuItem icon={iconShare} onSelect={share}>Share</MenuItem>
  <MenuItem icon={iconDownload} disabled>Download</MenuItem>
  <MenuSeparator />
  <MenuItem icon={iconDelete} danger onSelect={remove}>Delete level</MenuItem>
</Menu>`,
    note: 'The title strip names the menu for screen readers, so make it say what the actions act on ("Level 3"), not "More".',
  },
];

/** The Menu page's Examples: a file menu with shortcuts and a danger item, and an IconButton "more" menu. */
export function MenuExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
