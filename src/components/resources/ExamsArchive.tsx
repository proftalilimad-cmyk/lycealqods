import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Landmark, MapPin, ScrollText } from "lucide-react";
import { REGIONAL_EXAMS, REGIONAL_YEARS, REGIONS } from "../../data/regionalExams";
import Reveal from "../Reveal";

/* ============================================================
   أرشيف الامتحانات الجهوية (الأولى باكالوريا) — تحميل مباشر من الموقع
   ============================================================ */

const SESSIONS = [
  { id: "all", label: "الدورتان" },
  { id: "normale", label: "الدورة العادية" },
  { id: "rattrapage", label: "الدورة الاستدراكية" },
] as const;

function DlButton({ href, label, size, primary }: { href: string; label: string; size?: string; primary?: boolean }) {
  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition-all hover:-translate-y-0.5 ${
        primary ? "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-md shadow-brand-700/20" : "border border-brand-200 bg-white text-brand-700 hover:border-brand-400"
      }`}
    >
      <Download className="size-3.5" aria-hidden="true" />
      {label}
      {size && <span className={`text-[9px] font-bold ${primary ? "text-white/70" : "text-ink-400"}`}>({size})</span>}
    </a>
  );
}

export default function ExamsArchive() {
  const [region, setRegion] = useState<string>("الكل");
  const [year, setYear] = useState<number | "all">("all");
  const [session, setSession] = useState<(typeof SESSIONS)[number]["id"]>("all");

  const rows = useMemo(
    () =>
      REGIONAL_EXAMS.filter((e) => {
        if (region !== "الكل" && e.region !== region) return false;
        if (year !== "all" && e.year !== year) return false;
        if (session !== "all" && !e.id.endsWith(`-${session}`)) return false;
        return true;
      }),
    [region, year, session]
  );

  const grouped = useMemo(() => {
    const m = new Map<number, typeof rows>();
    for (const r of rows) m.set(r.year!, [...(m.get(r.year!) ?? []), r]);
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [rows]);

  const totalFiles = REGIONAL_EXAMS.reduce((n, e) => n + (e.action.kind === "file" && e.action.correctionUrl ? 2 : 1), 0);

  return (
    <div id="exams" className="mt-16 scroll-mt-28">
      <Reveal>
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <Landmark className="size-3.5" aria-hidden="true" />
            أرشيف الامتحانات الرسمية
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">الامتحانات الجهوية الموحدة — الأولى باكالوريا</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
            {REGIONAL_EXAMS.length} امتحانًا ({totalFiles} ملف PDF) من {REGIONS.length} جهات بين {REGIONAL_YEARS[REGIONAL_YEARS.length - 1]} و{REGIONAL_YEARS[0]}: الموضوع الرسمي + عناصر الإجابة، مستضافة على المنصة للتحميل المباشر.
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-7 rounded-3xl border border-ink-900/6 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="الجهة">
            <MapPin className="size-4 text-ink-400" aria-hidden="true" />
            {["الكل", ...REGIONS].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-all ${region === r ? "bg-brand-700 text-white shadow-md shadow-brand-700/25" : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"}`}
              >
                {r}
                {r !== "الكل" && <span className="ms-1 text-[9px] opacity-70">({REGIONAL_EXAMS.filter((e) => e.region === r).length})</span>}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="السنة">
            <button type="button" onClick={() => setYear("all")} className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition-all ${year === "all" ? "bg-gold-400 text-ink-900" : "bg-paper text-ink-500 hover:bg-gold-100"}`}>
              كل السنوات
            </button>
            {REGIONAL_YEARS.map((y) => (
              <button key={y} type="button" onClick={() => setYear(y)} className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition-all ${year === y ? "bg-gold-400 text-ink-900" : "bg-paper text-ink-500 hover:bg-gold-100"}`}>
                {y}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="الدورة">
            {SESSIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => setSession(s.id)} className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition-all ${session === s.id ? "bg-ink-900 text-white" : "bg-paper text-ink-500 hover:bg-ink-900/5"}`}>
                {s.label}
              </button>
            ))}
            <span className="ms-auto text-[11px] font-bold text-ink-500">{rows.length} امتحانًا</span>
          </div>
        </div>
      </Reveal>

      {grouped.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-brand-300 bg-white p-8 text-center text-sm font-semibold text-ink-500">لا توجد امتحانات مطابقة لهذه الفلاتر.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map(([y, list]) => (
            <Reveal key={y} y={14}>
              <div className="overflow-hidden rounded-3xl border border-ink-900/6 bg-white">
                <div className="flex items-center justify-between bg-gradient-to-l from-brand-700 to-brand-900 px-5 py-3 text-white">
                  <h3 className="font-display text-lg font-black">{y}</h3>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">{list.length} امتحانًا</span>
                </div>
                <ul className="divide-y divide-ink-900/6">
                  {list.map((e) => {
                    const a = e.action.kind === "file" ? e.action : null;
                    const isRatt = e.id.endsWith("-rattrapage");
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-brand-50/40">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <ScrollText className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-ink-900">{e.region}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-ink-500">
                            <span className={`rounded-full px-2 py-0.5 ${isRatt ? "bg-gold-100 text-gold-700" : "bg-brand-50 text-brand-700"}`}>{isRatt ? "الدورة الاستدراكية" : "الدورة العادية"}</span>
                            <span>التاريخ والجغرافيا · الأولى باكالوريا</span>
                            {a?.correctionUrl && (
                              <span className="inline-flex items-center gap-1 text-brand-700">
                                <CheckCircle2 className="size-3" aria-hidden="true" />
                                مع عناصر الإجابة
                              </span>
                            )}
                          </p>
                        </div>
                        {a && (
                          <div className="flex flex-wrap gap-1.5">
                            <DlButton href={a.url} label={a.label ?? "الموضوع"} size={a.size} primary={a.label !== "عناصر الإجابة"} />
                            {a.correctionUrl && <DlButton href={a.correctionUrl} label="عناصر الإجابة" size={a.correctionSize} />}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={100}>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gold-300/60 bg-gold-50 p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-400/25 text-gold-700">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-gold-700 sm:text-base">الإطار المرجعي الرسمي للامتحان الجهوي — التاريخ والجغرافيا</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-600">وثيقة وزارية تحدد المجالات المعرفية والمهارية وجداول التخصيص التي تُبنى عليها مواضيع الامتحان الجهوي.</p>
            </div>
          </div>
          <DlButton href="/files/cadres-reference/cadre-reference-examen-regional-1bac-histoire-geographie.pdf" label="تحميل الإطار المرجعي" size="570 KB" primary />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-ink-900/6 bg-cream p-4 text-[12px] leading-relaxed text-ink-600">
          <FileText className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
          <p>
            الملفات مواضيع رسمية صادرة عن الأكاديميات الجهوية للتربية والتكوين، مضغوطة لتسريع التحميل مع الحفاظ على وضوح القراءة. الامتحانات الوطنية للثانية باكالوريا تُدرج تباعًا ضمن صنف «امتحانات وطنية».
          </p>
        </div>
      </Reveal>
    </div>
  );
}
