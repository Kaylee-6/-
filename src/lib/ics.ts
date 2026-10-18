import type { AppState, Hotel } from './types';
import { bookingTime, fmtDateFull } from './time';

function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold content lines at 75 octets (RFC 5545 §3.1), never splitting a UTF-8 character. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + b > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function dateValue(date: string): string {
  return date.replace(/-/g, '');
}

function nextDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const n = new Date(Date.UTC(y, m - 1, d + 1));
  return n.toISOString().slice(0, 10);
}

interface IcsEvent {
  uid: string;
  title: string;
  description: string;
  /** Either an all-day date (YYYY-MM-DD) or an exact instant. */
  date?: string;
  start?: Date;
  minutes?: number;
  alarmsBefore: string[]; // e.g. ['-P7D', '-P2D', '-PT2H']
}

function eventLines(e: IcsEvent, stamp: Date): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${utcStamp(stamp)}`];
  if (e.start) {
    lines.push(`DTSTART:${utcStamp(e.start)}`);
    lines.push(`DTEND:${utcStamp(new Date(e.start.getTime() + (e.minutes ?? 30) * 60000))}`);
  } else if (e.date) {
    lines.push(`DTSTART;VALUE=DATE:${dateValue(e.date)}`);
    lines.push(`DTEND;VALUE=DATE:${dateValue(nextDate(e.date))}`);
  }
  lines.push(`SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.description)}`);
  for (const trigger of e.alarmsBefore) {
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, `TRIGGER:${trigger}`, 'END:VALARM');
  }
  lines.push('END:VEVENT');
  return lines;
}

export function calendar(events: IcsEvent[], stamp = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HOKKAIDO 2027//Snow & Beyond//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap((e) => eventLines(e, stamp)),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Whether the order's exact deadline time and zone have been filled in. */
export function hasExactDeadline(h: Hotel): boolean {
  return Boolean(h.cancel.deadlineDate && h.cancel.deadlineTime && h.cancel.deadlineOffset);
}

export function cancelDeadline(h: Hotel): Date | null {
  if (!h.cancel.refundable || !h.cancel.deadlineDate) return null;
  if (hasExactDeadline(h)) return bookingTime(`${h.cancel.deadlineDate}T${h.cancel.deadlineTime}`, h.cancel.deadlineOffset);
  return null;
}

export function cancelEvents(hotels: Hotel[]): IcsEvent[] {
  return hotels
    .filter((h) => h.cancel.refundable && h.cancel.deadlineDate)
    .map((h) => {
      const exact = cancelDeadline(h);
      const when = `${fmtDateFull(h.cancel.deadlineDate)} 前`;
      const description = [
        `${h.name}（${h.platform}）`,
        `入住 ${fmtDateFull(h.checkIn)} – 退房 ${fmtDateFull(h.checkOut)}`,
        exact
          ? `截止时刻：${h.cancel.deadlineDate} ${h.cancel.deadlineTime}（UTC${h.cancel.deadlineOffset}，按订单填写）`
          : '订单上的具体截止时刻与时区尚未填写：请以订单为准。本事件为全天提醒。',
        h.confirmationNo ? `订单号：${h.confirmationNo}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return exact
        ? {
            uid: `cancel-${h.id}@hokkaido2027`,
            title: `免费取消截止 · ${h.name}`,
            description,
            start: exact,
            minutes: 15,
            alarmsBefore: ['-P7D', '-P2D', '-PT3H'],
          }
        : {
            uid: `cancel-${h.id}@hokkaido2027`,
            title: `免费取消截止 ${when} · ${h.name}`,
            description,
            date: h.cancel.deadlineDate,
            alarmsBefore: ['-P7D', '-P2D'],
          };
    });
}

export function keyEvents(state: AppState): IcsEvent[] {
  const events: IcsEvent[] = [];
  const car = state.car;
  events.push({
    uid: 'car-pickup@hokkaido2027',
    title: `取车 · ${car.company}（新千岁）`,
    description: `${car.platform} 订单 · ${car.vehicle}\n${car.pickupPlace}`,
    start: new Date(car.pickupAt),
    minutes: 30,
    alarmsBefore: ['-P1D', '-PT2H'],
  });
  events.push({
    uid: 'car-return@hokkaido2027',
    title: `还车 · ${car.company}（新千岁）`,
    description: '洞爷湖 → 新千岁参考约 2 小时，冬季预留余量',
    start: new Date(car.returnAt),
    minutes: 30,
    alarmsBefore: ['-PT5H', '-PT3H'],
  });
  const ret = state.returnFlight;
  const dep = bookingTime(ret.departLocal, ret.departOffset);
  const arr = bookingTime(ret.arriveLocal, ret.arriveOffset);
  if (dep) {
    events.push({
      uid: 'flight-return@hokkaido2027',
      title: `${ret.airline} ${ret.flightNo} ${ret.from} → ${ret.to}`,
      description: `起飞 ${ret.departLocal.replace('T', ' ')}（UTC${ret.departOffset}）\n抵达 ${ret.arriveLocal.replace('T', ' ')}（UTC${ret.arriveOffset}）`,
      start: dep,
      minutes: arr ? Math.round((arr.getTime() - dep.getTime()) / 60000) : 60,
      alarmsBefore: ['-P1D', '-PT4H'],
    });
  }
  const out = state.outbound;
  const outDep = out ? bookingTime(out.departLocal, out.departOffset) : null;
  const outArr = out ? bookingTime(out.arriveLocal, out.arriveOffset) : null;
  if (out && outDep) {
    events.push({
      uid: 'flight-outbound@hokkaido2027',
      title: `${out.airline} ${out.flightNo} ${out.from} → ${out.to}`.trim(),
      description: out.connection ? `转机：${out.connection}` : '',
      start: outDep,
      minutes: outArr ? Math.round((outArr.getTime() - outDep.getTime()) / 60000) : 60,
      alarmsBefore: ['-P1D', '-PT4H'],
    });
  }
  for (const h of state.hotels) {
    events.push({
      uid: `stay-${h.id}@hokkaido2027`,
      title: `入住 ${h.name}`,
      description: `${h.roomType}\n入住 ${h.checkInTime || '时间待确认'} · 退房 ${h.checkOutTime || '时间待确认'}（${fmtDateFull(h.checkOut)}）\n${h.address}`,
      date: h.checkIn,
      alarmsBefore: [],
    });
  }
  return events;
}

export function downloadText(filename: string, text: string, type = 'text/calendar'): boolean {
  try {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
