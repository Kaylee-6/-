import { useEffect, useState } from 'react';
import { CalendarDays, Globe, Pencil, Phone, ShoppingBag } from 'lucide-react';
import type { Hotel } from '../lib/types';
import { OFFSET_OPTIONS, PAYMENT_OPTIONS } from '../lib/options';
import { mutate, useAppState } from '../lib/store';
import { fmtDateFull, fmtDateZh, nightsBetween, todayIn } from '../lib/time';
import { formatMoney, sumCad } from '../lib/money';
import { cancelEvents, calendar, downloadText, hasExactDeadline } from '../lib/ics';
import { useNow } from '../lib/actions';
import { toast } from '../lib/toast';
import { Cover, CoverEditor } from '../components/Cover';
import { Button, Card, CopyButton, KV, LinkPill, MapLinks, NumberField, PageHeader, PayBadge, SelectField, Sheet, StatusBadge, Tag, TextArea, TextField, Empty } from '../components/ui';

function daysLeft(date: string, now: Date) {
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
  const a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const b = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

function HotelEditor({ hotel, open, onClose }: { hotel: Hotel; open: boolean; onClose: () => void }) {
  const [d, setD] = useState(hotel);
  useEffect(() => {
    if (open) setD(hotel);
  }, [open, hotel]);
  const set = <K extends keyof Hotel>(k: K, v: Hotel[K]) => setD((x) => ({ ...x, [k]: v }));
  const setCancel = <K extends keyof Hotel['cancel']>(k: K, v: Hotel['cancel'][K]) => setD((x) => ({ ...x, cancel: { ...x.cancel, [k]: v } }));
  const save = () => {
    mutate((s) => {
      const i = s.hotels.findIndex((h) => h.id === hotel.id);
      s.hotels[i] = d;
    });
    toast('酒店信息已保存');
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`编辑 · ${hotel.name}`}
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
        <TextField className="col-span-2" label="订单号" value={d.confirmationNo} onChange={(v) => set('confirmationNo', v)} placeholder="未填写" />
        <TextField className="col-span-2" label="入住人姓名" value={d.guestName} onChange={(v) => set('guestName', v)} placeholder="未填写" />
        <TextField label="入住时间" type="time" value={d.checkInTime} onChange={(v) => set('checkInTime', v)} hint={d.checkInTime ? undefined : '待确认'} />
        <TextField label="退房时间" type="time" value={d.checkOutTime} onChange={(v) => set('checkOutTime', v)} />
        <TextField className="col-span-2" label="房型" value={d.roomType} onChange={(v) => set('roomType', v)} />
        <TextField className="col-span-2" label="早餐说明" value={d.breakfastNote} onChange={(v) => set('breakfastNote', v)} />
        <NumberField label={`订单金额（${d.priceCurrency === 'CNY' ? 'RMB' : d.priceCurrency}）`} value={d.price} onChange={(v) => set('price', v ?? 0)} />
        <NumberField label="加币账目 CAD" value={d.cadLedger} onChange={(v) => set('cadLedger', v)} hint="填写后预算使用此金额，不按汇率换算" />
        <SelectField className="col-span-2" label="付款状态" value={d.payment} onChange={(v) => set('payment', v)} options={PAYMENT_OPTIONS} />
        {d.cancel.refundable && (
          <>
            <TextField label="免费取消截止日期（前）" type="date" value={d.cancel.deadlineDate} onChange={(v) => setCancel('deadlineDate', v)} />
            <TextField label="订单上的截止时刻" type="time" value={d.cancel.deadlineTime} onChange={(v) => setCancel('deadlineTime', v)} hint="以订单为准" />
            <SelectField className="col-span-2" label="截止时刻所用时区" value={d.cancel.deadlineOffset} onChange={(v) => setCancel('deadlineOffset', v)} options={OFFSET_OPTIONS} />
          </>
        )}
        <TextField className="col-span-2" label="酒店电话" value={d.phone} onChange={(v) => set('phone', v)} inputMode="tel" />
        <TextArea label="停车" value={d.parking} onChange={(v) => set('parking', v)} rows={2} />
        <div className="col-span-2">
          <TextArea label="备注" value={d.notes} onChange={(v) => set('notes', v)} />
        </div>
      </div>
    </Sheet>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const now = useNow(60000);
  const [edit, setEdit] = useState(false);
  const nights = nightsBetween(hotel.checkIn, hotel.checkOut);
  const left = hotel.cancel.refundable && hotel.cancel.deadlineDate ? daysLeft(hotel.cancel.deadlineDate, now) : null;
  return (
    <article id={hotel.id} className="scroll-mt-6">
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Cover imageKey={`hotel:${hotel.id}`} scene={hotel.scene} title={`${hotel.name} 意象插画`} className="aspect-[16/10] md:aspect-auto md:min-h-full">
            <div className="absolute right-3 top-3">
              <CoverEditor imageKey={`hotel:${hotel.id}`} label={hotel.name} />
            </div>
            <div className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-white backdrop-blur">
              {nights} NIGHT{nights > 1 ? 'S' : ''} · {hotel.city.toUpperCase()}
            </div>
          </Cover>
          <div className="min-w-0 p-5 sm:p-6">
            <div className="eyebrow">
              {hotel.cityZh} · {fmtDateFull(hotel.checkIn)} – {fmtDateFull(hotel.checkOut)}
            </div>
            <h2 className="mt-1 font-display text-[30px] font-light leading-[1.05]">{hotel.name}</h2>
            <div className="text-[14px] text-ink-2">{hotel.nameZh}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={hotel.status} />
              <PayBadge payment={hotel.payment} />
              {!hotel.cancel.refundable && <Tag>不可取消</Tag>}
            </div>

            <dl className="mt-4">
              <KV k="入住">
                {fmtDateZh(hotel.checkIn)} · <span className="font-mono">{hotel.checkInTime ? `${hotel.checkInTime} 起` : '时间待确认'}</span>
              </KV>
              <KV k="退房">
                {fmtDateZh(hotel.checkOut)} · <span className="font-mono">{hotel.checkOutTime ? `${hotel.checkOutTime} 前` : '时间待确认'}</span>
              </KV>
              <KV k="房型">{hotel.roomType}</KV>
              <KV k="早餐">
                {hotel.breakfast === 'included' ? <Tag tone="ice">含早</Tag> : <Tag tone="plain">不含早</Tag>} <span className="text-ink-2">{hotel.breakfastNote}</span>
              </KV>
              <KV k="预订平台">{hotel.platform}</KV>
              <KV k="金额">
                <span className="tabular font-medium">{formatMoney(hotel.price, hotel.priceCurrency)}</span>
                {hotel.priceCurrency !== 'CAD' && hotel.cadLedger !== null && <span className="tabular text-ink-2"> · 账目 {formatMoney(hotel.cadLedger, 'CAD')}</span>}
                {hotel.credits.map((c) => (
                  <div key={c.label} className="text-[12.5px] text-gold-ink">
                    {c.label} {formatMoney(c.amount, c.currency)}，已体现在现金实付中
                  </div>
                ))}
              </KV>
              <KV k="取消政策">
                {hotel.cancel.refundable ? (
                  <>
                    免费取消截止 <b className="font-semibold">{fmtDateFull(hotel.cancel.deadlineDate)} 前</b>
                    {left !== null && <span className={`ml-2 text-[12.5px] ${left <= 14 && left >= 0 ? 'font-semibold text-danger' : 'text-ink-2'}`}>{left >= 0 ? `还有 ${left} 天` : '已过截止日'}</span>}
                    <div className="text-[12px] text-muted">
                      {hasExactDeadline(hotel) ? `订单时刻：${hotel.cancel.deadlineTime}（UTC${hotel.cancel.deadlineOffset}）` : '具体时刻与时区以订单为准（可在编辑中补填）'}
                    </div>
                  </>
                ) : (
                  hotel.cancel.note
                )}
              </KV>
              <KV k="订单号">{hotel.confirmationNo ? <span className="font-mono">{hotel.confirmationNo}</span> : <Empty>未填写</Empty>}</KV>
              <KV k="入住人">{hotel.guestName || <Empty>未填写</Empty>}</KV>
              <KV k="地址">
                {hotel.address}
                <div className="text-[12.5px] text-ink-2">{hotel.locationNote}</div>
              </KV>
              <KV k="电话">
                {hotel.phone ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <a href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`} className="font-mono underline-offset-2 hover:underline">
                      {hotel.phone}
                    </a>
                    <CopyButton text={hotel.phone} />
                    <span className="w-full text-[12px] text-muted">来源：{hotel.phoneSource}。日本车载导航可用电话号码检索目的地。</span>
                  </span>
                ) : (
                  <Empty>未填写</Empty>
                )}
              </KV>
              <KV k="停车">{hotel.parking}</KV>
              {hotel.notes && <KV k="备注">{hotel.notes}</KV>}
            </dl>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {hotel.highlights.map((h) => (
                <span key={h} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2">
                  {h}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-warn px-3.5 py-3">
              <div className="text-[12px] font-semibold text-gold-ink">入住提醒</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] leading-snug text-gold-ink">
                {hotel.reminders.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <MapLinks query={hotel.mapQuery} />
              <LinkPill href={hotel.website} icon={<Globe size={14} />}>
                官网
              </LinkPill>
              <LinkPill href={hotel.platformUrl} icon={<ShoppingBag size={14} />}>
                {hotel.platform.replace('携程 ', '')}
              </LinkPill>
              {hotel.phone && (
                <LinkPill href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`} icon={<Phone size={14} />}>
                  致电
                </LinkPill>
              )}
              <Button onClick={() => setEdit(true)}>
                <Pencil size={14} />
                编辑
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <HotelEditor hotel={hotel} open={edit} onClose={() => setEdit(false)} />
    </article>
  );
}

