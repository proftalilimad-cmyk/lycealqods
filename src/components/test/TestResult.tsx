import { useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  Home,
  Lightbulb,
  PenLine,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { Answer, Question } from "../../types";
import { gradeAutoQuestion, RECOMMENDATIONS } from "../../lib/grading";
import Ring from "../Ring";
import Reveal from "../Reveal";
import type { TestReport } from "./TestRunner";

const LEVEL_STYLES: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-700 ring-emerald-300",
  verygood: "bg-brand-100 text-brand-700 ring-brand-300",
  good: "bg-sky-100 text-sky-700 ring-sky-300",
  mid: "bg-gold-100 text-gold-700 ring-gold-300",
  support: "bg-rose-100 text-rose-700 ring-rose-300",
};

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

function correctText(q: Question): string {
  switch (q.kind) {
    case "mcq":
    case "doc":
      return `${LETTERS[q.answer]}) ${q.options[q.answer]}`;
    case "tf":
      return q.answer ? "صح" : "خطأ";
    case "ordering":
      return q.items.map((it, i) => `${i + 1}. ${it}`).join(" ← ");
    case "matching":
      return q.pairs.map((p) => `${p.term}: ${p.def}`).join(" | ");
    case "writing":
      return "يُقيَّم وفق شبكة التنقيط المعروضة أعلاه.";
  }
}

function answerText(q: Question, a: Answer): string {
  if (a === null || a === undefined || (typeof a === "string" && a.trim() === "")) return "بدون إجابة";
  switch (q.kind) {
    case "mcq":
    case "doc":
      return typeof a === "number" ? `${LETTERS[a]}) ${q.options[a]}` : "بدون إجابة";
    case "tf":
      return a === true ? "صح" : a === false ? "خطأ" : "بدون إجابة";
    case "ordering":
      return Array.isArray(a) ? a.map((orig, pos) => `${pos + 1}. ${q.items[orig]}`).join(" ← ") : "لم يتم الترتيب";
    case "matching": {
      if (typeof a !== "object" || Array.isArray(a)) return "بدون إجابة";
      const rec = a as Record<number, number>;
      const parts = q.pairs
        .map((p, ti) => (rec[ti] !== undefined ? `${p.term} ← ${q.pairs[rec[ti]].def}` : null))
        .filter(Boolean);
      return parts.length > 0 ? parts.join(" | ") : "بدون إجابة";
    }
    case "writing":
      return "انظر شبكة التنقيط أعلاه.";
  }
}

function scoreFor(q: Question, a: Answer): number {
  return gradeAutoQuestion(q, a);
}

interface TestResultProps {
  report: TestReport;
  questions: Question[];
  name: string;
  className: string;
  studentNo?: string;
  onRestart: () => void;
  onHome: () => void;
}

