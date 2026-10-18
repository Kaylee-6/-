import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, m, MotionConfig } from 'motion/react';
import {
  BedDouble,
  CalendarDays,
  CarFront,
  Compass,
  Ellipsis,
  House,
  ListChecks,
  MountainSnow,
  Settings as SettingsIcon,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { href, useRoute, type PageId } from './lib/router';
import { useAppState, useSaveFailed } from './lib/store';
import { dismiss, useToasts } from './lib/toast';
import { fillMissingRates } from './lib/rates';
import { Dashboard } from './pages/Dashboard';
import { Sheet } from './components/ui';

const Itinerary = lazy(() => import('./pages/Itinerary'));
const Hotels = lazy(() => import('./pages/Hotels'));
const Transport = lazy(() => import('./pages/Transport'));
const Ski = lazy(() => import('./pages/Ski'));
const Explore = lazy(() => import('./pages/Explore'));
const Budget = lazy(() => import('./pages/Budget'));
const Checklist = lazy(() => import('./pages/Checklist'));
const Settings = lazy(() => import('./pages/Settings'));

const PAGES: Record<PageId, ComponentType<{ param: string }>> = {
  home: Dashboard,
  itinerary: Itinerary,
  hotels: Hotels,
  transport: Transport,
  ski: Ski,
  explore: Explore,
  budget: Budget,
  checklist: Checklist,
  settings: Settings,
};

interface NavItem {
  page: PageId;
  label: string;
  en: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { page: 'home', label: '首页', en: 'Home', icon: House },
  { page: 'itinerary', label: '行程', en: 'Itinerary', icon: CalendarDays },
  { page: 'hotels', label: '住宿', en: 'Stay', icon: BedDouble },
  { page: 'transport', label: '交通', en: 'Transport', icon: CarFront },
  { page: 'ski', label: '滑雪', en: 'Ski', icon: MountainSnow },
  { page: 'explore', label: '目的地', en: 'Explore', icon: Compass },
  { page: 'budget', label: '费用', en: 'Budget', icon: Wallet },
  { page: 'checklist', label: '清单', en: 'Checklist', icon: ListChecks },
  { page: 'settings', label: '设置', en: 'Settings', icon: SettingsIcon },
];

const MOBILE_PRIMARY: PageId[] = ['home', 'itinerary', 'hotels', 'transport'];

function useTheme() {
  const { settings } = useAppState();
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [settings.theme]);
}

function Sidebar({ page }: { page: PageId }) {
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-line px-5 pb-6 pt-8 lg:flex">
      <a href={href('home')} className="block">
        <div className="font-display text-[28px] font-light leading-none tracking-[0.06em]">HOKKAIDO</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-[28px] font-light leading-none text-gold-ink">2027</span>
          <span className="font-display text-[15px] italic text-ink-2">Snow &amp; Beyond</span>
        </div>
      </a>
      <div className="mt-2 font-mono text-[10px] tracking-[0.14em] text-muted">FEB 12 — FEB 19 · YVR ⇄ CTS</div>
      <nav className="mt-8 flex flex-col gap-0.5" aria-label="主导航">
        {NAV.map((n) => {
          const active = n.page === page;
          return (
            <a
              key={n.page}
              href={href(n.page)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] transition ${active ? 'bg-surface text-ink shadow-[0_1px_0_var(--line)]' : 'text-ink-2 hover:bg-surface/60'}`}
            >
              <n.icon size={17} strokeWidth={active ? 2.2 : 1.7} className={active ? 'text-gold-ink' : ''} />
              <span>{n.label}</span>
              <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">{n.en}</span>
            </a>
          );
        })}
      </nav>
      <div className="mt-auto text-[11.5px] leading-relaxed text-muted">
        数据仅保存在本机浏览器。
        <br />
        定期在「设置」导出备份。
      </div>
    </aside>
  );
}

function BottomNav({ page, onMore }: { page: PageId; onMore: () => void }) {
  const inMore = !MOBILE_PRIMARY.includes(page);
  return (
    <nav
      aria-label="主导航"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/92 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}
    >
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {NAV.filter((n) => MOBILE_PRIMARY.includes(n.page)).map((n) => {
          const active = n.page === page;
          return (
            <a key={n.page} href={href(n.page)} aria-current={active ? 'page' : undefined} className="flex flex-col items-center gap-0.5 pb-1.5 pt-2">
              <n.icon size={21} strokeWidth={active ? 2.2 : 1.6} className={active ? 'text-ink' : 'text-muted'} />
              <span className={`text-[10.5px] ${active ? 'font-semibold text-ink' : 'text-muted'}`}>{n.label}</span>
            </a>
          );
        })}
        <button type="button" onClick={onMore} className="flex flex-col items-center gap-0.5 pb-1.5 pt-2" aria-haspopup="dialog">
          <Ellipsis size={21} strokeWidth={inMore ? 2.2 : 1.6} className={inMore ? 'text-ink' : 'text-muted'} />
          <span className={`text-[10.5px] ${inMore ? 'font-semibold text-ink' : 'text-muted'}`}>{inMore ? NAV.find((n) => n.page === page)?.label : '更多'}</span>
        </button>
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="更多">
      <div className="grid grid-cols-3 gap-2 pb-2">
        {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.page)).map((n) => (
          <a key={n.page} href={href(n.page)} onClick={onClose} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface px-2 py-4">
            <n.icon size={22} strokeWidth={1.7} className="text-gold-ink" />
            <span className="text-[14px] font-medium">{n.label}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{n.en}</span>
          </a>
        ))}
      </div>
    </Sheet>
  );
}

function Toasts() {
  const toasts = useToasts();
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto flex items-center gap-4 rounded-full bg-navy py-2 pl-4 pr-2 text-[13.5px] text-on-navy shadow-lg"
          >
            <span>{t.message}</span>
            {t.action ? (
              <button
                type="button"
                className="rounded-full px-3 py-1 font-semibold text-gold underline-offset-2 hover:underline"
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : (
              <span className="w-2" />
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PageFallback() {
  return <div className="py-24 text-center text-[13px] text-muted">载入中…</div>;
}

export function App() {
  useTheme();
  const route = useRoute();
  const [more, setMore] = useState(false);
  const saveFailed = useSaveFailed();
  const Page = PAGES[route.page];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.page]);

  useEffect(() => {
    void fillMissingRates();
  }, []);

  useEffect(() => {
    const nav = NAV.find((n) => n.page === route.page);
    document.title = route.page === 'home' ? 'HOKKAIDO 2027' : `${nav?.label} · HOKKAIDO 2027`;
  }, [route.page]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-dvh">
          <Sidebar page={route.page} />
          <main className="min-w-0 flex-1 pb-[calc(88px+env(safe-area-inset-bottom,0px))] lg:pb-16">
            {saveFailed && (
              <div className="gutter bg-warn py-2 text-center text-[13px] text-gold-ink">本机存储已满或被禁用，最近的修改可能未保存。请在「设置」导出备份或删除自定义照片。</div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={route.page} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <Suspense fallback={<PageFallback />}>
                  <Page param={route.param} />
                </Suspense>
              </m.div>
            </AnimatePresence>
          </main>
        </div>
        <BottomNav page={route.page} onMore={() => setMore(true)} />
        <MoreSheet open={more} onClose={() => setMore(false)} />
        <Toasts />
      </MotionConfig>
    </LazyMotion>
  );
}
