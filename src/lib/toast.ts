import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function toast(message: string, action?: Toast['action'], ms = 4500) {
  const t = { id: ++seq, message, action };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => dismiss(t.id), ms);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
}
