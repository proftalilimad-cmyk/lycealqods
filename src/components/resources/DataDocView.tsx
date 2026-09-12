import { useEffect } from "react";
import { BookOpenCheck, HelpCircle, Printer, X } from "lucide-react";
import type { ChartDataDoc, MapDataDoc, ResourceItem, TableDataDoc } from "../../data/resources";
import type { Route } from "../../routes";
import MimosaMap from "../geo/MimosaMap";

/* ============================================================
   عارض الوثائق البيانية: جدول / مبيان / خريطة تخطيطية
   يُرسم كل شيء بـ SVG وHTML بألوان هوية المنصة (بدون مكتبات خارجية)
   ============================================================ */

const PALETTE = ["#0f7c5b", "#e6b457", "#3fa883", "#b97f26", "#0a4d3a", "#efcb80"];

/* ---------- جدول ---------- */
function TableDoc({ doc }: { doc: TableDataDoc }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-900/8">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <caption className="bg-brand-50 px-4 py-3 text-start text-xs font-extrabold text-brand-800">{doc.caption}</caption>
        <thead>
          <tr className="bg-brand-700 text-white">
            {doc.columns.map((c) => (
              <th key={c} className="px-4 py-2.5 text-start text-xs font-extrabold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doc.rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-paper"}>
              {r.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-extrabold text-ink-900" : "font-semibold text-ink-700"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- مبيان أعمدة ---------- */
function BarChart({ doc }: { doc: ChartDataDoc }) {
  const W = 520;
  const H = 260;
  const padX = 48;
  const padY = 28;
  const max = Math.max(...doc.series.map((s) => s.value)) * 1.15;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const bw = Math.min(56, (innerW / doc.series.length) * 0.55);
  const step = innerW / doc.series.length;
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-ink-900/8 bg-white" role="img" aria-label={doc.caption}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padY + innerH - (innerH / ticks) * i;
        const v = Math.round((max / ticks) * i);
        return (
          <g key={i}>
            <line x1={padX} x2={W - padX} y1={y} y2={y} stroke="#e7e3d6" strokeWidth="1" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#5b6e66" fontWeight="700">
              {v}
            </text>
          </g>
        );
      })}
      {doc.series.map((s, i) => {
        const h = (s.value / max) * innerH;
        const x = padX + step * i + (step - bw) / 2;
        const y = padY + innerH - h;
        return (
          <g key={s.label}>
            <rect x={x} y={y} width={bw} height={h} rx="6" fill="url(#barGrad)" />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0b1d17">
              {s.value}
              {doc.unit ?? ""}
            </text>
            <text x={x + bw / 2} y={padY + innerH + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#33473f">
              {s.label}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18906b" />
          <stop offset="100%" stopColor="#0a4d3a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ---------- منحنى ---------- */
function LineChart({ doc }: { doc: ChartDataDoc }) {
  const W = 520;
  const H = 260;
  const padX = 48;
  const padY = 28;
  const values = doc.series.map((s) => s.value);
  const max = Math.max(...values) * 1.15;
  const min = 0;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const n = doc.series.length;
  const pts = doc.series.map((s, i) => {
    const x = padX + (n === 1 ? innerW / 2 : (innerW / (n - 1)) * i);
    const y = padY + innerH - ((s.value - min) / (max - min)) * innerH;
    return { x, y, s };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${padY + innerH} L ${pts[0].x} ${padY + innerH} Z`;
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-ink-900/8 bg-white" role="img" aria-label={doc.caption}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padY + innerH - (innerH / ticks) * i;
        const v = Math.round((max / ticks) * i);
        return (
          <g key={i}>
            <line x1={padX} x2={W - padX} y1={y} y2={y} stroke="#e7e3d6" strokeWidth="1" />
            <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#5b6e66" fontWeight="700">
              {v}
            </text>
          </g>
        );
      })}
      <path d={area} fill="#0f7c5b" opacity="0.08" />
      <path d={path} fill="none" stroke="#0f7c5b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p) => (
        <g key={p.s.label}>
          <circle cx={p.x} cy={p.y} r="5.5" fill="#fff" stroke="#0f7c5b" strokeWidth="3" />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0b1d17">
            {p.s.value}
          </text>
          <text x={p.x} y={padY + innerH + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#33473f">
            {p.s.label}
          </text>
        </g>
      ))}
      {doc.unit && (
        <text x={padX} y={14} fontSize="10" fontWeight="700" fill="#5b6e66">
          الوحدة: {doc.unit}
        </text>
      )}
    </svg>
  );
}

/* ---------- مبيان دائري ---------- */
function PieChart({ doc }: { doc: ChartDataDoc }) {
  const total = doc.series.reduce((a, s) => a + s.value, 0);
  const cx = 130;
  const cy = 130;
  const r = 100;
  let acc = -Math.PI / 2;
  const slices = doc.series.map((s, i) => {
    const angle = (s.value / total) * Math.PI * 2;
    const start = acc;
    const end = acc + angle;
    acc = end;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = angle > Math.PI ? 1 : 0;
    const mid = (start + end) / 2;
    const lx = cx + r * 0.62 * Math.cos(mid);
    const ly = cy + r * 0.62 * Math.sin(mid);
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: PALETTE[i % PALETTE.length], lx, ly, s, pct: Math.round((s.value / total) * 100) };
  });
  return (
    <div className="grid items-center gap-5 rounded-2xl border border-ink-900/8 bg-white p-5 sm:grid-cols-[260px_1fr]">
      <svg viewBox="0 0 260 260" className="mx-auto w-full max-w-[260px]" role="img" aria-label={doc.caption}>
        {slices.map((sl) => (
          <g key={sl.s.label}>
            <path d={sl.d} fill={sl.color} stroke="#fff" strokeWidth="2" />
            {sl.pct >= 6 && (
              <text x={sl.lx} y={sl.ly + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={sl.color === "#e6b457" || sl.color === "#efcb80" ? "#0b1d17" : "#fff"}>
                {sl.pct}٪
              </text>
            )}
          </g>
        ))}
      </svg>
      <ul className="space-y-2">
        {slices.map((sl) => (
          <li key={sl.s.label} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3.5 py-2 text-sm">
            <span className="flex items-center gap-2.5 font-bold text-ink-900">
              <span className="size-3.5 rounded-full" style={{ background: sl.color }} aria-hidden="true" />
              {sl.s.label}
            </span>
            <span className="font-display font-black text-brand-700">
              {sl.s.value}
              {doc.unit ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- خرائط وخطاطات تعليمية مفصّلة ---------- */
function North({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} fill="#ffffff" stroke="#0f7c5b" strokeWidth="1.6" />
      <polygon points={`0,${-r * 0.62} ${r * 0.3},${r * 0.3} 0,${r * 0.1} ${-r * 0.3},${r * 0.3}`} fill="#0f7c5b" />
      <text y={-r - 5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f7c5b">
        شمال
      </text>
    </g>
  );
}

function Scale({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="-5" width="36" height="7" fill="#0b1d17" />
      <rect x="36" y="-5" width="36" height="7" fill="#ffffff" stroke="#0b1d17" strokeWidth="1.2" />
      <text x="36" y="14" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4a4438">
        {label}
      </text>
    </g>
  );
}

/* رموز نباتية صغيرة لخطاطة المناخ */
function VegTree({ x, y, c = "#1d7a3f" }: { x: number; y: number; c?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-1.6" y="0" width="3.2" height="9" fill="#7c4a12" />
      <circle cy="-5" r="8" fill={c} />
      <circle cx="-6" cy="-1" r="5" fill={c} />
      <circle cx="6" cy="-1" r="5" fill={c} />
    </g>
  );
}
function VegConifer({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-1.4" y="0" width="2.8" height="6" fill="#7c4a12" />
      <polygon points="0,-20 8,-6 -8,-6" fill="#166534" />
      <polygon points="0,-13 9,0 -9,0" fill="#1d7a3f" />
    </g>
  );
}
function VegCactus({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} stroke="#3f8f4f" strokeWidth="4" strokeLinecap="round" fill="none">
      <path d="M 0 0 L 0 -16" />
      <path d="M 0 -8 C -7 -8, -8 -12, -8 -15" />
      <path d="M 0 -5 C 7 -5, 8 -9, 8 -12" />
    </g>
  );
}
function VegGrass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} stroke="#7fb069" strokeWidth="2" strokeLinecap="round" fill="none">
      <path d="M -8 0 C -8 -6, -10 -8, -11 -10" />
      <path d="M 0 0 C 0 -8, -1 -10, -1 -13" />
      <path d="M 8 0 C 8 -6, 10 -8, 11 -10" />
    </g>
  );
}
function VegSnow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} stroke="#7ea8d8" strokeWidth="2" strokeLinecap="round">
      <line y1="-9" y2="9" />
      <line x1="-8" x2="8" />
      <line x1="-6" y1="-6" x2="6" y2="6" />
      <line x1="-6" y1="6" x2="6" y2="-6" />
    </g>
  );
}

/* 1) خريطة الكثافة السكانية — مجال نموذجي */
function DensitySketch() {
  return (
    <svg viewBox="0 0 640 430" className="w-full rounded-2xl border border-ink-900/10 bg-[#e8f1fb]" role="img" aria-label="خريطة تخطيطية لتوزيع الكثافة السكانية: شريط ساحلي مكتظ غربًا، أحواض نهرية متوسطة الكثافة، ومجال جبلي وجاف قليل الكثافة شرقًا">
      {/* المحيط */}
      <rect x="0" y="0" width="640" height="430" fill="#dcebf9" />
      {[70, 150, 230, 310, 390].map((y) => (
        <path key={y} d={`M 14 ${y} q 12 -7 24 0 q 12 7 24 0`} fill="none" stroke="#9cc3e8" strokeWidth="2" />
      ))}
      <text x="34" y="222" fontSize="13" fontWeight="800" fill="#1e4f7c" transform="rotate(-90 34 222)">
        المحيط
      </text>
      {/* اليابسة */}
      <path d="M 96 0 C 120 60, 84 120, 100 180 C 112 240, 88 300, 104 360 C 110 400, 100 418, 96 430 L 640 430 L 640 0 Z" fill="#d4ede0" stroke="#0a4d3a" strokeWidth="2" />
      {/* كثافة متوسطة: حوضان نهريان */}
      <path d="M 150 88 C 210 78, 280 94, 340 108 C 372 118, 368 150, 330 158 C 260 170, 200 158, 152 160 C 140 136, 142 110, 150 88 Z" fill="#3fa883" />
      <path d="M 150 266 C 220 256, 300 266, 356 290 C 374 305, 356 330, 316 334 C 250 340, 190 330, 150 326 C 140 306, 142 286, 150 266 Z" fill="#3fa883" />
      {/* كثافة مرتفعة: الشريط الساحلي */}
      <path d="M 96 0 C 120 60, 84 120, 100 180 C 112 240, 88 300, 104 360 C 110 400, 100 418, 96 430 L 150 430 C 142 380, 158 320, 150 260 C 144 200, 162 140, 152 80 C 148 40, 144 20, 142 0 Z" fill="#0a4d3a" />
      {/* الأنهار */}
      <path d="M 476 58 C 400 84, 300 104, 210 118 C 180 124, 158 128, 138 132" fill="none" stroke="#3b82c4" strokeWidth="5" strokeLinecap="round" />
      <path d="M 505 352 C 420 322, 330 306, 240 298 C 200 294, 168 296, 146 300" fill="none" stroke="#3b82c4" strokeWidth="5" strokeLinecap="round" />
      <text x="392" y="76" fontSize="10" fontWeight="800" fill="#1e4f7c">
        نهر رئيسي
      </text>
      <text x="404" y="342" fontSize="10" fontWeight="800" fill="#1e4f7c">
        نهر رئيسي
      </text>
      {/* مجال جبلي */}
      {[
        [432, 152],
        [472, 128],
        [512, 158],
        [552, 118],
        [592, 148],
        [468, 212],
        [532, 232],
        [592, 208],
      ].map(([x, y], i) => (
        <polygon key={i} points={`${x - 13},${y + 10} ${x},${y - 11} ${x + 13},${y + 10}`} fill="none" stroke="#33473f" strokeWidth="1.8" />
      ))}
      <text x="512" y="182" textAnchor="middle" fontSize="11" fontWeight="800" fill="#33473f">
        مجال جبلي
      </text>
      {/* مجال جاف: كثبان ونقاط */}
      {[
        [450, 280],
        [492, 300],
        [540, 276],
        [586, 300],
        [470, 340],
        [520, 356],
        [576, 344],
        [610, 380],
      ].map(([x, y], i) => (
        <path key={i} d={`M ${x - 12} ${y} q 12 -10 24 0`} fill="none" stroke="#b97f26" strokeWidth="2.2" opacity="0.75" />
      ))}
      <text x="528" y="410" textAnchor="middle" fontSize="11" fontWeight="800" fill="#8a5a12">
        مجال جاف شبه فارغ
      </text>
      {/* المدن */}
      {[
        [120, 66, "مدينة ساحلية كبرى"],
        [128, 208, "ميناء"],
        [118, 344, "مدينة ساحلية"],
        [300, 122, "مدينة حوضية"],
      ].map(([x, y, n]) => (
        <g key={String(n)}>
          <circle cx={Number(x)} cy={Number(y)} r="5.5" fill="#e6b457" stroke="#0b1d17" strokeWidth="1.4" />
          <text x={Number(x) + 10} y={Number(y) + 4} fontSize="10" fontWeight="800" fill="#0b1d17">
            {n}
          </text>
        </g>
      ))}
      {/* طريق ساحلي */}
      <path d="M 120 66 C 128 120, 122 160, 128 208 C 132 260, 120 300, 118 344" fill="none" stroke="#8a8168" strokeWidth="2" strokeDasharray="7 5" />
      {/* تسميات توجيهية */}
      <text x="176" y="30" fontSize="11" fontWeight="800" fill="#0a4d3a">
        شريط ساحلي مكتظ (أكثر من 100 ن/كلم²)
      </text>
      <line x1="172" y1="34" x2="140" y2="52" stroke="#0a4d3a" strokeWidth="1.2" />
      <text x="238" y="200" fontSize="11" fontWeight="800" fill="#14624a">
        أحواض نهرية متوسطة الكثافة
      </text>
      <line x1="236" y1="192" x2="220" y2="156" stroke="#14624a" strokeWidth="1.2" />
      <North x={600} y={42} />
      <Scale x={430} y={412} label="0 ——— 200 كلم" />
    </svg>
  );
}

/* 2) خطاطة النطاقات المناخية من خط الاستواء إلى القطب */
function ClimateSketch() {
  const y = (lat: number) => 400 - (lat / 90) * 380;
  const bands = [
    { a: 0, b: 10, color: "#146b33", name: "النطاق الاستوائي" },
    { a: 10, b: 23.5, color: "#1d7a3f", name: "المداري الرطب" },
    { a: 23.5, b: 35, color: "#e0b25c", name: "المداري الجاف (الصحراوي)" },
    { a: 35, b: 60, color: "#7fb069", name: "النطاق المعتدل" },
    { a: 60, b: 75, color: "#9ec5e8", name: "النطاق البارد (تايغا/توندرا)" },
    { a: 75, b: 90, color: "#cfe3f5", name: "النطاق القطبي" },
  ];
  return (
    <svg viewBox="0 0 640 430" className="w-full rounded-2xl border border-ink-900/10 bg-white" role="img" aria-label="خطاطة النطاقات المناخية الكبرى من خط الاستواء إلى القطب مع الغطاء النباتي المقابل">
      {/* محور خطوط العرض */}
      <line x1="120" y1={y(90)} x2="120" y2={y(0)} stroke="#33473f" strokeWidth="2" />
      {[0, 23.5, 30, 60, 66.5, 90].map((lat) => (
        <g key={lat}>
          <line x1="114" x2="126" y1={y(lat)} y2={y(lat)} stroke="#33473f" strokeWidth="2" />
          <text x="108" y={y(lat) + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#5b6e66">
            {lat}°
          </text>
        </g>
      ))}
      <text x="40" y="210" fontSize="10" fontWeight="800" fill="#5b6e66" transform="rotate(-90 40 210)">
        خطوط العرض
      </text>
      {/* النطاقات */}
      {bands.map((b) => (
        <g key={b.name}>
          <rect x="140" y={y(b.b)} width="220" height={y(b.a) - y(b.b)} fill={b.color} stroke="#ffffff" strokeWidth="1.5" />
          <text x="250" y={(y(b.a) + y(b.b)) / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={b.color === "#e0b25c" || b.color === "#cfe3f5" ? "#0b1d17" : "#ffffff"}>
            {b.name}
          </text>
        </g>
      ))}
      {/* خطوط مرجعية */}
      <line x1="120" x2="360" y1={y(0)} y2={y(0)} stroke="#b91c1c" strokeWidth="2" strokeDasharray="8 5" />
      <text x="140" y={y(0) + 16} fontSize="10" fontWeight="800" fill="#b91c1c">
        خط الاستواء 0°
      </text>
      <line x1="120" x2="360" y1={y(23.5)} y2={y(23.5)} stroke="#b45309" strokeWidth="1.4" strokeDasharray="6 4" />
      <text x="366" y={y(23.5) + 4} fontSize="9.5" fontWeight="700" fill="#b45309">
        مدار السرطان
      </text>
      <line x1="120" x2="360" y1={y(66.5)} y2={y(66.5)} stroke="#475569" strokeWidth="1.4" strokeDasharray="6 4" />
      <text x="366" y={y(66.5) + 4} fontSize="9.5" fontWeight="700" fill="#475569">
        الدائرة القطبية
      </text>
      {/* أشعة الشمس: عمودية عند الاستواء ومائلة عند القطب */}
      <g stroke="#e6a512" strokeWidth="2.4" strokeLinecap="round">
        <line x1="66" y1={y(5)} x2="132" y2={y(5)} />
        <polygon points={`136,${y(5)} 126,${y(5) - 4} 126,${y(5) + 4}`} fill="#e6a512" stroke="none" />
        <line x1="52" y1={y(84) - 24} x2="120" y2={y(84)} />
        <polygon points={`126,${y(84) + 2} 114,${y(84) - 6} 120,${y(84) - 10}`} fill="#e6a512" stroke="none" />
      </g>
      <circle cx="56" cy={y(5)} r="9" fill="#f6c445" stroke="#e6a512" strokeWidth="2" />
      <circle cx="42" cy={y(84) - 20} r="9" fill="#f6c445" stroke="#e6a512" strokeWidth="2" />
      <text x="18" y={y(5) + 24} fontSize="9" fontWeight="700" fill="#8a5a12">
        أشعة عمودية
      </text>
      <text x="14" y={y(84) - 34} fontSize="9" fontWeight="700" fill="#8a5a12">
        أشعة مائلة
      </text>
      {/* الغطاء النباتي المقابل */}
      <text x="500" y="26" textAnchor="middle" fontSize="11" fontWeight="800" fill="#33473f">
        الغطاء النباتي المقابل
      </text>
      <VegSnow x={402} y={y(82)} />
      <text x="420" y={y(82) - 2} fontSize="10" fontWeight="800" fill="#33473f">
        جليد وتوندرا: تشكيلات عشبية قصيرة
      </text>
      <text x="420" y={y(82) + 11} fontSize="9" fontWeight="700" fill="#5b6e66">
        حرارة تحت الصفر وتساقطات ثلجية ضعيفة
      </text>
      <VegConifer x={402} y={y(67)} />
      <text x="420" y={y(67) - 2} fontSize="10" fontWeight="800" fill="#33473f">
        التايغا: غابات صنوبرية مخروطية
      </text>
      <text x="420" y={y(67) + 11} fontSize="9" fontWeight="700" fill="#5b6e66">
        أوراق إبرية مقاومة للبرودة
      </text>
      <VegTree x={402} y={y(47)} c="#4c8f3f" />
      <text x="420" y={y(47) - 2} fontSize="10" fontWeight="800" fill="#33473f">
        غابات معتدلة وسهوب (براري)
      </text>
      <text x="420" y={y(47) + 11} fontSize="9" fontWeight="700" fill="#5b6e66">
        أربعة فصول وتساقطات منتظمة
      </text>
      <VegCactus x={402} y={y(29)} />
      <text x="420" y={y(29) - 2} fontSize="10" fontWeight="800" fill="#33473f">
        نباتات صحراوية متباعدة شوكية
      </text>
      <text x="420" y={y(29) + 11} fontSize="9" fontWeight="700" fill="#5b6e66">
        جفاف شديد وحرارة مرتفعة
      </text>
      <g>
        <VegTree x={398} y={y(16)} c="#23924a" />
        <VegGrass x={414} y={y(16)} />
      </g>
      <text x="428" y={y(16) - 2} fontSize="10" fontWeight="800" fill="#33473f">
        السافانا: حشائش وأشجار متفرقة
      </text>
      <text x="428" y={y(16) + 11} fontSize="9" fontWeight="700" fill="#5b6e66">
        فصل مطير وفصل جاف متباينان
      </text>
      <VegTree x={402} y={y(5)} c="#146b33" />
      <text x="420" y={y(5) - 2} fontSize="10" fontWeight="800" fill="#33473f">
        غابة استوائية كثيفة دائمة الخضرة
      </text>
      <text x="420" y={y(5) + 11} fontSize="9" fontWeight="700" fill="#5b6e66">
        حرارة ورطوبة طوال السنة
      </text>
    </svg>
  );
}

/* 3) مقطع المجموعات البنيوية الكبرى */
function ReliefSketch() {
  return (
    <svg viewBox="0 0 640 380" className="w-full rounded-2xl border border-ink-900/10 bg-[#f7f5ef]" role="img" aria-label="مقطع تخطيطي: درع قديم منبسط، حوض رسوبي بطبقات أفقية، وسلسلة التوائية حديثة بقمم شاهقة فوق القاعدة البلورية">
      {/* القاعدة البلورية */}
      <rect x="0" y="300" width="640" height="80" fill="#33473f" />
      {[80, 200, 320, 440, 560].map((x) => (
        <g key={x} stroke="#8fa39a" strokeWidth="1.4">
          <line x1={x - 5} x2={x + 5} y1="340" y2="340" />
          <line x1={x} x2={x} y1="335" y2="345" />
        </g>
      ))}
      <text x="320" y="368" textAnchor="middle" fontSize="11" fontWeight="800" fill="#f7f5ef">
        القاعدة البلورية القديمة
      </text>
      {/* 1) الدرع القديم */}
      <path d="M 0 214 C 40 206, 70 210, 104 208 C 140 206, 176 212, 210 210 L 210 300 L 0 300 Z" fill="#8f5f1c" />
      <path d="M 0 214 C 40 206, 70 210, 104 208 C 140 206, 176 212, 210 210" fill="none" stroke="#5c3d10" strokeWidth="2.4" />
      {[
        [40, 236],
        [96, 252],
        [150, 240],
        [70, 278],
        [170, 280],
      ].map(([x, y], i) => (
        <g key={i} stroke="#e8d9bd" strokeWidth="1.6">
          <line x1={x - 5} x2={x + 5} y1={y} y2={y} />
          <line x1={x} x2={x} y1={y - 5} y2={y + 5} />
        </g>
      ))}
      {/* أسهم التعرية */}
      <g stroke="#b97f26" strokeWidth="2" fill="#b97f26">
        <path d="M 120 190 C 150 178, 190 182, 224 196" fill="none" strokeDasharray="5 4" />
        <polygon points="230,199 218,196 222,190" stroke="none" />
      </g>
      <text x="118" y="176" fontSize="9.5" fontWeight="800" fill="#8a5a12">
        تعرية ونقل الرواسب
      </text>
      <text x="105" y="120" textAnchor="middle" fontSize="12" fontWeight="800" fill="#5c3d10">
        1) الدروع / القواعد القديمة
      </text>
      <text x="105" y="136" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#5c3d10">
        سهول وهضاب منبسطة صلبة
      </text>
      <text x="105" y="150" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c5a24">
        (مثال: الدرع الكندي والإفريقي)
      </text>
      {/* 2) الحوض الرسوبي */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M 210 ${224 + i * 15} C 260 ${228 + i * 15}, 340 ${228 + i * 15}, 390 ${224 + i * 15} L 390 ${239 + i * 15} C 340 ${243 + i * 15}, 260 ${243 + i * 15}, 210 ${239 + i * 15} Z`} fill={i % 2 === 0 ? "#e6b457" : "#f5dfae"} stroke="#b97f26" strokeWidth="0.8" />
      ))}
      <path d="M 210 224 C 260 220, 340 220, 390 224" fill="none" stroke="#8f5f1c" strokeWidth="2.2" />
      {/* نهر بالحوض */}
      <path d="M 268 222 C 284 214, 316 214, 332 222" fill="none" stroke="#3b82c4" strokeWidth="4" strokeLinecap="round" />
      <text x="300" y="208" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1e4f7c">
        نهر
      </text>
      {/* سهم الترسيب */}
      <g stroke="#8f5f1c" strokeWidth="2" fill="#8f5f1c">
        <line x1="300" y1="176" x2="300" y2="196" strokeDasharray="5 4" />
        <polygon points="300,202 295,192 305,192" stroke="none" />
      </g>
      <text x="308" y="172" fontSize="9.5" fontWeight="800" fill="#8a5a12">
        ترسيب
      </text>
      <text x="300" y="120" textAnchor="middle" fontSize="12" fontWeight="800" fill="#8f5f1c">
        2) الأحواض الرسوبية
      </text>
      <text x="300" y="136" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#8f5f1c">
        سهول وهضاب رسوبية منخفضة
      </text>
      <text x="300" y="150" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a3762c">
        (مثال: حوض سبو، حوض باريس)
      </text>
      {/* 3) السلسلة الالتوائية الحديثة */}
      <path d="M 390 300 L 390 236 C 408 200, 420 150, 442 118 C 452 100, 462 84, 472 66 C 486 88, 498 128, 512 158 C 522 138, 532 118, 544 100 C 560 128, 574 176, 588 210 C 602 190, 618 172, 640 160 L 640 300 Z" fill="#0f7c5b" />
      <path d="M 472 66 L 466 78 L 478 78 Z" fill="#ffffff" />
      <path d="M 544 100 L 538 112 L 550 112 Z" fill="#ffffff" />
      <path d="M 412 240 C 434 180, 452 130, 472 100 C 492 130, 508 180, 528 236" fill="none" stroke="#a9dcc4" strokeWidth="1.8" strokeDasharray="6 4" />
      <path d="M 430 262 C 448 210, 460 170, 472 146 C 486 172, 500 216, 516 262" fill="none" stroke="#a9dcc4" strokeWidth="1.8" strokeDasharray="6 4" />
      {/* أسهم الضغط */}
      <g stroke="#b91c1c" strokeWidth="3" fill="#b91c1c">
        <line x1="352" y1="268" x2="382" y2="268" />
        <polygon points="390,268 378,262 378,274" stroke="none" />
        <line x1="636" y1="268" x2="606" y2="268" />
        <polygon points="598,268 610,262 610,274" stroke="none" />
      </g>
      <text x="516" y="40" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0a4d3a">
        3) السلاسل الالتوائية الحديثة
      </text>
      <text x="516" y="56" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0a4d3a">
        قمم حادة شاهقة وطبقات ملتوية
      </text>
      <text x="516" y="70" textAnchor="middle" fontSize="9" fontWeight="700" fill="#14624a">
        (مثال: الأطلس الكبير، الألب، الهيمالايا)
      </text>
      <text x="10" y="18" fontSize="10" fontWeight="700" fill="#5b6e66">
        غرب
      </text>
      <text x="630" y="18" textAnchor="end" fontSize="10" fontWeight="700" fill="#5b6e66">
        شرق
      </text>
    </svg>
  );
}

function MapDoc({ doc }: { doc: MapDataDoc }) {
  return (
    <div>
      {doc.sketch === "quartier" && <MimosaMap />}
      {doc.sketch === "density" && <DensitySketch />}
      {doc.sketch === "climate" && <ClimateSketch />}
      {doc.sketch === "relief" && <ReliefSketch />}
      {doc.sketch !== "quartier" && (
      <div className="mt-4 rounded-2xl border border-ink-900/8 bg-white p-4">
        <p className="text-[11px] font-extrabold text-ink-500">المفتاح</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {doc.legend.map((l) => (
            <li key={l.label} className="flex items-center gap-2.5 text-xs font-semibold text-ink-700">
              <span className="size-4 shrink-0 rounded-md border border-ink-900/10" style={{ background: l.color }} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      </div>
      )}
    </div>
  );
}

/* ---------- المكوّن الرئيسي: نافذة عرض الوثيقة ---------- */
interface DataDocViewProps {
  item: ResourceItem;
  onClose: () => void;
  go: (r: Route) => void;
}

export default function DataDocView({ item, onClose, go }: DataDocViewProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (item.action.kind !== "data") return null;
  const doc = item.action.data;
  const methodId = item.action.methodId;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={item.title}>
      <button type="button" aria-label="إغلاق" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-950/60 backdrop-blur-sm" data-no-print />
      <div className="animate-modal-in absolute inset-x-0 top-4 bottom-4 mx-auto w-[calc(100%-1.5rem)] max-w-3xl sm:top-8 sm:bottom-8">
        <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-paper shadow-2xl shadow-brand-950/40">
          <div className="flex items-start justify-between gap-3 border-b border-ink-900/8 bg-white px-5 py-4" data-no-print>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">
                {item.level} · {item.subject}
              </span>
              <h2 className="mt-2 font-display text-base font-extrabold leading-snug text-ink-900 sm:text-lg">{item.title}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => window.print()} title="طباعة الوثيقة" aria-label="طباعة الوثيقة" className="grid size-9 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                <Printer className="size-4" />
              </button>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <p className="mb-3 text-xs font-bold text-ink-500">{doc.caption}</p>
            {doc.kind === "table" && <TableDoc doc={doc} />}
            {doc.kind === "bar" && <BarChart doc={doc} />}
            {doc.kind === "line" && <LineChart doc={doc} />}
            {doc.kind === "pie" && <PieChart doc={doc} />}
            {doc.kind === "map" && <MapDoc doc={doc} />}
            {doc.note && <p className="mt-3 text-[11px] leading-relaxed text-ink-500">{doc.note}</p>}

            {doc.questions && doc.questions.length > 0 && (
              <div className="mt-6 rounded-2xl border border-gold-300/60 bg-gold-50 p-5">
                <p className="flex items-center gap-2 font-display text-sm font-extrabold text-gold-700">
                  <HelpCircle className="size-4" aria-hidden="true" />
                  أسئلة للتحليل والتدرب
                </p>
                <ol className="mt-3 space-y-2">
                  {doc.questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-700">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold-400/30 font-display text-[10px] font-black text-gold-700">{i + 1}</span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2" data-no-print>
              {methodId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    go({ view: "methods", id: methodId });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  <BookOpenCheck className="size-4" aria-hidden="true" />
                  منهجية تحليل هذا النوع من الوثائق ←
                </button>
              )}
              {item.lessonKey && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    go({ view: "lesson", id: item.lessonKey! });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400"
                >
                  الدرس المرتبط ←
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
