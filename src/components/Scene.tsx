import { memo, useId, type ReactNode } from 'react';
import type { SceneId } from '../lib/types';

/* Original vector illustrations. Shapes are generated from a seeded PRNG so every
   render is identical and nothing is fetched over the network. */

const W = 1200;
const H = 800;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Midpoint-displacement ridge from (0,y0) to (W,y1), closed to the bottom. */
function ridge(seed: number, y0: number, y1: number, amp: number, rough = 0.52, depth = 7): string {
  const r = rng(seed);
  let pts: [number, number][] = [
    [0, y0],
    [W, y1],
  ];
  let a = amp;
  for (let i = 0; i < depth; i++) {
    const next: [number, number][] = [];
    for (let j = 0; j < pts.length - 1; j++) {
      const [x0, ya] = pts[j];
      const [x1, yb] = pts[j + 1];
      next.push([x0, ya], [(x0 + x1) / 2, (ya + yb) / 2 + (r() - 0.5) * a]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    a *= rough;
  }
  return `M0,${H} ` + pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L${W},${H} Z`;
}

/** A stratovolcano cone (Mt. Yōtei style) with a slightly flattened summit. */
function cone(cx: number, base: number, half: number, height: number, seed: number) {
  const r = rng(seed);
  const top = base - height;
  const left: string[] = [];
  const right: string[] = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = top + height * Math.pow(t, 1.15);
    const spread = 18 + (half - 18) * Math.pow(t, 0.82);
    left.push(`${(cx - spread + (r() - 0.5) * 6).toFixed(1)},${y.toFixed(1)}`);
    right.unshift(`${(cx + spread + (r() - 0.5) * 6).toFixed(1)},${y.toFixed(1)}`);
  }
  const body = `M${left.join(' L')} L${right.join(' L')} Z`;
  // Snow cap with a jagged lower edge.
  const capY = top + height * 0.5;
  const capSpread = 18 + (half - 18) * Math.pow(0.5, 0.82);
  const teeth: string[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const x = cx + capSpread - (2 * capSpread * i) / n;
    const y = capY + (i % 2 === 0 ? r() * 10 : 18 + r() * 34);
    teeth.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const cap = `M${cx - 18},${top} L${cx + 18},${top} L${cx + capSpread},${capY} L${teeth.join(' L')} L${cx - capSpread},${capY} Z`;
  return { body, cap };
}

/** Many conifers in a single path. */
function conifers(seed: number, count: number, x0: number, x1: number, yBase: (x: number) => number, hMin: number, hMax: number): string {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const y = yBase(x) + r() * 14;
    const h = hMin + r() * (hMax - hMin);
    const w = h * (0.34 + r() * 0.1);
    for (let k = 0; k < 3; k++) {
      const ty = y - h + (k * h) / 3.4;
      const tw = (w * (k + 1.4)) / 3.4;
      d += `M${x.toFixed(1)},${ty.toFixed(1)} L${(x + tw).toFixed(1)},${(ty + h / 2.2).toFixed(1)} L${(x - tw).toFixed(1)},${(ty + h / 2.2).toFixed(1)} Z `;
    }
    d += `M${(x - 1.5).toFixed(1)},${(y - 4).toFixed(1)} h3 v8 h-3 Z `;
  }
  return d;
}

function flakes(seed: number, count: number, maxR = 2.6): ReactNode[] {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => (
    <circle key={i} cx={r() * W} cy={r() * H} r={0.6 + r() * maxR} opacity={0.35 + r() * 0.55} />
  ));
}

function windows(seed: number, x: number, y: number, w: number, h: number, density: number, color: string): ReactNode {
  const r = rng(seed);
  const cells: ReactNode[] = [];
  for (let yy = y + 8; yy < y + h - 10; yy += 14) {
    for (let xx = x + 6; xx < x + w - 8; xx += 11) {
      if (r() < density) cells.push(<rect key={`${xx}-${yy}`} x={xx} y={yy} width={5} height={7} fill={color} opacity={0.45 + r() * 0.5} />);
    }
  }
  return cells;
}

type Painter = (id: string) => ReactNode;

const yotei = cone(760, 540, 380, 320, 11);

const PAINTERS: Record<SceneId, Painter> = {
  hero: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7dbe4" />
          <stop offset="0.55" stopColor="#e7ecea" />
          <stop offset="0.8" stopColor="#f2e6d4" />
        </linearGradient>
        <radialGradient id={`${id}sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6e3c3" stopOpacity="0.95" />
          <stop offset="1" stopColor="#f6e3c3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}cone`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f9bab" />
          <stop offset="0.55" stopColor="#97afbd" />
          <stop offset="1" stopColor="#6d8899" />
        </linearGradient>
        <linearGradient id={`${id}mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f5f1" stopOpacity="0" />
          <stop offset="1" stopColor="#f6f5f1" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <circle cx="930" cy="250" r="260" fill={`url(#${id}sun)`} />
      <path d={ridge(3, 500, 470, 90)} fill="#b9cdd7" />
      <path d={yotei.body} fill={`url(#${id}cone)`} />
      <path d={yotei.cap} fill="#f7f8f6" />
      <rect y="430" width={W} height="170" fill={`url(#${id}mist)`} />
      <path d={ridge(7, 600, 570, 80)} fill="#7891a0" />
      <path d={ridge(9, 640, 650, 60)} fill="#56707f" />
      <path d={ridge(12, 690, 680, 30, 0.4)} fill="#eef1ef" />
      <path d={conifers(21, 70, 0, 430, () => 700, 40, 110)} fill="#20354a" />
      <path d={conifers(22, 60, 860, 1200, () => 700, 40, 120)} fill="#20354a" />
      <path d={conifers(23, 40, 380, 900, () => 690, 18, 40)} fill="#3d5566" opacity="0.8" />
      <rect y="720" width={W} height="80" fill="#f6f5f1" />
      <path d={ridge(14, 735, 725, 16, 0.4)} fill="#e6ebec" />
    </>
  ),
  otaru: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15263a" />
          <stop offset="0.6" stopColor="#36506a" />
          <stop offset="1" stopColor="#7d93a5" />
        </linearGradient>
        <linearGradient id={`${id}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c4459" />
          <stop offset="1" stopColor="#13202d" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f4d29a" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#e3b46e" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e3b46e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <path d={ridge(31, 360, 380, 60)} fill="#2b4358" />
      {/* warehouses, left bank */}
      {[
        [0, 300, 150],
        [140, 330, 120],
        [250, 280, 170],
        [410, 320, 120],
        [520, 350, 95],
      ].map(([x, top, w], i) => (
        <g key={i}>
          <path d={`M${x},440 V${top + 40} L${x + w / 2},${top} L${x + w},${top + 40} V440 Z`} fill="#172636" />
          <path d={`M${x - 4},${top + 42} L${x + w / 2},${top} L${x + w + 4},${top + 42} L${x + w},${top + 46} L${x + w / 2},${top + 8} L${x},${top + 46} Z`} fill="#e9eef1" />
          {[0.25, 0.55].map((f) => (
            <rect key={f} x={x + w * f} y={top + 70} width={w * 0.14} height={22} fill="#e7b874" opacity="0.8" />
          ))}
        </g>
      ))}
      {/* right bank, smaller in the distance */}
      {[
        [700, 392, 80],
        [770, 380, 100],
        [860, 396, 70],
        [920, 372, 130],
        [1040, 386, 160],
      ].map(([x, top, w], i) => (
        <g key={i}>
          <path d={`M${x},440 V${top + 22} L${x + w / 2},${top} L${x + w},${top + 22} V440 Z`} fill="#1d2f40" />
          <path d={`M${x - 2},${top + 23} L${x + w / 2},${top} L${x + w + 2},${top + 23} L${x + w / 2},${top + 5} Z`} fill="#dfe7ec" />
        </g>
      ))}
      <rect y="432" width={W} height="14" fill="#e9eef1" />
      <rect y="446" width={W} height={H - 446} fill={`url(#${id}water)`} />
      {/* lamp reflections and ripples */}
      {[90, 230, 370, 510, 760, 900, 1050].map((x, i) => (
        <rect key={i} x={x - 3} y="452" width="6" height={200 - (i % 3) * 30} fill="#e3b46e" opacity="0.28" />
      ))}
      {Array.from({ length: 26 }, (_, i) => (
        <line key={i} x1={(i * 97) % W} x2={((i * 97) % W) + 60 + (i % 4) * 30} y1={470 + i * 12} y2={470 + i * 12} stroke="#8fa8bb" strokeOpacity="0.25" strokeWidth="1.5" />
      ))}
      {/* gas lamps */}
      {[90, 230, 370, 510].map((x) => (
        <g key={x}>
          <circle cx={x} cy={318} r="60" fill={`url(#${id}glow)`} />
          <rect x={x - 2} y={322} width="4" height="112" fill="#0f1a26" />
          <path d={`M${x - 9},${310} h18 l-4,16 h-10 Z`} fill="#f5d9a6" />
        </g>
      ))}
      {/* snow light path candles along the bank */}
      {Array.from({ length: 34 }, (_, i) => {
        const x = 20 + i * 35;
        return (
          <g key={i}>
            <circle cx={x} cy={437} r="10" fill={`url(#${id}glow)`} />
            <circle cx={x} cy={437} r="2.2" fill="#ffe6b8" />
          </g>
        );
      })}
      <g fill="#f6f5f1">{flakes(41, 70)}</g>
    </>
  ),
  sapporo: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1926" />
          <stop offset="0.7" stopColor="#24394e" />
          <stop offset="1" stopColor="#465f74" />
        </linearGradient>
        <linearGradient id={`${id}snow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4dfe6" />
          <stop offset="1" stopColor="#f1f4f4" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      {/* skyline */}
      {[
        [0, 360, 110],
        [100, 410, 90],
        [180, 330, 120],
        [290, 390, 80],
        [360, 300, 110],
        [760, 340, 100],
        [850, 400, 70],
        [910, 300, 130],
        [1030, 370, 90],
        [1110, 330, 90],
      ].map(([x, top, w], i) => (
        <g key={i}>
          <rect x={x} y={top} width={w} height={600 - top} fill={i % 2 ? '#172738' : '#1b2d40'} />
          {windows(100 + i, x, top, w, 600 - top, 0.32, '#e8bf7e')}
        </g>
      ))}
      {/* TV tower */}
      <g>
        <path d="M560,600 L588,330 L612,330 L640,600 L622,600 L604,360 L596,360 L578,600 Z" fill="#132232" />
        {Array.from({ length: 9 }, (_, i) => {
          const y = 360 + i * 27;
          const spread = 8 + (i * 27 * 32) / 240;
          return <line key={i} x1={600 - spread - 4} x2={600 + spread + 4} y1={y} y2={y} stroke="#2e4a62" strokeWidth="3" />;
        })}
        <rect x="574" y="300" width="52" height="34" fill="#1a2e42" />
        <rect x="578" y="306" width="44" height="8" fill="#f0c98a" opacity="0.9" />
        <circle cx="600" cy="420" r="13" fill="#f6f2e8" />
        <path d="M600,412 V420 L606,424" stroke="#1a2e42" strokeWidth="2" fill="none" />
        <rect x="597" y="210" width="6" height="92" fill="#132232" />
        <circle cx="600" cy="208" r="4" fill="#e66a5a" />
      </g>
      <path d={ridge(51, 600, 605, 10, 0.4)} fill={`url(#${id}snow)`} />
      {/* Odori park trees with lights */}
      {[120, 260, 400, 820, 960, 1100].map((x, i) => (
        <g key={x}>
          <path d={`M${x},700 V630 M${x},660 l-30,-28 M${x},650 l26,-30 M${x},640 l-14,-26`} stroke="#3c5366" strokeWidth="4" fill="none" />
          {Array.from({ length: 14 }, (_, k) => (
            <circle key={k} cx={x - 34 + ((k * 37 + i * 11) % 68)} cy={600 + ((k * 23) % 46)} r="2.4" fill="#f3cf8e" />
          ))}
        </g>
      ))}
      <g fill="#f6f5f1">{flakes(52, 90)}</g>
    </>
  ),
  niseko: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b3cfdb" />
          <stop offset="1" stopColor="#eaf0f0" />
        </linearGradient>
        <linearGradient id={`${id}slope`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe6eb" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      {(() => {
        const c = cone(330, 470, 250, 220, 61);
        return (
          <>
            <path d={c.body} fill="#9bb3c1" />
            <path d={c.cap} fill="#f8f9f8" />
          </>
        );
      })()}
      <path d={ridge(62, 470, 440, 70)} fill="#c3d4dc" />
      <path d={ridge(63, 520, 500, 50)} fill="#a7bcc7" />
      <path d={conifers(64, 70, 0, 1200, (x) => 520 - x * 0.02, 14, 30)} fill="#5b7470" opacity="0.8" />
      <path d={`M0,560 C300,520 700,600 1200,520 L1200,800 L0,800 Z`} fill={`url(#${id}slope)`} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${520 + i * 40},800 C${560 + i * 30},700 ${470 + i * 50},640 ${600 + i * 60},560`} stroke="#c0d1d9" strokeWidth="2" fill="none" />
      ))}
      {/* birch grove */}
      {Array.from({ length: 13 }, (_, i) => {
        const r = rng(70 + i);
        const x = 760 + i * 34 + r() * 10;
        const top = 300 + r() * 120;
        const base = 640 + r() * 40;
        return (
          <g key={i}>
            <rect x={x} y={top} width={7 + r() * 3} height={base - top} fill="#f4f3ee" />
            {Array.from({ length: 6 }, (_, k) => (
              <rect key={k} x={x} y={top + 20 + k * ((base - top) / 6.5)} width={4 + r() * 4} height="3" fill="#3b4a52" />
            ))}
            <path d={`M${x + 4},${top + 40} l-26,-40 M${x + 4},${top + 80} l24,-36`} stroke="#c9d3d6" strokeWidth="2" />
          </g>
        );
      })}
      <path d={conifers(66, 14, 0, 300, () => 680, 90, 190)} fill="#2f4a45" />
      <path d={conifers(67, 10, 0, 300, () => 690, 60, 80)} fill="#f6f5f1" opacity="0.5" />
      <g fill="#ffffff">{flakes(68, 50, 2)}</g>
    </>
  ),
  rusutsu: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3d8e1" />
          <stop offset="1" stopColor="#eef2f1" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <path d={ridge(81, 330, 300, 120)} fill="#c7d6dd" />
      <path d={ridge(82, 420, 380, 110)} fill="#e9eef0" />
      <path d={conifers(83, 160, 0, 1200, (x) => 440 - Math.sin(x / 190) * 30, 14, 26)} fill="#6e8580" opacity="0.75" />
      <path d={ridge(84, 520, 470, 90)} fill="#f4f6f5" />
      <path d={conifers(85, 150, 0, 1200, (x) => 560 - Math.cos(x / 150) * 26, 24, 44)} fill="#4f665c" />
      {/* groomed runs */}
      <path d="M180,800 C260,640 330,560 420,470 L470,480 C380,580 330,660 300,800 Z" fill="#fbfbf9" />
      <path d="M760,800 C780,690 840,600 900,520 L950,530 C890,610 860,700 880,800 Z" fill="#fbfbf9" />
      <path d={ridge(86, 660, 620, 60)} fill="#ffffff" opacity="0.9" />
      <path d={conifers(87, 26, 0, 1200, () => 760, 70, 150)} fill="#2e463e" />
      {/* gondola */}
      <path d="M0,520 Q600,250 1200,110" stroke="#20354a" strokeWidth="2" fill="none" />
      {[140, 420, 700, 980].map((x, i) => {
        const t = x / 1200;
        const y = (1 - t) * (1 - t) * 520 + 2 * (1 - t) * t * 250 + t * t * 110;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y + 18} stroke="#20354a" strokeWidth="2" />
            <rect x={x - 13} y={y + 18} width="26" height="22" rx="6" fill={i % 2 ? '#c1a682' : '#20354a'} />
            <rect x={x - 8} y={y + 23} width="16" height="7" rx="2" fill="#e6eef2" />
          </g>
        );
      })}
      <g fill="#ffffff">{flakes(88, 40, 2)}</g>
    </>
  ),
  toya: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfdde4" />
          <stop offset="1" stopColor="#f0ece4" />
        </linearGradient>
        <linearGradient id={`${id}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d5d74" />
          <stop offset="1" stopColor="#223a4e" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <path d={ridge(91, 400, 420, 70)} fill="#a8bcc7" />
      <path d={ridge(92, 450, 440, 40)} fill="#e7edef" />
      {/* hilltop hotel on the rim */}
      <path d={ridge(93, 300, 470, 40, 0.45)} fill="#8aa1ae" />
      <path d="M150,312 Q260,262 370,318 L370,334 Q260,282 150,330 Z" fill="#20354a" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={170 + i * 13.5} y={306 - Math.sin((i / 13) * Math.PI) * 18} width="5" height="8" fill="#f1cf93" />
      ))}
      <rect y="470" width={W} height="200" fill={`url(#${id}lake)`} />
      {/* Nakajima island */}
      <path d="M470,500 C520,440 640,430 720,470 C760,488 780,500 790,505 L470,505 Z" fill="#3a5550" />
      <path d="M560,462 C600,446 650,446 690,462 C650,458 600,458 560,470 Z" fill="#eef2f1" />
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1={(i * 131) % 1100} x2={((i * 131) % 1100) + 70} y1={520 + i * 6.5} y2={520 + i * 6.5} stroke="#bcd0dc" strokeOpacity="0.35" strokeWidth="1.5" />
      ))}
      {/* Showa-shinzan dome with a thread of steam */}
      <path d="M940,474 C960,430 1010,430 1030,474 Z" fill="#9a8a78" />
      <path d="M985,430 C975,400 1000,380 990,350" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d={ridge(94, 670, 660, 30, 0.4)} fill="#f6f5f1" />
      <path d={conifers(95, 40, 0, 1200, () => 720, 50, 120)} fill="#20354a" />
      <g fill="#ffffff">{flakes(96, 40, 2)}</g>
    </>
  ),
  flight: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2d40" />
          <stop offset="0.55" stopColor="#4c6880" />
          <stop offset="0.85" stopColor="#c9b393" />
          <stop offset="1" stopColor="#e7d8bf" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx={(i * 211) % 1300} cy={600 + (i % 3) * 50} rx={260} ry={34} fill="#f6f5f1" opacity={0.18 + (i % 3) * 0.1} />
      ))}
      <path d={ridge(101, 690, 700, 30, 0.4)} fill="#f2ede4" opacity="0.9" />
      <path d="M-20,520 Q520,170 1040,240" stroke="#f6f5f1" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeDasharray="2 10" />
      <g transform="translate(1040 236) rotate(8)">
        <path d="M-60,0 L40,-4 C52,-4 58,0 52,4 L40,6 L-60,4 Z" fill="#f6f5f1" />
        <path d="M-6,0 L-34,-38 L-20,-38 L18,-2 Z M-6,4 L-34,40 L-20,40 L18,6 Z M-56,1 L-70,-20 L-62,-20 L-44,1 Z" fill="#f6f5f1" />
      </g>
      <g fill="#f6f5f1">{flakes(102, 30, 1.6)}</g>
    </>
  ),
  'hotel-otaru': (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a4259" />
          <stop offset="1" stopColor="#c5ae8c" />
        </linearGradient>
        <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a6579" />
          <stop offset="1" stopColor="#1d3142" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <path d={ridge(111, 470, 430, 80)} fill="#556f82" />
      <rect y="500" width={W} height="300" fill={`url(#${id}sea)`} />
      <rect x="430" y="150" width="210" height="400" fill="#1b2c3c" />
      <rect x="430" y="146" width="210" height="8" fill="#eef2f3" />
      {windows(112, 430, 160, 210, 380, 0.55, '#f0c98a')}
      <rect x="640" y="420" width="420" height="130" fill="#22364a" />
      <rect x="640" y="414" width="420" height="8" fill="#eef2f3" />
      {windows(113, 640, 430, 420, 110, 0.25, '#e7bf80')}
      <rect y="548" width={W} height="10" fill="#eef2f3" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={440 + i * 13} y="560" width="4" height={60 + (i % 4) * 20} fill="#f0c98a" opacity="0.25" />
      ))}
      <g fill="#f6f5f1">{flakes(114, 60)}</g>
    </>
  ),
  'hotel-sapporo': (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e1a27" />
          <stop offset="1" stopColor="#3a5268" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <rect x="120" y="380" width="200" height="320" fill="#182838" />
      {windows(121, 120, 380, 200, 320, 0.3, '#d9b273')}
      <rect x="880" y="340" width="220" height="360" fill="#182838" />
      {windows(122, 880, 340, 220, 360, 0.3, '#d9b273')}
      {/* the tower: shops below, hotel floors above */}
      <rect x="430" y="120" width="340" height="580" fill="#1d3044" />
      <rect x="430" y="470" width="340" height="230" fill="#25394e" />
      {windows(123, 430, 130, 340, 330, 0.62, '#f3d29b')}
      <rect x="450" y="490" width="300" height="60" fill="#c1a682" opacity="0.6" />
      <rect x="430" y="112" width="340" height="10" fill="#c1a682" />
      <rect y="700" width={W} height="100" fill="#e3eaee" />
      {[80, 360, 840, 1120].map((x) => (
        <g key={x}>
          <rect x={x - 2} y="610" width="4" height="92" fill="#0f1b27" />
          <circle cx={x} cy="606" r="9" fill="#f6dba6" />
        </g>
      ))}
      <g fill="#f6f5f1">{flakes(124, 90)}</g>
    </>
  ),
  'hotel-niseko': (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93aab8" />
          <stop offset="1" stopColor="#e4e9e8" />
        </linearGradient>
        <radialGradient id={`${id}steam`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <path d={ridge(131, 380, 340, 90)} fill="#b9c9d1" />
      <path d={conifers(132, 120, 0, 1200, () => 470, 50, 110)} fill="#46605b" />
      <path d={conifers(133, 120, 0, 1200, () => 470, 50, 110)} fill="#f6f5f1" opacity="0.25" />
      <path d="M300,560 L300,470 L600,420 L900,470 L900,560 Z" fill="#2c3f45" />
      <path d="M280,474 L600,410 L920,474 L920,486 L600,424 L280,486 Z" fill="#f4f6f5" />
      {[340, 420, 500, 640, 720, 800].map((x) => (
        <rect key={x} x={x} y="490" width="44" height="36" fill="#efc485" opacity="0.92" />
      ))}
      <rect y="556" width={W} height="244" fill="#f6f5f1" />
      <ellipse cx="420" cy="660" rx="170" ry="40" fill="#cddbe1" />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={360 + i * 50} cy={600 - i * 26} rx={90} ry={44} fill={`url(#${id}steam)`} />
      ))}
      <path d={conifers(134, 12, 760, 1200, () => 760, 120, 220)} fill="#2f4a45" />
      <g fill="#ffffff">{flakes(135, 60)}</g>
    </>
  ),
  'hotel-toya': (id) => (
    <>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f7c93" />
          <stop offset="0.7" stopColor="#d9c4a2" />
          <stop offset="1" stopColor="#efe2cb" />
        </linearGradient>
        <linearGradient id={`${id}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a7488" />
          <stop offset="1" stopColor="#2b4356" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <path d={ridge(141, 520, 500, 60)} fill="#8a9fae" />
      <rect y="560" width={W} height="240" fill={`url(#${id}lake)`} />
      <path d="M0,560 C200,300 520,250 760,300 C930,336 1060,430 1200,520 L1200,580 L0,580 Z" fill="#3e5465" />
      <path d="M260,330 C420,262 620,256 800,312 C760,300 600,282 430,306 Z" fill="#eef2f1" opacity="0.8" />
      <path d="M360,300 Q560,206 760,300 L760,326 Q560,236 360,326 Z" fill="#20354a" />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={380 + i * 15.5} y={296 - Math.sin((i / 23) * Math.PI) * 40} width="6" height="9" fill="#f3d49c" />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <line key={i} x1={(i * 151) % 1100} x2={((i * 151) % 1100) + 80} y1={600 + i * 10} y2={600 + i * 10} stroke="#d9c4a2" strokeOpacity="0.35" strokeWidth="1.5" />
      ))}
      <g fill="#ffffff">{flakes(142, 40, 2)}</g>
    </>
  ),
};

