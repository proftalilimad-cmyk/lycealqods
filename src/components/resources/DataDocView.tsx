import { useEffect } from "react";
import { BookOpenCheck, HelpCircle, Printer, X } from "lucide-react";
import type { ChartDataDoc, MapDataDoc, ResourceItem, TableDataDoc } from "../../data/resources";
import type { Route } from "../../routes";

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

/* ---------- خرائط تخطيطية ---------- */
function North({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r="14" fill="#ffffff" stroke="#0f7c5b" strokeWidth="1.5" />
      <polygon points="0,-9 4,4 0,1 -4,4" fill="#0f7c5b" />
      <text y="-18" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f7c5b">
        شمال
      </text>
    </g>
  );
}

function Scale({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="-4" width="30" height="6" fill="#0b1d17" />
      <rect x="30" y="-4" width="30" height="6" fill="#ffffff" stroke="#0b1d17" strokeWidth="1" />
      <text x="30" y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4a4438">
        {label}
      </text>
    </g>
  );
}

function QuartierSketch() {
  return (
    <svg viewBox="0 0 340 210" className="w-full rounded-2xl border border-ink-900/10 bg-[#f4efe3]" role="img" aria-label="رسم تخطيطي لحي سكني: مدرسة في الوسط، نهر جنوبًا شرقًا، مسجد شمالًا غربًا">
      <g stroke="#d8d0bb" strokeWidth="1">
        {[40, 80, 120, 160, 200, 240, 280].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="210" />
        ))}
        {[35, 70, 105, 140, 175].map((y) => (
          <line key={y} x1="0" y1={y} x2="340" y2={y} />
        ))}
      </g>
      <line x1="8" y1="92" x2="332" y2="92" stroke="#8a8168" strokeWidth="7" />
      <line x1="8" y1="92" x2="332" y2="92" stroke="#f4efe3" strokeWidth="1.5" strokeDasharray="10 8" />
      <text x="14" y="86" fontSize="9" fill="#6b6350" fontWeight="700">
        الشارع الرئيسي
      </text>
      <North x={30} y={32} />
      <g transform="translate(170,108)">
        <rect x="-17" y="-8" width="34" height="20" rx="2" fill="#0f7c5b" />
        <polygon points="-20,-8 0,-22 20,-8" fill="#0c6147" />
        <rect x="-4" y="2" width="8" height="10" fill="#f4efe3" />
        <text y="26" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0b1d17">
          المدرسة
        </text>
      </g>
      <g transform="translate(76,48)">
        <rect x="-12" y="-2" width="24" height="14" rx="2" fill="#b97f26" />
        <circle cy="-6" r="5" fill="#d99e37" />
        <text y="24" textAnchor="middle" fontSize="10" fontWeight="800" fill="#6b4a10">
          المسجد
        </text>
      </g>
      <path d="M 232 210 C 240 190, 226 178, 244 162 C 262 146, 252 130, 278 118 C 300 108, 310 96, 332 88" fill="none" stroke="#3b82c4" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <text x="258" y="180" fontSize="10" fontWeight="800" fill="#1e4f7c">
        النهر
      </text>
      <Scale x={18} y={190} label="0 ——— 100 متر" />
    </svg>
  );
}

