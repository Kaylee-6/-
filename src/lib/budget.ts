import type { AppState, BudgetCategory, Currency, Payment } from './types';
import { round2, sumCad, toCad } from './money';

export const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  hotel: '酒店',
  car: '租车',
  flight: '机票',
  ski: '雪票',
  fuel: '汽油',
  toll: '高速 / ETC',
  parking: '停车',
  visa: '签证 / 证件',
  food: '餐饮',
  sight: '景点门票',
  shopping: '购物',
  insurance: '保险',
  other: '其他',
};

export const PAYMENT_LABEL: Record<Payment, string> = {
  paid: '已付',
  unverified: '扣款待确认',
  unpaid: '已订未付',
  estimate: '估算',
};

export type RowSource = 'hotel' | 'car' | 'flight' | 'line';

export interface BudgetRow {
  id: string;
  source: RowSource;
  /** Id of the hotel / line this row comes from. */
  refId: string;
  category: BudgetCategory;
  name: string;
  detail: string;
  original: { amount: number; currency: Currency } | null;
  /** CAD value used for totals; null when no amount or no exchange rate yet. */
  cad: number | null;
  /** True when the CAD figure comes from the user's own ledger instead of a rate. */
  ledger: boolean;
  booked: boolean;
  payment: Payment;
  points: { amount: number; program: string } | null;
  /** Actual spending logged against this row (CAD). */
  actual: number;
  editable: boolean;
  note: string;
}

export interface BudgetSummary {
  /** Sum of every booked row: hotels + car + AC54 cash (+ outbound once bought). */
  confirmedBase: number;
  paid: number;
  unverified: number;
  unpaidBooked: number;
  /** Estimates still expected to be spent (not yet covered by logged expenses). */
  estimateRemaining: number;
  projected: number;
  toPay: number;
  expensesTotal: number;
  points: { amount: number; program: string }[];
  missing: BudgetRow[];
  byCategory: { category: BudgetCategory; cad: number }[];
  byPayment: { key: 'paid' | 'unverified' | 'unpaid' | 'estimate'; cad: number }[];
}

export function travelerCount(state: AppState): number {
  return Math.max(1, state.travelers.length);
}

export function buildRows(state: AppState): BudgetRow[] {
  const { rates } = state.settings;
  const n = travelerCount(state);
  const rows: BudgetRow[] = [];

  const expensesFor = (id: string) =>
    sumCad(
      state.expenses
        .filter((e) => e.lineId === id)
        .map((e) => toCad(e.amount, e.currency, rates) ?? 0),
    );

  for (const h of state.hotels) {
    const cad = h.cadLedger ?? toCad(h.price, h.priceCurrency, rates);
    rows.push({
      id: `hotel:${h.id}`,
      source: 'hotel',
      refId: h.id,
      category: 'hotel',
      name: h.name,
      detail: `${h.cityZh} · ${h.checkIn.slice(5).replace('-', '/')}–${h.checkOut.slice(5).replace('-', '/')}`,
      original: { amount: h.price, currency: h.priceCurrency },
      cad: cad === null ? null : round2(cad),
      ledger: h.cadLedger !== null && h.priceCurrency !== 'CAD',
      booked: h.status === 'confirmed',
      payment: h.payment,
      points: null,
      actual: 0,
      editable: false,
      note: h.credits.map((c) => `${c.label} ${c.currency} ${c.amount.toFixed(2)}`).join('；'),
    });
  }

  const car = state.car;
  rows.push({
    id: 'car',
    source: 'car',
    refId: 'car',
    category: 'car',
    name: `${car.company} · ${car.vehicle}`,
    detail: `${car.platform} · 6 天`,
    original: { amount: car.price, currency: car.currency },
    cad: toCad(car.price, car.currency, rates),
    ledger: false,
    booked: car.status === 'confirmed',
    payment: car.payment,
    points: null,
    actual: 0,
    editable: false,
    note: '',
  });

  const ret = state.returnFlight;
  const retCash = ret.cashTotal === null ? null : ret.cashTotal * (ret.cashPerPerson ? n : 1);
  rows.push({
    id: 'flight:return',
    source: 'flight',
    refId: 'return',
    category: 'flight',
    name: `回程 ${ret.airline} ${ret.flightNo}`,
    detail: `${ret.from} → ${ret.to} · 现金部分`,
    original: retCash === null ? null : { amount: retCash, currency: ret.currency },
    cad: retCash === null ? null : toCad(retCash, ret.currency, rates),
    ledger: false,
    booked: ret.status === 'confirmed',
    payment: ret.payment,
    points: ret.points ? { amount: ret.points, program: ret.pointsProgram } : null,
    actual: 0,
    editable: false,
    note: '积分单独统计，不折算现金',
  });

  const out = state.outbound;
  if (out && out.cashTotal !== null) {
    const amount = out.cashTotal * (out.cashPerPerson ? n : 1);
    const booked = out.status === 'confirmed';
    rows.push({
      id: 'flight:outbound',
      source: 'flight',
      refId: 'outbound',
      category: 'flight',
      name: `去程 ${out.airline} ${out.flightNo}`.trim(),
      detail: `${out.from} → ${out.to}${out.cashPerPerson ? ` · ${n} 人` : ''}`,
      original: { amount, currency: out.currency },
      cad: toCad(amount, out.currency, rates),
      ledger: false,
      booked,
      payment: booked ? out.payment : 'estimate',
      points: out.points ? { amount: out.points, program: out.pointsProgram } : null,
      actual: 0,
      editable: false,
      note: '',
    });
  } else {
    const opt =
      state.outboundOptions.find((o) => o.id === state.settings.outboundBudgetOption) ?? state.outboundOptions[0];
    if (opt) {
      const amount = opt.pricePerPerson * n;
      rows.push({
        id: 'flight:outbound',
        source: 'flight',
        refId: 'outbound',
        category: 'flight',
        name: '去程机票（未购买）',
        detail: `按候选 ${opt.airlineZh} ${opt.currency} ${opt.pricePerPerson.toLocaleString('en-US')} / 人 × ${n} 人估算`,
        original: { amount, currency: opt.currency },
        cad: toCad(amount, opt.currency, rates),
        ledger: false,
        booked: false,
        payment: 'estimate',
        points: null,
        actual: 0,
        editable: false,
        note: '',
      });
    }
  }

  for (const line of state.budgetLines) {
    const base = line.amount === null ? null : line.amount * (line.perPerson ? n : 1);
    const cad = base === null ? null : toCad(base, line.currency, rates);
    rows.push({
      id: `line:${line.id}`,
      source: 'line',
      refId: line.id,
      category: line.category,
      name: line.name,
      detail: line.perPerson && line.amount !== null ? `${line.amount} ${line.currency} / 人 × ${n}` : '',
      original: base === null ? null : { amount: base, currency: line.currency },
      cad: cad === null ? null : round2(cad),
      ledger: false,
      booked: line.payment !== 'estimate',
      payment: line.payment,
      points: null,
      actual: expensesFor(line.id),
      editable: true,
      note: line.note,
    });
  }

  return rows;
}

