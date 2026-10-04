import { useParams } from 'react-router-dom';
import { findManifest, routeFor } from '../manifests';
import { bitLogo } from '../manifests/bitLogo';
import { ComponentPage } from './ComponentPage';
import { UnknownComponentPage } from './UnknownComponentPage';

/**
 * `/components/:slug`. An unknown slug, or a manifest routed elsewhere (the logo is under Brand), gets the
 * unknown-component page with the closest match.
 */
export function ComponentRoute() {
  const { slug = '' } = useParams();
  const manifest = findManifest(slug);
  if (!manifest || routeFor(manifest) !== `/components/${slug}`) return <UnknownComponentPage slug={slug} />;
  return <ComponentPage key={manifest.slug} manifest={manifest} />;
}

/** `/brand/logo`. */
export function LogoRoute() {
  return <ComponentPage manifest={bitLogo} />;
}
