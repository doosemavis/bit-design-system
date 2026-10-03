import type { ComponentType } from 'react';
import {
  Alert,
  Badge,
  BitLogo,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  CodeBlock,
  Field,
  Input,
  Link,
  Select,
  Spinner,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';

/** Export name → component, so ChildSpec.component (a string) can be rendered. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous prop types by design
export const COMPONENTS: Record<string, ComponentType<any>> = {
  Alert,
  Badge,
  BitLogo,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Code,
  CodeBlock,
  Field,
  Input,
  Link,
  Select,
  Spinner,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
};

/**
 * The plain HTML elements a ChildSpec may name (PR1 checklist). A typo like `opton` would otherwise
 * render an unknown element silently; the manifest contract test fails on anything else.
 */
export const HTML_CHILDREN: readonly string[] = ['option', 'span', 'strong', 'em', 'code'];

/** A lowercase ChildSpec name is a plain HTML element, the same rule JSX uses for tags. */
export function isHtmlElement(name: string): boolean {
  return /^[a-z]/.test(name);
}
