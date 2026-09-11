import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe2,
  Image,
  Landmark,
  Link2,
  Presentation,
  Printer,
  Search,
  SlidersHorizontal,
  Table2,
  Target,
  UploadCloud,
  X,
} from "lucide-react";
import { LEVELS } from "../data/curriculum";
import { RESOURCES, RESOURCE_LEVELS, RESOURCE_TYPES, countByType, getResource, type ResourceItem, type ResourceType } from "../data/resources";
import { normalizeArabic } from "../lib/arabic";
import Reveal from "./Reveal";
import DataDocView from "./resources/DataDocView";
import type { Route } from "../routes";

const USEFUL_SITES = [
  { name: "AlloSchool — الاجتماعيات", url: "https://www.alloschool.com", desc: "ممتاز للدروس والوثائق والتمارين والفروض، وله أقسام خاصة بالجذع المشترك والأولى بكالوريا." },
  { name: "Moutamadris — متمدرس", url: "https://www.moutamadris.ma", desc: "يحتوي على دروس وتمارين وفروض وامتحانات لمختلف المستويات المغربية." },
  { name: "Revisio.ma", url: "https://www.revisio.ma", desc: "مفيد جدا للملخصات والتمارين والاختبارات التفاعلية وملفات PDF، مع قسم خاص بالتاريخ والجغرافيا." },
  { name: "LMadrassa — المدرسة المغربية", url: "https://www.lmadrassa.ma", desc: "يضم دروسا وتمارين وفروضا في الاجتماعيات لمستويات الثانوي التأهيلي." },
  { name: "Bestcours.ma", url: "https://www.bestcours.ma", desc: "مفيد خصوصا للفروض والتطبيقات والوثائق والامتحانات في التاريخ والجغرافيا." },
  { name: "Tasribat.ma", url: "https://www.tasribat.ma", desc: "يقدم ملخصات ودروسا وتمارين وفروضا بصيغة PDF، بما فيها موارد الاجتماعيات للجذع المشترك." },
];

const TYPE_ICONS: Record<ResourceType, typeof FileText> = {
  pdf: FileText,
  slides: Presentation,
  map: Globe2,
  table: Table2,
  chart: BarChart3,
  exercise: ClipboardList,
  exam: Target,
  national: Landmark,
  image: Image,
};

const SUBJECTS = ["الكل", "التاريخ", "الجغرافيا"] as const;

interface ResourcesProps {
  go: (r: Route) => void;
  /** نوع مورد يُفعَّل فلترُه عند الفتح (من الصفحة الرئيسية أو البحث) */
  initialType?: string;
  /** معرّف مورد يُفتح مباشرة (وثيقة بيانية) */
  openId?: string;
}

const isResourceType = (t: string | undefined): t is ResourceType => RESOURCE_TYPES.some((x) => x.id === t);

