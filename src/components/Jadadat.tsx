import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Globe2,
  History,
  Printer,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { normalizeArabic } from "../lib/arabic";
import {
  getJadada,
  getJadadatCatalog,
  getJadadatStats,
  jadadaBodyHtml,
  jadadaCss,
  jadadaFileName,
  jadadaPrintHtml,
  jadadaToHtml,
  type JadadaEntry,
  type JadadaFiche,
} from "../lib/jadadatLessons";
import { downloadText, printDocument } from "../lib/reportExport";
import type { Route } from "../routes";
import CopyLinkButton from "./CopyLinkButton";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";

interface JadadatProps {
  go: (route: Route) => void;
  detailId?: string;
  initialLevel?: string;
}

const SUBJECT_ICONS: Record<string, typeof History> = {
  history: History,
  geography: Globe2,
};

const ALL = "all";

function printFiche(fiche: JadadaFiche): void {
  /* نسخة الطباعة مختصرة ومهيأة لتبقى في صفحتين أو ثلاث كحد أقصى. */
  void printDocument(jadadaPrintHtml(fiche), jadadaFileName(fiche, "pdf").replace(/\.pdf$/, ""));
}

function downloadFiche(fiche: JadadaFiche): void {
  downloadText(jadadaToHtml(fiche), jadadaFileName(fiche, "html"), "text/html;charset=utf-8");
}

