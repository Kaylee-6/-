import { describe, expect, it } from 'vitest';
import { createSeed } from './seed';
import { buildRows, summarize } from './budget';
import { calendar, cancelEvents, fold, keyEvents } from './ics';
import { currentDay, nightsBetween, sortByTime, tripPhase } from './time';
import { formatMoney, sumCad, toCad } from './money';
import { normalize, validateImport } from './store';

describe('budget', () => {
  it('confirmed base total is CAD 2,178.17 + 47,400 Aeroplan points', () => {
    const s = summarize(createSeed());
    expect(s.confirmedBase).toBe(2178.17);
    expect(s.points).toEqual([{ amount: 47400, program: 'Aeroplan' }]);
  });

  it('lodging totals CAD 1,436.38 using the user ledger, not a rate', () => {
    const state = createSeed();
    const hotels = buildRows(state).filter((r) => r.source === 'hotel');
    expect(hotels.map((r) => r.cad)).toEqual([191.43, 388.21, 264.74, 592]);
    expect(sumCad(hotels.map((r) => r.cad ?? 0))).toBe(1436.38);
    state.settings.rates.CNY.perCad = 5.5; // a different rate must not change ledger amounts
    expect(sumCad(buildRows(state).filter((r) => r.source === 'hotel').map((r) => r.cad ?? 0))).toBe(1436.38);
  });

  it('separates paid from charge-unverified bookings', () => {
    const s = summarize(createSeed());
    expect(s.paid).toBe(1197.96); // 191.43 + 264.74 + 699.79 + 42
    expect(s.unverified).toBe(980.21); // 388.21 + 592.00
  });

  it('never counts estimates as paid and keeps the outbound flight out of the confirmed base', () => {
    const state = createSeed();
    const rows = buildRows(state);
    const outbound = rows.find((r) => r.id === 'flight:outbound');
    expect(outbound?.booked).toBe(false);
    expect(outbound?.cad).toBe(2370); // KE 1,185 × 2
    const s = summarize(state, rows);
    expect(s.confirmedBase).toBe(2178.17);
    expect(s.paid).toBe(1197.96);
  });

  it('scales the outbound estimate with the traveller count', () => {
    const state = createSeed();
    state.travelers.push({ ...state.travelers[1], id: 'C', label: '旅客 C' }, { ...state.travelers[1], id: 'D', label: '旅客 D' });
    expect(buildRows(state).find((r) => r.id === 'flight:outbound')?.cad).toBe(4740);
  });

  it('does not deduct OneKeyCash a second time', () => {
    const row = buildRows(createSeed()).find((r) => r.id === 'hotel:niseko');
    expect(row?.cad).toBe(264.74);
    expect(row?.note).toContain('78.60');
  });

  it('leaves JPY estimates unconverted until a rate is set', () => {
    const state = createSeed();
    const rusutsu = () => buildRows(state).find((r) => r.id === 'line:ski-b-rusutsu');
    expect(rusutsu()?.cad).toBeNull();
    expect(summarize(state).missing.map((m) => m.id)).toContain('line:ski-b-rusutsu');
    state.settings.rates.JPY.perCad = 100;
    expect(rusutsu()?.cad).toBe(260);
  });

  it('logged expenses count as paid and raise an estimate only when they exceed it', () => {
    const state = createSeed();
    const fuelLine = state.budgetLines.find((l) => l.id === 'fuel')!;
    const before = summarize(state);
    state.expenses.push({ id: 'e1', lineId: fuelLine.id, category: 'fuel', date: '2027-02-14', title: '加油', amount: 60, currency: 'CAD', note: '' });
    const mid = summarize(state);
    expect(mid.paid).toBe(round(before.paid + 60));
    expect(mid.projected).toBe(before.projected); // still inside the CAD 100 estimate
    state.expenses.push({ id: 'e2', lineId: fuelLine.id, category: 'fuel', date: '2027-02-18', title: '加油', amount: 70, currency: 'CAD', note: '' });
    expect(summarize(state).projected).toBe(round(before.projected + 30));
  });

  it('marks a bought ticket as booked once its payment is set to paid', () => {
    const state = createSeed();
    state.budgetLines.find((l) => l.id === 'ski-a-niseko')!.payment = 'paid';
    expect(summarize(state).confirmedBase).toBe(round(2178.17 + 125));
  });
});

function round(n: number) {
  return Math.round(n * 100) / 100;
}

