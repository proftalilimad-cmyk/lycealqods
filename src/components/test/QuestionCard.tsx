import { useMemo, useState } from "react";
import MimosaMap from "../geo/MimosaMap";
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
            <MimosaMap />
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
