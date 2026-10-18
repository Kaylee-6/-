import { href } from '../lib/router';

/* Schematic map of south-west Hokkaido. Positions are projected from real
   coordinates (equirectangular, latitude scaled for ~43°N); the coastline is simplified. */

const K = 260;
const KY = K * 1.37;
const px = (lon: number) => 30 + (lon - 140.6) * K;
const py = (lat: number) => 20 + (43.25 - lat) * KY;

interface Node {
  id: string;
  zh: string;
  en: string;
  lon: number;
  lat: number;
  nights?: string;
  dx: number;
  dy: number;
  anchor: 'start' | 'end' | 'middle';
  region?: string;
}

const NODES: Node[] = [
  { id: 'otaru', zh: '小樽', en: 'Otaru', lon: 141.0, lat: 43.19, nights: '1 晚', dx: -8, dy: -10, anchor: 'end', region: 'otaru' },
  { id: 'sapporo', zh: '札幌', en: 'Sapporo', lon: 141.354, lat: 43.06, nights: '2 晚', dx: 10, dy: -8, anchor: 'start', region: 'sapporo' },
  { id: 'cts', zh: '新千岁', en: 'CTS', lon: 141.692, lat: 42.775, dx: -10, dy: 18, anchor: 'end' },
  { id: 'niseko', zh: '二世古', en: 'Niseko', lon: 140.69, lat: 42.86, nights: '1 晚', dx: -2, dy: -14, anchor: 'start', region: 'niseko' },
  { id: 'rusutsu', zh: '留寿都', en: 'Rusutsu', lon: 140.9, lat: 42.75, dx: 10, dy: 4, anchor: 'start', region: 'rusutsu' },
  { id: 'toya', zh: '洞爷湖', en: 'Lake Toya', lon: 140.79, lat: 42.58, nights: '2 晚', dx: 12, dy: 14, anchor: 'start', region: 'toya' },
];

const COAST: [number, number][] = [
  [140.3, 43.0],
  [140.51, 42.98],
  [140.55, 43.12],
  [140.79, 43.21],
  [141.0, 43.2],
  [141.17, 43.15],
  [141.32, 43.23],
  [141.45, 43.36],
  [142.1, 43.36],
  [142.1, 42.62],
  [141.6, 42.62],
  [141.36, 42.53],
  [141.1, 42.42],
  [140.97, 42.33],
  [140.86, 42.46],
  [140.76, 42.53],
  [140.7, 42.57],
  [140.3, 42.62],
];

function smooth(points: [number, number][]): string {
  const p = points.map(([lon, lat]) => [px(lon), py(lat)]);
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

const pos = (id: string) => {
  const n = NODES.find((x) => x.id === id)!;
  return [px(n.lon), py(n.lat)] as const;
};

function curve(a: string, b: string, bend = 0.18): string {
  const [x1, y1] = pos(a);
  const [x2, y2] = pos(b);
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

/** Paper-coloured outline behind labels so they stay legible where routes cross. */
const HALO = { stroke: 'var(--surface)', strokeWidth: 3, paintOrder: 'stroke', strokeLinejoin: 'round' } as const;

const ROUTE = [
  curve('cts', 'otaru', 0.12),
  curve('otaru', 'sapporo', -0.2),
  curve('sapporo', 'niseko', 0.14),
  curve('niseko', 'rusutsu', 0.2),
  curve('rusutsu', 'toya', 0.2),
  curve('toya', 'cts', 0.22),
];

export function RouteMap({ current }: { current?: string }) {
  const [cx, cy] = pos('cts');
  const yotei = [px(140.81), py(42.826)];
  const lake = [px(140.85), py(42.6)];
  return (
    <svg viewBox="0 0 360 300" className="h-auto w-full" role="img" aria-label="路线简图：新千岁 → 小樽 → 札幌 → 二世古 → 留寿都 → 洞爷湖 → 新千岁">
      <rect width="360" height="300" fill="var(--ice)" opacity="0.55" />
      <path d={smooth(COAST)} fill="var(--surface)" stroke="var(--line)" strokeWidth="1" />
      <text x="190" y="18" className="fill-muted font-mono" fontSize="8" letterSpacing="1.5">
        ISHIKARI BAY · 石狩湾
      </text>
      <text x="22" y="292" className="fill-muted font-mono" fontSize="8" letterSpacing="1.5">
        UCHIURA BAY
      </text>
      <text x="238" y="292" className="fill-muted font-mono" fontSize="8" letterSpacing="1.5">
        PACIFIC · 太平洋
      </text>
      {/* Mt. Yotei and Lake Toya landmarks */}
      <path d={`M${yotei[0] - 11},${yotei[1] + 7} L${yotei[0]},${yotei[1] - 8} L${yotei[0] + 11},${yotei[1] + 7} Z`} fill="var(--ice)" stroke="var(--muted)" strokeWidth="0.8" />
      <text x={yotei[0]} y={yotei[1] + 17} textAnchor="middle" fontSize="7" className="fill-muted" {...HALO}>
        羊蹄山
      </text>
      <ellipse cx={lake[0]} cy={lake[1]} rx="13" ry="10" fill="var(--ice)" stroke="var(--muted)" strokeWidth="0.6" />
      {/* flight in from / out to Vancouver */}
      <path d={`M360,${cy - 40} Q${cx + 30},${cy - 40} ${cx},${cy}`} stroke="var(--gold)" strokeWidth="1.4" strokeDasharray="3 4" fill="none" />
      <text x="352" y={cy - 46} textAnchor="end" fontSize="8.5" className="fill-gold-ink font-mono" letterSpacing="1">
        YVR ✈
      </text>
      {ROUTE.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      ))}
      {NODES.map((n) => {
        const x = px(n.lon);
        const y = py(n.lat);
        const active = current && (n.id === current || n.region === current);
        const body = (
          <g>
            {active && (
              <circle cx={x} cy={y} r="11" fill="var(--gold)" opacity="0.3">
                <animate attributeName="r" values="7;13;7" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={n.id === 'cts' ? 4.5 : 5} fill={n.id === 'cts' ? 'var(--gold)' : 'var(--ink)'} stroke="var(--surface)" strokeWidth="2" />
            <text x={x + n.dx} y={y + n.dy} textAnchor={n.anchor} fontSize="11.5" fontWeight="600" className="fill-ink" {...HALO}>
              {n.zh}
              <tspan className="fill-muted" fontSize="8" fontWeight="400" dx="3">
                {n.en}
              </tspan>
            </text>
            {n.nights && (
              <text x={x + n.dx} y={y + n.dy + 11} textAnchor={n.anchor} fontSize="8" className="fill-gold-ink font-mono" {...HALO}>
                {n.nights}
              </text>
            )}
          </g>
        );
        return n.region ? (
          <a key={n.id} href={href('explore', n.region)} aria-label={`${n.zh} 目的地介绍`}>
            {body}
          </a>
        ) : (
          <g key={n.id}>{body}</g>
        );
      })}
    </svg>
  );
}
