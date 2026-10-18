import type { AppState, Day, FlightBooking } from './types';

export const TRIP_START = '2027-02-12';
export const TRIP_END = '2027-02-19';
/** Fallback countdown target while the outbound flight is not booked: 2/12 00:00 Vancouver (PST). */
export const DEFAULT_DEPARTURE = '2027-02-12T00:00:00-08:00';

const WEEK_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEK_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function parts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

export function fmtDateZh(date: string): string {
  if (!date) return '';
  const p = parts(date);
  return `${p.m}月${p.d}日 ${WEEK_ZH[p.dow]}`;
}

export function fmtDateDot(date: string): string {
  if (!date) return '';
  const p = parts(date);
  return `${p.m}.${String(p.d).padStart(2, '0')}`;
}

export function weekdayEn(date: string): string {
  return WEEK_EN[parts(date).dow];
}

export function fmtDateFull(date: string): string {
  if (!date) return '';
  const p = parts(date);
  return `${p.y}/${p.m}/${p.d}`;
}

/** YYYY-MM-DD for "now" in a given IANA zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function nightsBetween(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

export function bookingTime(local: string, offset: string): Date | null {
  if (!local || !offset) return null;
  const d = new Date(`${local}:00${offset}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function flightDeparture(f: FlightBooking | null): Date | null {
  return f ? bookingTime(f.departLocal, f.departOffset) : null;
}

export function flightArrival(f: FlightBooking | null): Date | null {
  return f ? bookingTime(f.arriveLocal, f.arriveOffset) : null;
}

export interface Countdown {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

export function countdown(target: Date, now = new Date()): Countdown {
  const diff = target.getTime() - now.getTime();
  const past = diff <= 0;
  const t = Math.abs(diff);
  return {
    total: diff,
    days: Math.floor(t / 86400000),
    hours: Math.floor((t % 86400000) / 3600000),
    minutes: Math.floor((t % 3600000) / 60000),
    seconds: Math.floor((t % 60000) / 1000),
    past,
  };
}

export function shortCountdown(target: Date, now = new Date()): string {
  const c = countdown(target, now);
  if (c.past) return '已过';
  if (c.days > 0) return `${c.days} 天 ${c.hours} 小时`;
  if (c.hours > 0) return `${c.hours} 小时 ${c.minutes} 分`;
  return `${c.minutes} 分钟`;
}

export type Phase = 'before' | 'during' | 'after';

export function departureTarget(state: AppState): { at: Date; exact: boolean } {
  const dep = flightDeparture(state.outbound);
  if (dep) return { at: dep, exact: true };
  return { at: new Date(DEFAULT_DEPARTURE), exact: false };
}

export function tripPhase(state: AppState, now = new Date()): Phase {
  const dep = departureTarget(state).at;
  const end = flightArrival(state.returnFlight) ?? new Date('2027-02-19T11:50:00-08:00');
  if (now < dep) return 'before';
  if (now <= end) return 'during';
  return 'after';
}

/**
 * The itinerary day that is "today". Day 0 follows Vancouver's calendar until the
 * plane lands in Japan; the rest follow Japan's calendar; Day 7 lasts until landing in YVR.
 */
export function currentDay(days: Day[], now = new Date(), arrivalInJapan?: Date | null): Day | null {
  const van = todayIn('America/Vancouver', now);
  const jst = todayIn('Asia/Tokyo', now);
  const landed = arrivalInJapan ?? new Date('2027-02-13T11:00:00+09:00');
  const byDate = (date: string) => days.find((d) => d.date === date) ?? null;
  if (now < landed && (van === TRIP_START || jst === '2027-02-13')) return byDate(TRIP_START);
  if (van === TRIP_END && jst > TRIP_END) return byDate(TRIP_END);
  if (jst < TRIP_START || jst > TRIP_END) return null;
  return byDate(jst);
}

/**
 * Stable sort that keeps unscheduled items attached to the item before them:
 * each item's effective time is its own time or the previous effective time.
 */
export function sortByTime<T extends { time: string }>(items: T[]): T[] {
  let last = '';
  const keyed = items.map((item, i) => {
    if (item.time) last = item.time;
    return { item, i, key: last };
  });
  keyed.sort((a, b) => (a.key === b.key ? a.i - b.i : a.key < b.key ? -1 : 1));
  return keyed.map((k) => k.item);
}

export function fmtClock(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
