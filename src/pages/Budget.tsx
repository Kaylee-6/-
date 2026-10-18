import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { AppState, BudgetCategory, BudgetLine, Currency, Expense, Payment } from '../lib/types';
import { mutate, uid, useAppState } from '../lib/store';
import { buildRows, CATEGORY_LABEL, summarize, type BudgetRow } from '../lib/budget';
import { CURRENCY_LABEL, formatDisplay, formatMoney, formatPoints, toCad } from '../lib/money';
import { href, type PageId } from '../lib/router';
import { PAYMENT_OPTIONS } from '../lib/options';
import { removeWithUndo } from '../lib/actions';
import { toast } from '../lib/toast';
import { Button, Card, CheckRow, IconButton, NumberField, PageHeader, PayBadge, SectionTitle, Segmented, SelectField, Sheet, Tag, TextArea, TextField } from '../components/ui';

/* Donut groups, in a fixed order so each group keeps its color whatever the totals. */
const GROUPS = [
  { key: 'flight', label: '机票', cats: ['flight'] },
  { key: 'hotel', label: '住宿', cats: ['hotel'] },
  { key: 'car', label: '租车', cats: ['car'] },
  { key: 'ski', label: '雪票', cats: ['ski'] },
  { key: 'drive', label: '油费 · 高速 · 停车', cats: ['fuel', 'toll', 'parking'] },
  { key: 'other', label: '其他（餐饮、购物、签证、保险…）', cats: ['food', 'sight', 'shopping', 'visa', 'insurance', 'other'] },
] as const;

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as BudgetCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }));
const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'CAD', label: 'CAD 加币' },
  { value: 'JPY', label: 'JPY 日元' },
  { value: 'CNY', label: 'CNY 人民币' },
];
const LINE_PAYMENT: { value: Payment; label: string }[] = [{ value: 'estimate', label: '估算（未购买）' }, ...PAYMENT_OPTIONS];

const SOURCE_PAGE: Record<BudgetRow['source'], PageId> = { hotel: 'hotels', car: 'transport', flight: 'transport', line: 'budget' };

function Kpi({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className={`min-w-0 rounded-[18px] border border-line p-4 ${strong ? 'bg-navy text-on-navy' : 'bg-surface'}`}>
      <div className={`text-[12px] ${strong ? 'opacity-75' : 'text-muted'}`}>{label}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        {/^(CAD|JPY|RMB) /.test(value) && <span className={`font-mono text-[11px] tracking-[0.1em] ${strong ? 'opacity-75' : 'text-muted'}`}>{value.slice(0, 3)}</span>}
        <span className={`tabular font-display font-light leading-tight ${strong ? 'text-[34px]' : 'text-[27px]'}`}>{value.replace(/^(CAD|JPY|RMB) /, '')}</span>
      </div>
      {sub && <div className={`mt-0.5 text-[12px] ${strong ? 'opacity-85' : 'text-ink-2'}`}>{sub}</div>}
    </div>
  );
}

