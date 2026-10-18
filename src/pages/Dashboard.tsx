import { ArrowUpRight, CalendarClock, Check } from 'lucide-react';
import { useAppState, mutate } from '../lib/store';
import { href } from '../lib/router';
import { currentDay, departureTarget, flightArrival, flightDeparture, fmtDateDot, fmtDateZh, nightsBetween, tripPhase, weekdayEn, todayIn } from '../lib/time';
import { summarize } from '../lib/budget';
import { formatDisplay, formatPoints } from '../lib/money';
import { useNow } from '../lib/actions';
import { Cover, CoverEditor } from '../components/Cover';
import { Snowfall } from '../components/Scene';
import { BigCountdown, InlineCountdown } from '../components/Countdown';
import { RouteMap } from '../components/RouteMap';
import { ActivityLine } from '../components/DayBits';
import { Card, ProgressRing, StatusBadge, Tag } from '../components/ui';
import { GROUP_LABEL, sortTodos } from '../lib/checklist';
import type { ReactNode } from 'react';
import type { AppState } from '../lib/types';

function daysUntilDate(date: string, now: Date): number {
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
  const [y1, m1, d1] = today.split('-').map(Number);
  const [y2, m2, d2] = date.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function Hero({ state }: { state: AppState }) {
  const now = useNow(30000);
  const phase = tripPhase(state, now);
  const dep = departureTarget(state);
  const today = currentDay(state.days, now, flightArrival(state.outbound));
  return (
    <Cover imageKey="hero" scene="hero" title="羊蹄山晨光插画" className="h-[440px] sm:h-[500px]">
      <Snowfall />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a26]/90 via-[#0e1a26]/40 to-[#0e1a26]/5" />
      <div className="gutter absolute right-0 top-[calc(12px+env(safe-area-inset-top,0px))]">
        <CoverEditor imageKey="hero" label="首页" />
      </div>
      <div className="gutter hero-text absolute inset-x-0 bottom-0 pb-7 text-white">
        <div className="mx-auto max-w-[1100px]">
          <div className="font-mono text-[10.5px] tracking-[0.22em] text-white/80">SNOW &amp; BEYOND · 北海道冬季之旅</div>
          <h1 className="mt-2 flex flex-wrap items-baseline gap-x-4 font-display font-light leading-[0.9] tracking-[0.04em]">
            <span className="text-[58px] sm:text-[88px]">HOKKAIDO</span>
            <span className="text-[58px] text-[#e3cfa9] sm:text-[88px]">2027</span>
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-white/85">
            <span className="font-mono tracking-wider">2027.2.12 — 2.19</span>
            <span>8 天 · 北海道 6 晚 · 3 天滑雪</span>
            <span className="font-mono tracking-wider">YVR ⇄ CTS</span>
          </div>
          <div className="mt-5">
            {phase === 'before' && (
              <>
                <div className="mb-2 text-[12.5px] text-white/80">距离出发</div>
                <BigCountdown target={dep.at} light />
                {!dep.exact && <div className="mt-2 text-[11.5px] text-white/65">按 2/12 0:00 温哥华时间计算；去程航班录入后自动改为起飞时刻</div>}
              </>
            )}
            {phase === 'during' && today && (
              <a href={href('itinerary', today.id)} className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 backdrop-blur">
                <span className="font-mono text-[12px] tracking-widest">DAY {today.index}</span>
                <span className="text-[15px]">{today.title}</span>
                <ArrowUpRight size={16} />
              </a>
            )}
            {phase === 'after' && <div className="text-[15px]">旅程已结束，欢迎回家。</div>}
          </div>
        </div>
      </div>
    </Cover>
  );
}

function TodayCard({ state }: { state: AppState }) {
  const now = useNow(60000);
  const phase = tripPhase(state, now);
  const today = currentDay(state.days, now, flightArrival(state.outbound));
  const day = today ?? (phase === 'after' ? state.days[state.days.length - 1] : state.days[0]);
  const hotel = state.hotels.find((h) => h.id === day.hotelId);
  const label = today ? '今日行程' : phase === 'before' ? '第一天预览' : '最后一天';
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">
            {label} · DAY {day.index} · {fmtDateDot(day.date)} {weekdayEn(day.date)}
          </div>
          <h3 className="mt-1 text-[20px] font-semibold leading-tight">{day.title}</h3>
          <div className="mt-0.5 text-[13px] text-ink-2">{day.route}</div>
        </div>
        <a href={href('itinerary', day.id)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12.5px] hover:border-ink/40">
          完整时间线
        </a>
      </div>
      <div className="mt-3 divide-y divide-line/70">
        {day.activities.slice(0, 6).map((a) => (
          <ActivityLine key={a.id} a={a} right={<StatusBadge status={a.status} compact />} />
        ))}
        {day.activities.length === 0 && <div className="py-3 text-[13.5px] text-muted">还没有安排活动，去行程页从候选目的地添加。</div>}
      </div>
      {hotel && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13px]">
          <span className="min-w-0 truncate">
            今晚 · <b className="font-semibold">{hotel.name}</b>
          </span>
          <span className="shrink-0 font-mono text-[12px] text-ink-2">入住 {hotel.checkInTime || '待确认'}</span>
        </div>
      )}
    </Card>
  );
}

