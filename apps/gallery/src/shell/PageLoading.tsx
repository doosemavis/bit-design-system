import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Stack, Text } from '@bit-ds/react';
import { findManifest } from '../manifests';

/** A page that arrives within this long shows no loading state at all, so fast loads don't flash. */
export const LOADING_DELAY_MS = 300;

interface PageLoadingProps {
  /** The page's name, as in "Loading Tokens…". */
  name: string;
}

/** The Suspense fallback for a lazy page: nothing for 300ms, then a Spinner and "Loading <Name>…". */
export function PageLoading({ name }: PageLoadingProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  const label = `Loading ${name}…`;
  return (
    <Stack direction="row" gap={12} align="center">
      <Spinner aria-label={label} />
      {/* The Spinner's status role already announces the label. */}
      <Text aria-hidden="true">{label}</Text>
    </Stack>
  );
}

/** The fallback for `/components/:slug`: names the component when the slug is a real one. */
export function ComponentLoading() {
  const { slug = '' } = useParams();
  return <PageLoading name={findManifest(slug)?.name ?? 'component'} />;
}
