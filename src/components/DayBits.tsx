import type { ReactNode } from 'react';
import {
  BedDouble,
  CarFront,
  Mountain,
  NotebookPen,
  Plane,
  Route as RouteIcon,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { Activity, ActivityKind } from '../lib/types';

export const KIND_META: Record<ActivityKind, { label: string; icon: LucideIcon }> = {
  flight: { label: '航班', icon: Plane },
  drive: { label: '自驾', icon: RouteIcon },
  car: { label: '租车', icon: CarFront },
  hotel: { label: '酒店', icon: BedDouble },
  ski: { label: '滑雪', icon: Mountain },
  sight: { label: '景点', icon: Sparkles },
  food: { label: '美食', icon: UtensilsCrossed },
  shopping: { label: '购物', icon: ShoppingBag },
  onsen: { label: '温泉 / 休闲', icon: Waves },
  note: { label: '备注', icon: NotebookPen },
};

export const KIND_OPTIONS = (Object.keys(KIND_META) as ActivityKind[]).map((k) => ({ value: k, label: KIND_META[k].label }));

export function KindIcon({ kind, size = 16 }: { kind: ActivityKind; size?: number }) {
  const Icon = KIND_META[kind].icon;
  return <Icon size={size} strokeWidth={1.7} />;
}

export function ActivityLine({ a, right }: { a: Activity; right?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="tabular w-11 shrink-0 pt-[1px] font-mono text-[12.5px] text-ink-2">{a.time || '—'}</span>
      <span className="mt-[1px] text-muted">
        <KindIcon kind={a.kind} size={15} />
      </span>
      <span className={`min-w-0 flex-1 text-[14px] leading-snug ${a.status === 'optional' ? 'text-ink-2' : ''}`}>{a.title}</span>
      {right}
    </div>
  );
}