function FicheActions({ fiche, go, compact = false, onOpen }: { fiche: JadadaFiche; go: (route: Route) => void; compact?: boolean; onOpen?: () => void }) {
  const base = compact
    ? "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-all"
    : "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-5"}`}>
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          go({ view: "jadadat", id: fiche.key });
        }}
        className={`${base} bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/20 hover:-translate-y-0.5`}
      >
        <FileText className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
        فتح الجذاذة
      </button>
      <button
        type="button"
        onClick={() => printFiche(fiche)}
        className={`${base} border border-gold-300 bg-gold-50 text-gold-700 hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-100`}
      >
        <Printer className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
        طباعة / PDF (2–3 صفحات)
      </button>
      {!compact && (
        <button
          type="button"
          onClick={() => downloadFiche(fiche)}
          className={`${base} border border-brand-200 bg-white text-brand-700 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md`}
        >
          <Download className="size-4" aria-hidden="true" />
          تحميل HTML
        </button>
      )}
      <button
        type="button"
        onClick={() => go({ view: "lesson", id: fiche.key })}
        className={`${base} border border-ink-900/10 bg-white text-ink-700 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700`}
      >
        <BookOpen className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
        درس الموقع
      </button>
    </div>
  );
}

function CatalogCard({ entry, go, onOpen }: { entry: JadadaEntry; go: (route: Route) => void; onOpen: (key: string) => void }) {
  const fiche = useMemo(() => getJadada(entry.key), [entry.key]);
  if (!fiche) return null;
  const Icon = SUBJECT_ICONS[entry.subjectId] ?? BookOpen;

  return (
    <article className="group flex flex-col rounded-2xl border border-ink-900/7 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_18px_45px_-25px_rgba(12,124,91,0.42)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-sm font-black text-gold-300 shadow-md shadow-brand-800/15">
          {entry.lessonNumber}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">
              <Icon className="size-3" aria-hidden="true" />
              {entry.subjectLabel}
            </span>
            {entry.sharedWithKey && (
              <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[10px] font-bold text-gold-700">محتوى مشترك</span>
            )}
          </div>
          <h3 className="mt-2 font-display text-sm font-extrabold leading-relaxed text-ink-900">{entry.title}</h3>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold text-ink-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-2.5 py-1">
          <Clock3 className="size-3" aria-hidden="true" />
          {entry.duration}
        </span>
        <span className="rounded-full bg-paper-warm px-2.5 py-1">{entry.sectionsCount} محاور</span>
        {entry.hasDocs && <span className="rounded-full bg-gold-50 px-2.5 py-1 text-gold-700">وثائق وأسئلة</span>}
        {entry.hasSchema && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">خطاطة</span>}
        {entry.hasApplication && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">تطبيق</span>}
      </div>

      <FicheActions fiche={fiche} go={go} onOpen={() => onOpen(entry.key)} compact />
    </article>
  );
}

function FilterSelect({ label, value, onChange, children, disabled = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-start sm:min-w-[170px]">
      <span className="text-[11px] font-extrabold text-ink-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-xs font-bold text-ink-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-paper-warm"
      >
        {children}
      </select>
    </label>
  );
}

function JadadatCatalog({ go, initialLevel, onOpen }: { go: (route: Route) => void; initialLevel?: string; onOpen: (key: string) => void }) {
  const catalog = useMemo(() => getJadadatCatalog(), []);
  const stats = useMemo(() => getJadadatStats(), []);
  const [levelId, setLevelId] = useState(initialLevel && stats.levels.some((l) => l.id === initialLevel) ? initialLevel : ALL);
  const [branchId, setBranchId] = useState(ALL);
  const [subjectId, setSubjectId] = useState(ALL);
  const [query, setQuery] = useState("");

  const availableBranches = useMemo(
    () => stats.branches.filter((branch) => levelId === ALL || branch.levelId === levelId),
    [levelId, stats.branches],
  );

  const filtered = useMemo(() => {
    const q = normalizeArabic(query);
    return catalog.filter((entry) => {
      if (levelId !== ALL && entry.levelId !== levelId) return false;
      if (branchId !== ALL && entry.branchId !== branchId) return false;
      if (subjectId !== ALL && entry.subjectId !== subjectId) return false;
      if (q) {
        const hay = normalizeArabic(`${entry.title} ${entry.branchLabel} ${entry.levelLabel} ${entry.subjectLabel} ${entry.unitTitle} ${entry.program}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [branchId, catalog, levelId, query, subjectId]);

  const groups = useMemo(() => {
    const map = new Map<string, { entry: JadadaEntry; levelLabel: string; branchLabel: string; subjectLabel: string; unitTitle: string; unitIndex: number }[]>();
    for (const entry of filtered) {
      const key = `${entry.levelId}|${entry.branchId}|${entry.subjectId}|${entry.unitIndex}`;
      const group = map.get(key) ?? [];
      group.push({ entry, levelLabel: entry.levelLabel, branchLabel: entry.branchLabel, subjectLabel: entry.subjectLabel, unitTitle: entry.unitTitle, unitIndex: entry.unitIndex });
      map.set(key, group);
    }
    return Array.from(map.values());
  }, [filtered]);

  const setLevel = (value: string) => {
    setLevelId(value);
    setBranchId(ALL);
  };

  return (
    <>
      <Reveal delay={100}>
        <div className="mt-10 rounded-3xl border border-ink-900/7 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(4,36,26,0.28)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <SlidersHorizontal className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-sm font-extrabold text-ink-900">اختر مستوى الدرس ومسلكه</p>
                <p className="text-[11px] text-ink-500">تُبنى الجذاذة من الدرس نفسه، ولا تُعرض إلا الدروس المنشورة في قسم الدروس.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-extrabold text-brand-700">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {filtered.length} من {stats.total} جذاذة
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <FilterSelect label="المستوى" value={levelId} onChange={setLevel}>
              <option value={ALL}>كل المستويات</option>
              {stats.levels.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
            </FilterSelect>
            <FilterSelect label="المسلك" value={branchId} onChange={setBranchId} disabled={!availableBranches.length}>
              <option value={ALL}>كل المسالك</option>
              {availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.label}</option>)}
            </FilterSelect>
            <FilterSelect label="المادة" value={subjectId} onChange={setSubjectId}>
              <option value={ALL}>التاريخ والجغرافيا</option>
              {stats.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}
            </FilterSelect>
            <label className="flex min-w-0 flex-[1.5] flex-col gap-1.5 text-start sm:min-w-[220px]">
              <span className="text-[11px] font-extrabold text-ink-500">بحث في عناوين الجذاذات</span>
              <span className="relative">
                <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="مثال: الثورة الصناعية…"
                  className="h-11 w-full rounded-xl border border-ink-900/10 bg-white pe-10 ps-3 text-xs font-semibold text-ink-800 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />
              </span>
            </label>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 space-y-8">
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-brand-300 bg-brand-50/60 p-10 text-center">
            <BookOpenCheck className="mx-auto size-10 text-brand-500" aria-hidden="true" />
            <p className="mt-4 font-display text-lg font-extrabold text-ink-900">لا توجد جذاذة بهذا الاختيار</p>
            <p className="mt-2 text-sm text-ink-500">جرّب تغيير المستوى أو المسلك أو كلمة البحث.</p>
          </div>
        ) : (
          groups.map((group, index) => {
            const first = group[0];
            const Icon = SUBJECT_ICONS[first.entry.subjectId] ?? BookOpen;
            return (
              <Reveal key={`${first.entry.levelId}-${first.entry.branchId}-${first.entry.subjectId}-${first.entry.unitIndex}`} delay={Math.min(index * 35, 300)}>
                <section className="overflow-hidden rounded-3xl border border-ink-900/7 bg-white shadow-[0_16px_45px_-30px_rgba(4,36,26,0.3)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/7 bg-gradient-to-l from-brand-50 via-white to-gold-50/50 px-5 py-4 sm:px-6">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-gold-300">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-brand-700">{first.levelLabel} · {first.branchLabel} · {first.subjectLabel}</p>
                        <h2 className="mt-1 font-display text-base font-extrabold leading-relaxed text-ink-900">الوحدة {first.unitIndex + 1}: {first.unitTitle}</h2>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-ink-500 ring-1 ring-ink-900/8">
                      <BookOpen className="size-3" aria-hidden="true" />
                      {group.length} {group.length === 1 ? "جذاذة" : "جذاذات"}
                    </span>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                    {group.map(({ entry }) => <CatalogCard key={entry.key} entry={entry} go={go} onOpen={onOpen} />)}
                  </div>
                </section>
              </Reveal>
            );
          })
        )}
      </div>
    </>
  );
}

