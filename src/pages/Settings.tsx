import { useRef, useState } from 'react';
import { Download, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import type { Traveler } from '../lib/types';
import { exportJson, mutate, resetState, setState, useAppState, validateImport } from '../lib/store';
import { applyRates, ECB_SOURCE, fetchEcbRates } from '../lib/rates';
import { downloadText } from '../lib/ics';
import { removeWithUndo } from '../lib/actions';
import { toast } from '../lib/toast';
import { LINKS } from '../lib/links';
import { Button, Card, ConfirmButton, CopyButton, IconButton, LinkPill, NumberField, PageHeader, SectionTitle, Segmented, TextArea, TextField } from '../components/ui';

function TravelerCard({ t, canRemove }: { t: Traveler; canRemove: boolean }) {
  const set = <K extends keyof Traveler>(k: K, v: Traveler[K]) => mutate((s) => void (s.travelers.find((x) => x.id === t.id)![k] = v));
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15px] font-semibold">
          {t.label} <span className="text-[13px] font-normal text-ink-2">{t.role}</span>
        </div>
        {canRemove && (
          <IconButton
            label={`移除 ${t.label}`}
            onClick={() =>
              removeWithUndo(`已移除 ${t.label}`, (s) => {
                s.travelers = s.travelers.filter((x) => x.id !== t.id);
              })
            }
          >
            <Trash2 size={15} />
          </IconButton>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <TextField label="姓名" value={t.name} onChange={(v) => set('name', v)} placeholder="未填写" />
        <NumberField label="年龄" value={t.age} onChange={(v) => set('age', v)} />
        <TextField label="身份" value={t.role} onChange={(v) => set('role', v)} />
        <TextField label="已有雪票 / 通票" value={t.passes} onChange={(v) => set('passes', v)} placeholder="未填写" />
        <div className="col-span-2">
          <TextArea label="备注" value={t.notes} onChange={(v) => set('notes', v)} rows={2} />
        </div>
      </div>
    </Card>
  );
}

function Rates() {
  const { settings } = useAppState();
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    setBusy(true);
    try {
      const data = await fetchEcbRates();
      applyRates(data, ['JPY', 'CNY']);
      toast(`已更新为 ${data.date} 的 ECB 参考汇率`);
    } catch {
      toast('无法联网获取汇率，请手动输入');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="p-5">
      <p className="text-[13.5px] text-ink-2">
        账目以 CAD 为主。酒店的人民币订单使用你提供的加币账目，不随汇率变化；汇率只用于估算项与旅途支出的换算。
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {(['JPY', 'CNY'] as const).map((c) => {
          const r = settings.rates[c];
          return (
            <div key={c} className="rounded-2xl bg-surface-2 p-4">
              <div className="font-mono text-[12px] tracking-[0.12em] text-muted">1 CAD = ? {c}</div>
              <div className="mt-2 grid gap-3">
                <NumberField
                  label={`${c} 汇率`}
                  value={r.perCad}
                  placeholder="未设置"
                  onChange={(v) =>
                    mutate((s) => {
                      s.settings.rates[c] = { perCad: v, source: '手动输入', asOf: new Date().toISOString().slice(0, 10) };
                    })
                  }
                />
                <div className="text-[12px] text-ink-2">
                  来源：{r.perCad ? r.source || '手动输入' : '未设置'}
                  {r.asOf ? ` · ${r.asOf}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={refresh} disabled={busy}>
          <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
          获取最新 ECB 参考汇率
        </Button>
        <span className="text-[12px] text-muted">{ECB_SOURCE}。会覆盖上面两个汇率。</span>
      </div>
    </Card>
  );
}

function DataTools() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState('');
  const doImport = (text: string) => {
    const r = validateImport(text);
    if (!r.ok) return toast(r.error);
    setState(r.state);
    setPaste('');
    toast('备份已导入');
  };
  return (
    <Card className="p-5">
      <p className="text-[13.5px] text-ink-2">所有修改自动保存在这台设备的浏览器里（localStorage），刷新不会丢失。换手机或清除浏览器数据前，请先导出备份。</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          tone="primary"
          onClick={() => {
            const ok = downloadText(`hokkaido2027-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJson(), 'application/json');
            toast(ok ? '已导出 JSON 备份' : '当前环境不支持下载，请用「复制 JSON」');
          }}
        >
          <Download size={15} />
          导出 JSON
        </Button>
        <CopyButton text={exportJson()} label="复制 JSON" />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          id="import-file"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) doImport(await f.text());
            e.target.value = '';
          }}
        />
        <Button onClick={() => fileRef.current?.click()}>
          <Upload size={15} />
          导入 JSON 文件
        </Button>
      </div>
      <div className="mt-4">
        <TextArea label="或粘贴备份 JSON" value={paste} onChange={setPaste} rows={3} placeholder='{"version":1, …}' />
        <div className="mt-2">
          <Button onClick={() => doImport(paste)} disabled={!paste.trim()}>
            导入粘贴的内容
          </Button>
        </div>
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <div className="text-[13px] text-ink-2">恢复初始数据会清除所有修改（建议先导出备份）。</div>
        <div className="mt-2">
          <ConfirmButton
            label="恢复初始数据"
            confirmLabel="确认清除所有修改"
            onConfirm={() => {
              resetState();
              toast('已恢复初始数据');
            }}
          />
        </div>
      </div>
    </Card>
  );
}

