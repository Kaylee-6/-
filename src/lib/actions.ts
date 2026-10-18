import { useEffect, useState } from 'react';
import type { AppState } from './types';
import { getState, mutate, setState } from './store';
import { toast } from './toast';

/** Apply a destructive change and offer an undo toast instead of a confirm dialog. */
export function removeWithUndo(message: string, fn: (draft: AppState) => void) {
  const snapshot = getState();
  mutate(fn);
  toast(message, { label: '撤销', run: () => setState(snapshot) });
}

/** Current time, refreshed on an interval (1s for countdowns, 30s for "today"). */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}

/** Downscale a picked photo so it fits comfortably in localStorage. */
export function compressImage(file: File, max = 1400, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('无法识别这张图片'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('浏览器不支持图片压缩'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
