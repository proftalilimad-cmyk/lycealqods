import { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe2,
  Image,
  Landmark,
  Link2,
  Presentation,
  Printer,
  Table2,
  Target,
  UploadCloud,
} from "lucide-react";
import { LEVELS } from "../data/curriculum";
import { getLessonContent, hasLessonContent, lessonKey } from "../data/lessonContent";
import { APPLICATIONS } from "../data/applications";
import { TEST_BANKS } from "../data/testBanks";
import Reveal from "./Reveal";
import type { Route } from "../routes";

const USEFUL_SITES = [
  { name: "AlloSchool — الاجتماعيات", url: "https://www.alloschool.com", desc: "ممتاز للدروس والوثائق والتمارين والفروض، وله أقسام خاصة بالجذع المشترك والأولى بكالوريا." },
  { name: "Moutamadris — متمدرس", url: "https://www.moutamadris.ma", desc: "يحتوي على دروس وتمارين وفروض وامتحانات لمختلف المستويات المغربية." },
  { name: "Revisio.ma", url: "https://www.revisio.ma", desc: "مفيد جدا للملخصات والتمارين والاختبارات التفاعلية وملفات PDF، مع قسم خاص بالتاريخ والجغرافيا." },
  { name: "LMadrassa — المدرسة المغربية", url: "https://www.lmadrassa.ma", desc: "يضم دروسا وتمارين وفروضا في الاجتماعيات لمستويات الثانوي التأهيلي." },
  { name: "Bestcours.ma", url: "https://www.bestcours.ma", desc: "مفيد خصوصا للفروض والتطبيقات والوثائق والامتحانات في التاريخ والجغرافيا." },
  { name: "Tasribat.ma", url: "https://www.tasribat.ma", desc: "يقدم ملخصات ودروسا وتمارين وفروضا بصيغة PDF، بما فيها موارد الاجتماعيات للجذع المشترك." },
];

interface PrintableLesson {
  key: string;
  title: string;
  level: string;
  branch: string;
  subject: string;
  unit: string;
}

interface ResourcesProps {
  go: (r: Route) => void;
}

