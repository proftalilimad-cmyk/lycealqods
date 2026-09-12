import {
  Award,
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  Compass,
  FileText,
  FlaskConical,
  Globe2,
  GraduationCap,
  History,
  Library,
  MonitorPlay,
  PenLine,
  Search,
  Target,
  Timer,
  User,
} from "lucide-react";
import Reveal from "./Reveal";
import type { Route } from "../routes";
import { LEVELS } from "../data/curriculum";
import { METHODOLOGIES } from "../data/methodologies";
import { APPLICATIONS } from "../data/applications";

interface HomeProps {
  go: (r: Route) => void;
  onSearch: () => void;
}

interface QuickAction {
  label: string;
  desc: string;
  icon: typeof Target;
  route?: Route;
  search?: boolean;
  soon?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "الدروس", desc: "منظمة حسب المستوى والدورتين", icon: BookOpenCheck, route: { view: "lessons" } },
  { label: "التمارين", desc: "تطبيقات بتصحيح نموذجي", icon: FlaskConical, route: { view: "apps" } },
  { label: "الفروض", desc: "تقويمات محروسة ونماذج فروض", icon: ClipboardList, route: { view: "resources", type: "exam" } },
  { label: "الامتحانات الجهوية", desc: "مواضيع رسمية مع عناصر الإجابة", icon: FileText, route: { view: "resources", type: "regional" } },
  { label: "المنهجيات", desc: "تحليل الوثائق والكتابة", icon: PenLine, route: { view: "methods" } },
  { label: "العروض التفاعلية", desc: "دروس 1 باك علوم من الكتاب المدرسي", icon: MonitorPlay, route: { view: "decks" } },
  { label: "المصطلحات", desc: "معجم مفاهيم دروس المادة", icon: Library, search: true },
  { label: "الخرائط والخطاطات", desc: "خرائط تخطيطية وخطاطات تفاعلية", icon: Globe2, route: { view: "resources", type: "map" } },
  { label: "التقويم الذاتي", desc: "8 تقويمات تفاعلية حسب المستوى", icon: Target, route: { view: "test" } },
  { label: "البحث", desc: "درس، مفهوم، شخصية، حدث، تمرين...", icon: Search, search: true },
];

const OBJECTIVES = [
  { icon: History, text: "تبسيط المفاهيم التاريخية والجغرافية" },
  { icon: FileText, text: "تنمية مهارات تحليل الوثائق" },
  { icon: Globe2, text: "التدريب على قراءة الخرائط والجداول والمبيانات" },
  { icon: PenLine, text: "تطوير مهارات الكتابة التاريخية والجغرافية" },
  { icon: ClipboardList, text: "توفير تمارين تطبيقية بتصحيحات نموذجية" },
  { icon: Award, text: "الاستعداد الجيد للفروض والامتحانات" },
];