function LineEditor({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: BudgetLine | null }) {
  const blank: BudgetLine = { id: uid('line'), category: 'other', name: '', amount: null, currency: 'CAD', perPerson: false, rangeLow: null, rangeHigh: null, payment: 'estimate', note: '' };
  const [d, setD] = useState<BudgetLine>(initial ?? blank);
  useEffect(() => {
    if (open) setD(initial ?? { ...blank, id: uid('line') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);
  const set = <K extends keyof BudgetLine>(k: K, v: BudgetLine[K]) => setD((x) => ({ ...x, [k]: v }));
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? '编辑预算项' : '添加预算项'}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            tone="primary"
            disabled={!d.name.trim()}
            onClick={() => {
              mutate((s) => {
                const i = s.budgetLines.findIndex((l) => l.id === d.id);
                if (i >= 0) s.budgetLines[i] = d;
                else s.budgetLines.push(d);
              });
              toast('预算已保存');
              onClose();
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        <TextField className="col-span-2" label="名称" value={d.name} onChange={(v) => set('name', v)} placeholder="例如：藻岩山缆车" />
        <SelectField label="类别" value={d.category} onChange={(v) => set('category', v)} options={CATEGORY_OPTIONS} />
        <SelectField label="状态" value={d.payment} onChange={(v) => set('payment', v)} options={LINE_PAYMENT} />
        <NumberField label="金额" value={d.amount} onChange={(v) => set('amount', v)} />
        <SelectField label="币种" value={d.currency} onChange={(v) => set('currency', v)} options={CURRENCY_OPTIONS} />
        <NumberField label="参考区间 · 低" value={d.rangeLow} onChange={(v) => set('rangeLow', v)} placeholder="可选" />
        <NumberField label="参考区间 · 高" value={d.rangeHigh} onChange={(v) => set('rangeHigh', v)} placeholder="可选" />
        <div className="col-span-2">
          <CheckRow checked={d.perPerson} onChange={(v) => set('perPerson', v)} sub="勾选后按旅客人数自动乘算">
            按每人计
          </CheckRow>
        </div>
        <div className="col-span-2">
          <TextArea label="备注" value={d.note} onChange={(v) => set('note', v)} rows={2} />
        </div>
        <p className="col-span-2 text-[12px] text-muted">「估算」只计入预估，不会计入已付。买好后把状态改为「已付」，它会进入已确认金额。</p>
      </div>
    </Sheet>
  );
}

function ExpenseEditor({ open, onClose, state }: { open: boolean; onClose: () => void; state: AppState }) {
  const today = new Date().toISOString().slice(0, 10);
  const blank = (): Expense => ({ id: uid('exp'), lineId: state.budgetLines.some((l) => l.id === 'food') ? 'food' : null, category: 'food', date: today, title: '', amount: 0, currency: 'JPY', note: '' });
  const [d, setD] = useState<Expense>(blank);
  const [amount, setAmount] = useState<number | null>(null);
  useEffect(() => {
    if (open) {
      setD(blank());
      setAmount(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const lineOptions = [{ value: '', label: '不挂预算项（直接计入实际支出）' }, ...state.budgetLines.map((l) => ({ value: l.id, label: `${CATEGORY_LABEL[l.category]} · ${l.name}` }))];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="记一笔实际支出"
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            tone="primary"
            disabled={!d.title.trim() || !amount}
            onClick={() => {
              mutate((s) => void s.expenses.push({ ...d, amount: amount ?? 0, title: d.title.trim() }));
              toast('已记录支出');
              onClose();
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3.5">
        <TextField className="col-span-2" label="内容" value={d.title} onChange={(v) => setD({ ...d, title: v })} placeholder="例如：薄野拉面" />
        <NumberField label="金额" value={amount} onChange={setAmount} />
        <SelectField label="币种" value={d.currency} onChange={(v) => setD({ ...d, currency: v })} options={CURRENCY_OPTIONS} />
        <TextField label="日期" type="date" value={d.date} onChange={(v) => setD({ ...d, date: v })} />
        <SelectField label="类别" value={d.category} onChange={(v) => setD({ ...d, category: v })} options={CATEGORY_OPTIONS} />
        <SelectField
          className="col-span-2"
          label="对应预算项"
          value={d.lineId ?? ''}
          onChange={(v) => {
            const line = state.budgetLines.find((l) => l.id === v);
            setD({ ...d, lineId: v || null, category: line ? line.category : d.category });
          }}
          options={lineOptions}
        />
        <div className="col-span-2">
          <TextArea label="备注" value={d.note} onChange={(v) => setD({ ...d, note: v })} rows={2} />
        </div>
        {d.currency !== 'CAD' && !state.settings.rates[d.currency].perCad && (
          <p className="col-span-2 rounded-xl bg-warn px-3 py-2 text-[12.5px] text-gold-ink">还没有设置 {d.currency} 汇率，这笔支出暂时无法换算成加币。请到「设置」填写汇率。</p>
        )}
      </div>
    </Sheet>
  );
}

function Donut({ state }: { state: AppState }) {
  const s = summarize(state);
  const { displayCurrency: dc, rates } = state.settings;
  const data = GROUPS.map((g, i) => ({
    key: g.key,
    label: g.label,
    color: `var(--viz-${i + 1})`,
    value: s.byCategory.filter((c) => (g.cats as readonly string[]).includes(c.category)).reduce((a, c) => a + c.cad, 0),
  }));
  const total = data.reduce((a, d) => a + d.value, 0);
  const shown = data.filter((d) => d.value > 0);
  return (
    <Card className="p-5">
      <div className="eyebrow">预估总支出 · 按类别</div>
      <div className="mt-3 grid items-center gap-6 sm:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <PieChart width={220} height={220}>
            <Pie data={shown} dataKey="value" nameKey="label" innerRadius={72} outerRadius={104} paddingAngle={1.5} cornerRadius={4} stroke="var(--surface)" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
              {shown.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] shadow-lg">
                    <div className="font-medium">{p.label}</div>
                    <div className="tabular text-ink-2">
                      {formatDisplay(p.value, dc, rates)} · {((p.value / total) * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-muted">预估总额</span>
            <span className="tabular font-display text-[22px] font-light leading-tight">{formatDisplay(total, dc, rates).replace(/^(CAD|JPY|RMB) /, '')}</span>
            <span className="font-mono text-[10px] tracking-wider text-muted">{CURRENCY_LABEL[dc]}</span>
          </div>
        </div>
        <ul className="flex flex-col divide-y divide-line/70">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-3 py-2 text-[13.5px]">
              <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: d.color }} />
              <span className="min-w-0 flex-1">{d.label}</span>
              <span className="tabular shrink-0 text-ink-2">{d.value > 0 ? formatDisplay(d.value, dc, rates) : '—'}</span>
              <span className="tabular w-12 shrink-0 text-right text-muted">{d.value > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : ''}</span>
            </li>
          ))}
        </ul>
      </div>
      <PaymentBar state={state} />
    </Card>
  );
}

function PaymentBar({ state }: { state: AppState }) {
  const s = summarize(state);
  const { displayCurrency: dc, rates } = state.settings;
  const parts = [
    { key: 'paid', label: '已付', cls: 'bg-forest', v: s.byPayment[0].cad },
    { key: 'unverified', label: '扣款待确认', cls: 'bg-gold', v: s.byPayment[1].cad },
    { key: 'unpaid', label: '已订未付', cls: 'bg-danger', v: s.byPayment[2].cad },
    { key: 'estimate', label: '估算 / 待支出', cls: 'hatch bg-surface-2', v: s.byPayment[3].cad },
  ];
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="eyebrow">付款进度</div>
      <div className="mt-2 flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts
          .filter((p) => p.v > 0)
          .map((p) => (
            <div key={p.key} className={`${p.cls} h-full first:rounded-l-full last:rounded-r-full`} style={{ width: `${(p.v / total) * 100}%` }} title={`${p.label} ${formatDisplay(p.v, dc, rates)}`} />
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-2">
        {parts.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-[3px] ${p.cls}`} />
            {p.label} <span className="tabular">{formatDisplay(p.v, dc, rates)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RowItem({ r, state, onEdit }: { r: BudgetRow; state: AppState; onEdit?: () => void }) {
  const { displayCurrency: dc, rates } = state.settings;
  const line = r.source === 'line' ? state.budgetLines.find((l) => l.id === r.refId) : undefined;
  const showConverted = r.original && (r.original.currency !== dc || r.ledger);
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[14.5px] font-medium">{r.name}</span>
          <Tag tone="plain">{CATEGORY_LABEL[r.category]}</Tag>
          {r.ledger && <Tag tone="ice">CAD 按用户账目</Tag>}
        </div>
        {r.detail && <div className="text-[12.5px] text-ink-2">{r.detail}</div>}
        {line && line.rangeLow !== null && line.rangeHigh !== null && (
          <div className="text-[12px] text-muted">
            参考区间 {formatMoney(line.rangeLow, line.currency)} – {formatMoney(line.rangeHigh, line.currency).replace(/^\w+ /, '')}
          </div>
        )}
        {r.note && <div className="text-[12px] text-muted">{r.note}</div>}
        {r.points && (
          <div className="text-[12.5px] text-gold-ink">
            + {formatPoints(r.points.amount)} {r.points.program} 积分（单独统计）
          </div>
        )}
        {r.actual > 0 && <div className="text-[12.5px] text-forest">已记录实际支出 {formatDisplay(r.actual, dc, rates)}</div>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`tabular text-[14.5px] font-medium ${!r.booked ? 'text-ink-2' : ''}`}>{r.original ? formatMoney(r.original.amount, r.original.currency) : <span className="text-muted">未填写</span>}</span>
        {showConverted && <span className="tabular text-[12px] text-muted">{r.cad === null ? '待换算（未设汇率）' : `≈ ${formatDisplay(r.cad, dc, rates)}`}</span>}
        <PayBadge payment={r.payment} />
      </div>
      <div className="flex shrink-0 flex-col">
        {r.editable && onEdit ? (
          <>
            <IconButton label="编辑" onClick={onEdit} className="h-8 w-8">
              <Pencil size={14} />
            </IconButton>
            <IconButton
              label="删除"
              className="h-8 w-8"
              onClick={() =>
                removeWithUndo(`已删除「${r.name}」`, (s) => {
                  s.budgetLines = s.budgetLines.filter((l) => l.id !== r.refId);
                  s.expenses = s.expenses.map((e) => (e.lineId === r.refId ? { ...e, lineId: null } : e));
                })
              }
            >
              <Trash2 size={14} />
            </IconButton>
          </>
        ) : (
          <a href={href(SOURCE_PAGE[r.source], r.source === 'hotel' ? r.refId : '')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2" aria-label="在来源页面修改" title="在来源页面修改">
            <ArrowUpRight size={15} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function Budget() {
  const state = useAppState();
  const rows = useMemo(() => buildRows(state), [state]);
  const s = useMemo(() => summarize(state, rows), [state, rows]);
  const { displayCurrency: dc, rates } = state.settings;
  const fmt = (v: number) => formatDisplay(v, dc, rates);
  const [lineEdit, setLineEdit] = useState<{ open: boolean; line: BudgetLine | null }>({ open: false, line: null });
  const [expOpen, setExpOpen] = useState(false);
  const booked = rows.filter((r) => r.booked);
  const estimates = rows.filter((r) => !r.booked);
  const credits = state.hotels.flatMap((h) => h.credits.map((c) => ({ ...c, hotel: h.name })));

  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader
          eyebrow="BUDGET · 费用"
          title="花了多少，还要花多少"
          subtitle="以加币为主货币。已确认、已付、扣款待确认、估算分开统计，估算永远不会计入已付。"
          actions={
            <Segmented
              label="显示币种"
              value={dc}
              onChange={(v) => mutate((st) => void (st.settings.displayCurrency = v))}
              options={[
                { value: 'CAD', label: 'CAD' },
                { value: 'JPY', label: 'JPY' },
                { value: 'CNY', label: 'CNY' },
              ]}
            />
          }
        />
        {dc !== 'CAD' && (
          <p className="-mt-2 mb-4 text-[12.5px] text-muted">
            {rates[dc].perCad ? `1 CAD = ${rates[dc].perCad} ${dc} · 来源：${rates[dc].source || '手动输入'}${rates[dc].asOf ? ` · ${rates[dc].asOf}` : ''}` : `${dc} 汇率未设置，金额以 CAD 显示。`}{' '}
            <a href={href('settings')} className="underline underline-offset-2">
              修改汇率
            </a>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1 md:row-span-2">
            <div className="h-full rounded-[18px] bg-navy p-5 text-on-navy">
              <div className="text-[12px] opacity-75">已确认基础总金额</div>
              <div className="tabular mt-1 font-display text-[40px] font-light leading-tight">{fmt(s.confirmedBase)}</div>
              {s.points.map((p) => (
                <div key={p.program} className="tabular text-[14px] opacity-90">
                  + {formatPoints(p.amount)} {p.program} 积分
                </div>
              ))}
              <p className="mt-4 text-[12.5px] leading-relaxed opacity-80">
                4 家酒店 + 租车 + AC54 回程现金。不代表全额已付款；去程机票未购买，不计入。
              </p>
            </div>
          </div>
          <Kpi label="已付款" value={fmt(s.paid)} sub={s.expensesTotal > 0 ? `含旅途支出 ${fmt(s.expensesTotal)}` : '酒店 2 家 + 租车 + AC54 现金'} />
          <Kpi label="扣款待确认" value={fmt(s.unverified)} sub="SAPPORO STREAM · Windsor" />
          <Kpi label="预估待支出" value={fmt(s.estimateRemaining)} sub="去程机票、雪票、油费等估算" />
          <Kpi label="预估总支出" value={fmt(s.projected)} sub={`待支付（含估算）${fmt(s.toPay)}`} />
        </div>

        {s.missing.length > 0 && (
          <div className="mt-4 rounded-2xl bg-warn px-4 py-3 text-[13px] text-gold-ink">
            {s.missing.length} 项还没有金额或缺少汇率，未计入合计：{s.missing.map((m) => m.name).join('、')}。
          </div>
        )}

        <div className="mt-6">
          <Donut state={state} />
        </div>

        <SectionTitle aside={<span className="text-[12px] text-muted">来自酒店 / 交通页面，在原页面修改</span>}>已预订</SectionTitle>
        <div className="divide-y divide-line/70 rounded-[18px] border border-line bg-surface px-4">
          {booked.map((r) => (
            <RowItem key={r.id} r={r} state={state} onEdit={r.editable ? () => setLineEdit({ open: true, line: state.budgetLines.find((l) => l.id === r.refId)! }) : undefined} />
          ))}
        </div>

        <SectionTitle
          aside={
            <Button tone="primary" onClick={() => setLineEdit({ open: true, line: null })}>
              <Plus size={15} />
              添加预算项
            </Button>
          }
        >
          待预算 · 估算
        </SectionTitle>
        <div className="divide-y divide-line/70 rounded-[18px] border border-line bg-surface px-4">
          {estimates.map((r) => (
            <RowItem key={r.id} r={r} state={state} onEdit={r.editable ? () => setLineEdit({ open: true, line: state.budgetLines.find((l) => l.id === r.refId)! }) : undefined} />
          ))}
        </div>

        <SectionTitle
          aside={
            <Button tone="primary" onClick={() => setExpOpen(true)}>
              <Plus size={15} />
              记一笔
            </Button>
          }
        >
          旅途实际支出
        </SectionTitle>
        {state.expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-5 py-6 text-center text-[13.5px] text-ink-2">还没有记录。旅途中每笔餐饮、油费、门票都可以记在这里，并挂到对应预算项上做「预算 vs 实际」。</div>
        ) : (
          <div className="divide-y divide-line/70 rounded-[18px] border border-line bg-surface px-4">
            {[...state.expenses]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((e) => {
                const cad = toCad(e.amount, e.currency, rates);
                const line = state.budgetLines.find((l) => l.id === e.lineId);
                return (
                  <div key={e.id} className="flex items-start gap-3 py-3">
                    <span className="tabular w-12 shrink-0 font-mono text-[12px] text-muted">{e.date.slice(5).replace('-', '/')}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px]">{e.title}</div>
                      <div className="text-[12px] text-muted">
                        {CATEGORY_LABEL[e.category]}
                        {line ? ` · ${line.name}` : ''}
                        {e.note ? ` · ${e.note}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="tabular text-[14px] font-medium">{formatMoney(e.amount, e.currency)}</div>
                      {e.currency !== dc && <div className="tabular text-[12px] text-muted">{cad === null ? '待换算' : `≈ ${fmt(cad)}`}</div>}
                    </div>
                    <IconButton label="删除" className="h-8 w-8" onClick={() => removeWithUndo(`已删除「${e.title}」`, (st) => void (st.expenses = st.expenses.filter((x) => x.id !== e.id)))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                );
              })}
          </div>
        )}

        <SectionTitle>积分与抵扣</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {s.points.map((p) => (
            <Card key={p.program} className="p-4">
              <div className="text-[12px] text-muted">{p.program} 积分 · AC54 回程</div>
              <div className="tabular font-display text-[30px] font-light">{formatPoints(p.amount)} pts</div>
              <div className="text-[12.5px] text-ink-2">单独统计，不折算为现金，也不视为零价值。</div>
            </Card>
          ))}
          {credits.map((c) => (
            <Card key={c.label} className="p-4">
              <div className="text-[12px] text-muted">{c.hotel}</div>
              <div className="tabular font-display text-[30px] font-light">{formatMoney(c.amount, c.currency)}</div>
              <div className="text-[12.5px] text-ink-2">{c.label}：已体现在现金实付 CAD 264.74 中，不再重复扣除。</div>
            </Card>
          ))}
        </div>
      </div>
      <LineEditor open={lineEdit.open} onClose={() => setLineEdit((x) => ({ ...x, open: false }))} initial={lineEdit.line} />
      <ExpenseEditor open={expOpen} onClose={() => setExpOpen(false)} state={state} />
    </div>
  );
}
