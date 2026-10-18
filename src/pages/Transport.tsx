import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Globe, Luggage, Minus, Pencil, Plane, Plus, ShieldCheck, Users } from 'lucide-react';
import type { AppState, Currency, FlightBooking, FlightOption } from '../lib/types';
import { mutate, useAppState } from '../lib/store';
import { bookingTime, fmtDateDot, weekdayEn } from '../lib/time';
import { formatMoney, formatPoints } from '../lib/money';
import { mapDirections } from '../lib/links';
import { WEATHER_LINKS } from '../lib/content';
import { OFFSET_OPTIONS, PAYMENT_OPTIONS } from '../lib/options';
import { removeWithUndo } from '../lib/actions';
import { toast } from '../lib/toast';
import { Cover } from '../components/Cover';
import { InlineCountdown } from '../components/Countdown';
import {
  Button,
  Card,
  CheckRow,
  Empty,
  KV,
  LinkPill,
  MapLinks,
  NumberField,
  PageHeader,
  PayBadge,
  SectionTitle,
  SelectField,
  Sheet,
  STATUS_OPTIONS,
  StatusBadge,
  Tag,
  TextArea,
  TextField,
} from '../components/ui';

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'CAD', label: 'CAD 加币' },
  { value: 'JPY', label: 'JPY 日元' },
  { value: 'CNY', label: 'CNY 人民币' },
];

function blankOutbound(opt?: FlightOption): FlightBooking {
  const arrive = opt ? opt.arrival.slice(0, 16) : '';
  return {
    airline: opt?.airline ?? '',
    flightNo: '',
    from: 'YVR',
    to: 'CTS',
    departLocal: '',
    departOffset: '-08:00',
    arriveLocal: arrive,
    arriveOffset: '+09:00',
    connection: '',
    cashTotal: null,
    cashPerPerson: true,
    currency: 'CAD',
    points: null,
    pointsProgram: '',
    baggage: '',
    seats: '',
    confirmationNo: '',
    status: 'confirmed',
    payment: 'paid',
    note: '',
  };
}

function FlightForm({ open, onClose, initial, kind }: { open: boolean; onClose: () => void; initial: FlightBooking; kind: 'outbound' | 'return' }) {
  const [d, setD] = useState(initial);
  useEffect(() => {
    if (open) setD(initial);
  }, [open, initial]);
  const set = <K extends keyof FlightBooking>(k: K, v: FlightBooking[K]) => setD((x) => ({ ...x, [k]: v }));
  const save = () => {
    mutate((s) => {
      if (kind === 'outbound') s.outbound = d;
      else s.returnFlight = d;
    });
    toast(kind === 'outbound' ? '去程航班已保存' : '回程航班已保存');
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind === 'outbound' ? '录入实际购买的去程航班' : '编辑回程航班'}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button tone="primary" onClick={save}>
            保存
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        {kind === 'outbound' && <p className="col-span-2 rounded-xl bg-warn px-3 py-2 text-[12.5px] text-gold-ink">请按电子客票逐项核对。航空公司与抵达时间来自候选方案，仅作预填。</p>}
        <TextField label="航空公司" value={d.airline} onChange={(v) => set('airline', v)} />
        <TextField label="航班号" value={d.flightNo} onChange={(v) => set('flightNo', v)} placeholder="未填写" />
        <TextField label="出发机场" value={d.from} onChange={(v) => set('from', v.toUpperCase())} />
        <TextField label="到达机场" value={d.to} onChange={(v) => set('to', v.toUpperCase())} />
        <TextField label="起飞（当地时间）" type="datetime-local" value={d.departLocal} onChange={(v) => set('departLocal', v)} />
        <SelectField label="起飞地时区" value={d.departOffset} onChange={(v) => set('departOffset', v)} options={OFFSET_OPTIONS} />
        <TextField label="抵达（当地时间）" type="datetime-local" value={d.arriveLocal} onChange={(v) => set('arriveLocal', v)} />
        <SelectField label="抵达地时区" value={d.arriveOffset} onChange={(v) => set('arriveOffset', v)} options={OFFSET_OPTIONS} />
        <TextField className="col-span-2" label="转机机场与时长" value={d.connection} onChange={(v) => set('connection', v)} placeholder="例如 ICN 5h30m" />
        <NumberField label="现金票价" value={d.cashTotal} onChange={(v) => set('cashTotal', v)} />
        <SelectField label="币种" value={d.currency} onChange={(v) => set('currency', v)} options={CURRENCY_OPTIONS} />
        <SelectField
          className="col-span-2"
          label="票价口径"
          value={d.cashPerPerson ? 'pp' : 'total'}
          onChange={(v) => set('cashPerPerson', v === 'pp')}
          options={[
            { value: 'pp', label: '每人（按旅客人数自动乘算）' },
            { value: 'total', label: '订单合计' },
          ]}
        />
        <NumberField label="积分（如有）" value={d.points} onChange={(v) => set('points', v)} />
        <TextField label="积分计划" value={d.pointsProgram} onChange={(v) => set('pointsProgram', v)} placeholder="Aeroplan / SKYPASS …" />
        <TextField label="行李额度" value={d.baggage} onChange={(v) => set('baggage', v)} />
        <TextField label="选座" value={d.seats} onChange={(v) => set('seats', v)} />
        <TextField className="col-span-2" label="订单号 / PNR" value={d.confirmationNo} onChange={(v) => set('confirmationNo', v)} />
        <SelectField label="状态" value={d.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} />
        <SelectField label="付款" value={d.payment} onChange={(v) => set('payment', v)} options={[...PAYMENT_OPTIONS, { value: 'estimate', label: '估算' }]} />
        <div className="col-span-2">
          <TextArea label="备注" value={d.note} onChange={(v) => set('note', v)} rows={2} />
        </div>
      </div>
    </Sheet>
  );
}