function JadadaDetail({ fiche, go, onBack }: { fiche: JadadaFiche; go: (route: Route) => void; onBack: () => void }) {
  return (
    <section className="pt-32 pb-20 md:pt-36">
      <style dangerouslySetInnerHTML={{ __html: jadadaCss(".jadada-screen") }} />
      <div className="mx-auto max-w-[1080px] px-5 sm:px-8">
        <Reveal>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-700 transition-colors hover:text-brand-900"
            >
              <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
              العودة إلى فهرس الجذاذات
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => printFiche(fiche)}
                className="inline-flex items-center gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-2.5 text-xs font-extrabold text-gold-700 transition-all hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-100"
              >
                <Printer className="size-4" aria-hidden="true" />
                طباعة / حفظ PDF (2–3 صفحات)
              </button>
              <button
                type="button"
                onClick={() => downloadFiche(fiche)}
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md"
              >
                <FileDown className="size-4" aria-hidden="true" />
                تحميل HTML
              </button>
              <CopyLinkButton route={{ view: "jadadat", id: fiche.key }} label="نسخ رابط الجذاذة" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="jadada-screen overflow-hidden rounded-[2rem] bg-paper shadow-[0_25px_80px_-35px_rgba(4,36,26,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-5 py-3 text-xs font-semibold text-brand-800 sm:px-8">
              <span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-gold-500" aria-hidden="true" />جذاذة مبنية على درس الموقع نفسه</span>
              <button type="button" onClick={() => go({ view: "lesson", id: fiche.key })} className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900">
                <ExternalLink className="size-3.5" aria-hidden="true" /> فتح الدرس الأصلي
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: jadadaBodyHtml(fiche) }} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Jadadat({ go, detailId, initialLevel }: JadadatProps) {
  const [localDetailId, setLocalDetailId] = useState<string>();
  const activeDetailId = detailId ?? localDetailId;
  const fiche = activeDetailId ? getJadada(activeDetailId) : null;
  const stats = useMemo(() => getJadadatStats(), []);

  if (activeDetailId && fiche) {
    return (
      <JadadaDetail
        fiche={fiche}
        go={go}
        onBack={() => {
          setLocalDetailId(undefined);
          go({ view: "jadadat", level: fiche.levelId });
        }}
      />
    );
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand-50/70 to-transparent" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="قسم الجذاذات"
          title="جذاذات الاجتماعيات"
          highlight="مبنية على الدروس"
          description="جذاذات تربوية منظمة لكل درس منشور في قسم الدروس: المضمون من درس الموقع، والغلاف الديداكتيكي بألوان فضاء الاجتماعيات، مع مراحل الحصة وأنشطة الأستاذ والمتعلم والتقويم والدعم."
        />

        <Reveal delay={80}>
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-gold-300/70 bg-gold-50/70 px-5 py-4 text-center text-xs font-semibold leading-loose text-gold-800 sm:text-sm">
            <span className="font-extrabold">إعداد وإنجاز: الأستاذ عماد طليل</span> · ثانوية القدس، القنيطرة — ليست الجذاذة ملخصًا للدرس، بل تخطيطًا لأجرأة التعلمات، ومضامينها مرتبطة بالدرس المدرج في المنصة.
          </div>
        </Reveal>

        <Reveal delay={125}>
          <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-5 py-4 text-center sm:flex-row sm:text-start">
            <div>
              <p className="font-display text-sm font-extrabold text-brand-800">أرشيف الجذاذات بصيغة PDF</p>
              <p className="mt-1 text-[11px] font-semibold text-brand-700">161 جذاذة حقيقية · ملفات مرتبة حسب المستوى والمسلك والمادة · ثلاث صفحات كحد أقصى لكل جذاذة</p>
            </div>
            <a
              href="/exports/jadadat-pdf.zip"
              download="الجذاذات_الاجتماعيات_PDF.zip"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-brand-700/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Download className="size-4" aria-hidden="true" />
              تحميل الجذاذات PDF (ZIP)
            </a>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { value: stats.total, label: "جذاذة مبنية على درس منشور", icon: FileText },
              { value: stats.levels.length, label: "مستويات دراسية", icon: BookOpenCheck },
              { value: stats.units, label: "وحدة ومجزوءة", icon: Sparkles },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-ink-900/7 bg-white p-4 shadow-[0_15px_35px_-28px_rgba(4,36,26,0.35)]">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-5" aria-hidden="true" /></span>
                <div><p className="font-display text-xl font-black text-ink-900">{value}</p><p className="text-[11px] font-semibold text-ink-500">{label}</p></div>
              </div>
            ))}
          </div>
        </Reveal>

        <JadadatCatalog
          go={go}
          initialLevel={initialLevel}
          onOpen={(key) => setLocalDetailId(key)}
        />
      </div>
    </section>
  );
}
