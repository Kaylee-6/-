import { useEffect, useState } from 'react';
import { CalendarDays, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ChecklistGroup, ChecklistItem } from '../lib/types';
import { mutate, uid, useAppState } from '../lib/store';
import { GROUP_LABEL, GROUP_ORDER } from '../lib/checklist';
import { calendar, cancelEvents, downloadText, hasExactDeadline, keyEvents } from '../lib/ics';
import { fmtDateFull } from '../lib/time';
import { href } from '../lib/router';
import { removeWithUndo } from '../lib/actions';
import { toast } from '../lib/toast';
import { Button, Card, CheckRow, CopyButton, IconButton, PageHeader, ProgressRing, SectionTitle, Segmented, SelectField, Sheet, Tag, TextArea, TextField } from '../components/ui';

const GROUP_OPTIONS = GROUP_ORDER.map((g) => ({ value: g, label: GROUP_LABEL[g] }));

function ItemEditor({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: ChecklistItem | null }) {
  const blank = (): ChecklistItem => ({ id: uid('c'), group: 'plan', label: '', done: false, due: '', priority: false, note: '', link: '' });
  const [d, setD] = useState<ChecklistItem>(initial ?? blank());
  useEffect(() => {
    if (open) setD(initial ?? blank());
  }, [open, initial]);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? '编辑待办' : '添加待办'}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            tone="primary"
            disabled={!d.label.trim()}
            onClick={() => {
              mutate((s) => {
                const i = s.checklist.findIndex((c) => c.id === d.id);
                const item = { ...d, label: d.label.trim() };
                if (i >= 0) s.checklist[i] = item;
                else s.checklist.push(item);
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
        <TextField className="col-span-2" label="事项" value={d.label} onChange={(v) => setD({ ...d, label: v })} />
        <SelectField label="分组" value={d.group} onChange={(v: ChecklistGroup) => setD({ ...d, group: v })} options={GROUP_OPTIONS} />
        <TextField label="截止日期（可选）" type="date" value={d.due} onChange={(v) => setD({ ...d, due: v })} />
        <TextField className="col-span-2" label="相关链接（可选）" value={d.link} onChange={(v) => setD({ ...d, link: v })} inputMode="url" placeholder="https://" />
        <div className="col-span-2">
          <TextArea label="备注" value={d.note} onChange={(v) => setD({ ...d, note: v })} rows={2} />
        </div>
        <div className="col-span-2">
          <CheckRow checked={d.priority} onChange={(v) => setD({ ...d, priority: v })}>
            优先处理
          </CheckRow>
        </div>
      </div>
    </Sheet>
  );
}

function Reminders() {
  const { hotels } = useAppState();
  const state = useAppState();
  const cancelText = calendar(cancelEvents(hotels));
  const keyText = calendar(keyEvents(state));
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-gold-ink" />
        <div className="eyebrow">取消截止提醒 · 自动生成</div>
      </div>
      <ul className="mt-2 divide-y divide-line/70">
        {hotels.map((h) => (
          <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
            <a href={href('hotels', h.id)} className="text-[14px] font-medium underline-offset-2 hover:underline">
              {h.name}
            </a>
            {h.cancel.refundable ? (
              <span className="text-[13px]">
                {fmtDateFull(h.cancel.deadlineDate)} 前{' '}
                {hasExactDeadline(h) ? (
                  <Tag tone="ice">
                    {h.cancel.deadlineTime} UTC{h.cancel.deadlineOffset}
                  </Tag>
                ) : (
                  <Tag>时刻 / 时区待按订单补填</Tag>
                )}
              </span>
            ) : (
              <Tag tone="plain">不可取消 · 无提醒</Tag>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] text-ink-2">
        没有填写订单截止时刻时，生成全天事件，并在截止日前 7 天、2 天提醒；填写时刻与时区后（在住宿页「编辑」），生成精确时刻事件。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          tone="primary"
          onClick={() => toast(downloadText('hokkaido2027-cancel-deadlines.ics', cancelText) ? '已下载取消提醒 .ics，用日历打开即可导入' : '当前环境不支持下载，请用「复制」')}
        >
          导出取消提醒 .ics
        </Button>
        <Button onClick={() => toast(downloadText('hokkaido2027-key-dates.ics', keyText) ? '已下载关键行程 .ics' : '当前环境不支持下载，请用「复制」')}>导出关键行程 .ics</Button>
        <CopyButton text={cancelText} label="复制取消提醒文本" />
      </div>
    </Card>
  );
}

export default function Checklist() {
  const state = useAppState();
  const [filter, setFilter] = useState<'open' | 'all' | 'done'>('open');
  const [edit, setEdit] = useState<{ open: boolean; item: ChecklistItem | null }>({ open: false, item: null });
  const done = state.checklist.filter((c) => c.done).length;
  const total = state.checklist.length;
  const visible = (c: ChecklistItem) => (filter === 'all' ? true : filter === 'open' ? !c.done : c.done);

  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader
          eyebrow="CHECKLIST · 行前清单"
          title="出发前要搞定的事"
          actions={
            <Button tone="primary" onClick={() => setEdit({ open: true, item: null })}>
              <Plus size={15} />
              添加
            </Button>
          }
        />
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <Card className="flex items-center gap-5 p-5">
            <ProgressRing value={total ? done / total : 0} size={84} stroke={6}>
              <span className="tabular text-[18px] font-semibold">{Math.round((done / Math.max(1, total)) * 100)}%</span>
            </ProgressRing>
            <div>
              <div className="text-[15px]">
                已完成 <b className="tabular">{done}</b> / {total}
              </div>
              <div className="mt-1 text-[12.5px] text-ink-2">装备清单在「滑雪」页，共 {state.gear.length} 件，已打包 {state.gear.filter((g) => g.done).length} 件。</div>
              <a href={href('ski')} className="mt-1 inline-block text-[12.5px] text-gold-ink underline-offset-2 hover:underline">
                去装备清单
              </a>
            </div>
          </Card>
          <Reminders />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Segmented
            label="筛选"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: '待完成' },
              { value: 'all', label: '全部' },
              { value: 'done', label: '已完成' },
            ]}
          />
        </div>

        {GROUP_ORDER.map((g) => {
          const items = state.checklist.filter((c) => c.group === g && visible(c));
          if (items.length === 0) return null;
          const all = state.checklist.filter((c) => c.group === g);
          return (
            <section key={g}>
              <SectionTitle aside={<span className="tabular text-[12px] text-muted">{all.filter((c) => c.done).length} / {all.length}</span>}>{GROUP_LABEL[g]}</SectionTitle>
              <ul className="divide-y divide-line/70">
                {items.map((c) => (
                  <li key={c.id} className="group flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CheckRow
                        checked={c.done}
                        onChange={(v) => mutate((s) => void (s.checklist.find((x) => x.id === c.id)!.done = v))}
                        sub={
                          (c.note || c.due || c.priority) && (
                            <span className="flex flex-wrap items-center gap-1.5">
                              {c.priority && !c.done && <Tag>优先</Tag>}
                              {c.due && <Tag tone="ice">截止 {fmtDateFull(c.due)}</Tag>}
                              {c.note && <span>{c.note}</span>}
                            </span>
                          )
                        }
                      >
                        {c.label}
                      </CheckRow>
                    </div>
                    <div className="flex shrink-0 items-center pt-1.5">
                      {c.link && (
                        <a href={c.link} target="_blank" rel="noopener noreferrer" aria-label="打开相关链接" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <IconButton label="编辑" className="h-8 w-8" onClick={() => setEdit({ open: true, item: c })}>
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        label="删除"
                        className="h-8 w-8"
                        onClick={() => removeWithUndo(`已删除「${c.label}」`, (s) => void (s.checklist = s.checklist.filter((x) => x.id !== c.id)))}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {state.checklist.filter(visible).length === 0 && <div className="py-10 text-center text-[14px] text-ink-2">{filter === 'open' ? '全部完成，可以出发了。' : '这里还没有内容。'}</div>}
      </div>
      <ItemEditor open={edit.open} onClose={() => setEdit((x) => ({ ...x, open: false }))} initial={edit.item} />
    </div>
  );
}