describe('money', () => {
  it('converts with per-CAD rates', () => {
    const rates = createSeed().settings.rates;
    expect(toCad(100, 'CAD', rates)).toBe(100);
    expect(toCad(4795.5, 'CNY', rates)).toBeCloseTo(1000, 6);
    expect(toCad(1000, 'JPY', rates)).toBeNull();
  });
  it('formats currencies distinctly', () => {
    expect(formatMoney(1861.86, 'CNY')).toBe('RMB 1,861.86');
    expect(formatMoney(26000, 'JPY')).toBe('JPY 26,000');
    expect(formatMoney(2178.17, 'CAD')).toBe('CAD 2,178.17');
  });
});

describe('time', () => {
  it('counts 6 nights across the four hotels', () => {
    const nights = createSeed().hotels.reduce((n, h) => n + nightsBetween(h.checkIn, h.checkOut), 0);
    expect(nights).toBe(6);
  });

  it('keeps unscheduled items after the item before them when sorting', () => {
    const sorted = sortByTime([
      { id: 'a', time: '19:35' },
      { id: 'b', time: '' },
      { id: 'c', time: '14:00' },
    ]);
    expect(sorted.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('picks Day 0 by Vancouver date and later days by Japan date', () => {
    const days = createSeed().days;
    expect(currentDay(days, new Date('2027-02-12T10:00:00-08:00'))?.id).toBe('d0');
    expect(currentDay(days, new Date('2027-02-13T15:00:00+09:00'))?.id).toBe('d1');
    expect(currentDay(days, new Date('2027-02-16T08:00:00+09:00'))?.id).toBe('d4');
    expect(currentDay(days, new Date('2027-02-19T22:00:00+09:00'))?.id).toBe('d7');
    expect(currentDay(days, new Date('2027-02-20T10:00:00+09:00'))?.id).toBe('d7'); // in the air, still 2/19 in YVR
    expect(currentDay(days, new Date('2026-12-01T10:00:00+09:00'))).toBeNull();
  });

  it('derives trip phase from the departure target and AC54 arrival', () => {
    const s = createSeed();
    expect(tripPhase(s, new Date('2026-10-18T00:00:00Z'))).toBe('before');
    expect(tripPhase(s, new Date('2027-02-15T00:00:00Z'))).toBe('during');
    expect(tripPhase(s, new Date('2027-02-20T00:00:00Z'))).toBe('after');
  });
});

describe('ics', () => {
  it('creates an all-day reminder when the order deadline time is not filled in', () => {
    const events = cancelEvents(createSeed().hotels);
    expect(events.map((e) => e.uid)).toEqual([
      'cancel-sapporo@hokkaido2027',
      'cancel-niseko@hokkaido2027',
      'cancel-toya@hokkaido2027',
    ]);
    const text = calendar(events, new Date('2026-10-18T00:00:00Z'));
    expect(text).toContain('DTSTART;VALUE=DATE:20270116');
    expect(text).toContain('TRIGGER:-P7D');
    expect(text).not.toContain('Grand Park Otaru'); // non-refundable, no reminder
  });

  it('uses the exact instant once time and offset are entered', () => {
    const state = createSeed();
    const toya = state.hotels.find((h) => h.id === 'toya')!;
    toya.cancel.deadlineTime = '23:59';
    toya.cancel.deadlineOffset = '+08:00';
    const text = calendar(cancelEvents([toya]), new Date('2026-10-18T00:00:00Z'));
    expect(text).toContain('DTSTART:20270116T155900Z');
  });

  it('includes car and AC54 key events', () => {
    const text = calendar(keyEvents(createSeed()), new Date('2026-10-18T00:00:00Z'));
    expect(text).toContain('DTSTART:20270213T050000Z'); // 14:00 JST pick-up
    expect(text).toContain('DTSTART:20270219T103500Z'); // AC54 19:35 JST
  });

  it('folds long lines without breaking UTF-8 characters', () => {
    const folded = fold(`SUMMARY:${'北海道'.repeat(40)}`);
    for (const line of folded.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('import', () => {
  it('rejects files that are not backups', () => {
    expect(validateImport('{"foo":1}').ok).toBe(false);
    expect(validateImport('not json').ok).toBe(false);
  });
  it('fills in missing settings from defaults', () => {
    const s = normalize({ ...createSeed(), settings: { displayCurrency: 'JPY' } });
    expect(s.settings.displayCurrency).toBe('JPY');
    expect(s.settings.rates.CNY.perCad).toBe(4.7955);
  });
});
