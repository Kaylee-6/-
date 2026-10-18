import { countdown } from '../lib/time';
import { useNow } from '../lib/actions';

export function BigCountdown({ target, light = false }: { target: Date; light?: boolean }) {
  const now = useNow(1000);
  const c = countdown(target, now);
  const cells: [number, string][] = [
    [c.days, 'DAYS 天'],
    [c.hours, 'HRS 时'],
    [c.minutes, 'MIN 分'],
    [c.seconds, 'SEC 秒'],
  ];
  return (
    <div className={`flex items-end gap-4 sm:gap-6 ${light ? 'text-white' : 'text-ink'}`} aria-live="off">
      {cells.map(([v, label], i) => (
        <div key={label} className="flex flex-col">
          <span className={`tabular font-display font-light leading-none ${i === 0 ? 'text-[56px] sm:text-[72px]' : 'text-[32px] sm:text-[40px]'}`}>
            {i === 0 ? v : String(v).padStart(2, '0')}
          </span>
          <span className={`mt-1 font-mono text-[9.5px] tracking-[0.16em] ${light ? 'text-white/75' : 'text-muted'}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function InlineCountdown({ target, pastLabel = '已过' }: { target: Date; pastLabel?: string }) {
  const now = useNow(30000);
  const c = countdown(target, now);
  if (c.past) return <span className="text-muted">{pastLabel}</span>;
  return (
    <span className="tabular">
      {c.days > 0 ? `${c.days} 天 ` : ''}
      {c.hours} 小时{c.days === 0 ? ` ${c.minutes} 分` : ''}
    </span>
  );
}
