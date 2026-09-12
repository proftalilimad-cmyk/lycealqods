import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Lightbulb, ListOrdered, NotebookPen } from "lucide-react";
import { METHODOLOGIES } from "../data/methodologies";
import Reveal from "./Reveal";

interface MethodologiesProps {
  detailId?: string;
  onSelect: (id?: string) => void;
}

export default function Methodologies({ detailId, onSelect }: MethodologiesProps) {
  const detail = METHODOLOGIES.find((m) => m.id === detailId);
  const [openTips, setOpenTips] = useState(true);

  if (detail) {
    return (
      <section className="pt-32 pb-20 md:pt-36">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <button
              type="button"
              onClick={() => onSelect(undefined)}
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800"
            >
              <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
              العودة إلى كل المنهجيات
            </button>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6 overflow-hidden rounded-3xl border border-ink-900/6 bg-white shadow-[0_30px_70px_-30px_rgba(4,36,26,0.25)]">
              <div className="noise relative bg-gradient-to-l from-brand-700 to-brand-900 p-8 text-white sm:p-10">
                <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-30" aria-hidden="true" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-bold text-gold-300">
                    <NotebookPen className="size-3.5" aria-hidden="true" />
                    منهجيات الاجتماعيات
                  </span>
                  <h1 className="mt-4 font-display text-2xl font-black leading-relaxed sm:text-3xl">{detail.title}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-loose text-white/70 sm:text-base">{detail.intro}</p>
                </div>
              </div>

              <div className="p-7 sm:p-10">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink-900">
                  <ListOrdered className="size-5 text-brand-600" aria-hidden="true" />
                  الخطوات المنهجية
                </h2>
                <ol className="mt-6 space-y-4">
                  {detail.steps.map((s, i) => (
                    <li key={s.title} className="flex gap-4 rounded-2xl border border-ink-900/6 bg-cream p-5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-base font-black text-gold-300">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-display text-sm font-extrabold text-ink-900 sm:text-base">{s.title}</p>
                        <p className="mt-1.5 text-sm leading-loose text-ink-500">{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                    <button type="button" onClick={() => setOpenTips((v) => !v)} className="flex w-full items-center gap-2 text-start font-display text-sm font-extrabold text-emerald-700">
                      <Lightbulb className="size-4.5" aria-hidden="true" />
                      نصائح ذهبية
                    </button>
                    {openTips && (
                      <ul className="mt-3.5 space-y-2.5">
                        {detail.tips.map((t) => (
                          <li key={t} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-700">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
                    <p className="flex items-center gap-2 font-display text-sm font-extrabold text-rose-600">
                      <AlertTriangle className="size-4.5" aria-hidden="true" />
                      أخطاء شائعة يجب تجنبها
                    </p>
                    <ul className="mt-3.5 space-y-2.5">
                      {detail.mistakes.map((m) => (
                        <li key={m} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-700">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
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
              <FileText className="size-3.5" aria-hidden="true" />
              المنهجيات
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl">منهجيات الاجتماعيات</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              أدلة تطبيقية مفصلة للتعامل مع الوثائق والكتابة وأسئلة الامتحان — خطوات مرتبة، نصائح، وأخطاء شائعة يجب تجنبها.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {METHODOLOGIES.map((m, i) => (
            <Reveal key={m.id} delay={(i % 3) * 100}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className="group flex h-full w-full flex-col rounded-3xl border border-ink-900/6 bg-white p-7 text-start transition-all duration-500 hover:-translate-y-2 hover:border-brand-200 hover:shadow-[0_28px_60px_-24px_rgba(12,124,91,0.35)]"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                  <FileText className="size-5.5" strokeWidth={2} aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-display text-lg font-extrabold leading-relaxed text-ink-900">{m.title}</h2>
                <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-ink-500 line-clamp-3">{m.intro}</p>
                <span className="mt-5 flex items-center justify-between border-t border-ink-900/6 pt-4 text-xs">
                  <span className="font-semibold text-ink-500">{m.steps.length} خطوات منهجية</span>
                  <span className="font-extrabold text-brand-700 transition-transform duration-300 group-hover:-translate-x-1">اقرأ المنهجية ←</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