function TodoCard({ state }: { state: AppState }) {
  const open = sortTodos(state.checklist.filter((c) => !c.done));
  const done = state.checklist.filter((c) => c.done).length;
  const total = state.checklist.length;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <ProgressRing value={total ? done / total : 0}>
          <span className="tabular text-[14px] font-semibold">{Math.round((done / Math.max(1, total)) * 100)}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <div className="eyebrow">准备进度</div>
          <div className="mt-0.5 text-[15px]">
            已完成 <b className="tabular">{done}</b> / {total} 项
          </div>
        </div>
        <a href={href('checklist')} className="ml-auto shrink-0 rounded-full border border-line px-3 py-1.5 text-[12.5px] hover:border-ink/40">
          全部清单
        </a>
      </div>
      <div className="mt-4 text-[12px] font-medium text-ink-2">下一项待办</div>
      <ul className="mt-1 divide-y divide-line/70">
        {open.slice(0, 4).map((c) => (
          <li key={c.id} className="flex items-start gap-3 py-2.5">
            <button
              type="button"
              aria-label={`标记完成：${c.label}`}
              onClick={() => mutate((s) => void (s.checklist.find((x) => x.id === c.id)!.done = true))}
              className="group/check mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-ink/30 transition hover:border-forest"
            >
              <Check size={13} strokeWidth={3} className="text-forest opacity-0 transition group-hover/check:opacity-100" />
            </button>
            <span className="min-w-0 flex-1 text-[14px] leading-snug">{c.label}</span>
            <span className="flex shrink-0 gap-1">
              {c.priority && <Tag>优先</Tag>}
              <Tag tone="plain">{GROUP_LABEL[c.group]}</Tag>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MoneyCard({ state }: { state: AppState }) {
  const s = summarize(state);
  const { displayCurrency: dc, rates } = state.settings;
  const fmt = (v: number) => formatDisplay(v, dc, rates);
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="eyebrow">费用概览</div>
        <a href={href('budget')} className="text-[12.5px] text-ink-2 underline-offset-2 hover:underline">
          明细
        </a>
      </div>
      <div className="mt-2 text-[12.5px] text-ink-2">已确认基础总金额</div>
      <div className="tabular font-display text-[34px] font-light leading-tight">{fmt(s.confirmedBase)}</div>
      {s.points.map((p) => (
        <div key={p.program} className="tabular text-[13px] text-gold-ink">
          + {formatPoints(p.amount)} {p.program} 积分
        </div>
      ))}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <div>
          <dt className="text-muted">已付款</dt>
          <dd className="tabular font-medium">{fmt(s.paid)}</dd>
        </div>
        <div>
          <dt className="text-muted">扣款待确认</dt>
          <dd className="tabular font-medium">{fmt(s.unverified)}</dd>
        </div>
        <div>
          <dt className="text-muted">预估总支出</dt>
          <dd className="tabular font-medium">{fmt(s.projected)}</dd>
        </div>
        <div>
          <dt className="text-muted">待支付（含估算）</dt>
          <dd className="tabular font-medium">{fmt(s.toPay)}</dd>
        </div>
      </dl>
      {s.missing.length > 0 && <div className="mt-3 text-[12px] text-gold-ink">{s.missing.length} 项未填写金额或缺少汇率，预估总额偏低</div>}
      <div className="mt-2 text-[11.5px] text-muted">已确认基础总金额 ≠ 全额已付款；去程机票未购买，不计入。</div>
    </Card>
  );
}

function KeyDates({ state }: { state: AppState }) {
  const now = useNow(60000);
  const car = state.car;
  const items: { label: string; when: string; value: ReactNode; tone?: 'warn' }[] = [];
  for (const h of state.hotels) {
    if (!h.cancel.refundable || !h.cancel.deadlineDate) continue;
    const d = daysUntilDate(h.cancel.deadlineDate, now);
    items.push({
      label: `${h.name} 免费取消截止`,
      when: `${fmtDateZh(h.cancel.deadlineDate)} 前`,
      value: d >= 0 ? `还有 ${d} 天` : '已过截止日',
      tone: d >= 0 && d <= 14 ? 'warn' : undefined,
    });
  }
  items.push({ label: '取车 · 新千岁', when: '2/13 14:00 JST', value: <InlineCountdown target={new Date(car.pickupAt)} /> });
  items.push({ label: '还车 · 新千岁', when: '2/19 14:00 JST', value: <InlineCountdown target={new Date(car.returnAt)} /> });
  const ret = flightDeparture(state.returnFlight);
  if (ret) items.push({ label: `${state.returnFlight.flightNo} 起飞`, when: '2/19 19:35 JST', value: <InlineCountdown target={ret} /> });
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-gold-ink" />
        <div className="eyebrow">关键时间</div>
      </div>
      <ul className="mt-2 divide-y divide-line/70">
        {items.map((i) => (
          <li key={i.label} className="flex items-baseline justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[14px]">{i.label}</div>
              <div className="font-mono text-[11.5px] text-muted">{i.when}</div>
            </div>
            <div className={`shrink-0 text-right text-[13px] ${i.tone === 'warn' ? 'font-semibold text-danger' : 'text-ink-2'}`}>{i.value}</div>
          </li>
        ))}
      </ul>
      <div className="mt-1 text-[11.5px] text-muted">取消截止只按日期计算；具体时刻与时区以订单为准。</div>
    </Card>
  );
}

function Stays({ state }: { state: AppState }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
      {state.hotels.map((h) => (
        <a key={h.id} href={href('hotels', h.id)} className="group w-[220px] shrink-0 snap-start sm:w-auto">
          <Cover imageKey={`hotel:${h.id}`} scene={h.scene} className="aspect-[4/3] rounded-2xl" />
          <div className="mt-2 font-mono text-[10.5px] tracking-[0.12em] text-muted">
            {fmtDateDot(h.checkIn)} – {fmtDateDot(h.checkOut)} · {nightsBetween(h.checkIn, h.checkOut)} 晚
          </div>
          <div className="text-[14.5px] font-semibold leading-snug group-hover:underline">{h.name}</div>
          <div className="text-[12.5px] text-ink-2">{h.cityZh}</div>
        </a>
      ))}
    </div>
  );
}

export function Dashboard() {
  const state = useAppState();
  const now = useNow(60000);
  const today = currentDay(state.days, now, flightArrival(state.outbound));
  return (
    <>
      <Hero state={state} />
      <div className="gutter">
        <div className="mx-auto max-w-[1100px]">
          <div className="mt-6 grid items-start gap-4 md:grid-cols-[1.25fr_1fr]">
            <TodayCard state={state} />
            <Card className="overflow-hidden">
              <div className="flex items-baseline justify-between px-5 pt-4">
                <div className="eyebrow">路线 · ROUTE</div>
                <a href={href('transport')} className="text-[12.5px] text-ink-2 underline-offset-2 hover:underline">
                  驾驶路线
                </a>
              </div>
              <div className="px-2 pb-2">
                <RouteMap current={today?.regionId} />
              </div>
            </Card>
          </div>
          <div className="mt-4 grid items-start gap-4 md:grid-cols-3">
            <TodoCard state={state} />
            <MoneyCard state={state} />
            <KeyDates state={state} />
          </div>
          <div className="mb-3 mt-10 flex items-baseline justify-between border-b border-line pb-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">6 晚住宿 · Stays</h2>
            <a href={href('hotels')} className="text-[12.5px] text-ink-2 underline-offset-2 hover:underline">
              全部酒店
            </a>
          </div>
          <Stays state={state} />
        </div>
      </div>
    </>
  );
}
