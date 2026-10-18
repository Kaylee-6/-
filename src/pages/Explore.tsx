import { useState } from 'react';
import { ArrowLeft, CalendarPlus, MapPin } from 'lucide-react';
import type { AppState, Region, Spot } from '../lib/types';
import { mutate, uid, useAppState } from '../lib/store';
import { REGIONS, regionById, spotsFor } from '../lib/content';
import { mapSearch } from '../lib/links';
import { href, navigate } from '../lib/router';
import { fmtDateDot, weekdayEn } from '../lib/time';
import { toast } from '../lib/toast';
import { Cover, CoverEditor } from '../components/Cover';
import { KindIcon } from '../components/DayBits';
import { Button, LinkPill, PageHeader, SectionTitle, Sheet } from '../components/ui';

function stayLabel(region: Region, state: AppState) {
  const days = region.dayIds.map((id) => state.days.find((d) => d.id === id)!).filter(Boolean);
  if (days.length === 0) return '';
  const first = days[0];
  const last = days[days.length - 1];
  return first.id === last.id ? `${fmtDateDot(first.date)} ${weekdayEn(first.date)}` : `${fmtDateDot(first.date)} – ${fmtDateDot(last.date)}`;
}

function AddToDay({ spot, region, state }: { spot: Spot; region: Region; state: AppState }) {
  const [open, setOpen] = useState(false);
  const add = (dayId: string) => {
    const day = state.days.find((d) => d.id === dayId)!;
    mutate((s) => {
      s.days
        .find((d) => d.id === dayId)!
        .activities.push({ id: uid('act'), time: '', endTime: '', title: spot.name, titleEn: spot.nameEn, kind: spot.kind, status: 'optional', tags: [], place: spot.place, note: spot.desc, spotId: spot.id });
    });
    setOpen(false);
    toast(`已加入 Day ${day.index}`, { label: '查看', run: () => navigate('itinerary', dayId) });
  };
  const ordered = [...state.days].sort((a, b) => Number(region.dayIds.includes(b.id)) - Number(region.dayIds.includes(a.id)) || a.index - b.index);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="px-3">
        <CalendarPlus size={14} />
        加入日程
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`把「${spot.name}」加入哪一天？`}>
        <div className="flex flex-col gap-2 pb-2">
          {ordered.map((d) => {
            const here = region.dayIds.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => add(d.id)}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition hover:border-ink/40 ${here ? 'border-gold bg-surface' : 'border-line bg-surface/60'}`}
              >
                <span className="font-mono text-[11px] tracking-[0.12em] text-muted">DAY {d.index}</span>
                <span className="tabular font-display text-[22px] font-light">{fmtDateDot(d.date)}</span>
                <span className="min-w-0 flex-1 truncate text-[14px]">{d.title}</span>
                {here && <span className="shrink-0 text-[11.5px] text-gold-ink">在此停留</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] text-muted">加入后为 Optional（可选）状态，可在行程页改时间与状态。</p>
      </Sheet>
    </>
  );
}

function RegionDetail({ region, state }: { region: Region; state: AppState }) {
  const spots = spotsFor(region.id);
  const n = REGIONS.findIndex((r) => r.id === region.id) + 1;
  return (
    <div>
      <Cover imageKey={`region:${region.id}`} scene={region.scene} title={`${region.name}插画`} className="h-[360px] sm:h-[460px]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a26]/85 via-[#0e1a26]/20 to-transparent" />
        <div className="gutter absolute inset-x-0 top-[calc(12px+env(safe-area-inset-top,0px))] flex justify-between">
          <a href={href('explore')} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/35 px-3 text-[12.5px] text-white backdrop-blur">
            <ArrowLeft size={14} /> 全部目的地
          </a>
          <CoverEditor imageKey={`region:${region.id}`} label={region.name} />
        </div>
        <div className="gutter absolute inset-x-0 bottom-0 pb-6 text-white">
          <div className="mx-auto max-w-[1100px]">
            <div className="font-mono text-[11px] tracking-[0.2em] text-white/80">
              {String(n).padStart(2, '0')} / 05 · {stayLabel(region, state)}
            </div>
            <h1 className="mt-1 flex flex-wrap items-baseline gap-x-4">
              <span className="font-display text-[60px] font-light leading-none sm:text-[84px]">{region.nameEn}</span>
              <span className="text-[26px] font-semibold">{region.name}</span>
              <span className="font-display text-[22px] text-white/75">{region.nameJa !== region.name ? region.nameJa : ''}</span>
            </h1>
          </div>
        </div>
      </Cover>
      <div className="gutter">
        <div className="mx-auto max-w-[1100px]">
          <div className="mt-5 flex flex-wrap gap-2">
            {region.keywords.map((k) => (
              <span key={k} className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px]">
                {k}
              </span>
            ))}
          </div>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div className="min-w-0">
              <p className="max-w-[62ch] text-[17px] leading-[1.85]">{region.intro}</p>
              <SectionTitle>推荐玩法</SectionTitle>
              <ol className="flex flex-col">
                {region.experiences.map((e, i) => (
                  <li key={e} className="flex gap-4 border-b border-line/70 py-3 text-[15px]">
                    <span className="tabular w-6 shrink-0 font-display text-[20px] leading-none text-gold-ink">{i + 1}</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="min-w-0">
              <SectionTitle>停留</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {region.dayIds.map((id) => {
                  const d = state.days.find((x) => x.id === id)!;
                  return (
                    <a key={id} href={href('itinerary', id)} className="rounded-2xl border border-line bg-surface px-3 py-2 hover:border-ink/40">
                      <div className="font-mono text-[10.5px] tracking-[0.12em] text-muted">DAY {d.index}</div>
                      <div className="text-[14px]">
                        {fmtDateDot(d.date)} · {d.title}
                      </div>
                    </a>
                  );
                })}
              </div>
              <SectionTitle>当地美食</SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {region.foods.map((f) => (
                  <li key={f} className="rounded-full bg-ice px-3 py-1 text-[13px]">
                    {f}
                  </li>
                ))}
              </ul>
              <SectionTitle>链接</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {region.links.map((l) => (
                  <LinkPill key={l.url} href={l.url}>
                    {l.label}
                  </LinkPill>
                ))}
              </div>
            </aside>
          </div>

          <SectionTitle aside={<span className="text-[12px] text-muted">{spots.length} 处</span>}>主要地点</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((s) => (
              <div key={s.id} className="flex flex-col rounded-[18px] border border-line bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-gold-ink">
                    <KindIcon kind={s.kind} size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15.5px] font-semibold leading-tight">{s.name}</div>
                    <div className="font-display text-[15px] italic text-muted">{s.nameEn}</div>
                  </div>
                </div>
                <p className="mt-2 flex-1 text-[13.5px] text-ink-2">{s.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LinkPill href={mapSearch(s.place)} icon={<MapPin size={14} />}>
                    地图
                  </LinkPill>
                  <AddToDay spot={s} region={region} state={state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Explore({ param }: { param: string }) {
  const state = useAppState();
  const region = regionById(param);
  if (region) return <RegionDetail region={region} state={state} />;
  const [lead, ...rest] = REGIONS;
  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader eyebrow="EXPLORE HOKKAIDO · 目的地" title="五个地方，一条雪线" subtitle="按行程顺序排列：运河小镇、北方都市、两座粉雪山，最后停在火山湖边。" />
        <a href={href('explore', lead.id)} className="group block">
          <Cover imageKey={`region:${lead.id}`} scene={lead.scene} className="aspect-[4/3] rounded-[22px] sm:aspect-[21/9]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a26]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
              <div className="font-mono text-[11px] tracking-[0.2em] text-white/80">01 · {stayLabel(lead, state)}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-[54px] font-light leading-none sm:text-[72px]">{lead.nameEn}</span>
                <span className="text-[22px] font-semibold">{lead.name}</span>
              </div>
              <div className="mt-2 max-w-[56ch] text-[14px] text-white/85">{lead.keywords.join(' · ')}</div>
            </div>
          </Cover>
        </a>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {rest.map((r, i) => (
            <a key={r.id} href={href('explore', r.id)} className="group block">
              <Cover imageKey={`region:${r.id}`} scene={r.scene} className="aspect-[4/3] rounded-[22px]" />
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted">{String(i + 2).padStart(2, '0')}</span>
                  <span className="font-display text-[32px] font-light leading-none group-hover:underline">{r.nameEn}</span>
                  <span className="text-[16px] font-semibold">{r.name}</span>
                </div>
                <span className="shrink-0 font-mono text-[11.5px] text-muted">{stayLabel(r, state)}</span>
              </div>
              <div className="mt-1 text-[13px] text-ink-2">{r.keywords.join(' · ')}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