export default function TestResult({ questions: QUESTIONS, report, name, className, studentNo, onRestart, onHome }: TestResultProps) {
  const [openReview, setOpenReview] = useState<number | null>(null);
  const [showWriting, setShowWriting] = useState(false);

  const skillEntries = Object.entries(report.skills).map(([skill, v]) => ({
    skill,
    ...v,
    ratio: v.max > 0 ? v.got / v.max : 0,
  }));
  const strengths = skillEntries.filter((s) => s.ratio >= 0.7);
  const weaknesses = skillEntries.filter((s) => s.ratio < 0.55);
  const recs = weaknesses.map((w) => RECOMMENDATIONS[w.skill]).filter(Boolean) as string[];

  const minutesUsed = Math.floor(report.timeUsedSeconds / 60);
  const secondsUsed = report.timeUsedSeconds % 60;

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        {/* ============ النتيجة الرئيسية ============ */}
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-brand-800 to-brand-950 p-7 text-white shadow-[0_40px_80px_-30px_rgba(6,56,40,0.7)] sm:p-10">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 pattern-zellige-light opacity-30" />
              <div className="absolute -top-20 end-1/4 size-72 rounded-full bg-gold-500/15 blur-[100px]" />
            </div>
            <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
              <div className="mx-auto text-white">
                <Ring percent={Math.round(report.percent)} size={150} stroke={13} />
              </div>
              <div className="text-center md:text-start">
                <p className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-bold text-gold-300">
                  <Award className="size-3.5" aria-hidden="true" />
                  نتيجة التقويم التشخيصي — الجذع المشترك
                </p>
                <h1 className="mt-4 font-display text-2xl font-black sm:text-3xl">
                  {name}
                  {studentNo ? <span className="text-white/60"> (رقم {studentNo})</span> : null}
                </h1>
                <p className="mt-1.5 text-sm text-white/55">{className}</p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <span className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
                    <span className="block font-display text-2xl font-black text-gold-300">{report.total} <span className="text-sm text-white/50">/ 20</span></span>
                    <span className="block text-[11px] text-white/55">النتيجة النهائية</span>
                  </span>
                  <span className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
                    <span className="block font-display text-2xl font-black text-gold-300">{report.percent}٪</span>
                    <span className="block text-[11px] text-white/55">النسبة العامة</span>
                  </span>
                  <span className={`rounded-2xl px-5 py-3 ring-2 ${LEVEL_STYLES[report.levelTone]}`}>
                    <span className="block font-display text-2xl font-black">{report.levelLabel}</span>
                    <span className="block text-[11px] font-semibold opacity-70">تقدير المستوى</span>
                  </span>
                  <span className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
                    <span className="block font-display text-lg font-black text-white">{minutesUsed}:{String(secondsUsed).padStart(2, "0")}</span>
                    <span className="flex items-center gap-1 text-[11px] text-white/55">
                      <Clock className="size-3" aria-hidden="true" /> مدة الإنجاز
                    </span>
                  </span>
                </div>

                {/* التاريخ / الجغرافيا */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>التاريخ</span>
                      <span className="text-gold-300">{report.historyScore} / 10</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-l from-gold-300 to-gold-500 transition-all duration-1000" style={{ width: `${(report.historyScore / 10) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>الجغرافيا</span>
                      <span className="text-brand-300">{report.geographyScore} / 10</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-l from-brand-300 to-brand-500 transition-all duration-1000" style={{ width: `${(report.geographyScore / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ============ التشخيص الفردي ============ */}
        <Reveal delay={120}>
          <h2 className="mt-14 flex items-center gap-2.5 font-display text-2xl font-black text-ink-900">
            <Sparkles className="size-6 text-gold-500" aria-hidden="true" />
            التشخيص التربوي الفردي
          </h2>
        </Reveal>

        {/* المهارات */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillEntries.map((s, i) => (
            <Reveal key={s.skill} delay={i * 60}>
              <div className="rounded-2xl border border-ink-900/6 bg-white p-4.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-extrabold text-ink-900">{s.skill}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      s.ratio >= 0.7 ? "bg-emerald-100 text-emerald-700" : s.ratio < 0.55 ? "bg-rose-100 text-rose-700" : "bg-gold-100 text-gold-700"
                    }`}
                  >
                    {Math.round(s.ratio * 100)}٪
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper-warm">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      s.ratio >= 0.7 ? "bg-gradient-to-l from-emerald-400 to-emerald-600" : s.ratio < 0.55 ? "bg-gradient-to-l from-rose-400 to-rose-500" : "bg-gradient-to-l from-gold-400 to-gold-500"
                    }`}
                    style={{ width: `${Math.round(s.ratio * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-500">النقاط: {s.got} / {s.max}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* نقاط القوة / التعثر / التوصيات */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Reveal delay={100}>
            <div className="h-full rounded-3xl border border-ink-900/6 bg-white p-6">
              <p className="flex items-center gap-2 font-display text-base font-extrabold text-emerald-700">
                <CheckCircle2 className="size-5" aria-hidden="true" />
                نقاط القوة
              </p>
              <ul className="mt-4 space-y-2.5">
                {strengths.length > 0 ? (
                  strengths.map((s) => (
                    <li key={s.skill} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                      التحكم في {s.skill} ({Math.round(s.ratio * 100)}٪)
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-ink-500">لا توجد مهارة فوق عتبة 70٪ بعد — الانطلاقة من التوصيات.</li>
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="h-full rounded-3xl border border-ink-900/6 bg-white p-6">
              <p className="flex items-center gap-2 font-display text-base font-extrabold text-rose-600">
                <AlertCircle className="size-5" aria-hidden="true" />
                مواطن التعثر
              </p>
              <ul className="mt-4 space-y-2.5">
                {weaknesses.length > 0 ? (
                  weaknesses.map((w) => (
                    <li key={w.skill} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
                      صعوبة في {w.skill} ({Math.round(w.ratio * 100)}٪)
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-ink-500">لا تعثر بارز — واصل على نفس الوتيرة.</li>
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="h-full rounded-3xl border border-ink-900/6 bg-white p-6">
              <p className="flex items-center gap-2 font-display text-base font-extrabold text-brand-700">
                <Lightbulb className="size-5" aria-hidden="true" />
                توصيات الأستاذ
              </p>
              <ul className="mt-4 space-y-2.5">
                {recs.length > 0 ? (
                  recs.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      {r}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-ink-500">مستوى جيد — يُنصح بإعادة التشخيص بعد المراجعة لتثبيت المكتسبات.</li>
                )}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ============ شبكة تنقيط الكتابة ============ */}
        <Reveal delay={120}>
          <h2 className="mt-14 flex items-center gap-2.5 font-display text-2xl font-black text-ink-900">
            <PenLine className="size-6 text-gold-500" aria-hidden="true" />
            شبكة تنقيط سؤال الكتابة (السؤال 20)
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            تنقيط آلي <strong>استرشادي متعدد المعايير</strong> (لا يعتمد على الكلمات فقط، بل على الحجم والبنية والمفاهيم والروابط والترقيم) — يُعتمد النهائي بعد مراجعة الأستاذ.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-6 overflow-hidden rounded-3xl border border-ink-900/6 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-brand-50 text-start text-brand-800">
                    <th className="px-5 py-3.5 text-start font-display text-xs font-extrabold">المعيار</th>
                    <th className="px-5 py-3.5 text-start font-display text-xs font-extrabold">الوزن</th>
                    <th className="px-5 py-3.5 text-start font-display text-xs font-extrabold">النقطة المحصل عليها</th>
                    <th className="px-5 py-3.5 text-start font-display text-xs font-extrabold">ملاحظة التحليل</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rubric.criteria.map((c, i) => (
                    <tr key={c.key} className={i % 2 === 0 ? "bg-white" : "bg-paper-warm/40"}>
                      <td className="px-5 py-3.5 font-bold text-ink-900">{c.label}</td>
                      <td className="px-5 py-3.5 text-ink-500">{c.weight}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-extrabold ${c.ratio >= 0.7 ? "text-emerald-600" : c.ratio < 0.4 ? "text-rose-600" : "text-gold-600"}`}>
                          {c.score}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs leading-relaxed text-ink-500">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-brand-800 text-white">
                    <td className="px-5 py-3.5 font-display font-extrabold" colSpan={2}>مجموع سؤال الكتابة</td>
                    <td className="px-5 py-3.5 font-display text-lg font-black text-gold-300" colSpan={2}>
                      {report.rubric.total} / 1
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="border-t border-ink-900/6 p-4">
              <button
                type="button"
                onClick={() => setShowWriting((v) => !v)}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-brand-700 transition-colors hover:text-brand-800"
              >
                <ChevronDown className={`size-4 transition-transform duration-300 ${showWriting ? "rotate-180" : ""}`} aria-hidden="true" />
                {showWriting ? "إخفاء نص الفقرة المكتوبة" : "عرض نص الفقرة المكتوبة"}
              </button>
              {showWriting && (
                <p className="mt-3 whitespace-pre-line rounded-2xl bg-paper-warm/60 p-5 text-sm leading-loose text-ink-700">
                  {report.writingText.trim() || "لم تتم كتابة فقرة."}
                </p>
              )}
            </div>
          </div>
        </Reveal>

        {/* ============ مراجعة الأسئلة ============ */}
        <Reveal delay={120}>
          <h2 className="mt-14 flex items-center gap-2.5 font-display text-2xl font-black text-ink-900">
            <FlaskConical className="size-6 text-gold-500" aria-hidden="true" />
            مراجعة الأسئلة سؤالًا سؤالًا
          </h2>
        </Reveal>
        <div className="mt-6 space-y-3">
          {QUESTIONS.map((q, i) => {
            const a = report.answers[i];
            const score = scoreFor(q, a);
            const ok = score >= q.points;
            const partial = score > 0 && score < q.points;
            const open = openReview === i;
            return (
              <Reveal key={q.id} delay={Math.min(i, 8) * 40}>
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${open ? "border-brand-300 bg-white shadow-lg" : "border-ink-900/6 bg-white"}`}>
                  <button
                    type="button"
                    onClick={() => setOpenReview(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3.5 px-5 py-4 text-start"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-black text-white ${
                        ok ? "bg-emerald-500" : partial ? "bg-gold-500" : "bg-rose-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-extrabold text-ink-900 line-clamp-1">{q.title}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-500">
                        {q.subject === "history" ? "التاريخ" : "الجغرافيا"} · {q.skill}
                      </span>
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${ok ? "bg-emerald-100 text-emerald-700" : partial ? "bg-gold-100 text-gold-700" : "bg-rose-100 text-rose-700"}`}>
                      {Math.round(score * 100) / 100} / {q.points}
                    </span>
                    <ChevronDown className={`size-4.5 shrink-0 text-ink-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-3 border-t border-ink-900/6 p-5">
                        <p className="flex items-start gap-2.5 text-sm leading-relaxed">
                          {ok ? (
                            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-500" aria-hidden="true" />
                          ) : (
                            <XCircle className="mt-0.5 size-4.5 shrink-0 text-rose-500" aria-hidden="true" />
                          )}
                          <span>
                            <span className="font-extrabold text-ink-900">إجابتك: </span>
                            <span className="text-ink-700">{answerText(q, a)}</span>
                          </span>
                        </p>
                        {!ok && (
                          <p className="flex items-start gap-2.5 text-sm leading-relaxed">
                            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-500" aria-hidden="true" />
                            <span>
                              <span className="font-extrabold text-emerald-700">الإجابة الصحيحة: </span>
                              <span className="text-ink-700">{correctText(q)}</span>
                            </span>
                          </p>
                        )}
                        {q.explanation && (
                          <p className="rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
                            <span className="font-extrabold">توضيح: </span>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* ============ إجراءات ============ */}
        <Reveal delay={150}>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-3xl border border-ink-900/6 bg-white p-7 sm:flex-row">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <RotateCcw className="size-4.5" aria-hidden="true" />
              إعادة الاختبار
            </button>
            <button
              type="button"
              onClick={onHome}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-900/10 bg-white px-7 py-3.5 text-sm font-bold text-ink-700 transition-all hover:-translate-y-0.5 hover:border-brand-300 sm:w-auto"
            >
              <Home className="size-4.5" aria-hidden="true" />
              العودة إلى الرئيسية
            </button>
            <p className="flex items-center gap-2 text-xs text-ink-500 sm:ms-auto">
              <TrendingUp className="size-4 text-brand-600" aria-hidden="true" />
              حُفظت نسختك في لوحة نتائج الأستاذ.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
