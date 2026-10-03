import type { ComponentType } from 'react';
import { Alert, Badge, BitLogo, Button, Card, CardBody, CardFooter, CardHeader, Spinner, Stack, Text } from '@bit-ds/react';

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
  Spinner,
  Stack,
  Text,
};