export default function Resources({ go, initialType, openId }: ResourcesProps) {
  const [type, setType] = useState<ResourceType | "all">(isResourceType(initialType) ? initialType : "all");
  const [level, setLevel] = useState<string>("الكل");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("الكل");
  const [query, setQuery] = useState("");
  const [openDoc, setOpenDoc] = useState<ResourceItem | null>(() => {
    const r = openId ? getResource(openId) : undefined;
    return r && r.action.kind === "data" ? r : null;
  });
  const [visible, setVisible] = useState(24);
  const [pdfLevelId, setPdfLevelId] = useState("tc");

  useEffect(() => {
    if (isResourceType(initialType)) {
      const t = window.setTimeout(() => document.getElementById("library")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
      return () => window.clearTimeout(t);
    }
  }, [initialType]);

  const filtered = useMemo(() => {
    const q = normalizeArabic(query);
    return RESOURCES.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (level !== "الكل" && r.level !== level && r.level !== "جميع المستويات") return false;
      if (subject !== "الكل" && r.subject !== subject && r.subject !== "مشترك") return false;
      if (q.length >= 2) {
        const hay = normalizeArabic(`${r.title} ${r.desc} ${(r.tags ?? []).join(" ")} ${r.year ?? ""}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [type, level, subject, query]);

  const shown = filtered.slice(0, visible);
  const hasFilters = type !== "all" || level !== "الكل" || subject !== "الكل" || query.length > 0;

  const resetFilters = () => {
    setType("all");
    setLevel("الكل");
    setSubject("الكل");
    setQuery("");
    setVisible(24);
  };

  const pickType = (t: ResourceType) => {
    setType(t);
    setVisible(24);
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* مكتبة PDF حسب المستوى (القسم الأصلي) */
  const pdfLibrary = RESOURCES.filter((r) => r.type === "pdf");
  const pdfLevelLabel = LEVELS.find((lv) => lv.id === pdfLevelId)?.label ?? "__";
  const pdfLevelLessons = pdfLibrary.filter((l) => l.level === pdfLevelLabel);
  const pdfByLevelCount = (id: string) => pdfLibrary.filter((l) => l.level === (LEVELS.find((lv) => lv.id === id)?.label ?? "__")).length;

  const openItem = (r: ResourceItem) => {
    const a = r.action;
    if (a.kind === "route") go(a.route);
    else if (a.kind === "data") setOpenDoc(r);
    else if (a.kind === "url" || a.kind === "file") window.open(a.url, "_blank", "noopener,noreferrer");
  };

  const actionLabel = (r: ResourceItem) => {
    const a = r.action;
    if (a.label) return a.label;
    if (a.kind === "data") return "عرض الوثيقة";
    if (a.kind === "file") return "تحميل";
    if (a.kind === "url") return a.site ? `فتح على ${a.site}` : "فتح الرابط";
    return "فتح";
  };

  return (
    <section className="pt-32 pb-20 md:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <FolderOpen className="size-3.5" aria-hidden="true" />
              الموارد التعليمية
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl">الموارد التعليمية</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              مكتبة منظمة لجميع الوثائق المصاحبة للدروس: ملفات PDF، عروض، خرائط، جداول، مبيانات، تمارين، فروض وامتحانات وطنية.
            </p>
            <p className="mt-3 text-xs font-bold text-brand-700">
              {RESOURCES.length} موردًا · {RESOURCE_TYPES.filter((t) => countByType(t.id) > 0).length} أصناف · 3 مستويات
            </p>
          </div>
        </Reveal>

        {/* بطاقات فئات الموارد */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_TYPES.map((c, i) => {
            const Icon = TYPE_ICONS[c.id];
            const n = countByType(c.id);
            const ready = n > 0;
            return (
              <Reveal key={c.id} delay={(i % 3) * 80}>
                <article
                  className={`group flex h-full flex-col rounded-3xl border border-ink-900/6 bg-white p-6 transition-all duration-500 ${
                    ready ? "hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_25px_55px_-22px_rgba(12,124,91,0.3)]" : "opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`grid size-12 place-items-center rounded-2xl transition-colors duration-300 ${ready ? "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white" : "bg-paper-warm text-ink-400"}`}>
                      <Icon className="size-5.5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${ready ? "bg-brand-50 text-brand-700" : "border border-dashed border-gold-400/70 bg-gold-50 text-gold-700"}`}>
                      {ready ? `${n} ${n === 1 ? "مورد" : n <= 10 ? "موارد" : "موردًا"}` : "قيد الإضافة"}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-lg font-extrabold text-ink-900">{c.plural}</h2>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-500">{c.desc}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-ink-900/6 pt-4">
                    <span className={`text-[11px] font-semibold ${ready ? "text-brand-600" : "text-ink-400"}`}>{ready ? "متاح الآن" : "سيتوفر قريبًا خلال الموسم الدراسي"}</span>
                    {ready ? (
                      <button type="button" onClick={() => pickType(c.id)} className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:bg-brand-100">
                        تصفح ←
                      </button>
                    ) : (
                      <span className="grid size-8 place-items-center rounded-xl bg-paper-warm text-ink-300" aria-hidden="true">
                        <UploadCloud className="size-4" />
                      </span>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* ===== المكتبة الموحدة مع الفلاتر ===== */}
        <div id="library" className="mt-16 scroll-mt-28">
          <Reveal>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                المكتبة الشاملة
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">ابحث وصفِّ حسب النوع والمستوى والمادة</h2>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-7 rounded-3xl border border-ink-900/6 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-300" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setVisible(24);
                    }}
                    placeholder="ابحث في الموارد: عنوان، مفهوم، سنة امتحان…"
                    className="field ps-10"
                    aria-label="البحث في الموارد"
                  />
                </label>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="المادة">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSubject(s);
                        setVisible(24);
                      }}
                      className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${subject === s ? "bg-brand-700 text-white shadow-md shadow-brand-700/25" : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="المستوى">
                {["الكل", ...RESOURCE_LEVELS].map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => {
                      setLevel(lv);
                      setVisible(24);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${level === lv ? "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-md shadow-brand-700/25" : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"}`}
                  >
                    {lv}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="نوع المورد">
                <button
                  type="button"
                  onClick={() => {
                    setType("all");
                    setVisible(24);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-extrabold transition-all ${type === "all" ? "bg-gold-400 text-ink-900" : "bg-paper text-ink-500 hover:bg-gold-100 hover:text-gold-700"}`}
                >
                  كل الأنواع
                </button>
                {RESOURCE_TYPES.filter((t) => countByType(t.id) > 0).map((t) => {
                  const Icon = TYPE_ICONS[t.id];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setType(t.id);
                        setVisible(24);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold transition-all ${type === t.id ? "bg-gold-400 text-ink-900" : "bg-paper text-ink-500 hover:bg-gold-100 hover:text-gold-700"}`}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {t.plural}
                      <span className={`rounded-full px-1.5 text-[10px] ${type === t.id ? "bg-ink-900/10" : "bg-white"}`}>{countByType(t.id)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-900/6 pt-3 text-xs">
                <span className="font-bold text-ink-500">
                  {filtered.length === 0 ? "لا نتائج" : `${filtered.length} ${filtered.length === 1 ? "مورد" : "موردًا"}`}
                  {hasFilters ? " مطابق للفلاتر" : " في المكتبة"}
                </span>
                {hasFilters && (
                  <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 font-extrabold text-brand-700 hover:text-brand-800">
                    <X className="size-3.5" aria-hidden="true" />
                    إعادة ضبط الفلاتر
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {shown.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((r, i) => {
                const Icon = TYPE_ICONS[r.type];
                const meta = RESOURCE_TYPES.find((t) => t.id === r.type)!;
                const external = r.action.kind === "url";
                const isFile = r.action.kind === "file";
                return (
                  <Reveal key={r.id} delay={(i % 3) * 60} y={14}>
                    <article className="group flex h-full flex-col rounded-2xl border border-ink-900/6 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(12,124,91,0.3)]">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <div className="flex flex-wrap justify-end gap-1">
                          <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-700">{meta.label}</span>
                          {r.year && <span className="rounded-full bg-paper px-2.5 py-0.5 text-[10px] font-extrabold text-ink-500">{r.year}</span>}
                        </div>
                      </div>
                      <h3 className="mt-3.5 line-clamp-2 font-display text-[15px] font-extrabold leading-snug text-ink-900" title={r.title}>
                        {r.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] leading-relaxed text-ink-500">{r.desc}</p>
                      <p className="mt-3 text-[10px] font-bold text-ink-400">
                        {r.level} · {r.subject}
                      </p>
                      <button
                        type="button"
                        onClick={() => openItem(r)}
                        className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all hover:-translate-y-0.5 ${
                          external
                            ? "border border-brand-200 bg-white text-brand-700 hover:border-brand-400"
                            : "btn-shine bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-md shadow-brand-700/20"
                        }`}
                      >
                        {external ? <ExternalLink className="size-3.5" aria-hidden="true" /> : isFile ? <Download className="size-3.5" aria-hidden="true" /> : null}
                        {actionLabel(r)}
                        {!external && !isFile && <span aria-hidden="true">←</span>}
                      </button>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-3xl border border-dashed border-brand-300 bg-white p-8 text-center text-sm font-semibold text-ink-500">
              لا توجد موارد مطابقة — جرّب كلمة أخرى أو وسّع الفلاتر.
            </p>
          )}

          {filtered.length > visible && (
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setVisible((v) => v + 24)} className="rounded-xl border border-brand-200 bg-white px-6 py-3 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400">
                عرض المزيد ({filtered.length - visible} متبقية)
              </button>
            </div>
          )}
        </div>

        {/* مكتبة PDF حسب المستوى */}
        <Reveal delay={150}>
          <div id="pdf-library" className="mt-16 scroll-mt-28">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                <Printer className="size-3.5" aria-hidden="true" />
                مكتبة PDF — دروس قابلة للتحميل والطباعة
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">حمّل أو اطبع أي درس بصيغة PDF</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
                اختر المستوى، ثم افتح الدرس واضغط زر «طباعة / تحميل PDF» في أعلاه — تُحفظ نسخته كاملة بنسق منظم للطابعة.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv.id}
                  type="button"
                  onClick={() => setPdfLevelId(lv.id)}
                  className={`rounded-xl px-4.5 py-2.5 text-xs font-extrabold transition-all sm:text-sm ${
                    pdfLevelId === lv.id ? "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/25" : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"
                  }`}
                >
                  {lv.label} <span className={`ms-1 rounded-full px-1.5 text-[10px] ${pdfLevelId === lv.id ? "bg-white/20" : "bg-brand-50 text-brand-700"}`}>{pdfByLevelCount(lv.id)}</span>
                </button>
              ))}
            </div>

            {pdfLevelLessons.length > 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {pdfLevelLessons.map((l) => (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/6 bg-white px-5 py-4 transition-colors hover:border-brand-200">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-extrabold text-ink-900" title={l.title}>
                        {l.title}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-ink-500">
                        {l.desc} · {l.subject}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openItem(l)}
                      className="btn-shine inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-2 text-[11px] font-extrabold text-white shadow-md shadow-brand-700/20 transition-all hover:-translate-y-0.5"
                    >
                      <Printer className="size-3.5" aria-hidden="true" />
                      فتح وطباعة ←
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-3xl border border-dashed border-brand-300 bg-white p-8 text-center text-sm font-semibold text-ink-500">
                دروس هذا المستوى قيد الإعداد — ستُضاف تباعا خلال الموسم الدراسي (جرب مستوى آخر).
              </p>
            )}
          </div>
        </Reveal>

        {/* مواقع مفيدة للاجتماعيات */}
        <Reveal delay={200}>
          <div className="mt-16">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                <Link2 className="size-3.5" aria-hidden="true" />
                مواقع مفيدة للاجتماعيات
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">مواقع شريكة للتعلم والتدريب</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">منصات مغربية موثوقة تكمّل محتوى المنصة: دروس، فروض، PDF، تمارين واختبارات تفاعلية.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USEFUL_SITES.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl border border-ink-900/6 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(12,124,91,0.3)]"
                >
                  <span className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                      <FolderOpen className="size-5" aria-hidden="true" />
                    </span>
                    <ExternalLink className="size-4 text-ink-300 transition-colors group-hover:text-brand-600" aria-hidden="true" />
                  </span>
                  <span className="mt-4 block font-display text-[15px] font-extrabold text-ink-900">{s.name}</span>
                  <span className="mt-1.5 block flex-1 text-[12px] leading-relaxed text-ink-500">{s.desc}</span>
                  <span className="mt-3 text-xs font-extrabold text-brand-700 transition-transform duration-300 group-hover:-translate-x-1">زيارة الموقع ←</span>
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ملاحظة PDF + إضافة ملفات */}
        <Reveal delay={260}>
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-ink-900/6 bg-cream p-6 text-center">
              <p className="flex items-center justify-center gap-2 font-display text-sm font-extrabold text-ink-900">
                <BookOpenCheck className="size-4.5 text-brand-600" aria-hidden="true" />
                كيفية تحميل PDF؟
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
                افتح أي درس من المكتبة، ثم اضغط زر «طباعة / تحميل PDF» في ترويسته. تُعرض نسخة طباعة نظيفة، ويمكن اختيار «حفظ كـ PDF» من نافذة الطباعة. الجداول والمبيانات والخرائط تُطبع أيضًا من زر الطابعة داخل نافذة العرض.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-brand-700">
                <span className="rounded-full bg-brand-50 px-3 py-1.5">1. افتح المورد</span>
                <span aria-hidden="true">←</span>
                <span className="rounded-full bg-brand-50 px-3 py-1.5">2. زر الطباعة</span>
                <span aria-hidden="true">←</span>
                <span className="rounded-full bg-brand-50 px-3 py-1.5">3. حفظ كـ PDF</span>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-3xl border border-gold-300/60 bg-gold-50 p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold-400/25 text-gold-600">
                <UploadCloud className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-sm font-extrabold text-gold-700 sm:text-base">المكتبة مفتوحة لإضافة ملفات الأستاذ</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                  العروض والصور والفروض المحروسة الخاصة بالقسم تُضاف تباعًا خلال الموسم؛ بمجرد إضافة أي ملف يظهر هنا مصنفًا حسب نوعه ومستواه ومادته مع زر تحميل مباشر.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {openDoc && <DataDocView item={openDoc} onClose={() => setOpenDoc(null)} go={go} />}
    </section>
  );
}
