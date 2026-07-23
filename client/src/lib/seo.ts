const DEFAULT_DESCRIPTION =
  'Discover movies, TV shows and anime with Allrated. Find what to watch next, rate titles, and build your personal list.';

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

export function setPageMeta(pathname: string, title?: string, description = DEFAULT_DESCRIPTION, image?: string) {
  const pageTitle = title ? `${title} | Allrated` : 'Allrated — Find What to Watch';
  const url = `${window.location.origin}${pathname}`;
  document.title = pageTitle;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', pageTitle);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', image || `${window.location.origin}/app-icon.svg`);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', pageTitle);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', image || `${window.location.origin}/app-icon.svg`);
  upsertLink('canonical', url);
}