export default function Hotels({ param }: { param: string }) {
  const { hotels } = useAppState();
  useEffect(() => {
    if (param) setTimeout(() => document.getElementById(param)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }, [param]);
  const nights = hotels.reduce((n, h) => n + nightsBetween(h.checkIn, h.checkOut), 0);
  const ledger = sumCad(hotels.map((h) => h.cadLedger ?? 0));
  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader
          eyebrow="STAY · 住宿"
          title="四家酒店，六晚"
          subtitle={
            <>
              小樽 1 晚 · 札幌 2 晚 · 二世古 1 晚 · 洞爷湖 2 晚。合计 <span className="tabular font-medium text-ink">{nights} 晚</span>，加币账目{' '}
              <span className="tabular font-medium text-ink">{formatMoney(ledger, 'CAD')}</span>（其中札幌与 Windsor 扣款待确认）。
            </>
          }
          actions={
            <Button
              onClick={() => {
                const ok = downloadText('hokkaido2027-cancel-deadlines.ics', calendar(cancelEvents(hotels)));
                toast(ok ? '已生成取消提醒日历文件' : '当前环境不支持下载，请在清单页复制');
              }}
            >
              <CalendarDays size={15} />
              取消截止 .ics
            </Button>
          }
        />
        <div className="flex flex-col gap-6">
          {hotels.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </div>
        <p className="mt-6 text-[12px] text-muted">封面为原创插画，不代表酒店实景；可点「更换封面」换成自己的照片。官网与电话来自公开资料，出发前请再核对一次。</p>
      </div>
    </div>
  );
}
