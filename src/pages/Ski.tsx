import { useEffect, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import type { AppState, SkiCover, SkiCoverStatus, SkiDay } from '../lib/types';
import { mutate, uid, useAppState } from '../lib/store';
import { RESORTS } from '../lib/content';
import { fmtDateDot, fmtDateZh, weekdayEn } from '../lib/time';
import { buildRows } from '../lib/budget';
import { formatDisplay, formatMoney } from '../lib/money';
import { href } from '../lib/router';
import { removeWithUndo } from '../lib/actions';
import { toast } from '../lib/toast';
import { Cover } from '../components/Cover';
import { Button, Card, CheckRow, IconButton, LinkPill, MapLinks, PageHeader, PayBadge, SectionTitle, SelectField, Sheet, StatusBadge, Tag, TextArea, TextField } from '../components/ui';

const COVER_STATUS: Record<SkiCoverStatus, { label: string; cls: string }> = {
  'pass-verify': { label: '通票 · 待核实', cls: 'bg-warn text-gold-ink' },
  'pass-pending': { label: '通票 · 待确认是否购买', cls: 'bg-warn text-gold-ink' },
  'to-buy': { label: '需购买 · 未购买', cls: 'bg-danger/12 text-danger' },
  bought: { label: '已购买 / 已兑换', cls: 'bg-forest text-bg' },
  unset: { label: '未设置', cls: 'bg-surface-2 text-muted' },
};

const STATUS_OPTS = (Object.keys(COVER_STATUS) as SkiCoverStatus[]).map((k) => ({ value: k, label: COVER_STATUS[k].label }));

function dayStatusText(sd: SkiDay, state: AppState): string {
  const covers = state.travelers.map((t) => sd.cover[t.id]?.status ?? 'unset');
  if (covers.every((c) => c === 'bought')) return '雪票全部确认';
  if (covers.includes('pass-verify')) return '计划确定 · 通票资格待核实';
  return '计划确定 · 雪票未确认';
}

function CoverEditor({ open, onClose, sd, travelerId, state }: { open: boolean; onClose: () => void; sd: SkiDay; travelerId: string; state: AppState }) {
  const current: SkiCover = sd.cover[travelerId] ?? { method: '', status: 'unset', note: '' };
  const [d, setD] = useState(current);
  useEffect(() => {
    if (open) setD(sd.cover[travelerId] ?? { method: '', status: 'unset', note: '' });
  }, [open, sd, travelerId]);
  const resort = RESORTS.find((r) => r.id === sd.resortId);
  const ikonOnRusutsu = sd.resortId === 'rusutsu' && /ikon/i.test(d.method);
  const traveler = state.travelers.find((t) => t.id === travelerId);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${traveler?.label ?? ''} · ${fmtDateDot(state.days.find((x) => x.id === sd.dayId)!.date)} ${resort?.name ?? ''}`}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            tone="primary"
            disabled={ikonOnRusutsu}
            onClick={() => {
              mutate((s) => {
                s.skiDays.find((x) => x.dayId === sd.dayId)!.cover[travelerId] = d;
              });
              toast('雪票安排已保存');
              onClose();
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <TextField label="使用方式" value={d.method} onChange={(v) => setD({ ...d, method: v })} placeholder="例如：Rusutsu 两日票 / Epic Pass" />
        {ikonOnRusutsu && (
          <div className="flex gap-2 rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">
            <AlertTriangle size={15} className="mt-[2px] shrink-0" />
            Ikon Pass 不覆盖 Rusutsu（Rusutsu 是 Epic Pass 合作雪场），不能这样设置。
          </div>
        )}
        <SelectField label="状态" value={d.status} onChange={(v) => setD({ ...d, status: v })} options={STATUS_OPTS} />
        <TextArea label="备注" value={d.note} onChange={(v) => setD({ ...d, note: v })} rows={2} />
      </div>
    </Sheet>
  );
}

function TimesEditor({ open, onClose, sd }: { open: boolean; onClose: () => void; sd: SkiDay }) {
  const [d, setD] = useState(sd);
  useEffect(() => {
    if (open) setD(sd);
  }, [open, sd]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="出发与返回时间"
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            tone="primary"
            onClick={() => {
              mutate((s) => {
                const i = s.skiDays.findIndex((x) => x.dayId === sd.dayId);
                s.skiDays[i] = { ...s.skiDays[i], area: d.area, departFrom: d.departFrom, departTime: d.departTime, returnTo: d.returnTo, returnTime: d.returnTime, note: d.note };
              });
              toast('已保存');
              onClose();
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        <TextField className="col-span-2" label="雪区" value={d.area} onChange={(v) => setD({ ...d, area: v })} />
        <TextField label="出发地点" value={d.departFrom} onChange={(v) => setD({ ...d, departFrom: v })} />
        <TextField label="出发时间" type="time" value={d.departTime} onChange={(v) => setD({ ...d, departTime: v })} />
        <TextField label="返回地点" value={d.returnTo} onChange={(v) => setD({ ...d, returnTo: v })} />
        <TextField label="预计回到酒店" type="time" value={d.returnTime} onChange={(v) => setD({ ...d, returnTime: v })} />
        <div className="col-span-2">
          <TextArea label="备注" value={d.note} onChange={(v) => setD({ ...d, note: v })} rows={2} />
        </div>
      </div>
    </Sheet>
  );
}

function Gear({ state }: { state: AppState }) {
  const [text, setText] = useState('');
  const done = state.gear.filter((g) => g.done).length;
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div className="eyebrow">装备打包清单</div>
        <span className="tabular text-[12.5px] text-ink-2">
          {done} / {state.gear.length}
        </span>
      </div>
      <div className="mt-1 grid gap-x-8 divide-y divide-line/70 sm:grid-cols-2 sm:divide-y-0">
        {state.gear.map((g) => (
          <div key={g.id} className="group flex items-center gap-1 sm:border-b sm:border-line/70">
            <div className="min-w-0 flex-1">
              <CheckRow checked={g.done} onChange={(v) => mutate((s) => void (s.gear.find((x) => x.id === g.id)!.done = v))}>
                {g.label}
              </CheckRow>
            </div>
            <IconButton
              label={`删除 ${g.label}`}
              className="h-8 w-8 opacity-60 group-hover:opacity-100"
              onClick={() => removeWithUndo(`已删除「${g.label}」`, (s) => void (s.gear = s.gear.filter((x) => x.id !== g.id)))}
            >
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          mutate((s) => void s.gear.push({ id: uid('g'), label: text.trim(), done: false }));
          setText('');
        }}
      >
        <input aria-label="新装备" className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="添加装备…" />
        <Button type="submit" tone="primary" disabled={!text.trim()}>
          <Plus size={15} />
          添加
        </Button>
      </form>
    </Card>
  );
}

export default function Ski() {
  const state = useAppState();
  const [coverEdit, setCoverEdit] = useState<{ dayId: string; travelerId: string } | null>(null);
  const [timesEdit, setTimesEdit] = useState<string | null>(null);
  const skiRows = buildRows(state).filter((r) => r.category === 'ski');
  const { displayCurrency: dc, rates } = state.settings;

  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader eyebrow="SKI · 滑雪" title="三个滑雪日" subtitle="2/16 Niseko United · 2/17–2/18 Rusutsu Resort。日期已确定，所有雪票均未标记为已购买。" />

        <div className="grid gap-4 md:grid-cols-3">
          {state.skiDays.map((sd) => {
            const day = state.days.find((d) => d.id === sd.dayId)!;
            const resort = RESORTS.find((r) => r.id === sd.resortId)!;
            return (
              <Card key={sd.dayId} className="overflow-hidden">
                <Cover imageKey={`region:${resort.regionId}`} scene={resort.scene} className="h-[130px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a26]/75 to-transparent" />
                  <div className="absolute bottom-0 p-4 text-white">
                    <div className="font-mono text-[11px] tracking-[0.14em] text-white/80">
                      DAY {day.index} · {fmtDateDot(day.date)} {weekdayEn(day.date)}
                    </div>
                    <div className="text-[19px] font-semibold">{resort.name}</div>
                  </div>
                </Cover>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status="planned" compact />
                    <Tag>{dayStatusText(sd, state)}</Tag>
                  </div>
                  <div className="mt-2 text-[13.5px]">{sd.area}</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <div className="tabular font-display text-[28px] font-light leading-tight">{sd.departTime || '待定'}</div>
                      <div className="text-[11.5px] leading-snug text-muted">出发 · {sd.departFrom}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="tabular font-display text-[28px] font-light leading-tight">{sd.returnTime || '待定'}</div>
                      <div className="text-[11.5px] leading-snug text-muted">回酒店 · {sd.returnTo}</div>
                    </div>
                  </div>
                  {sd.note && <div className="mt-1 text-[12px] text-muted">{sd.note}</div>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => setTimesEdit(sd.dayId)}>
                      <Pencil size={14} />
                      时间
                    </Button>
                    <LinkPill href={href('itinerary', sd.dayId)}>当天行程</LinkPill>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <SectionTitle aside={<span className="text-[12px] text-muted">点格子修改</span>}>雪票覆盖 · 谁用什么滑</SectionTitle>
        <div className="overflow-x-auto rounded-[18px] border border-line bg-surface">
          <table className="w-full min-w-[620px] border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-medium text-muted">旅客</th>
                {state.skiDays.map((sd) => {
                  const day = state.days.find((d) => d.id === sd.dayId)!;
                  return (
                    <th key={sd.dayId} className="px-4 py-3 font-medium">
                      <div className="font-mono text-[11px] tracking-[0.12em] text-muted">{fmtDateZh(day.date)}</div>
                      {RESORTS.find((r) => r.id === sd.resortId)!.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {state.travelers.map((t) => (
                <tr key={t.id} className="border-b border-line/70 last:border-b-0">
                  <th className="px-4 py-3 align-top font-medium">
                    {t.label}
                    <div className="text-[12px] font-normal text-muted">{[t.name, t.passes].filter(Boolean).join(' · ') || '通票未填写'}</div>
                  </th>
                  {state.skiDays.map((sd) => {
                    const c = sd.cover[t.id];
                    const st = COVER_STATUS[c?.status ?? 'unset'];
                    return (
                      <td key={sd.dayId} className="px-2 py-2 align-top">
                        <button type="button" onClick={() => setCoverEdit({ dayId: sd.dayId, travelerId: t.id })} className="w-full rounded-xl px-2 py-1.5 text-left transition hover:bg-surface-2">
                          <div className="text-[13.5px] leading-snug">{c?.method || '未设置'}</div>
                          <span className={`mt-1 inline-block rounded-md px-1.5 py-[1px] text-[11.5px] ${st.cls}`}>{st.label}</span>
                          {c?.note && <div className="mt-1 text-[11.5px] leading-snug text-muted">{c.note}</div>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex gap-2 text-[12.5px] text-ink-2">
          <AlertTriangle size={14} className="mt-[2px] shrink-0 text-gold-ink" />
          Ikon Pass 不覆盖 Rusutsu。旅客 B 的 Ikon Session Pass 若购买，计划 Niseko 用 1 天，另外 2 天或用于 Revelstoke。
        </div>

        <SectionTitle aside={<a href={href('budget')} className="text-[12.5px] text-ink-2 underline-offset-2 hover:underline">在费用页修改</a>}>雪票预算（估算）</SectionTitle>
        <div className="divide-y divide-line/70 rounded-[18px] border border-line bg-surface px-4">
          {skiRows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <div className="text-[14px] font-medium">{r.name}</div>
                {r.note && <div className="text-[12px] text-muted">{r.note}</div>}
              </div>
              <div className="flex items-center gap-3">
                <PayBadge payment={r.payment} />
                <div className="text-right">
                  <div className="tabular text-[14px] font-medium">{r.original ? formatMoney(r.original.amount, r.original.currency) : '未填写'}</div>
                  {r.original && r.original.currency !== dc && <div className="tabular text-[12px] text-muted">≈ {formatDisplay(r.cad, dc, rates)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">Niseko 1 日票参考约 CAD 110–125、Rusutsu 2 日票参考约 JPY 26,000，均为之前查询的价格，不是已付金额。</p>

        <SectionTitle>雪场</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {RESORTS.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <Cover imageKey={`region:${r.regionId}`} scene={r.scene} className="aspect-[16/9]" />
              <div className="p-5">
                <div className="eyebrow">{r.nameZh}</div>
                <h3 className="font-display text-[28px] font-light leading-tight">{r.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{r.intro}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.terrain.map((t) => (
                    <span key={t} className="rounded-full bg-ice px-2.5 py-1 text-[12px]">
                      {t}
                    </span>
                  ))}
                </div>
                <dl className="mt-4 divide-y divide-line/70">
                  {r.areas.map((a) => (
                    <div key={a.name} className="flex gap-3 py-2 text-[13.5px]">
                      <dt className="w-32 shrink-0 font-medium">{a.name}</dt>
                      <dd className="text-ink-2">{a.desc}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2">{r.passNote}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.links.map((l) => (
                    <LinkPill key={l.url} href={l.url}>
                      {l.label}
                    </LinkPill>
                  ))}
                  <MapLinks query={r.mapQuery} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <SectionTitle>装备</SectionTitle>
        <Gear state={state} />
      </div>

      {coverEdit && (
        <CoverEditor
          open
          onClose={() => setCoverEdit(null)}
          sd={state.skiDays.find((s) => s.dayId === coverEdit.dayId)!}
          travelerId={coverEdit.travelerId}
          state={state}
        />
      )}
      {timesEdit && <TimesEditor open onClose={() => setTimesEdit(null)} sd={state.skiDays.find((s) => s.dayId === timesEdit)!} />}
    </div>
  );
}
