import { useRef, useState, type ReactNode } from 'react';
import { ImagePlus } from 'lucide-react';
import type { SceneId } from '../lib/types';
import { mutate, useAppState } from '../lib/store';
import { compressImage } from '../lib/actions';
import { toast } from '../lib/toast';
import { Scene } from './Scene';
import { Button, Sheet, TextField } from './ui';

/** A cover that shows the user's own photo when set, otherwise the illustrated scene. */
export function Cover({ imageKey, scene, title, className = '', children }: { imageKey: string; scene: SceneId; title?: string; className?: string; children?: ReactNode }) {
  const { images } = useAppState();
  const src = images[imageKey];
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src && !failed ? (
        <img src={src} alt={title ?? ''} className="h-full w-full object-cover" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <Scene id={scene} title={title} />
      )}
      {children}
    </div>
  );
}

export function CoverEditor({ imageKey, label }: { imageKey: string; label: string }) {
  const { images } = useAppState();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const current = images[imageKey] ?? '';

  const save = (value: string) => {
    mutate((s) => {
      if (value) s.images[imageKey] = value;
      else delete s.images[imageKey];
    });
    setOpen(false);
    toast(value ? '封面已更新' : '已恢复插画封面');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setUrl(current.startsWith('data:') ? '' : current);
          setOpen(true);
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/35 px-3 text-[12px] text-white backdrop-blur transition hover:bg-black/50"
      >
        <ImagePlus size={14} />
        更换封面
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`更换封面 · ${label}`}
        footer={
          <>
            {current && (
              <Button tone="ghost" onClick={() => save('')}>
                恢复插画
              </Button>
            )}
            <Button tone="primary" onClick={() => save(url.trim())} disabled={!url.trim()}>
              使用这个链接
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px] text-ink-2">默认封面为原创插画。可以换成自己拍的照片，或粘贴一张有使用权的图片链接。照片只保存在这台设备的浏览器里。</p>
          <TextField label="图片链接（https://）" value={url} onChange={setUrl} placeholder="https://…" inputMode="url" />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              id={`file-${imageKey}`}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  save(await compressImage(f));
                } catch (err) {
                  toast((err as Error).message);
                }
              }}
            />
            <Button onClick={() => fileRef.current?.click()}>
              <ImagePlus size={15} />
              从相册选择照片
            </Button>
            <p className="mt-2 text-[12px] text-muted">照片会压缩到约 1400px 宽后存入本机。</p>
          </div>
        </div>
      </Sheet>
    </>
  );
}
