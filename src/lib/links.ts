/**
 * External links used across the app. Only official domains confirmed by search,
 * plus Google Maps URLs built from real place names / addresses.
 */
export const LINKS = {
  ctrip: 'https://www.ctrip.com/',
  expedia: 'https://www.expedia.ca/',
  klook: 'https://www.klook.com/',
  nipponRentACar: 'https://www.nipponrentacar.co.jp/en/nrglobal/flow/',
  airCanada: 'https://www.aircanada.com/',
  koreanAir: 'https://www.koreanair.com/',
  evaAir: 'https://www.evaair.com/',
  grandParkOtaru: 'https://parkhotelgroup.com/grand-park-otaru',
  streamHotel: 'https://www.streamhotel.co.jp/sapporo/',
  kanronomori: 'https://kanronomori.com/en/index.html',
  windsor: 'https://www.windsor-hotels.co.jp/en/',
  nisekoUnited: 'https://www.niseko.ne.jp/en/',
  ikonNiseko: 'https://www.ikonpass.com/destinations/niseko-united',
  rusutsu: 'https://rusutsu.com/en/',
  epicRusutsu: 'https://www.epicpass.com/regions/japan/rusutsu-resort.aspx',
  snowNiseko: 'https://www.onthesnow.com/hokkaido/niseko-united/skireport',
  snowRusutsu: 'https://www.onthesnow.com/hokkaido/rusutsu/skireport',
  snowLightPath: 'https://www.visit-hokkaido.jp/en/event/detail_11004.html',
  visitHokkaido: 'https://www.visit-hokkaido.jp/en/',
  sapporoTravel: 'https://www.sapporo.travel/en/',
  jpConsulateVancouver: 'https://www.vancouver.ca.emb-japan.go.jp/',
  caaIdp: 'https://www.caa.ca/idp',
  jmaForecast: 'https://www.jma.go.jp/bosai/forecast/',
  nexcoEast: 'https://www.e-nexco.co.jp/en/',
} as const;

export function mapSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapDirections(destination: string, origin?: string): string {
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving' });
  if (origin) params.set('origin', origin);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
