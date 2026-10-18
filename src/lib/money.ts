import type { Currency, Settings } from './types';

export const CURRENCY_LABEL: Record<Currency, string> = { CAD: 'CAD', JPY: 'JPY', CNY: 'RMB' };

export type Rates = Settings['rates'];

/** Convert an amount to CAD. Returns null when the rate is not set. */
export function toCad(amount: number, currency: Currency, rates: Rates): number | null {
  if (currency === 'CAD') return amount;
  const r = rates[currency].perCad;
  if (!r || r <= 0) return null;
  return amount / r;
}

/** Convert a CAD amount to the display currency. Returns null when the rate is not set. */
export function fromCad(cad: number, currency: Currency, rates: Rates): number | null {
  if (currency === 'CAD') return cad;
  const r = rates[currency].perCad;
  if (!r || r <= 0) return null;
  return cad * r;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Sum in integer cents so 191.43 + 388.21 + ... is exact. */
export function sumCad(values: number[]): number {
  return values.reduce((acc, v) => acc + Math.round(v * 100), 0) / 100;
}

export function formatAmount(amount: number, currency: Currency): string {
  const digits = currency === 'JPY' ? 0 : 2;
  return amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatMoney(amount: number | null | undefined, currency: Currency): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return `${CURRENCY_LABEL[currency]} —`;
  return `${CURRENCY_LABEL[currency]} ${formatAmount(amount, currency)}`;
}

/** Format a CAD amount in the chosen display currency; falls back to CAD when no rate. */
export function formatDisplay(cad: number | null, display: Currency, rates: Rates): string {
  if (cad === null) return '待换算';
  const v = fromCad(cad, display, rates);
  if (v === null) return formatMoney(cad, 'CAD');
  return formatMoney(v, display);
}

export function formatPoints(n: number): string {
  return n.toLocaleString('en-US');
}
