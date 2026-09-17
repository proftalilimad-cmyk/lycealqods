/* ============================================================
   مكتبة «مسار/منار التاريخ والجغرافيا» — جذع مشترك شعبة علوم تجريبية
   عرض ملفات الكتاب (PDF داخل المتصفح) وتحميل وثائق Word، مع ربط
   كل جذاذة بمصادرها من الكتاب.
   ============================================================ */
import { useMemo, useState } from "react";
import { BookOpenCheck, Download, ExternalLink, FileText, FolderOpen, Printer } from "lucide-react";
import { MANAR_FILES, MANAR_GROUPS, type ManarFile } from "../data/manarSources";
import type { Route } from "../routes";

const manarUrl = (f: string) => `manar-tc/${f.split("/").map(encodeURIComponent).join("/")}`;

interface ManarLibraryProps {
  open?: string;
  go: (r: Route) => void;
}

export default function ManarLibrary({ open, go }: ManarLibraryProps) {
  const [picked, setPicked] = useState<string | undefined>(open);
  const [group, setGroup] = useState<string>("الكل");
  const current = useMemo(() => MANAR_FILES.find((m) => m.file === picked), [picked]);
  const visible = useMemo(
    () => (group === "الكل" ? MANAR_FILES : MANAR_FILES.filter((m) => m.cat.startsWith(group.split(" — ")[0]))),
    [group],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-ink-900/10">
        <div className="p-5 sm:p-7" style={{ background: "linear-gradient(135deg, #edf7f2 0%, #ffffff 65%)" }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-extrabold text-white">
            <BookOpenCheck className="size-3.5" aria-hidden="true" />
            كتاب منار في الاجتماعيات
          </span>
          <h1 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-[30px]">
            مكتبة مسار ومنار — التاريخ والجغرافيا (جذع مشترك شعبة علوم تجريبية)
          </h1>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-500 sm:text-sm">
            {MANAR_FILES.length} ملفًا من وثائق الكتاب والجذاذات والتقديم العام: ملفات PDF تُقرأ داخل المتصفح، ووثائق
            Word قابلة للتحميل. المصادر نفسها معتمدة في جذاذات الأستاذ عماد طليل المعروضة في قسم الجذاذات.
          </p>
        </div>

        {current ? (
          <div className="p-4 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold text-ink-500">{current.cat}</p>
                <h2 className="font-display text-base font-black text-ink-900">{current.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPicked(undefined)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-3.5 py-2 text-[11px] font-extrabold text-ink-700 hover:border-brand-300 hover:text-brand-700"
                >
                  ← لائحة الملفات
                </button>
                <a
                  href={manarUrl(current.file)}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-[11px] font-extrabold text-white hover:bg-brand-700"
                >
                  <Download className="size-3.5" /> تحميل الملف
                </a>
                {current.ext === "pdf" && (
                  <a
                    href={manarUrl(current.file)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2 text-[11px] font-extrabold text-brand-700 hover:border-brand-400"
                  >
                    <ExternalLink className="size-3.5" /> نافذة مستقلة / طباعة
                  </a>
                )}
              </div>
            </div>
            {current.ext === "pdf" ? (
              <iframe
                title={current.title}
                src={manarUrl(current.file)}
                className="h-[75vh] w-full rounded-2xl border border-ink-900/10 bg-white"
              />
            ) : (
              <div className="rounded-2xl border border-ink-900/10 bg-paper-warm/60 p-6 text-center">
                <FileText className="mx-auto size-10 text-brand-600" aria-hidden="true" />
                <p className="mt-3 text-sm font-extrabold text-ink-800">
                  وثيقة Word ({current.ext}) — لا تُعرض داخل المتصفح، حمّلها لفتحها في برنامج Word.
                </p>
                <p className="mt-1 text-[11px] font-bold text-ink-500">{current.file}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {["الكل", ...MANAR_GROUPS].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`rounded-xl px-3 py-1.5 text-[10.5px] font-extrabold transition-colors ${
                    group === g ? "bg-brand-600 text-white" : "border border-ink-900/10 bg-white text-ink-600 hover:border-brand-300"
                  }`}
                >
                  {g === "الكل" ? `الكل (${MANAR_FILES.length})` : g}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((m) => (
                <div key={m.file} className="flex items-start gap-3 rounded-2xl border border-ink-900/10 bg-white p-3.5">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-[9px] font-black text-white"
                    style={{ background: m.ext === "pdf" ? "#0c6147" : "#0f7c5b" }}
                  >
                    {m.ext.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-extrabold text-ink-900" title={m.title}>
                      {m.title}
                    </p>
                    <p className="mt-0.5 truncate text-[9.5px] font-bold text-ink-500">{m.cat}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.ext === "pdf" && (
                        <button
                          type="button"
                          onClick={() => {
                            setPicked(m.file);
                            window.scrollTo({ top: 0 });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-brand-700"
                        >
                          <Printer className="size-3" /> عرض وطباعة
                        </button>
                      )}
                      <a
                        href={manarUrl(m.file)}
                        download
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-extrabold text-brand-700 hover:border-brand-400"
                      >
                        <Download className="size-3" /> تحميل
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-ink-500">
              <FolderOpen className="size-3.5" aria-hidden="true" />
              الملفات محفوظة في مستودع المشروع تحت «جذع مشترك شعبة علوم تجريبية» وتُقدَّم عبر المسار /manar-tc/.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => go({ view: "jadadat" })}
          className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-xs font-extrabold text-brand-700 hover:border-brand-400"
        >
          إلى جذاذات الجذع المشترك العلمي ←
        </button>
      </div>
    </div>
  );
}

export { manarUrl };
export type { ManarFile };
