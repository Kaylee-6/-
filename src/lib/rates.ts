import { mutate, getState } from './store';

interface FrankfurterResponse {
  date: string;
  rates: Record<string, number>;
}

const ENDPOINTS = ['https://api.frankfurter.dev/v1/latest?base=CAD&symbols=JPY,CNY', 'https://api.frankfurter.app/latest?from=CAD&to=JPY,CNY'];

export const ECB_SOURCE = '欧洲央行 ECB 参考汇率（经 Frankfurter API）';

/** Fetch ECB reference rates for CAD→JPY/CNY. Throws when offline or blocked. */
export async function fetchEcbRates(): Promise<FrankfurterResponse> {
  let lastError: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as FrankfurterResponse;
      if (!data?.rates?.JPY || !data?.rates?.CNY) throw new Error('汇率数据不完整');
      return data;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('无法获取汇率');
}

export function applyRates(data: FrankfurterResponse, which: ('JPY' | 'CNY')[]) {
  mutate((s) => {
    for (const c of which) {
      s.settings.rates[c] = { perCad: data.rates[c], source: ECB_SOURCE, asOf: data.date };
    }
  });
}

/** On first launch the JPY rate is empty; fill it once from ECB if the network allows. */
export async function fillMissingRates() {
  const missing = (['JPY', 'CNY'] as const).filter((c) => !getState().settings.rates[c].perCad);
  if (missing.length === 0 || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  try {
    applyRates(await fetchEcbRates(), [...missing]);
  } catch {
    /* stays empty; the user can enter a rate by hand */
  }
}