function fmtLocal(local: string) {
  if (!local) return { date: '', time: '—' };
  const date = local.slice(0, 10);
  return { date: `${fmtDateDot(date)} ${weekdayEn(date)}`, time: local.slice(11, 16) };
}

function tzName(offset: string) {
  return offset === '+09:00' ? 'JST' : offset === '-08:00' ? 'PST' : offset ? `UTC${offset}` : '时区未填';
}

function BoardingPass({ f, label, onEdit, extra }: { f: FlightBooking; label: string; onEdit: () => void; extra?: ReactNode }) {
  const dep = fmtLocal(f.departLocal);
  const arr = fmtLocal(f.arriveLocal);
  const depAt = bookingTime(f.departLocal, f.departOffset);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-line px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Plane size={16} className="text-gold-ink" />
          <span className="eyebrow">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={f.status} compact />
          <PayBadge payment={f.payment} />
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[15px] font-semibold">
            {f.airline || <Empty>航空公司未填写</Empty>} <span className="font-mono text-gold-ink">{f.flightNo}</span>
          </div>
          {depAt && <span className="text-[12.5px] text-ink-2">起飞倒计时 <InlineCountdown target={depAt} /></span>}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div>
            <div className="font-mono text-[40px] font-medium leading-none tracking-wider">{f.from}</div>
            <div className="tabular mt-2 font-display text-[28px] font-light leading-none">{dep.time}</div>
            <div className="mt-1 font-mono text-[11px] tracking-[0.1em] text-muted">
              {dep.date} · {tzName(f.departOffset)}
            </div>
          </div>
          <div className="mb-8 flex flex-col items-center text-muted">
            <span className="h-px w-14 bg-line sm:w-24" />
          </div>
          <div className="text-right">
            <div className="font-mono text-[40px] font-medium leading-none tracking-wider">{f.to}</div>
            <div className="tabular mt-2 font-display text-[28px] font-light leading-none">{arr.time}</div>
            <div className="mt-1 font-mono text-[11px] tracking-[0.1em] text-muted">
              {arr.date} · {tzName(f.arriveOffset)}
            </div>
          </div>
        </div>
        <dl className="mt-5">
          <KV k="现金">{f.cashTotal !== null ? `${formatMoney(f.cashTotal, f.currency)}${f.cashPerPerson ? ' / 人' : ''}` : <Empty>未填写</Empty>}</KV>
          {f.points ? (
            <KV k="积分">
              <span className="tabular">{formatPoints(f.points)}</span> {f.pointsProgram} points <span className="text-[12px] text-muted">（单独记录，不折算现金）</span>
            </KV>
          ) : null}
          <KV k="转机">{f.connection || <Empty>{f.from === 'CTS' ? '未填写' : '待确认'}</Empty>}</KV>
          <KV k="行李额度">{f.baggage || <Empty>未填写</Empty>}</KV>
          <KV k="选座">{f.seats || <Empty>未填写</Empty>}</KV>
          <KV k="订单号">{f.confirmationNo ? <span className="font-mono">{f.confirmationNo}</span> : <Empty>未填写</Empty>}</KV>
          {f.note && <KV k="备注">{f.note}</KV>}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onEdit}>
            <Pencil size={14} />
            编辑
          </Button>
          {extra}
        </div>
      </div>
    </Card>
  );
}