interface SceneProps {
  id: SceneId;
  className?: string;
  title?: string;
}

/** Full-bleed illustrated scene; fills its box like `object-fit: cover`. */
export const Scene = memo(function Scene({ id, className = '', title }: SceneProps) {
  const uidPrefix = useId().replace(/:/g, '');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full ${className}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {PAINTERS[id](`${uidPrefix}${id}`)}
    </svg>
  );
});

/** Slow falling snow, drawn once and translated with CSS. Respects reduced motion. */
export function Snowfall({ count = 60 }: { count?: number }) {
  const r = rng(999);
  const dots = Array.from({ length: count }, () => ({ x: r() * 100, y: r() * 100, s: 1 + r() * 2.4, o: 0.4 + r() * 0.5 }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[0, 1].map((layer) => (
        <svg
          key={layer}
          className="snowfall absolute inset-x-0 -top-full h-[200%] w-full"
          style={{ animationDuration: `${layer ? 38 : 26}s`, animationDelay: `${layer ? -12 : 0}s` }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {dots.slice(layer * (count / 2), (layer + 1) * (count / 2)).map((d, i) => (
            <ellipse key={i} cx={d.x} cy={d.y} rx={d.s * 0.12} ry={d.s * 0.06} fill="#ffffff" opacity={d.o} />
          ))}
        </svg>
      ))}
    </div>
  );
}
