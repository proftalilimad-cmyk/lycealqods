import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpenCheck, FileText, FlaskConical, FolderOpen, LayoutGrid, MonitorPlay, NotebookPen, Search, Target, X } from "lucide-react";
import { normalizeArabic } from "../lib/arabic";
import { METHODOLOGIES } from "../data/methodologies";
import { APPLICATIONS } from "../data/applications";
import { LEVELS } from "../data/curriculum";
import { QUESTIONS } from "../data/questions";
import { LESSON_CONTENT } from "../data/lessonContent";
import { TEST_BANKS } from "../data/testBanks";
import { RESOURCES, typeMeta } from "../data/resources";
import { DECKS } from "../data/decks";
import { JADADA_STATUS_META, SECTION_META, TC_SCI_CATALOG, catalogText } from "../data/jadadat";
import type { Route } from "../routes";

interface SearchResult {
  id: string;
  group: "منهجيات" | "تطبيقات" | "دروس ومحاور" | "جذاذات" | "عروض تفاعلية" | "أسئلة التقويم" | "موارد" | "صفحات";
  title: string;
  hint: string;
  action: Route;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  go: (r: Route) => void;
}

const STATIC_PAGES: SearchResult[] = [
  { id: "p-test", group: "صفحات", title: "التقويم التشخيصي في الاجتماعيات — الجذع المشترك", hint: "20 سؤالًا · 60 دقيقة · /20", action: { view: "test" } },
  { id: "p-about", group: "صفحات", title: "نبذة عن الأستاذ عماد طليل", hint: "أستاذ الاجتماعيات — ثانوية القدس القنيطرة", action: { view: "about" } },
  { id: "p-dash", group: "صفحات", title: "لوحة الأستاذ (دخول محمي)", hint: "نتائج التقويم التشخيصي — باسم مستعمل وكلمة مرور", action: { view: "dashboard", tab: "results" } },
  { id: "p-dash-jadadat", group: "صفحات", title: "تتبّع إنجاز الجذاذات", hint: "25 جذاذة · الحالة والتاريخ والقسم — داخل لوحة الأستاذ", action: { view: "dashboard", tab: "jadadat" } },
  { id: "p-dash-sec", group: "صفحات", title: "الدخول والأمان — لوحة الأستاذ", hint: "تغيير اسم المستعمل وكلمة المرور", action: { view: "dashboard", tab: "security" } },
  { id: "p-res", group: "صفحات", title: "الموارد التعليمية", hint: "ملفات وخرائط وجداول ومبيانات", action: { view: "resources" } },
  { id: "p-decks", group: "صفحات", title: "العروض التفاعلية — الأولى باكالوريا علوم", hint: "دروس من الكتاب المدرسي مع الاشتغال على الوثائق", action: { view: "decks" } },
];

const SUGGESTIONS = ["الثورة الصناعية", "تحليل الخريطة", "الفلاحة البورية", "المسيرة الخضراء", "قراءة المبيان", "كتابة فقرة", "الهجرة القروية"];

const GROUP_ICONS = {
  منهجيات: FileText,
  تطبيقات: FlaskConical,
  "دروس ومحاور": BookOpenCheck,
  جذاذات: NotebookPen,
  "عروض تفاعلية": MonitorPlay,
  "أسئلة التقويم": Target,
  موارد: FolderOpen,
  صفحات: LayoutGrid,
} as const;