function OutboundCandidates({ state, onBook }: { state: AppState; onBook: (o: FlightOption) => void }) {
  const n = state.travelers.length;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {state.outboundOptions.map((o, i) => {
        const chosen = state.settings.outboundBudgetOption === o.id;
        const arr = o.arrival.slice(11, 16);
        return (
          <Card key={o.id} className={`p-5 ${chosen ? 'ring-1 ring-gold' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow">候选 {String.fromCharCode(65 + i)} · OPTION</div>
                <div className="mt-1 text-[19px] font-semibold">
                  {o.airlineZh} <span className="font-display font-normal italic text-ink-2">{o.airline}</span>
                </div>
                <div className="text-[13px] text-ink-2">{o.cabin}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status="planned" compact />
                <Tag>未购买</Tag>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <div className="tabular font-display text-[34px] font-light leading-none">{formatMoney(o.pricePerPerson, o.currency)}</div>
                <div className="mt-1 text-[12.5px] text-muted">
                  每人 · {n} 人合计 <span className="tabular">{formatMoney(o.pricePerPerson * n, o.currency)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[11px] tracking-[0.12em] text-muted">ARRIVE CTS</div>
                <div className="tabular font-display text-[30px] font-light leading-none">{arr}</div>
                <div className="font-mono text-[11px] text-muted">2.13 SAT · JST</div>
              </div>
            </div>
            <dl className="mt-4">
              <KV k="行李">{o.baggage}</KV>
              <KV k="转机">{o.connection}</KV>
              <KV k="优势">{o.pros}</KV>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button tone={chosen ? 'primary' : 'quiet'} onClick={() => mutate((s) => void (s.settings.outboundBudgetOption = o.id))}>
                {chosen ? '预算按此方案估算' : '按此方案估算预算'}
              </Button>
              <Button onClick={() => onBook(o)}>录入实际购买</Button>
              <LinkPill href={o.website} icon={<Globe size={14} />}>
                官网
              </LinkPill>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Stepper({ label, value, onChange, max = 9 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-[14px]">{label}</span>
      <span className="flex items-center gap-1">
        <button type="button" aria-label={`减少${label}`} onClick={() => onChange(Math.max(0, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink/40">
          <Minus size={14} />
        </button>
        <span className="tabular w-7 text-center text-[16px] font-semibold">{value}</span>
        <button type="button" aria-label={`增加${label}`} onClick={() => onChange(Math.min(max, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink/40">
          <Plus size={14} />
        </button>
      </span>
    </div>
  );
}

function CapacityCheck({ state }: { state: AppState }) {
  const { luggage, car, travelers } = state;
  const big = luggage.suitcase28 + luggage.boardBag + luggage.skiBag;
  const people = travelers.length;
  const warnings: string[] = [];
  if (people > car.seats) warnings.push(`${people} 人超过 ${car.seats} 座，需要更大车型或两辆车`);
  if (big > car.luggageCapacity) warnings.push(`大件 ${big} 件超过页面标示的 ${car.luggageCapacity} 件行李容量，建议升级车型或向租车公司确认`);
  if (people >= 4 && big >= car.luggageCapacity) warnings.push('4 人加满载行李时，后排与后备箱空间会非常紧张');
  const setL = (k: keyof AppState['luggage'], v: number) => mutate((s) => void (s.luggage[k] = v));
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Luggage size={16} className="text-gold-ink" />
        <div className="eyebrow">人数与行李 · 容量检查</div>
      </div>
      <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
        <div className="divide-y divide-line/70">
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="flex items-center gap-2 text-[14px]">
              <Users size={15} /> 旅客人数
            </span>
            <a href="#/settings" className="text-[13px] text-ink-2 underline-offset-2 hover:underline">
              {people} 人 · 去设置修改
            </a>
          </div>
          <Stepper label="28 寸行李箱" value={luggage.suitcase28} onChange={(v) => setL('suitcase28', v)} />
          <Stepper label="单板包" value={luggage.boardBag} onChange={(v) => setL('boardBag', v)} />
          <Stepper label="双板包" value={luggage.skiBag} onChange={(v) => setL('skiBag', v)} />
          <Stepper label="随身小件" value={luggage.carryOn} onChange={(v) => setL('carryOn', v)} />
        </div>
        <div className="mt-3 sm:mt-0">
          {[
            ['座位', people, car.seats],
            ['大件行李', big, car.luggageCapacity],
          ].map(([k, used, cap]) => {
            const ratio = Math.min(1.25, Number(used) / Number(cap));
            const over = Number(used) > Number(cap);
            return (
              <div key={String(k)} className="mb-4">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span>{k}</span>
                  <span className={`tabular ${over ? 'font-semibold text-danger' : 'text-ink-2'}`}>
                    {used} / {cap}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-forest'}`} style={{ width: `${(ratio / 1.25) * 100}%` }} />
                </div>
              </div>
            );
          })}
          <div className="text-[12px] text-muted">容量按租车页面标示（5 座 · 3 件行李）。实际车型可能为同级替代车。</div>
          {warnings.map((w) => (
            <div key={w} className="mt-2 flex gap-2 text-[13px] text-danger">
              <AlertTriangle size={15} className="mt-[2px] shrink-0" />
              {w}
            </div>
          ))}
          {warnings.length === 0 && <div className="mt-2 text-[13px] text-forest">当前人数与行李在标示容量内。</div>}
        </div>
      </div>
    </Card>
  );
}

