import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BedDouble, Mountain, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Activity, AppState, Day } from '../lib/types';
import { mutate, uid, useAppState } from '../lib/store';
import { href, navigate } from '../lib/router';
import { currentDay, flightArrival, fmtDateDot, fmtDateZh, weekdayEn } from '../lib/time';
import { regionById, spotsFor } from '../lib/content';
import { mapDirections, mapSearch } from '../lib/links';
import { removeWithUndo, useNow } from '../lib/actions';
import { toast } from '../lib/toast';
import { Cover } from '../components/Cover';
import { ActivityForm } from '../components/ActivityForm';
import { KIND_META, KindIcon } from '../components/DayBits';
import { Button, Card, IconButton, LinkPill, MapLinks, SectionTitle, StatusBadge, Tag } from '../components/ui';

function DayStrip({ days, active, today }: { days: Day[]; active: string; today?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [active]);
  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {days.map((d) => {
        const on = d.id === active;
        return (
          <a
            key={d.id}
            href={href('itinerary', d.id)}
            aria-current={on ? 'page' : undefined}
            className={`relative flex w-[84px] shrink-0 flex-col rounded-2xl border px-3 py-2.5 transition ${on ? 'border-navy bg-navy text-on-navy' : 'border-line bg-surface hover:border-ink/30'}`}
          >
            <span className={`font-mono text-[10px] tracking-[0.14em] ${on ? 'opacity-75' : 'text-muted'}`}>DAY {d.index}</span>
            <span className="tabular font-display text-[24px] font-light leading-tight">{fmtDateDot(d.date)}</span>
            <span className={`font-mono text-[10px] tracking-[0.14em] ${on ? 'opacity-75' : 'text-muted'}`}>{weekdayEn(d.date)}</span>
            {today === d.id && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" title="今天" />}
          </a>
        );
      })}
    </div>
  );
}