export default function SearchOverlay({ open, onClose, go }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    const qNorm = normalizeArabic(query);
    if (qNorm.length < 2) return [];
    const out: SearchResult[] = [];

    for (const m of METHODOLOGIES) {
      const hay = normalizeArabic(`${m.title} ${m.intro} ${m.steps.map((s) => s.title).join(" ")}`);
      if (hay.includes(qNorm)) {
        out.push({ id: `m-${m.id}`, group: "منهجيات", title: m.title, hint: `${m.steps.length} خطوات — اضغط للقراءة`, action: { view: "methods", id: m.id } });
      }
    }

    for (const a of APPLICATIONS) {
      const hay = normalizeArabic(`${a.title} ${a.skillTag} ${a.level} ${a.subject} ${a.docs.map((d) => d.text).join(" ")} ${a.questions.map((q) => q.q).join(" ")}`);
      if (hay.includes(qNorm)) {
        out.push({ id: `a-${a.id}`, group: "تطبيقات", title: a.title, hint: `${a.level} · ${a.subject} · /${a.points}`, action: { view: "apps", id: a.id } });
      }
    }

    for (const lv of LEVELS) {
      for (const br of lv.branches) {
        for (const [subj, unitArr] of Object.entries(br.units)) {
          unitArr.forEach((u, i) => {
            const realLessons = u.lessons.filter((ls) => !ls.soon);
            const matchedUnit = normalizeArabic(`${lv.label} ${br.label} ${u.title}`).includes(qNorm);
            if (matchedUnit) {
              out.push({
                id: `c-${lv.id}-${br.id}-${subj}-${i}`,
                group: "دروس ومحاور",
                title: u.title,
                hint: `${br.label} · ${subj === "history" ? "التاريخ" : subj === "geography" ? "الجغرافيا" : "المواطنة"}`,
                action: { view: "lessons", level: lv.id },
              });
            }
            realLessons.forEach((ls, li) => {
              if (normalizeArabic(ls.title).includes(qNorm)) {
                out.push({
                  id: `l-${lv.id}-${br.id}-${subj}-${i}-${li}`,
                  group: "دروس ومحاور",
                  title: ls.title,
                  hint: `${lv.label} · ${br.label} · ${u.title}`,
                  action: { view: "lessons", level: lv.id },
                });
              }
            });
          });
        }
      }
    }

    /* العروض التفاعلية المبنية على الكتاب المدرسي */
    /* الجذاذات: اللائحة الرسمية للجذع المشترك العلمي (تاريخ + جغرافيا) */
    for (const e of TC_SCI_CATALOG) {
      // البحث يشمل نص الوثيقة الأصلية كاملًا (المراحل، التدبير، الدعامات، المنتوج…)
      const hay = normalizeArabic(
        [
          `جذاذة ${e.slot.number} ${e.slot.title}`,
          `${e.slot.subject} ${e.slot.cycle} ${e.slot.unitTitle} ${SECTION_META.title} ${SECTION_META.level}`,
          SECTION_META.authorLabel,
          e.imported ? `المنتوج ${e.imported.source}` : "",
          e.sourceFile ?? "",
          catalogText(e),
        ].join(" "),
      );
      if (hay.includes(qNorm)) {
        out.push({
          id: `j-${e.slot.id}`,
          group: "جذاذات",
          title: e.slot.title,
          hint: `الجذاذة ${e.slot.number} · ${e.slot.subject} · ${e.slot.cycle} — ${JADADA_STATUS_META[e.status].short}`,
          action: { view: "jadadat", level: "tc", open: e.slot.id },
        });
      }
    }

    for (const d of DECKS) {
      const hay = normalizeArabic(`${d.title} ${d.module} ${d.problem} ${d.concepts.join(" ")} ${d.slides.map((s) => s.title).join(" ")} عرض تفاعلي`);
      if (hay.includes(qNorm)) {
        out.push({
          id: `d-${d.id}`,
          group: "عروض تفاعلية",
          title: d.title,
          hint: `${d.subject} · الكتاب ص ${d.pages[0]}–${d.pages[1]} · ${d.slides.length} شرائح`,
          action: { view: "decks", id: d.id },
        });
      }
    }

    /* موارد المكتبة (جداول، مبيانات، خرائط، امتحانات وطنية، ملفات الأستاذ) — دروس PDF والتطبيقات والتقويمات مغطاة في مجموعاتها */
    for (const r of RESOURCES) {
      if (r.type === "pdf" || r.type === "exercise" || r.type === "exam") continue;
      const hay = normalizeArabic(`${r.title} ${r.desc} ${(r.tags ?? []).join(" ")} ${r.year ?? ""} ${typeMeta(r.type).plural}`);
      if (hay.includes(qNorm)) {
        out.push({
          id: `r-${r.id}`,
          group: "موارد",
          title: r.title,
          hint: `${typeMeta(r.type).label} · ${r.level} · ${r.subject}`,
          action: r.action.kind === "data" ? { view: "resources", open: r.id } : { view: "resources", type: r.type },
        });
      }
    }

    for (const bank of TEST_BANKS) {
      if (normalizeArabic(`${bank.branch} ${bank.level} ${bank.desc} ${bank.focus.join(" ")} تقويم تشخيصي`).includes(qNorm)) {
        out.push({
          id: `bank-${bank.id}`,
          group: "أسئلة التقويم",
          title: `تقويم تشخيصي — ${bank.branch}`,
          hint: `${bank.level} · 20 سؤالًا · 60 دقيقة · /20`,
          action: { view: "test", bank: bank.id },
        });
      }
    }

    for (const [lessonId, content] of Object.entries(LESSON_CONTENT)) {
      const sectionsText = content.sections
        .map(
          (s) =>
            `${s.title} ` +
            s.blocks
              .map((b) =>
                b.type === "p" || b.type === "callout"
                  ? b.text
                  : b.type === "ul"
                    ? `${b.title ?? ""} ${b.items.join(" ")}`
                    : `${b.head.join(" ")} ${b.rows.flat().join(" ")}`
              )
              .join(" ")
        )
        .join(" ");
      const hay = normalizeArabic(
        `${content.title} ${content.intro} ${content.objectives.join(" ")} ${sectionsText} ${content.glossary
          .map((g) => `${g.term} ${g.def}`)
          .join(" ")} ${content.timeline.map((t) => `${t.date} ${t.event}`).join(" ")}`
      );
      if (hay.includes(qNorm)) {
        out.push({
          id: `lc-${lessonId}`,
          group: "دروس ومحاور",
          title: content.title,
          hint: "درس كامل بالمحتوى: أهداف ومحاور ومفاهيم واختبار تفاعلي",
          action: { view: "lesson", id: lessonId },
        });
      }
    }

    QUESTIONS.forEach((q) => {
      const hay = normalizeArabic(`${q.title} ${q.skill} ${q.explanation ?? ""}`);
      if (hay.includes(qNorm)) {
        out.push({
          id: `q-${q.id}`,
          group: "أسئلة التقويم",
          title: q.title,
          hint: `سؤال ${q.id} من التقويم التشخيصي · ${q.skill}`,
          action: { view: "test" },
        });
      }
    });

    STATIC_PAGES.forEach((p) => {
      if (normalizeArabic(`${p.title} ${p.hint}`).includes(qNorm)) out.push(p);
    });

    return out.slice(0, 20);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return [...map.entries()];
  }, [results]);

  if (!open) return null;

  const pick = (r: SearchResult) => {
    go(r.action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="البحث في المنصة">
      <button type="button" aria-label="إغلاق البحث" onClick={onClose} className="animate-fade-in absolute inset-0 bg-brand-950/55 backdrop-blur-sm" />
      <div className="animate-modal-in absolute inset-x-0 top-4 sm:top-10 mx-auto w-[calc(100%-2rem)] max-w-2xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-950/40">
          {/* حقل البحث */}
          <div className="flex items-center gap-3 border-b border-ink-900/8 px-5 py-4">
            <Search className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن درس، مفهوم، تطبيق، تمرين أو منهجية..."
              aria-label="حقل البحث"
              className="w-full bg-transparent text-sm font-semibold text-ink-900 placeholder:text-ink-300 focus:outline-none sm:text-base"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper-warm text-ink-500 transition-colors hover:text-ink-900"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-3">
            {query.trim().length < 2 && (
              <div className="p-4">
                <p className="text-xs font-extrabold text-ink-500">اقتراحات سريعة:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuery(s)}
                      className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim().length >= 2 && results.length === 0 && (
              <div className="p-8 text-center">
                <Search className="mx-auto size-8 text-ink-300" aria-hidden="true" />
                <p className="mt-3 font-display text-sm font-extrabold text-ink-900">لا توجد نتائج مطابقة لـ«{query}»</p>
                <p className="mt-1.5 text-xs text-ink-500">جرّب كلمات أخرى مثل: الثورة الصناعية، المبيان، المسيرة الخضراء...</p>
              </div>
            )}

            {grouped.map(([group, items]) => {
              const Icon = GROUP_ICONS[group as keyof typeof GROUP_ICONS] ?? FileText;
              return (
                <div key={group} className="mb-2">
                  <p className="flex items-center gap-2 px-3 py-2 text-[11px] font-extrabold text-ink-500">
                    <Icon className="size-3.5 text-brand-600" aria-hidden="true" />
                    {group} <span className="text-ink-300">({items.length})</span>
                  </p>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => pick(r)}
                      className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition-colors hover:bg-brand-50"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-extrabold text-ink-900">{r.title}</span>
                        <span className="mt-0.5 block text-[11px] text-ink-500">{r.hint}</span>
                      </span>
                      <ArrowLeft className="size-4 shrink-0 text-ink-300 transition-all group-hover:-translate-x-1 group-hover:text-brand-600" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