export function summarize(state: AppState, rows = buildRows(state)): BudgetSummary {
  const { rates } = state.settings;
  const booked = rows.filter((r) => r.booked);
  const estimates = rows.filter((r) => !r.booked);
  const cadOf = (r: BudgetRow) => r.cad ?? 0;

  const lineIds = new Set(state.budgetLines.map((l) => l.id));
  const expenseCad = state.expenses.map((e) => ({
    linked: e.lineId !== null && lineIds.has(e.lineId),
    category: e.category,
    cad: toCad(e.amount, e.currency, rates) ?? 0,
  }));
  const expensesTotal = sumCad(expenseCad.map((e) => e.cad));
  const unlinked = expenseCad.filter((e) => !e.linked);

  const confirmedBase = sumCad(booked.map(cadOf));
  const paidBooked = sumCad(booked.filter((r) => r.payment === 'paid').map(cadOf));
  const unverified = sumCad(booked.filter((r) => r.payment === 'unverified').map(cadOf));
  const unpaidBooked = sumCad(booked.filter((r) => r.payment === 'unpaid').map(cadOf));
  const paid = sumCad([paidBooked, expensesTotal]);

  // An estimate counts at its planned amount, or at what was actually spent if that is higher.
  const estimateProjected = estimates.map((r) => Math.max(cadOf(r), r.actual));
  const estimateRemaining = sumCad(estimates.map((r) => Math.max(0, cadOf(r) - r.actual)));
  // Spending logged against a booked line is on top of the booking itself.
  const bookedExtras = sumCad(booked.map((r) => r.actual));

  const projected = sumCad([confirmedBase, ...estimateProjected, bookedExtras, ...unlinked.map((e) => e.cad)]);
  const toPay = round2(Math.max(0, projected - paid));

  const cats = new Map<BudgetCategory, number>();
  const add = (c: BudgetCategory, v: number) => cats.set(c, sumCad([cats.get(c) ?? 0, v]));
  for (const r of booked) add(r.category, cadOf(r) + r.actual);
  estimates.forEach((r, i) => add(r.category, estimateProjected[i]));
  for (const e of unlinked) add(e.category, e.cad);

  const points = rows.flatMap((r) => (r.points ? [r.points] : []));
  const missing = rows.filter((r) => r.cad === null);

  return {
    confirmedBase,
    paid,
    unverified,
    unpaidBooked,
    estimateRemaining,
    projected,
    toPay,
    expensesTotal,
    points,
    missing,
    byCategory: [...cats.entries()]
      .map(([category, cad]) => ({ category, cad }))
      .filter((c) => c.cad > 0)
      .sort((a, b) => b.cad - a.cad),
    byPayment: [
      { key: 'paid', cad: paid },
      { key: 'unverified', cad: unverified },
      { key: 'unpaid', cad: unpaidBooked },
      { key: 'estimate', cad: round2(Math.max(0, projected - paid - unverified - unpaidBooked)) },
    ],
  };
}