function DensitySketch() {
  return (
    <svg viewBox="0 0 340 230" className="w-full rounded-2xl border border-ink-900/10 bg-[#eef4fb]" role="img" aria-label="خريطة تخطيطية لتوزيع الكثافة السكانية: شريط ساحلي مكتظ غربًا، أحواض نهرية متوسطة، داخل جبلي وجاف قليل الكثافة">
      {/* اليابسة */}
      <path d="M 60 12 C 90 30, 70 70, 62 110 C 55 150, 80 190, 66 222 L 336 222 L 336 12 Z" fill="#d4ede0" stroke="#0a4d3a" strokeWidth="1.5" />
      {/* البحر */}
      <text x="22" y="120" fontSize="11" fontWeight="800" fill="#1e4f7c" transform="rotate(-90 22 120)">
        المحيط
      </text>
      {/* كثافة متوسطة: أحواض */}
      <path d="M 78 40 C 130 60, 170 55, 230 70 C 250 80, 240 110, 210 118 C 160 126, 120 110, 82 120 C 64 100, 70 70, 78 40 Z" fill="#3fa883" opacity="0.9" />
      <path d="M 90 150 C 140 140, 190 150, 230 175 C 200 200, 150 205, 92 195 C 78 180, 82 165, 90 150 Z" fill="#3fa883" opacity="0.9" />
      {/* كثافة مرتفعة: شريط ساحلي */}
      <path d="M 62 20 C 82 45, 74 80, 68 112 C 64 150, 82 185, 70 220 L 96 220 C 104 185, 90 150, 92 112 C 96 80, 104 48, 84 20 Z" fill="#0a4d3a" />
      {/* المدن */}
      {[
        [80, 60, "مدينة أ"],
        [84, 130, "مدينة ب"],
        [82, 200, "مدينة ج"],
      ].map(([x, y, n]) => (
        <g key={String(n)}>
          <circle cx={Number(x)} cy={Number(y)} r="4" fill="#e6b457" stroke="#0b1d17" strokeWidth="1" />
          <text x={Number(x) + 8} y={Number(y) + 4} fontSize="8.5" fontWeight="800" fill="#0b1d17">
            {n}
          </text>
        </g>
      ))}
      {/* الأنهار */}
      <path d="M 300 40 C 250 60, 200 70, 120 90 C 100 96, 90 104, 78 112" fill="none" stroke="#3b82c4" strokeWidth="3" strokeLinecap="round" />
      <path d="M 320 200 C 260 180, 200 170, 140 165 C 110 162, 95 170, 84 180" fill="none" stroke="#3b82c4" strokeWidth="3" strokeLinecap="round" />
      {/* جبال */}
      {[
        [230, 130],
        [262, 118],
        [292, 140],
        [318, 112],
        [250, 160],
      ].map(([x, y], i) => (
        <polygon key={i} points={`${x - 10},${y + 8} ${x},${y - 8} ${x + 10},${y + 8}`} fill="none" stroke="#33473f" strokeWidth="1.4" />
      ))}
      <text x="268" y="185" fontSize="9.5" fontWeight="800" fill="#33473f">
        مجال جبلي وجاف
      </text>
      <North x={310} y={34} />
      <Scale x={200} y={214} label="0 ——— 200 كلم" />
    </svg>
  );
}