export default function Settings() {
  const state = useAppState();
  const addTraveler = () =>
    mutate((s) => {
      const used = new Set(s.travelers.map((t) => t.id));
      const id = 'ABCDEF'.split('').find((l) => !used.has(l)) ?? `T${s.travelers.length + 1}`;
      s.travelers.push({ id, label: `旅客 ${id}`, role: '同行', name: '', age: null, passes: '', notes: '' });
    });
  return (
    <div className="gutter">
      <div className="mx-auto max-w-[1100px] pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <PageHeader eyebrow="SETTINGS · 设置" title="旅客、汇率与数据" />

        <SectionTitle
          aside={
            <Button onClick={addTraveler} disabled={state.travelers.length >= 6}>
              <Plus size={15} />
              添加旅客
            </Button>
          }
        >
          旅客 · {state.travelers.length} 人
        </SectionTitle>
        <p className="mb-3 text-[13px] text-ink-2">改成 4 人时，去程机票估算会自动按人数乘算，雪票矩阵会出现新旅客（需自行设置），交通页会检查车辆座位与行李容量。酒店房间数不会自动改变。</p>
        <div className="grid gap-4 md:grid-cols-2">
          {state.travelers.map((t) => (
            <TravelerCard key={t.id} t={t} canRemove={state.travelers.length > 1} />
          ))}
        </div>

        <SectionTitle>汇率</SectionTitle>
        <Rates />

        <SectionTitle>外观</SectionTitle>
        <Segmented
          label="外观"
          value={state.settings.theme}
          onChange={(v) => mutate((s) => void (s.settings.theme = v))}
          options={[
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ]}
        />

        <SectionTitle>数据备份</SectionTitle>
        <DataTools />

        <SectionTitle>添加到手机主屏幕</SectionTitle>
        <Card className="p-5 text-[13.5px] leading-relaxed text-ink-2">
          <p>
            <b className="text-ink">iPhone（Safari）</b>：打开网页 → 点底部「分享」→「添加到主屏幕」。之后从主屏幕图标打开，全屏显示，订单与行程可离线查看。
          </p>
          <p className="mt-2">
            <b className="text-ink">Android（Chrome）</b>：菜单 →「安装应用」或「添加到主屏幕」。
          </p>
          <p className="mt-2 text-[12.5px] text-muted">离线时地图、官网、汇率更新等外部链接需要网络；你添加的网络图片会在首次查看后缓存。</p>
        </Card>

        <SectionTitle>数据来源与说明</SectionTitle>
        <Card className="p-5 text-[13px] leading-relaxed text-ink-2">
          <ul className="list-disc space-y-1.5 pl-4">
            <li>订单信息全部来自你提供的行程资料；未提供的订单号、姓名、电话保持空白。</li>
            <li>候选去程航班、雪票价格、油费、高速、停车均为估算或之前查询的价格，不计入已付。</li>
            <li>CNY 默认汇率由你的两笔 Ctrip 订单推算（RMB 1,861.86 ≈ CAD 388.21；RMB 2,838.65 ≈ CAD 592.00）。</li>
            <li>酒店与雪场官网链接、公开电话经检索核实；车程均为参考值，冬季以实时导航为准。</li>
            <li>地图按钮使用 Google Maps 官方 URL 格式，按真实名称或地址搜索。</li>
            <li>封面为原创矢量插画，不代表酒店或景点实景。</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkPill href={LINKS.visitHokkaido}>Visit Hokkaido</LinkPill>
            <LinkPill href={LINKS.jpConsulateVancouver}>日本驻温哥华总领事馆</LinkPill>
            <LinkPill href={LINKS.caaIdp}>CAA · IDP</LinkPill>
          </div>
        </Card>
      </div>
    </div>
  );
}
