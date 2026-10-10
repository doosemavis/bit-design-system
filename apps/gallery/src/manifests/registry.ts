import type { ComponentType } from 'react';
import {
  Alert,
  Badge,
  BitLogo,
  BitTheme,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Code,
  CodeBlock,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  Field,
  Heading,
  Icon,
  IconButton,
  Input,
  Link,
  Radio,
  RadioGroup,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Text,
  Textarea,
  Tooltip,
} from '@bit-ds/react';

/** Export name → component, so ChildSpec.component (a string) can be rendered. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous prop types by design
export const COMPONENTS: Record<string, ComponentType<any>> = {
  Alert,
  Badge,
  BitLogo,
  BitTheme,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Code,
  CodeBlock,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  Field,
  Heading,
  Icon,
  IconButton,
  Input,
  Link,
  Radio,
  RadioGroup,
  SegmentedControl,
  Select,
  Slider,
  Spinner,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Text,
  Textarea,
  Tooltip,
};

/**
 * The plain HTML elements a ChildSpec may name (PR1 checklist). A typo like `spn` would otherwise
 * render an unknown element silently; the manifest contract test fails on anything else. `option` is
 * gone: Select takes an options prop and no children (passing any is a type error), the gallery's
 * `select` lint ban covers native selects, and the manifest contract test rejects an `option` ChildSpec.
 */
export const HTML_CHILDREN: readonly string[] = ['span', 'strong', 'em', 'code'];

/** A lowercase ChildSpec name is a plain HTML element, the same rule JSX uses for tags. */
export function isHtmlElement(name: string): boolean {
  return /^[a-z]/.test(name);
}
