import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, FileText, Link2, ListChecks, PenLine, Scale, Table2, XCircle } from "lucide-react";
import type { Answer, Question } from "../../types";
import { seededShuffle } from "../../lib/arabic";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];
const PAIR_COLORS = [
  { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-700" },
  { bg: "bg-gold-100", border: "border-gold-400", text: "text-gold-700" },
  { bg: "bg-sky-100", border: "border-sky-400", text: "text-sky-700" },
  { bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-700" },
];

const KIND_META: Record<string, { label: string; icon: typeof ListChecks }> = {
  mcq: { label: "اختيار من متعدد", icon: ListChecks },
  tf: { label: "صح / خطأ", icon: Scale },
  ordering: { label: "ترتيب الأحداث", icon: ArrowDown },
  matching: { label: "ربط المفاهيم", icon: Link2 },
  doc: { label: "تحليل وثيقة", icon: FileText },
  writing: { label: "كتابة فقرة", icon: PenLine },
};

/** الرسم التخطيطي لوثيقة الخريطة (السؤال 12) */
/** شارة تسمية فوق الخريطة/الصورة القمرية */
function MapChip({ x, y, w, text, color }: { x: number; y: number; w: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 21} width={w} height={36} rx={11} fill="#ffffff" opacity="0.95" stroke={color} strokeWidth="2.5" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="19" fontWeight="800" fill="#0b1d17">
        {text}
      </text>
    </g>
  );
}

/**
 * وثيقة خريطة حي ميموزا — القنيطرة (نمط Google Maps / Google Earth):
 * طبقتان قابلتان للتبديل (خريطة شارع + صورة قمرية) بنفس المعالم والمواضع،
 * مع مفتاح ومؤشر شمال ومقياس: ثانوية القدس هي المدرسة وسط المخطط.
 * المحاكاة بصرية لأغراض التمرين، والمواضع تقريبية.
 */
function MapSketch() {
  const [layer, setLayer] = useState<"map" | "aerial">("map");
  return (
    <figure className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
      {/* مبدّل الطبقتين */}
      <div className="flex items-center justify-between gap-2 border-b border-ink-900/8 bg-cream px-3 py-2">
        <span className="text-[10px] font-extrabold text-ink-500">حي ميموزا — القنيطرة</span>
        <div className="flex overflow-hidden rounded-lg border border-ink-900/12" role="group" aria-label="اختيار طبقة الخريطة">
          <button
            type="button"
            onClick={() => setLayer("map")}
            aria-pressed={layer === "map"}
            className={`px-3 py-1.5 text-[10px] font-extrabold transition-colors ${layer === "map" ? "bg-brand-600 text-white" : "bg-white text-ink-700 hover:bg-brand-50"}`}
          >
            خريطة (نمط Google Maps)
          </button>
          <button
            type="button"
            onClick={() => setLayer("aerial")}
            aria-pressed={layer === "aerial"}
            className={`px-3 py-1.5 text-[10px] font-extrabold transition-colors ${layer === "aerial" ? "bg-brand-600 text-white" : "bg-white text-ink-700 hover:bg-brand-50"}`}
          >
            صورة قمرية
          </button>
        </div>
      </div>

      <div className="relative" style={{ aspectRatio: "1408 / 768" }}>
        <img
          src="/images/mimosa-map.jpg"
          alt="خريطة رقمية تعليمية لحي ميموزا بالقنيطرة: ثانوية القدس وسط المخطط، مسجد في الشمال الغربي، مجرى مائي في الجنوب الشرقي، شارع رئيسي من الشرق إلى الغرب وحديقة في الجنوب الغربي"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${layer === "map" ? "opacity-100" : "opacity-0"}`}
        />
        <img
          src="/images/mimosa-aerial.jpg"
          alt="صورة قمرية تعليمية لحي ميموزا بالقنيطرة بنفس المعالم: ثانوية القدس وسط المخطط، مسجد في الشمال الغربي، مجرى مائي في الجنوب الشرقي، شارع رئيسي وحديقة"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${layer === "aerial" ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
        />
        <svg viewBox="0 0 1408 768" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          {/* إطار ثانوية القدس */}
          <rect x="340" y="228" width="292" height="314" rx="14" fill="none" stroke="#d99e37" strokeWidth="4" strokeDasharray="14 10" />
          <circle cx="432" cy="386" r="11" fill="#d99e37" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={486} y={206} w={216} text="ثانوية القدس" color="#d99e37" />

          {/* المسجد */}
          <circle cx="182" cy="152" r="10" fill="#0f7c5b" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={200} y={106} w={140} text="مسجد الحي" color="#0f7c5b" />

          {/* المجرى المائي */}
          <circle cx="1188" cy="597" r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={1180} y={548} w={150} text="مجرى مائي" color="#0284c7" />

          {/* الحديقة */}
          <circle cx="156" cy="630" r="10" fill="#16a34a" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={186} y={582} w={150} text="حديقة الحي" color="#16a34a" />

          {/* الشارع الرئيسي شرق-غرب */}
          <line x1="648" y1="406" x2="1330" y2="406" stroke={layer === "map" ? "#33473f" : "#ffffff"} strokeWidth="5" strokeDasharray="26 18" opacity="0.85" />
          <MapChip x={985} y={368} w={300} text="الشارع الرئيسي (شرق – غرب)" color="#33473f" />

          {/* مؤشر الشمال */}
          <g>
            <circle cx="1330" cy="66" r="34" fill="#ffffff" opacity="0.95" stroke="#33473f" strokeWidth="2.5" />
            <polygon points="1330,40 1342,74 1330,65 1318,74" fill="#0f7c5b" />
            <text x="1330" y="92" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0b1d17">
              شمال
            </text>
          </g>

          {/* مقياس الرسم */}
          <g>
            <rect x="46" y="684" width="248" height="58" rx="12" fill="#ffffff" opacity="0.95" stroke="#33473f" strokeWidth="2" />
            <rect x="66" y="712" width="80" height="9" fill="#0b1d17" />
            <rect x="146" y="712" width="80" height="9" fill="#ffffff" stroke="#0b1d17" strokeWidth="1.5" />
            <text x="66" y="706" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0b1d17">0</text>
            <text x="146" y="706" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0b1d17">50</text>
            <text x="226" y="706" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0b1d17">100 م</text>
            <text x="270" y="722" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5b6e66">مقياس تقريبي</text>
          </g>
        </svg>
      </div>

      <figcaption className="space-y-2 border-t border-ink-900/8 bg-cream p-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-ink-700">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-gold-500" aria-hidden="true" />
            ثانوية القدس (المدرسة)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand-600" aria-hidden="true" />
            مسجد الحي
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sky-600" aria-hidden="true" />
            مجرى مائي
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-600" aria-hidden="true" />
            حديقة الحي
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-ink-700" aria-hidden="true" />
            الشارع الرئيسي
          </li>
        </ul>
        <p className="text-[10px] leading-relaxed text-ink-500">
          محاكاة تعليمية لنمط خرائط Google (خريطة شارع وصورة قمرية) لحي ميموزا — القنيطرة؛ المواضع تقريبية لأغراض التمرين.
          بدّل الطبقة لتدريب التلاميذ على قراءة الخريطة والصورة القمرية، ووجِّه الوثيقة دائمًا بمؤشر الشمال قبل تحديد الجهات.
        </p>
      </figcaption>
    </figure>
  );
}

interface QuestionCardProps {
  question: Question;
  answer: Answer;
  onChange: (a: Answer) => void;
}

export default function QuestionCard({ question: q, answer, onChange }: QuestionCardProps) {
  const meta = KIND_META[q.kind];
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);

  const shuffledOrder = useMemo(
    () => (q.kind === "ordering" ? seededShuffle(q.items.map((_, i) => i), q.id * 7 + 3) : []),
    [q]
  );
  const displayOrder: number[] = q.kind === "ordering" ? (Array.isArray(answer) ? (answer as number[]) : shuffledOrder) : [];

  const shuffledDefs = useMemo(
    () =>
      q.kind === "matching"
        ? seededShuffle(
            q.pairs.map((p, i) => ({ orig: i, text: p.def })),
            q.id * 13 + 5
          )
        : [],
    [q]
  );

  const matchingRecord: Record<number, number> =
    q.kind === "matching" && answer !== null && typeof answer === "object" && !Array.isArray(answer)
      ? (answer as Record<number, number>)
      : {};
  const usedDefs = new Set(Object.values(matchingRecord));

  const move = (pos: number, dir: -1 | 1) => {
    const arr = [...displayOrder];
    const target = pos + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[pos], arr[target]] = [arr[target], arr[pos]];
    onChange(arr);
  };

  const pickDef = (defOrig: number) => {
    if (selectedTerm === null) return;
    if (usedDefs.has(defOrig)) return;
    onChange({ ...matchingRecord, [selectedTerm]: defOrig });
    setSelectedTerm(null);
  };

  const unpair = (termIdx: number) => {
    const next = { ...matchingRecord };
    delete next[termIdx];
    onChange(Object.keys(next).length > 0 ? next : null);
    setSelectedTerm(null);
  };

  return (
    <div>
      {/* ترويسة السؤال */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700">
          <meta.icon className="size-3.5" aria-hidden="true" />
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/8 bg-paper-warm px-3 py-1 text-[11px] font-semibold text-ink-500">
          المهارة: {q.skill}
        </span>
        <span className="ms-auto inline-flex items-center rounded-full bg-gold-100 px-3 py-1 text-[11px] font-extrabold text-gold-700">
          {q.points === 1 ? "نقطة واحدة" : `${q.points} نقط`}
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-extrabold leading-relaxed text-ink-900 sm:text-xl">{q.title}</h3>

      {/* وثيقة */}
      {q.kind === "doc" && (
        <div className="mt-4 rounded-2xl border border-gold-300/60 bg-gold-50/70 p-4 sm:p-5">
          <p className="mb-2.5 flex items-center gap-2 text-[11px] font-extrabold text-gold-700">
            {q.options ? null : <Table2 className="size-3.5" />}
            <FileText className="size-3.5" aria-hidden="true" />
            {q.docLabel}
          </p>
          {q.mapSketch ? (
            <MapSketch />
          ) : (
            <p className="whitespace-pre-line text-sm leading-loose text-ink-700">{q.doc}</p>
          )}
        </div>
      )}

      {/* اختيار من متعدد + وثيقة */}
      {(q.kind === "mcq" || q.kind === "doc") && (
        <div className="mt-5 space-y-3" role="listbox" aria-label="خيارات الإجابة">
          {q.options.map((opt, i) => {
            const selected = answer === i;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange(i)}
                className={`group flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-start text-sm transition-all duration-300 sm:text-[15px] ${
                  selected
                    ? "border-brand-500 bg-brand-50 shadow-[0_12px_30px_-14px_rgba(12,124,91,0.4)]"
                    : "border-ink-900/10 bg-white hover:-translate-y-0.5 hover:border-brand-300"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold transition-colors ${
                    selected ? "bg-brand-600 text-white" : "bg-paper-warm text-ink-500 group-hover:bg-brand-100 group-hover:text-brand-700"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1 leading-relaxed text-ink-900">{opt}</span>
                <span
                  className={`size-5 shrink-0 rounded-full border-2 transition-all ${
                    selected ? "border-brand-600 bg-brand-600 shadow-[inset_0_0_0_3px_white]" : "border-ink-300"
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* صح / خطأ */}
      {q.kind === "tf" && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { val: true, label: "صح", icon: CheckCircle2 },
            { val: false, label: "خطأ", icon: XCircle },
          ].map((opt) => {
            const selected = answer === opt.val;
            return (
              <button
                key={opt.label}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(opt.val)}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border px-4 py-4 font-display text-base font-extrabold transition-all duration-300 ${
                  selected
                    ? opt.val
                      ? "border-brand-500 bg-brand-50 text-brand-700 shadow-[0_12px_30px_-14px_rgba(12,124,91,0.5)]"
                      : "border-rose-400 bg-rose-50 text-rose-600 shadow-[0_12px_30px_-14px_rgba(225,90,90,0.4)]"
                    : "border-ink-900/10 bg-white text-ink-700 hover:-translate-y-0.5 hover:border-brand-300"
                }`}
              >
                <opt.icon className="size-5" aria-hidden="true" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* الترتيب */}
      {q.kind === "ordering" && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold text-ink-500">استعمل السهمين لرفع أو خفض كل حدث حتى يصبح التسلسل صحيحًا (من الأقدم إلى الأحدث):</p>
          <ol className="space-y-2.5">
            {displayOrder.map((origIdx, pos) => (
              <li
                key={origIdx}
                className="animate-fade-in flex items-center gap-3 rounded-2xl border border-ink-900/10 bg-white px-4 py-3 transition-all"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 font-display text-sm font-black text-white">
                  {pos + 1}
                </span>
                <span className="flex-1 text-sm font-semibold leading-relaxed text-ink-900">{q.items[origIdx]}</span>
                <span className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(pos, -1)}
                    disabled={pos === 0}
                    aria-label={`رفع ${q.items[origIdx]}`}
                    className="grid size-7 place-items-center rounded-lg border border-ink-900/10 text-ink-500 transition-colors enabled:hover:border-brand-400 enabled:hover:text-brand-700 disabled:opacity-30"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(pos, 1)}
                    disabled={pos === displayOrder.length - 1}
                    aria-label={`خفض ${q.items[origIdx]}`}
                    className="grid size-7 place-items-center rounded-lg border border-ink-900/10 text-ink-500 transition-colors enabled:hover:border-brand-400 enabled:hover:text-brand-700 disabled:opacity-30"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* الربط */}
      {q.kind === "matching" && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold text-ink-500">اضغط على مفهوم من العمود الأول، ثم اضغط على مدلوله المناسب من العمود الثاني. اضغط على زوج مربوط لفكّه.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2.5">
              <p className="text-center text-[11px] font-extrabold text-ink-500">المفهوم</p>
              {q.pairs.map((pair, termIdx) => {
                const paired = matchingRecord[termIdx] !== undefined;
                const color = PAIR_COLORS[termIdx % PAIR_COLORS.length];
                return (
                  <button
                    key={pair.term}
                    type="button"
                    onClick={() => (paired ? unpair(termIdx) : setSelectedTerm(termIdx === selectedTerm ? null : termIdx))}
                    className={`w-full rounded-2xl border-2 px-4 py-3 text-start text-sm font-bold transition-all duration-300 ${
                      paired
                        ? `${color.bg} ${color.border} ${color.text}`
                        : selectedTerm === termIdx
                          ? "border-brand-500 bg-brand-50 text-brand-700 shadow-[0_10px_25px_-12px_rgba(12,124,91,0.45)]"
                          : "border-ink-900/10 bg-white text-ink-900 hover:border-brand-300"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      {pair.term}
                      {paired && <Link2 className="size-4 shrink-0" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2.5">
              <p className="text-center text-[11px] font-extrabold text-ink-500">المدلول</p>
              {shuffledDefs.map((def) => {
                const termIdx = Object.entries(matchingRecord).find(([, v]) => v === def.orig)?.[0];
                const paired = termIdx !== undefined;
                const color = paired ? PAIR_COLORS[Number(termIdx) % PAIR_COLORS.length] : null;
                return (
                  <button
                    key={def.orig}
                    type="button"
                    onClick={() => pickDef(def.orig)}
                    disabled={paired}
                    className={`w-full rounded-2xl border-2 px-4 py-3 text-start text-xs leading-relaxed transition-all duration-300 sm:text-sm ${
                      paired
                        ? `${color!.bg} ${color!.border} ${color!.text} font-semibold`
                        : selectedTerm !== null
                          ? "border-dashed border-brand-400 bg-brand-50/50 text-ink-900 hover:bg-brand-50"
                          : "border-ink-900/10 bg-white text-ink-700"
                    }`}
                  >
                    {def.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* الكتابة */}
      {q.kind === "writing" && (
        <div className="mt-5">
          <p className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-loose text-ink-700">{q.prompt}</p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {q.guidance.map((g) => (
              <li key={g} className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                {g}
              </li>
            ))}
          </ul>
          <textarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
            rows={9}
            dir="rtl"
            placeholder="اكتب فقرتك هنا بشكل منظم..."
            aria-label="مساحة كتابة الفقرة"
            className="field mt-4 resize-y font-sans leading-loose"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
            <span>
              عدد الكلمات:{" "}
              <span className="font-extrabold text-brand-700">
                {typeof answer === "string" ? answer.trim().split(/\s+/).filter(Boolean).length : 0}
              </span>
            </span>
            <span>يُقيَّم هذا السؤال وفق شبكة تنقيط خاصة (انظر النتائج)</span>
          </div>
        </div>
      )}
    </div>
  );
}