function ClimateSketch() {
  const bands = [
    { y: 0, h: 22, color: "#9ec5e8", label: "قطبي / بارد", lat: "90°" },
    { y: 22, h: 34, color: "#7fb069", label: "معتدل", lat: "60°" },
    { y: 56, h: 26, color: "#e0b25c", label: "مداري جاف (صحاري)", lat: "30°" },
    { y: 82, h: 46, color: "#1d7a3f", label: "استوائي ومداري رطب", lat: "0°" },
    { y: 128, h: 26, color: "#e0b25c", label: "مداري جاف (صحاري)", lat: "30°" },
    { y: 154, h: 34, color: "#7fb069", label: "معتدل", lat: "60°" },
    { y: 188, h: 22, color: "#9ec5e8", label: "قطبي / بارد", lat: "90°" },
  ];
  return (
    <svg viewBox="0 0 340 210" className="w-full rounded-2xl border border-ink-900/10 bg-white" role="img" aria-label="خطاطة النطاقات المناخية الكبرى من القطب الشمالي إلى القطب الجنوبي">
      {bands.map((b, i) => (
        <g key={i}>
          <rect x="60" y={b.y} width="220" height={b.h} fill={b.color} stroke="#fff" strokeWidth="1" />
          <text x="170" y={b.y + b.h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={b.color === "#9ec5e8" || b.color === "#e0b25c" ? "#0b1d17" : "#fff"}>
            {b.label}
          </text>
          <text x="52" y={b.y + 10} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#5b6e66">
            {b.lat}
          </text>
        </g>
      ))}
      <line x1="60" y1="105" x2="280" y2="105" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="286" y="108" fontSize="9" fontWeight="800" fill="#b91c1c">
        خط الاستواء
      </text>
      <text x="286" y="50" fontSize="8.5" fontWeight="700" fill="#33473f">
        مدار السرطان ↑
      </text>
      <text x="286" y="166" fontSize="8.5" fontWeight="700" fill="#33473f">
        مدار الجدي ↓
      </text>
      <g transform="translate(20,150)" fontSize="8" fontWeight="700" fill="#5b6e66">
        <text transform="rotate(-90)">خطوط العرض</text>
      </g>
    </svg>
  );
}

function ReliefSketch() {
  return (
    <svg viewBox="0 0 340 210" className="w-full rounded-2xl border border-ink-900/10 bg-white" role="img" aria-label="مقطع تخطيطي: درع قديم، حوض رسوبي، سلسلة التوائية حديثة">
      {/* السماء/الخلفية */}
      <rect x="0" y="0" width="340" height="210" fill="#f7f5ef" />
      {/* الدرع القديم */}
      <path d="M 0 140 L 0 170 L 120 170 L 120 128 C 90 118, 60 120, 30 126 Z" fill="#8f5f1c" />
      <path d="M 0 140 C 30 126, 60 120, 120 128" fill="none" stroke="#5c3d10" strokeWidth="2" />
      {/* الحوض الرسوبي (طبقات أفقية) */}
      {[132, 142, 152, 162].map((y, i) => (
        <rect key={y} x="120" y={y} width="100" height="10" fill={i % 2 === 0 ? "#e6b457" : "#f5dfae"} stroke="#b97f26" strokeWidth="0.6" />
      ))}
      {/* السلسلة الالتوائية */}
      <path d="M 220 170 L 220 150 C 235 120, 245 70, 262 60 C 278 70, 288 118, 300 140 C 312 120, 322 100, 340 92 L 340 170 Z" fill="#0f7c5b" />
      <path d="M 232 130 C 245 100, 252 84, 262 78 C 272 84, 280 102, 290 130" fill="none" stroke="#a9dcc4" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M 244 150 C 252 126, 256 112, 262 106 C 268 112, 272 128, 280 150" fill="none" stroke="#a9dcc4" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* قاعدة */}
      <rect x="0" y="170" width="340" height="40" fill="#33473f" />
      <text x="170" y="195" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#f7f5ef">
        القاعدة الصلبة
      </text>
      {/* تسميات */}
      <text x="60" y="112" textAnchor="middle" fontSize="10" fontWeight="800" fill="#5c3d10">
        درع قديم
      </text>
      <text x="60" y="124" textAnchor="middle" fontSize="8" fontWeight="700" fill="#5c3d10">
        (هضاب / سهول عليا)
      </text>
      <text x="170" y="112" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8f5f1c">
        حوض رسوبي
      </text>
      <text x="170" y="124" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8f5f1c">
        (سهول منخفضة)
      </text>
      <text x="262" y="46" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0a4d3a">
        سلسلة التوائية حديثة
      </text>
      <text x="262" y="57" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0a4d3a">
        (جبال شاهقة)
      </text>
      <text x="8" y="16" fontSize="8.5" fontWeight="700" fill="#5b6e66">
        غرب
      </text>
      <text x="332" y="16" textAnchor="end" fontSize="8.5" fontWeight="700" fill="#5b6e66">
        شرق
      </text>
    </svg>
  );
}

function MapDoc({ doc }: { doc: MapDataDoc }) {
  return (
    <div>
      {doc.sketch === "quartier" && <QuartierSketch />}
      {doc.sketch === "density" && <DensitySketch />}
      {doc.sketch === "climate" && <ClimateSketch />}
      {doc.sketch === "relief" && <ReliefSketch />}
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