function CarSection({ state }: { state: AppState }) {
  const car = state.car;
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ confirmationNo: car.confirmationNo, notes: car.notes });
  const toggle = (list: 'checks' | 'amexChecks', id: string, v: boolean) =>
    mutate((s) => void (s.car[list].find((c) => c.id === id)!.done = v));
  return (
    <>
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Cover imageKey="car" scene="niseko" className="aspect-[16/10] md:aspect-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a26]/70 to-transparent" />
            <div className="absolute bottom-0 p-5 text-white">
              <div className="font-mono text-[11px] tracking-[0.16em] text-white/80">SUV · 5 SEATS · AT</div>
              <div className="font-display text-[30px] font-light leading-tight">Subaru Forester</div>
              <div className="text-[13px] text-white/85">or similar · 同级车</div>
            </div>
          </Cover>
          <div className="min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={car.status} />
              <PayBadge payment={car.payment} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="eyebrow">取车 PICK-UP</div>
                <div className="tabular font-display text-[30px] font-light leading-tight">14:00</div>
                <div className="font-mono text-[11.5px] text-muted">2.13 SAT · JST</div>
                <div className="mt-1 text-[12.5px] text-ink-2">
                  <InlineCountdown target={new Date(car.pickupAt)} />
                </div>
              </div>
              <div>
                <div className="eyebrow">还车 RETURN</div>
                <div className="tabular font-display text-[30px] font-light leading-tight">14:00</div>
                <div className="font-mono text-[11.5px] text-muted">2.19 FRI · JST</div>
                <div className="mt-1 text-[12.5px] text-ink-2">
                  <InlineCountdown target={new Date(car.returnAt)} />
                </div>
              </div>
            </div>
            <dl className="mt-4">
              <KV k="平台">
                {car.platform} → 实际租车公司 {car.company}
              </KV>
              <KV k="车型">
                {car.vehicle}
                <div className="text-[12.5px] text-ink-2">{car.vehicleNote}</div>
              </KV>
              <KV k="规格">
                SUV · {car.seats} 座 · {car.transmission} · 页面标示 {car.luggageCapacity} 件行李
              </KV>
              <KV k="租期">6 天 · 2027/2/13 14:00 – 2/19 14:00</KV>
              <KV k="金额">
                <span className="tabular font-medium">{formatMoney(car.price, car.currency)}</span>
              </KV>
              <KV k="取车地点">{car.pickupPlace}</KV>
              <KV k="订单号">{car.confirmationNo ? <span className="font-mono">{car.confirmationNo}</span> : <Empty>未填写</Empty>}</KV>
              {car.notes && <KV k="备注">{car.notes}</KV>}
            </dl>
            <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2">{car.pickupNote}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <MapLinks query="Nippon Rent-A-Car New Chitose Airport" label="营业所地图" />
              <LinkPill href={car.platformUrl}>Klook</LinkPill>
              <LinkPill href={car.companyUrl}>Nippon Rent-A-Car</LinkPill>
              <Button
                onClick={() => {
                  setDraft({ confirmationNo: car.confirmationNo, notes: car.notes });
                  setEdit(true);
                }}
              >
                <Pencil size={14} />
                编辑
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gold-ink" />
            <div className="eyebrow">冬季配置 · ETC · 保险 · 驾照</div>
          </div>
          <div className="mt-1 divide-y divide-line/70">
            {car.checks.map((c) => (
              <CheckRow key={c.id} checked={c.done} onChange={(v) => toggle('checks', c.id, v)}>
                {c.label}
              </CheckRow>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="eyebrow">若依赖 Amex Gold 租车保险</div>
          <p className="mt-2 text-[13px] text-ink-2">逐项向 Amex 核对（以保险证书条款为准），全部确认前不要拒绝租车公司保险。</p>
          <div className="mt-1 divide-y divide-line/70">
            {car.amexChecks.map((c) => (
              <CheckRow key={c.id} checked={c.done} onChange={(v) => toggle('amexChecks', c.id, v)}>
                {c.label}
              </CheckRow>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-4">
        <CapacityCheck state={state} />
      </div>
      <Sheet
        open={edit}
        onClose={() => setEdit(false)}
        title="编辑租车信息"
        footer={
          <>
            <Button tone="ghost" onClick={() => setEdit(false)}>
              取消
            </Button>
            <Button
              tone="primary"
              onClick={() => {
                mutate((s) => {
                  s.car.confirmationNo = draft.confirmationNo;
                  s.car.notes = draft.notes;
                });
                setEdit(false);
                toast('租车信息已保存');
              }}
            >
              保存
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <TextField label="订单号 / 预约号" value={draft.confirmationNo} onChange={(v) => setDraft((d) => ({ ...d, confirmationNo: v }))} placeholder="未填写" />
          <TextArea label="备注（营业所、接驳、保险方案等）" value={draft.notes} onChange={(v) => setDraft((d) => ({ ...d, notes: v }))} />
        </div>
      </Sheet>
    </>
  );
}

function Routes({ state }: { state: AppState }) {
  return (
    <div className="grid gap-x-8 md:grid-cols-2">
      {state.days
        .filter((d) => state.legs.some((l) => l.dayId === d.id))
        .map((d) => (
          <div key={d.id} className="border-b border-line py-3">
            <div className="font-mono text-[11px] tracking-[0.14em] text-muted">
              DAY {d.index} · {fmtDateDot(d.date)} {weekdayEn(d.date)}
            </div>
            {state.legs
              .filter((l) => l.dayId === d.id)
              .map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-medium">
                      {l.from} → {l.to}
                    </div>
                    <div className="font-mono text-[12px] text-ink-2">{l.estimate}</div>
                    {l.note && <div className="text-[12.5px] text-muted">{l.note}</div>}
                  </div>
                  <a
                    href={mapDirections(l.destination, l.origin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-navy px-3.5 py-1.5 text-[12.5px] font-medium text-on-navy"
                  >
                    导航
                  </a>
                </div>
              ))}
          </div>
        ))}
    </div>
  );
}

export default function Transport() {
  const state = useAppState();
  const [form, setForm] = useState<{ open: boolean; kind: 'outbound' | 'return'; initial: FlightBooking }>({ open: false, kind: 'outbound', initial: blankOutbound() });
  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader
          eyebrow="TRANSPORT · 交通"
          title="航班、租车与路线"
          subtitle="国际航班 + 北海道自驾。去程尚未购买；回程 AC54 已确认；Nippon Rent-A-Car 已预订并付款。"
          actions={
            <nav className="flex gap-2 text-[13px]">
              <a href="#flights" className="rounded-full border border-line px-3 py-1.5 hover:border-ink/40" onClick={(e) => (e.preventDefault(), document.getElementById('flights')?.scrollIntoView({ behavior: 'smooth' }))}>
                航班
              </a>
              <a href="#car" className="rounded-full border border-line px-3 py-1.5 hover:border-ink/40" onClick={(e) => (e.preventDefault(), document.getElementById('car')?.scrollIntoView({ behavior: 'smooth' }))}>
                租车
              </a>
              <a href="#routes" className="rounded-full border border-line px-3 py-1.5 hover:border-ink/40" onClick={(e) => (e.preventDefault(), document.getElementById('routes')?.scrollIntoView({ behavior: 'smooth' }))}>
                路线
              </a>
            </nav>
          }
        />

        <SectionTitle id="flights">去程 · YVR → CTS · 2/12</SectionTitle>
        {state.outbound ? (
          <BoardingPass
            f={state.outbound}
            label="去程 OUTBOUND"
            onEdit={() => setForm({ open: true, kind: 'outbound', initial: state.outbound! })}
            extra={
              <Button
                tone="ghost"
                onClick={() =>
                  removeWithUndo('已撤回为候选方案', (s) => {
                    s.outbound = null;
                  })
                }
              >
                撤回为候选
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-[13.5px] text-ink-2">两个方案都还没有购买。预算暂按选中的方案 × {state.travelers.length} 人估算，不计入已确认金额。</p>
            <OutboundCandidates state={state} onBook={(o) => setForm({ open: true, kind: 'outbound', initial: blankOutbound(o) })} />
          </>
        )}

        <SectionTitle>回程 · CTS → YVR · 2/19</SectionTitle>
        <BoardingPass f={state.returnFlight} label="回程 RETURN" onEdit={() => setForm({ open: true, kind: 'return', initial: state.returnFlight })} />
        <p className="mt-2 text-[12.5px] text-muted">19:35 从新千岁起飞（日本时间），同一日历日 11:50 抵达温哥华（加拿大时间）。</p>

        <SectionTitle id="car">租车 · Nippon Rent-A-Car</SectionTitle>
        <CarSection state={state} />

        <SectionTitle id="routes" aside={<span className="text-[12px] text-muted">车程为参考，冬季以实时导航为准</span>}>
          驾驶路线
        </SectionTitle>
        <Routes state={state} />
        <div className="mt-4 flex flex-wrap gap-2">
          {WEATHER_LINKS.map((l) => (
            <LinkPill key={l.url} href={l.url}>
              {l.label}
            </LinkPill>
          ))}
        </div>
      </div>
      <FlightForm open={form.open} onClose={() => setForm((f) => ({ ...f, open: false }))} initial={form.initial} kind={form.kind} />
    </div>
  );
}
