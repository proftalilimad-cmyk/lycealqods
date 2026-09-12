import { useState } from "react";
import { ArrowLeft, Award, BadgeCheck, CheckCircle2, ChevronDown, Clock3, Eye, FileText, FlaskConical, PenLine } from "lucide-react";
import { APPLICATIONS } from "../data/applications";
import Reveal from "./Reveal";
import { LEVELS } from "../data/curriculum";

interface ApplicationsProps {
  detailId?: string;
  initialLevel?: string;
  onSelect: (id?: string) => void;
}

export default function Applications({ detailId, initialLevel, onSelect }: ApplicationsProps) {
  const [levelFilter, setLevelFilter] = useState(initialLevel ?? "all");
  const [subjectFilter, setSubjectFilter] = useState<"all" | "التاريخ" | "الجغرافيا">("all");
  const [showCorrection, setShowCorrection] = useState(false);
  const [openDoc, setOpenDoc] = useState(true);

  const detail = APPLICATIONS.find((a) => a.id === detailId);

  const filtered = APPLICATIONS.filter(
    (a) =>
      (levelFilter === "all" || a.level === (LEVELS.find((l) => l.id === levelFilter)?.label ?? a.level)) &&
      (subjectFilter === "all" || a.subject === subjectFilter)
  );

  if (detail) {
    return (
      <section className="pt-32 pb-20 md:pt-36">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <button type="button" onClick={() => { onSelect(undefined); setShowCorrection(false); }} className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800">
              <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
              العودة إلى كل التطبيقات
            </button>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-6 overflow-hidden rounded-3xl border border-ink-900/6 bg-white shadow-[0_30px_70px_-30px_rgba(4,36,26,0.25)]">
              <div className="noise relative bg-gradient-to-l from-brand-700 to-brand-900 p-8 text-white sm:p-10">
                <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-30" aria-hidden="true" />
                <div className="relative">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1 text-[11px] font-bold text-gold-300">{detail.level}</span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-bold text-white/85">{detail.subject}</span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-bold text-white/85">{detail.skillTag}</span>
                  </div>
                  <h1 className="mt-4 font-display text-2xl font-black leading-relaxed sm:text-3xl">{detail.title}</h1>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      المدة المقترحة: {detail.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Award className="size-3.5" aria-hidden="true" />
                      النقطة المقترحة: {detail.points} /{detail.points}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-10">
                {/* الوثائق */}
                <button type="button" onClick={() => setOpenDoc((v) => !v)} className="flex w-full items-center justify-between font-display text-lg font-extrabold text-ink-900">
                  <span className="flex items-center gap-2.5">
                    <FileText className="size-5 text-brand-600" aria-hidden="true" />
                    الوثائق ({detail.docs.length})
                  </span>
                  <ChevronDown className={`size-5 text-ink-500 transition-transform ${openDoc ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {openDoc && (
                  <div className="mt-4 space-y-4">
                    {detail.docs.map((d, i) => (
                      <div key={i} className="rounded-2xl border border-gold-300/60 bg-gold-50/70 p-5">
                        <p className="text-[11px] font-extrabold text-gold-700">{d.label}</p>
                        <p className="mt-2.5 whitespace-pre-line text-sm leading-loose text-ink-700">{d.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* الأسئلة */}
                <h2 className="mt-9 flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                  <PenLine className="size-5 text-brand-600" aria-hidden="true" />
                  الأسئلة
                </h2>
                <div className="mt-5 space-y-5">
                  {detail.questions.map((q, i) => (
                    <div key={i} className="rounded-2xl border border-ink-900/6 bg-cream p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-extrabold leading-relaxed text-ink-900">
                          <span className="me-1.5 inline-grid size-6 place-items-center rounded-lg bg-brand-600 text-[11px] font-black text-white">{i + 1}</span>
                          {q.q}
                        </p>
                        <span className="shrink-0 rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-extrabold text-gold-700">{q.pts} ن</span>
                      </div>
                      <textarea
                        rows={3}
                        dir="rtl"
                        placeholder="اكتب إجابتك هنا ثم قارنها بالتصحيح النموذجي..."
                        aria-label={`مساحة الإجابة عن السؤال ${i + 1}`}
                        className="field mt-3.5 resize-y text-sm leading-relaxed"
                      />
                      {showCorrection && (
                        <div className="animate-fade-up mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                          <p className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-700">
                            <BadgeCheck className="size-4" aria-hidden="true" />
                            التصحيح النموذجي — السؤال {i + 1}
                          </p>
                          <p className="mt-2 text-sm leading-loose text-ink-700">
                            {detail.correction.find((c) => c.q === i + 1)?.text ?? "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl bg-paper-warm/70 p-5 sm:flex-row sm:justify-between">
                  <p className="flex items-center gap-2 text-xs font-semibold text-ink-500">
                    <Eye className="size-4 text-brand-600" aria-hidden="true" />
                    أجب أولًا بمفردك، ثم اعرض التصحيح النموذجي لتقييم إجاباتك.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCorrection((v) => !v)}
                    className={`btn-shine inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all hover:-translate-y-0.5 ${
                      showCorrection
                        ? "border border-ink-900/10 bg-white text-ink-700"
                        : "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/25"
                    }`}
                  >
                    <CheckCircle2 className="size-4.5" aria-hidden="true" />
                    {showCorrection ? "إخفاء التصحيح" : "تصحيح"}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-20 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              تطبيقات وتمارين
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl">تطبيقات وتمارين مصححة</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              مصنفة حسب: المستوى ← المادة ← المهارة. كل تطبيق يتضمن وثيقة أو أكثر، أسئلة متدرجة، مساحة للإجابة، وتصحيحًا نموذجيًا بالنقطة المقترحة.
            </p>
          </div>
        </Reveal>

        {/* المرشحات */}
        <Reveal delay={100}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLevelFilter("all")}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${levelFilter === "all" ? "bg-brand-600 text-white shadow" : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"}`}
              >
                كل المستويات
              </button>
              {LEVELS.map((lv) => (
                <button
                  key={lv.id}
                  type="button"
                  onClick={() => setLevelFilter(lv.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${levelFilter === lv.id ? "bg-brand-600 text-white shadow" : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"}`}
                >
                  {lv.label}
                </button>
              ))}
            </div>
            <span className="hidden h-6 w-px bg-ink-900/10 sm:block" aria-hidden="true" />
            <div className="flex gap-2">
              {(["all", "التاريخ", "الجغرافيا"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubjectFilter(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${subjectFilter === s ? "bg-gold-400 text-ink-950 shadow" : "border border-ink-900/8 bg-white text-ink-500 hover:text-gold-700"}`}
                >
                  {s === "all" ? "المادتان" : s}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => (
            <Reveal key={a.id} delay={(i % 3) * 100}>
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="group flex h-full w-full flex-col rounded-3xl border border-ink-900/6 bg-white p-7 text-start transition-all duration-500 hover:-translate-y-2 hover:border-brand-200 hover:shadow-[0_28px_60px_-24px_rgba(12,124,91,0.35)]"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-extrabold text-brand-700">{a.level}</span>
                  <span className="rounded-full bg-gold-100 px-3 py-1 text-[10px] font-extrabold text-gold-700">{a.subject}</span>
                </div>
                <h2 className="mt-4 flex-1 font-display text-lg font-extrabold leading-relaxed text-ink-900">{a.title}</h2>
                <p className="mt-2 text-xs font-semibold text-ink-500">{a.skillTag}</p>
                <div className="mt-4 flex items-center justify-between border-t border-ink-900/6 pt-4 text-[11px] font-semibold text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-3.5" aria-hidden="true" />
                    {a.docs.length} {a.docs.length === 1 ? "وثيقة" : "وثائق"} · {a.questions.length} أسئلة
                  </span>
                  <span className="rounded-full bg-paper-warm px-2.5 py-1 font-extrabold text-ink-700">/{a.points}</span>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand-700 transition-transform duration-300 group-hover:-translate-x-1">
                  افتح التطبيق ←
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 rounded-3xl border border-dashed border-brand-300 bg-white p-10 text-center text-sm font-semibold text-ink-500">
            لا توجد تطبيقات مطابقة لهذا الترشيح حاليًا — تُضاف تطبيقات جديدة تباعًا.
          </p>
        )}
      </div>
    </section>
  );
}
