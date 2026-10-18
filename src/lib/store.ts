import { useSyncExternalStore } from 'react';
import type { AppState } from './types';
import { createSeed, SCHEMA_VERSION } from './seed';

const KEY = 'hokkaido2027:state';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Fill in anything a saved state is missing (older versions, partial imports). */
export function normalize(input: unknown): AppState {
  const seed = createSeed();
  if (!input || typeof input !== 'object') return seed;
  const raw = input as Partial<AppState>;
  const merged: AppState = { ...seed, ...raw, version: SCHEMA_VERSION } as AppState;
  merged.settings = {
    ...seed.settings,
    ...(raw.settings ?? {}),
    rates: { ...seed.settings.rates, ...(raw.settings?.rates ?? {}) },
  };
  merged.luggage = { ...seed.luggage, ...(raw.luggage ?? {}) };
  merged.car = { ...seed.car, ...(raw.car ?? {}) };
  merged.returnFlight = { ...seed.returnFlight, ...(raw.returnFlight ?? {}) };
  if (!merged.images || typeof merged.images !== 'object') merged.images = {};
  for (const key of ['travelers', 'days', 'hotels', 'outboundOptions', 'legs', 'skiDays', 'budgetLines', 'expenses', 'checklist', 'gear'] as const) {
    if (!Array.isArray(merged[key])) (merged as unknown as Record<string, unknown>)[key] = seed[key];
  }
  return merged;
}

export function validateImport(text: string): { ok: true; state: AppState } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: '不是有效的 JSON 文件' };
  }
  const p = parsed as Partial<AppState>;
  if (!p || typeof p !== 'object' || !Array.isArray(p.days) || !Array.isArray(p.hotels)) {
    return { ok: false, error: '文件缺少行程或酒店数据，看起来不是本应用导出的备份' };
  }
  return { ok: true, state: normalize(parsed) };
}

function load(): AppState {
  const text = safeGet(KEY);
  if (!text) return createSeed();
  try {
    return normalize(JSON.parse(text));
  } catch {
    return createSeed();
  }
}

let state: AppState = load();
let saveFailed = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveFailed = !safeSet(KEY, JSON.stringify(state));
    emit();
  }, 250);
}

export function getState(): AppState {
  return state;
}

export function setState(next: AppState) {
  state = next;
  persist();
  emit();
}

/** Apply a change to a deep copy of the state, then save. */
export function mutate(fn: (draft: AppState) => void) {
  const draft = structuredClone(state);
  fn(draft);
  setState(draft);
}

export function resetState() {
  setState(createSeed());
}

export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useSaveFailed(): boolean {
  return useSyncExternalStore(subscribe, () => saveFailed, () => false);
}

export function uid(prefix = 'x'): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) {
      try {
        state = normalize(JSON.parse(e.newValue));
        emit();
      } catch {
        /* ignore malformed writes from other tabs */
      }
    }
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(saveTimer);
    safeSet(KEY, JSON.stringify(state));
  });
}