export default function Home({ go, onSearch }: HomeProps) {
  return (
    <>
      {/* ============ Hero ============ */}
      <section className="noise relative overflow-hidden bg-brand-950 pt-36 pb-24 sm:pt-40">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 pattern-zellige-light opacity-80" />
          <div className="animate-blob absolute -top-40 -start-32 size-[34rem] rounded-full bg-brand-600/25 blur-[110px]" />
          <div className="animate-blob absolute top-1/3 -end-40 size-[30rem] rounded-full bg-gold-500/15 blur-[120px] [animation-delay:-6s]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-xs font-semibold text-gold-300 sm:text-sm">
              <GraduationCap className="size-4" aria-hidden="true" />
              ثانوية القدس التأهيلية — القنيطرة
            </span>
          </Reveal>
          <Reveal delay={110}>
            <h1 className="mt-7 font-display text-3xl font-black leading-[1.35] text-white sm:text-4xl sm:leading-[1.3] lg:text-5xl lg:leading-[1.25]">
              منصة{" "}
              <span className="bg-gradient-to-l from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                الاجتماعيات
              </span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-gold-300 sm:text-base">
              <User className="size-4.5" aria-hidden="true" />
              الأستاذ عماد طليل · ثانوية القدس – القنيطرة
            </p>
          </Reveal>
          <Reveal delay={220}>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-lg">
              مرحبًا بكم في منصة الاجتماعيات، فضاء للتعلم والمراجعة والتدرب في التاريخ والجغرافيا.
            </p>
          </Reveal>

          <Reveal delay={340}>
            <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-5 lg:max-w-5xl">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => (a.search ? onSearch() : a.route && go(a.route))}
                  className={`group relative rounded-2xl border p-4 text-center backdrop-blur transition-all duration-300 ${
                    a.soon
                      ? "border-white/8 bg-white/[0.03] hover:border-white/20"
                      : "border-white/12 bg-white/[0.05] hover:-translate-y-1.5 hover:border-gold-300/40 hover:bg-white/[0.09]"
                  }`}
                >
                  {a.soon && (
                    <span className="absolute end-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-extrabold text-white/50">
                      قريبًا
                    </span>
                  )}
                  <span className={`mx-auto grid size-10 place-items-center rounded-xl transition-all duration-300 ${a.soon ? "bg-white/10 text-white/40" : "bg-white/10 text-gold-300 group-hover:scale-110 group-hover:bg-gold-400/20"}`}>
                    <a.icon className="size-5" strokeWidth={2.2} />
                  </span>
                  <span className={`mt-3 block font-display text-[13px] font-extrabold ${a.soon ? "text-white/55" : "text-white"}`}>{a.label}</span>
                  <span className="mt-1 hidden text-[10px] leading-snug text-white/45 lg:block">{a.desc}</span>
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={460}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => go({ view: "test" })}
                className="btn-shine group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-gold-400 to-gold-500 px-8 py-4 text-base font-extrabold text-ink-950 shadow-xl shadow-gold-600/25 transition-all duration-300 hover:-translate-y-1 sm:w-auto"
              >
                <Target className="size-5" aria-hidden="true" />
                ابدأ التقويم التشخيصي
              </button>
              <button
                type="button"
                onClick={onSearch}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white/85 transition-all duration-300 hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                <Search className="size-5 text-gold-300" aria-hidden="true" />
                ابحث عن درس أو مفهوم
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ أهداف المنصة ============ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                  <Compass className="size-3.5" aria-hidden="true" />
                  أهداف المنصة
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.3] text-ink-900 sm:text-4xl">
                  لماذا هذه{" "}
                  <span className="bg-gradient-to-l from-gold-400 via-gold-500 to-brand-500 bg-clip-text text-transparent">
                    المنصة؟
                  </span>
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-5 max-w-xl text-base leading-loose text-ink-500 sm:text-lg">
                  منصة تعليمية تهدف إلى مساعدة تلاميذ التعليم الثانوي التأهيلي على تعلم مادة الاجتماعيات
                  من خلال دروس مبسطة، تطبيقات، تمارين، وتقويمات تفاعلية.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[
                    { icon: ClipboardList, v: "20", l: "سؤالًا تشخيصيًا" },
                    { icon: FileText, v: String(METHODOLOGIES.length), l: "منهجيات مفصلة" },
                    { icon: FlaskConical, v: String(APPLICATIONS.length), l: "تطبيقات مصححة" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-2xl border border-ink-900/6 bg-white p-4 text-center">
                      <s.icon className="mx-auto size-5 text-brand-600" aria-hidden="true" />
                      <p className="mt-2 font-display text-2xl font-black text-ink-900">{s.v}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-ink-500">{s.l}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {OBJECTIVES.map((o, i) => (
                <Reveal key={o.text} delay={i * 90}>
                  <div className="group flex h-full items-start gap-3.5 rounded-2xl border border-ink-900/6 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_45px_-20px_rgba(12,124,91,0.3)]">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                      <o.icon className="size-5" strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <p className="pt-1 text-sm font-semibold leading-relaxed text-ink-700">{o.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ المستويات ============ */}
      <section className="bg-paper-warm/60 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                <BookOpenCheck className="size-3.5" aria-hidden="true" />
                الدروس حسب المستوى
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">اختر مستواك الدراسي</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 sm:text-base">
                دروس التاريخ والجغرافيا والتربية على المواطنة منظمة حسب المستويات والمسالك.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {LEVELS.map((lv, i) => (
              <Reveal key={lv.id} delay={i * 120}>
                <button
                  type="button"
                  onClick={() => go({ view: "lessons", level: lv.id })}
                  className={`group relative w-full overflow-hidden rounded-3xl p-8 text-start transition-all duration-500 hover:-translate-y-2 ${
                    i === 0
                      ? "bg-gradient-to-b from-brand-800 to-brand-950 text-white shadow-[0_35px_70px_-28px_rgba(6,56,40,0.6)] ring-2 ring-gold-400/40"
                      : "border border-ink-900/6 bg-white hover:border-brand-200 hover:shadow-[0_28px_60px_-26px_rgba(12,124,91,0.3)]"
                  }`}
                >
                  {i === 0 && <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-30" aria-hidden="true" />}
                  <div className="relative">
                    <span
                      className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold ${
                        i === 0 ? "bg-gold-400/15 text-gold-300" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {i === 0 ? "مستوى التقويم التشخيصي" : "مستوى دراسي"}
                    </span>
                    <h3 className={`mt-5 font-display text-2xl font-black ${i === 0 ? "text-white" : "text-ink-900"}`}>{lv.label}</h3>
                    <p className={`mt-3 text-sm leading-relaxed ${i === 0 ? "text-white/70" : "text-ink-500"}`}>{lv.desc}</p>
                    <span
                      className={`mt-6 inline-flex items-center gap-2 text-sm font-bold transition-transform duration-300 group-hover:-translate-x-1 ${
                        i === 0 ? "text-gold-300" : "text-brand-700"
                      }`}
                    >
                      تصفح الدروس
                      <span aria-hidden="true">←</span>
                    </span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ دعوة للتقويم ============ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <Reveal>
            <div className="noise relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-brand-900 to-brand-950 px-6 py-14 text-center sm:px-12 md:py-20">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute inset-0 pattern-zellige-light opacity-60" />
                <div className="animate-blob absolute -top-24 start-1/3 size-96 rounded-full bg-gold-500/15 blur-[110px]" />
              </div>
              <div className="relative mx-auto max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-5 py-2 text-xs font-bold text-gold-300 sm:text-sm">
                  <Timer className="size-4" aria-hidden="true" />
                  8 تقويمات · 20 سؤالًا · 60 دقيقة · النقطة /20
                </span>
                <h2 className="mt-6 font-display text-3xl font-black leading-[1.3] text-white sm:text-4xl">
                  التقويم التشخيصي في الاجتماعيات —{" "}
                  <span className="bg-gradient-to-l from-gold-300 to-gold-500 bg-clip-text text-transparent">الجذع المشترك</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  8 بنوك أسئلة مخصصة لكل المستويات والمسالك (جذع مشترك، أولى باك، ثانية باك) —
                  عشرة أسئلة في التاريخ وعشرة في الجغرافيا، بتصحيح آلي فوري وتحليل تربوي مفصّل.
                </p>
                <button
                  type="button"
                  onClick={() => go({ view: "test" })}
                  className="btn-shine group mt-8 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-gold-400 to-gold-500 px-9 py-4 text-base font-extrabold text-ink-950 shadow-xl shadow-gold-600/25 transition-all duration-300 hover:-translate-y-1"
                >
                  <BarChart3 className="size-5" aria-hidden="true" />
                  شخّص مستواك الآن
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
