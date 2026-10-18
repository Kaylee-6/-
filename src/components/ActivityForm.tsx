import { useEffect, useState } from 'react';
import type { Activity, Day } from '../lib/types';
import { mutate, uid } from '../lib/store';
import { sortByTime } from '../lib/time';
import { toast } from '../lib/toast';
import { fmtDateDot } from '../lib/time';
import { KIND_OPTIONS } from './DayBits';
import { Button, CheckRow, SelectField, Sheet, STATUS_OPTIONS, TextArea, TextField } from './ui';

export function blankActivity(): Activity {
  return { id: uid('act'), time: '', endTime: '', title: '', titleEn: '', kind: 'sight', status: 'planned', tags: [], place: '', note: '' };
}

/** Add or edit one activity; can also move it to another day. Saving re-sorts that day by time. */
export function ActivityForm({
  open,
  onClose,
  days,
  dayId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  days: Day[];
  dayId: string;
  initial: Activity | null;
}) {
  const [draft, setDraft] = useState<Activity>(initial ?? blankActivity());
  const [targetDay, setTargetDay] = useState(dayId);
  const [tagText, setTagText] = useState('');

  useEffect(() => {
    if (!open) return;
    const a = initial ?? blankActivity();
    setDraft(a);
    setTagText(a.tags.join('，'));
    setTargetDay(dayId);
  }, [open, initial, dayId]);

  const set = <K extends keyof Activity>(k: K, v: Activity[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const isNew = !initial;

  const save = () => {
    if (!draft.title.trim()) return;
    const next: Activity = {
      ...draft,
      title: draft.title.trim(),
      tags: tagText
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean),
    };
    mutate((s) => {
      const from = s.days.find((d) => d.id === dayId)!;
      const to = s.days.find((d) => d.id === targetDay)!;
      const idx = from.activities.findIndex((a) => a.id === next.id);
      if (idx >= 0 && from.id === to.id) {
        from.activities[idx] = next;
      } else {
        if (idx >= 0) from.activities.splice(idx, 1);
        to.activities.push(next);
      }
      to.activities = sortByTime(to.activities);
    });
    const moved = targetDay !== dayId;
    const toDay = days.find((d) => d.id === targetDay);
    toast(moved && toDay ? `已移到 Day ${toDay.index}` : isNew ? '已添加活动' : '已保存');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isNew ? '添加活动' : '编辑活动'}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            取消
          </Button>
          <Button tone="primary" onClick={save} disabled={!draft.title.trim()}>
            保存
          </Button>
        </>
      }
    >
      <form
        className="grid grid-cols-2 gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField className="col-span-2" label="活动名称" value={draft.title} onChange={(v) => set('title', v)} placeholder="例如：藻岩山夜景" />
        <TextField className="col-span-2" label="英文 / 当地名称（可选）" value={draft.titleEn} onChange={(v) => set('titleEn', v)} placeholder="Mount Moiwa" />
        <TextField label="开始时间" type="time" value={draft.time} onChange={(v) => set('time', v)} hint="留空 = 跟随上一项" />
        <TextField label="结束时间" type="time" value={draft.endTime} onChange={(v) => set('endTime', v)} />
        <SelectField label="类型" value={draft.kind} onChange={(v) => set('kind', v)} options={KIND_OPTIONS} />
        <SelectField label="状态" value={draft.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} />
        <TextField className="col-span-2" label="地图搜索地点（用于 Google Maps）" value={draft.place} onChange={(v) => set('place', v)} placeholder="地点名称或地址" />
        <TextField className="col-span-2" label="标签（逗号分隔）" value={tagText} onChange={setTagText} placeholder="待确认，需预约" />
        <div className="col-span-2">
          <TextArea label="备注" value={draft.note} onChange={(v) => set('note', v)} />
        </div>
        <div className="col-span-2">
          <CheckRow checked={Boolean(draft.important)} onChange={(v) => set('important', v)}>
            标记为重点
          </CheckRow>
        </div>
        <SelectField
          className="col-span-2"
          label="所在日期"
          value={targetDay}
          onChange={setTargetDay}
          options={days.map((d) => ({ value: d.id, label: `Day ${d.index} · ${fmtDateDot(d.date)} · ${d.title}` }))}
        />
        <button type="submit" className="hidden" />
      </form>
    </Sheet>
  );
}
