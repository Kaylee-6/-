import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Check, ExternalLink as ExternalIcon, MapPin, Navigation, X } from 'lucide-react';
import type { Payment, Status } from '../lib/types';
import { mapDirections, mapSearch } from '../lib/links';
import { PAYMENT_LABEL } from '../lib/budget';

/* ---------- status ---------- */

const STATUS_TEXT: Record<Status, { en: string; zh: string }> = {
  confirmed: { en: 'Confirmed', zh: '已确认' },
  planned: { en: 'Planned', zh: '计划中' },
  optional: { en: 'Optional', zh: '可选' },
};

export function StatusBadge({ status, compact = false }: { status: Status; compact?: boolean }) {
  const t = STATUS_TEXT[status];
  const cls =
    status === 'confirmed'
      ? 'bg-forest text-bg border-forest'
      : status === 'planned'
        ? 'border-ink/70 text-ink'
        : 'border-dashed border-gold text-gold-ink';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-[1px] font-mono text-[10.5px] uppercase leading-[18px] tracking-[0.08em] ${cls}`}
      title={`${t.en} · ${t.zh}`}
    >
      {status === 'confirmed' && <Check size={11} strokeWidth={2.6} />}
      {t.en}
      {!compact && <span className="font-sans normal-case tracking-normal opacity-80">{t.zh}</span>}
    </span>
  );
}

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed · 已确认' },
  { value: 'planned', label: 'Planned · 计划中' },
  { value: 'optional', label: 'Optional · 可选' },
];

export function PayBadge({ payment }: { payment: Payment }) {
  const dot =
    payment === 'paid'
      ? 'bg-forest'
      : payment === 'unverified'
        ? 'bg-gold'
        : payment === 'unpaid'
          ? 'bg-danger'
          : 'hatch border border-gold';
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-ink-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {PAYMENT_LABEL[payment]}
    </span>
  );
}

export function Tag({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'plain' | 'ice' }) {
  const cls = tone === 'warn' ? 'bg-warn text-gold-ink' : tone === 'ice' ? 'bg-ice text-ink' : 'bg-surface-2 text-ink-2';
  return <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-[1px] text-[11.5px] leading-[18px] ${cls}`}>{children}</span>;
}

/* ---------- buttons & links ---------- */

type BtnTone = 'primary' | 'quiet' | 'ghost' | 'danger';

export function Button({
  children,
  onClick,
  tone = 'quiet',
  type = 'button',
  className = '',
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: BtnTone;
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const cls = {
    primary: 'bg-navy text-on-navy hover:opacity-90',
    quiet: 'border border-line bg-surface text-ink hover:border-ink/40',
    ghost: 'text-ink-2 hover:bg-surface-2',
    danger: 'border border-danger/40 text-danger hover:bg-danger/10',
  }[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition disabled:opacity-40 ${cls} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, onClick, children, className = '' }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 transition hover:bg-surface-2 ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkPill({ href, children, icon }: { href: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] text-ink transition hover:border-ink/40"
    >
      {icon ?? <ExternalIcon size={14} />}
      {children}
    </a>
  );
}

export function MapLinks({ query, label = '地图', navigate = true, origin }: { query: string; label?: string; navigate?: boolean; origin?: string }) {
  if (!query) return null;
  return (
    <>
      <LinkPill href={mapSearch(query)} icon={<MapPin size={14} />}>
        {label}
      </LinkPill>
      {navigate && (
        <LinkPill href={mapDirections(query, origin)} icon={<Navigation size={14} />}>
          导航
        </LinkPill>
      )}
    </>
  );
}

/** Two-step inline confirmation (the in-page replacement for window.confirm). */
export function ConfirmButton({ label, confirmLabel = '确认删除', onConfirm, tone = 'danger' }: { label: ReactNode; confirmLabel?: string; onConfirm: () => void; tone?: BtnTone }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return armed ? (
    <Button tone="danger" onClick={onConfirm} className="bg-danger/10">
      {confirmLabel}
    </Button>
  ) : (
    <Button tone={tone === 'danger' ? 'ghost' : tone} onClick={() => setArmed(true)}>
      {label}
    </Button>
  );
}

/* ---------- layout ---------- */

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-5 pt-2">
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-1 font-display text-[34px] font-light leading-[1.05] tracking-tight md:text-[44px]">{title}</h1>
        {subtitle && <div className="mt-2 max-w-[62ch] text-[14px] text-ink-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 mt-9 flex items-baseline justify-between gap-3 border-b border-line pb-2" id={id}>
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{children}</h2>
      {aside}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-line bg-surface ${className}`}>{children}</div>;
}

export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-b border-line/70 py-2 text-[14px] last:border-b-0">
      <dt className="text-muted">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <span className="text-muted">{children}</span>;
}

export function ProgressRing({ value, size = 64, stroke = 5, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--forest)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- form fields ---------- */

export function Field({ label, hint, children, className = '' }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[12.5px] font-medium text-ink-2">
        {label}
      </label>
      {children(id)}
      {hint && <div className="text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  className,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: ReactNode;
  className?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'url' | 'tel';
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <input id={id} className="field" type={type} value={value} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder = '未填写',
  hint,
  className,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  hint?: ReactNode;
  className?: string;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(value === null ? '' : String(value));
    }
  }, [value]);
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          className="field tabular"
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value.replace(/[,，\s]/g, '');
            setText(e.target.value);
            const n = raw === '' ? null : Number(raw);
            if (n === null || Number.isFinite(n)) {
              last.current = n;
              onChange(n);
            }
          }}
        />
      )}
    </Field>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <Field label={label}>
      {(id) => <textarea id={id} className="field resize-y" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      {(id) => (
        <select id={id} className="field appearance-none bg-[length:12px] pr-8" value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-8 rounded-full px-3 text-[12.5px] font-medium transition ${value === o.value ? 'bg-navy text-on-navy' : 'text-ink-2 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CheckRow({ checked, onChange, children, sub }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; sub?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2.5">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={`mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:outline-2 peer-focus-visible:outline-gold ${
          checked ? 'border-forest bg-forest text-bg' : 'border-ink/30 bg-surface'
        }`}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[14.5px] ${checked ? 'text-muted line-through decoration-line' : ''}`}>{children}</span>
        {sub && <span className="mt-0.5 block text-[12.5px] text-muted">{sub}</span>}
      </span>
    </label>
  );
}

/* ---------- sheet ---------- */

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus({ preventScroll: true }), 60);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <m.div className="absolute inset-0 bg-[var(--scrim)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <m.div
            ref={panel}
            className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[22px] bg-bg shadow-2xl md:max-w-xl md:rounded-[22px]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <h2 className="text-[16px] font-semibold">{title}</h2>
              <IconButton label="关闭" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}>
                {footer}
              </div>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- copy ---------- */

export function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      tone="ghost"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          })
          .catch(() => setDone(false));
      }}
    >
      {done ? '已复制' : label}
    </Button>
  );
}
