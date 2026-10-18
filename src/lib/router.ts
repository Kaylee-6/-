import { useSyncExternalStore } from 'react';

export type PageId =
  | 'home'
  | 'itinerary'
  | 'hotels'
  | 'transport'
  | 'ski'
  | 'explore'
  | 'budget'
  | 'checklist'
  | 'settings';

export interface Route {
  page: PageId;
  param: string;
}

const PAGES: PageId[] = ['home', 'itinerary', 'hotels', 'transport', 'ski', 'explore', 'budget', 'checklist', 'settings'];

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [page = '', param = ''] = clean.split('/');
  return PAGES.includes(page as PageId) ? { page: page as PageId, param: decodeURIComponent(param) } : { page: 'home', param: '' };
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

const getHash = () => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return parseHash(hash);
}

export function href(page: PageId, param = ''): string {
  if (page === 'home') return '#/';
  return `#/${page}${param ? `/${encodeURIComponent(param)}` : ''}`;
}

export function navigate(page: PageId, param = '') {
  const next = href(page, param);
  if (window.location.hash !== next) window.location.hash = next;
}