export default function Resources({ go }: ResourcesProps) {
  const [levelId, setLevelId] = useState("tc");

  /* مكتبة الدروس القابلة للطباعة (محتوى كامل متاح على المنصة) */
  const library = useMemo<PrintableLesson[]>(() => {
    const out: PrintableLesson[] = [];
    for (const lv of LEVELS) {
      for (const br of lv.branches) {
        for (const subj of br.subjects) {
          const units = br.units[subj.id] ?? [];
          units.forEach((unit, ui) => {
            unit.lessons.forEach((lesson, li) => {
              if (lesson.soon || !lesson.title) return;
              const key = lessonKey(br.id, subj.id, ui, li);
              if (!hasLessonContent(key)) return;
              out.push({
                key,
                title: getLessonContent(key)?.title ?? lesson.title,
                level: lv.label,
                branch: br.label,
                subject: subj.label,
                unit: unit.title,
              });
            });
          });
        }
      }
    }
    return out;
  }, []);

  const levelLessons = library.filter((l) => l.level === (LEVELS.find((lv) => lv.id === levelId)?.label ?? "__"));
  const byLevelCount = (id: string) => library.filter((l) => l.level === (LEVELS.find((lv) => lv.id === id)?.label ?? "__")).length;

  const CATEGORIES = [
    {
      icon: FileText, label: "دروس وملخصات PDF", desc: "دروس وملخصات قابلة للتحميل بصيغة PDF عبر زر الطباعة داخل كل درس",
      value: `${library.length}`, unit: "درسًا متاحًا", route: null, action: "library", ready: true,
    },
    { icon: ClipboardList, label: "تمارين", desc: "سلاسل تمارين مصنفة بتصحيحات نموذجية مفصلة",
      value: `${APPLICATIONS.length}`, unit: "تطبيقات مصححة", route: { view: "apps" } as Route, ready: true,
    },
    { icon: Target, label: "نماذج فروض / تقويمات", desc: "تقويمات تفاعلية محروسة بمؤقت وتصحيح آلي وفق المستويات",
      value: `${TEST_BANKS.length}`, unit: "تقويمات حسب المسلك", route: { view: "test" } as Route, ready: true,
    },
    { icon: Globe2, label: "خرائط", desc: "خرائط تاريخية وجغرافية للتدريب — نماذج متاحة داخل التقويم (رسم تخطيطي بوسيلة وشمال ومقياس)",
      value: "قيد الإضافة", route: null, ready: false,
    },
    { icon: Table2, label: "جداول إحصائية", desc: "جداول تدريبية بأرقام ومعطيات — نماذج متوفرة حاليا ضمن التقويم والتطبيقات",
      value: "ضمن الوثائق", route: { view: "apps" } as Route, ready: true, soft: true,
    },
    { icon: BarChart3, label: "مبيانات", desc: "نماذج مبيانات للتحليل مع شبكة قراءة منهجية — متوفرة حاليا ضمن التقويم والتطبيقات",
      value: "ضمن الوثائق", route: { view: "apps" } as Route, ready: true, soft: true,
    },
    { icon: Presentation, label: "عروض PowerPoint", desc: "عروض الدروس المصورة والمصنفة حسب المستوى",
      value: "قيد الإضافة", route: null, ready: false,
    },
    { icon: Image, label: "صور ووثائق بصرية", desc: "صور تاريخية ووثائق مرئية مصنفة",
      value: "قيد الإضافة", route: null, ready: false,
    },
    { icon: Landmark, label: "امتحانات وطنية وجهوية", desc: "مواضيع وطنية مع عناصر الإجابة للثانية باكالوريا",
      value: "قيد الإضافة", route: null, ready: false,
    },
  ];

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
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-3xl border border-gold-300/60 bg-gold-50 p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold-400/25 text-gold-600">
              <UploadCloud className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-gold-700 sm:text-base">بنية جاهزة لإضافة الملفات</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                أُعدت هذه الواجهة لاستقبال الملفات فورا: بمجرد إضافة الأستاذ لأي مورد، سيظهر هنا مصنفا حسب النوع والمستوى مع إمكانية التحميل المباشر. حاليا المحتوى المتاح مربوط بما هو منشوء على المنصة نفسها: دروس PDF قابلة للطباعة، تطبيقات مصححة، وتقويمات تفاعلية.
              </p>
            </div>
          </div>
        </Reveal>

        {/* بطاقات فئات الموارد */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.label} delay={(i % 3) * 80}>
              <article
                className={`group flex h-full flex-col rounded-3xl border border-ink-900/6 bg-white p-6 transition-all duration-500 ${
                  c.ready ? "hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-[0_25px_55px_-22px_rgba(12,124,91,0.3)]" : "opacity-90"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`grid size-12 place-items-center rounded-2xl transition-colors duration-300 ${c.ready ? "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white" : "bg-paper-warm text-ink-400"}`}>
                    <c.icon className="size-5.5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${c.ready ? (c.soft ? "bg-gold-100 text-gold-700" : "bg-brand-50 text-brand-700") : "border border-dashed border-gold-400/70 bg-gold-50 text-gold-700"}`}>
                    {c.value}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-lg font-extrabold text-ink-900">{c.label}</h2>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-500">{c.desc}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink-900/6 pt-4">
                  <span className={`text-[11px] font-semibold ${c.ready ? "text-brand-600" : "text-ink-400"}`}>
                    {c.ready ? (c.unit ?? "متاح الآن") : "سيتوفر قريبًا خلال الموسم الدراسي"}
                  </span>
                  {c.ready && c.route ? (
                    <button type="button" onClick={() => go(c.route!)} className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:bg-brand-100">
                      افتح ←
                    </button>
                  ) : c.action === "library" ? (
                    <a href="#library" className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700">
                      المكتبة ←
                    </a>
                  ) : (
                    <span className="grid size-8 place-items-center rounded-xl bg-paper-warm text-ink-300" aria-hidden="true">
                      <UploadCloud className="size-4" />
                    </span>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* مكتبة PDF */}
        <Reveal delay={150}>
          <div id="library" className="mt-16 scroll-mt-28">
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
                  onClick={() => setLevelId(lv.id)}
                  className={`rounded-xl px-4.5 py-2.5 text-xs font-extrabold transition-all sm:text-sm ${
                    levelId === lv.id
                      ? "bg-gradient-to-l from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/25"
                      : "border border-ink-900/8 bg-white text-ink-500 hover:text-brand-700"
                  }`}
                >
                  {lv.label} <span className={`ms-1 rounded-full px-1.5 text-[10px] ${levelId === lv.id ? "bg-white/20" : "bg-brand-50 text-brand-700"}`}>{byLevelCount(lv.id)}</span>
                </button>
              ))}
            </div>

            {levelLessons.length > 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {levelLessons.map((l) => (
                  <div key={l.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/6 bg-white px-5 py-4 transition-colors hover:border-brand-200">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-extrabold text-ink-900" title={l.title}>{l.title}</p>
                      <p className="mt-1 text-[10px] font-semibold text-ink-500">
                        {l.branch} · {l.subject} · {l.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => go({ view: "lesson", id: l.key })}
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
              <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
                منصات مغربية موثوقة تكمّل محتوى المنصة: دروس، فروض، PDF، تمارين واختبارات تفاعلية.
              </p>
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
                  <span className="mt-3 text-xs font-extrabold text-brand-700 transition-transform duration-300 group-hover:-translate-x-1">
                    زيارة الموقع ←
                  </span>
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ملاحظة التمريين */}
        <Reveal delay={260}>
          <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-ink-900/6 bg-cream p-6 text-center">
            <p className="flex items-center justify-center gap-2 font-display text-sm font-extrabold text-ink-900">
              <BookOpenCheck className="size-4.5 text-brand-600" aria-hidden="true" />
              كيفية تحميل PDF؟
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
              افتح أي درس من المكتبة أعلاه، ثم اضغط زر «طباعة / تحميل PDF» في ترويسته. تُعرض نسخة طباعة نظيفة: العنوان والأهداف والمحاور والوثائق والخطاطة والمعجم — ويمكن اختيار «حفظ كـ PDF» من نافذة الطباعة.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-brand-700">
              <span className="rounded-full bg-brand-50 px-3 py-1.5">1. افتح الدرس</span>
              <span aria-hidden="true">←</span>
              <span className="rounded-full bg-brand-50 px-3 py-1.5">2. زر الطباعة أعلى الصفحة</span>
              <span aria-hidden="true">←</span>
              <span className="rounded-full bg-brand-50 px-3 py-1.5">3. حفظ كـ PDF</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