function Timeline({ day, onEdit }: { day: Day; onEdit: (a: Activity) => void }) {
  const move = (i: number, dir: -1 | 1) =>
    mutate((s) => {
      const list = s.days.find((d) => d.id === day.id)!.activities;
      const j = i + dir;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    });
  if (day.activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-[14px] text-ink-2">
        这一天还没有活动。
        <br />
        从下方「候选目的地」加入，或点「添加活动」自己写。
      </div>
    );
  }
  return (
    <ol className="relative">
      <span className="absolute bottom-3 left-[70.5px] top-3 w-px bg-line" aria-hidden />
      {day.activities.map((a, i) => (
        <li key={a.id} className="group relative grid grid-cols-[48px_22px_1fr] gap-x-3 py-3">
          <div className="tabular pt-0.5 text-right font-mono text-[13px] text-ink-2">
            {a.time || <span className="text-line">—</span>}
            {a.endTime && <div className="text-[11px] text-muted">{a.endTime}</div>}
          </div>
          <div className="relative flex justify-center pt-0.5">
            <span
              className={`z-[1] flex h-[22px] w-[22px] items-center justify-center rounded-full border ${
                a.status === 'confirmed'
                  ? 'border-forest bg-forest text-bg'
                  : a.status === 'planned'
                    ? 'border-ink/60 bg-bg text-ink'
                    : 'border-dashed border-gold bg-bg text-gold-ink'
              }`}
              title={KIND_META[a.kind].label}
            >
              <KindIcon kind={a.kind} size={12} />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
              <h3 className={`min-w-0 text-[15.5px] leading-snug ${a.important ? 'font-semibold' : 'font-medium'} ${a.status === 'optional' ? 'text-ink-2' : ''}`}>{a.title}</h3>
              <StatusBadge status={a.status} compact />
              {a.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            {a.titleEn && <div className="mt-0.5 font-display text-[15px] italic text-muted">{a.titleEn}</div>}
            {a.note && <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-2">{a.note}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {a.place && (
                <>
                  <a href={mapSearch(a.place)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 hover:border-ink/40">
                    地图
                  </a>
                  <a href={mapDirections(a.place)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 hover:border-ink/40">
                    导航
                  </a>
                </>
              )}
              <span className="ml-auto flex items-center opacity-80 transition group-hover:opacity-100">
                <IconButton label="上移" onClick={() => move(i, -1)} className="h-8 w-8">
                  <ArrowUp size={15} />
                </IconButton>
                <IconButton label="下移" onClick={() => move(i, 1)} className="h-8 w-8">
                  <ArrowDown size={15} />
                </IconButton>
                <IconButton label="编辑" onClick={() => onEdit(a)} className="h-8 w-8">
                  <Pencil size={15} />
                </IconButton>
                <IconButton
                  label="删除"
                  className="h-8 w-8"
                  onClick={() =>
                    removeWithUndo(`已删除「${a.title}」`, (s) => {
                      const d = s.days.find((x) => x.id === day.id)!;
                      d.activities = d.activities.filter((x) => x.id !== a.id);
                    })
                  }
                >
                  <Trash2 size={15} />
                </IconButton>
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Candidates({ day, state }: { day: Day; state: AppState }) {
  const regionIds = day.regionId ? [day.regionId] : [];
  const spots = regionIds.flatMap(spotsFor);
  if (spots.length === 0) return null;
  const used = new Set(state.days.flatMap((d) => d.activities.map((a) => a.spotId).filter(Boolean)));
  const add = (spotId: string) => {
    const s = spots.find((x) => x.id === spotId)!;
    mutate((st) => {
      st.days
        .find((d) => d.id === day.id)!
        .activities.push({ id: uid('act'), time: '', endTime: '', title: s.name, titleEn: s.nameEn, kind: s.kind, status: 'optional', tags: [], place: s.place, note: s.desc, spotId: s.id });
    });
    toast(`已加入 Day ${day.index}：${s.name}`);
  };
  return (
    <>
      <SectionTitle aside={<span className="text-[12px] text-muted">不在时间线中，点「加入」才会添加</span>}>候选目的地</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2">
        {spots.map((s) => {
          const inPlan = used.has(s.id);
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3">
              <span className="text-gold-ink">
                <KindIcon kind={s.kind} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-medium leading-tight">
                  {s.name} <span className="font-display text-[14px] italic text-muted">{s.nameEn}</span>
                </div>
                <div className="truncate text-[12.5px] text-ink-2">{s.desc}</div>
              </div>
              <a href={mapSearch(s.place)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[12px] text-ink-2 underline-offset-2 hover:underline">
                地图
              </a>
              <Button tone={inPlan ? 'ghost' : 'quiet'} onClick={() => add(s.id)} className="shrink-0 px-3">
                <Plus size={14} />
                {inPlan ? '再加' : '加入'}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DayNotes({ day }: { day: Day }) {
  const [text, setText] = useState(day.notes);
  useEffect(() => setText(day.notes), [day.id, day.notes]);
  useEffect(() => {
    if (text === day.notes) return;
    const t = setTimeout(() => mutate((s) => void (s.days.find((d) => d.id === day.id)!.notes = text)), 400);
    return () => clearTimeout(t);
  }, [text, day.id, day.notes]);
  return (
    <textarea
      aria-label="当日备注"
      className="field min-h-[96px] resize-y"
      placeholder="当日备注：餐厅预约、停车、集合时间……（自动保存）"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}

export default function Itinerary({ param }: { param: string }) {
  const state = useAppState();
  const now = useNow(60000);
  const today = currentDay(state.days, now, flightArrival(state.outbound));
  const day = state.days.find((d) => d.id === param) ?? today ?? state.days[0];
  const [form, setForm] = useState<{ open: boolean; activity: Activity | null }>({ open: false, activity: null });
  const region = regionById(day.regionId);
  const hotel = state.hotels.find((h) => h.id === day.hotelId);
  const ski = state.skiDays.find((s) => s.dayId === day.id);
  const legs = state.legs.filter((l) => l.dayId === day.id);
  const prev = state.days[day.index - 1];
  const next = state.days[day.index + 1];
  const counts = { confirmed: 0, planned: 0, optional: 0 };
  day.activities.forEach((a) => counts[a.status]++);

  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <div className="eyebrow mb-3">ITINERARY · 行程</div>
        <DayStrip days={state.days} active={day.id} today={today?.id} />

        <Cover imageKey={region ? `region:${region.id}` : 'flight'} scene={region?.scene ?? 'flight'} className="mt-5 h-[180px] rounded-[22px] sm:h-[220px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a26]/80 via-[#0e1a26]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="font-mono text-[11px] tracking-[0.16em] text-white/80">
              DAY {day.index} · {fmtDateZh(day.date)} · {weekdayEn(day.date)}
            </div>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight sm:text-[30px]">{day.title}</h1>
            <div className="font-display text-[17px] italic text-white/85">{day.titleEn}</div>
          </div>
        </Cover>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px]">
          <div>
            <span className="text-muted">路线 </span>
            {day.route}
          </div>
          <div>
            <span className="text-muted">交通 </span>
            {day.transport}
          </div>
          <div>
            <span className="text-muted">主题 </span>
            {day.theme}
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            {day.warnings.length > 0 && (
              <div className="mb-5 rounded-2xl bg-warn px-4 py-3">
                {day.warnings.map((w) => (
                  <div key={w} className="flex gap-2 py-1 text-[13.5px] leading-snug text-gold-ink">
                    <AlertTriangle size={15} className="mt-[2px] shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">时间线 · Timeline</h2>
              <div className="flex items-center gap-3 text-[12px] text-muted">
                <span>{counts.confirmed} 已确认</span>
                <span>{counts.planned} 计划</span>
                <span>{counts.optional} 可选</span>
              </div>
            </div>
            <Timeline day={day} onEdit={(a) => setForm({ open: true, activity: a })} />
            <div className="mt-3">
              <Button tone="primary" onClick={() => setForm({ open: true, activity: null })}>
                <Plus size={16} />
                添加活动
              </Button>
            </div>
            <Candidates day={day} state={state} />
            <SectionTitle>当日备注</SectionTitle>
            <DayNotes day={day} />
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            {hotel && (
              <Card className="overflow-hidden">
                <Cover imageKey={`hotel:${hotel.id}`} scene={hotel.scene} className="h-[120px]" />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[12px] text-muted">
                    <BedDouble size={14} /> 今晚住宿
                  </div>
                  <div className="mt-1 text-[16px] font-semibold leading-snug">{hotel.name}</div>
                  <div className="text-[13px] text-ink-2">{hotel.roomType}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                    <StatusBadge status={hotel.status} compact />
                    <span className="font-mono text-ink-2">
                      入住 {hotel.checkInTime || '待确认'} · 退房 {hotel.checkOutTime || '待确认'}
                    </span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink-2">早餐：{hotel.breakfastNote}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <MapLinks query={hotel.mapQuery} />
                    <LinkPill href={href('hotels', hotel.id)} icon={<ArrowRight size={14} />}>
                      详情
                    </LinkPill>
                  </div>
                </div>
              </Card>
            )}
            {ski && (
              <a href={href('ski')} className="block rounded-[18px] border border-line bg-surface p-4 hover:border-ink/30">
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <Mountain size={14} /> 滑雪日
                </div>
                <div className="mt-1 text-[15px] font-semibold">{ski.area}</div>
                <div className="mt-1 font-mono text-[12.5px] text-ink-2">
                  出发 {ski.departTime || '待定'} · 预计回酒店 {ski.returnTime || '待定'}
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {state.travelers.map((t) => {
                    const c = ski.cover[t.id];
                    return (
                      <div key={t.id} className="flex items-baseline gap-2 text-[12.5px]">
                        <span className="w-12 shrink-0 text-muted">{t.label}</span>
                        <span className="min-w-0">{c ? c.method : '未设置'}</span>
                      </div>
                    );
                  })}
                </div>
              </a>
            )}
            {legs.length > 0 && (
              <Card className="p-4">
                <div className="text-[12px] text-muted">驾驶路线</div>
                <ul className="mt-1 divide-y divide-line/70">
                  {legs.map((l) => (
                    <li key={l.id} className="py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-medium">
                          {l.from} → {l.to}
                        </span>
                        <a href={mapDirections(l.destination, l.origin)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[12.5px] text-gold-ink underline-offset-2 hover:underline">
                          导航
                        </a>
                      </div>
                      <div className="font-mono text-[11.5px] text-muted">{l.estimate}</div>
                      {l.note && <div className="text-[12px] text-ink-2">{l.note}</div>}
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-muted">车程为参考，冬季以实时导航为准。</div>
              </Card>
            )}
            {region && (
              <a href={href('explore', region.id)} className="block rounded-[18px] border border-line bg-surface p-4 hover:border-ink/30">
                <div className="text-[12px] text-muted">目的地</div>
                <div className="mt-0.5 text-[15px] font-semibold">
                  {region.name} <span className="font-display font-normal italic text-muted">{region.nameEn}</span>
                </div>
                <div className="mt-1 line-clamp-3 text-[12.5px] text-ink-2">{region.intro}</div>
              </a>
            )}
          </aside>
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-4">
          {prev ? (
            <Button tone="ghost" onClick={() => navigate('itinerary', prev.id)}>
              <ArrowLeft size={16} /> Day {prev.index}
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button tone="ghost" onClick={() => navigate('itinerary', next.id)}>
              Day {next.index} <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
      <ActivityForm open={form.open} onClose={() => setForm((f) => ({ ...f, open: false }))} days={state.days} dayId={day.id} initial={form.activity} />
    </div>
  );
}
