import { Award, BadgeCheck, BookOpenCheck, Compass, Download, FileText, GraduationCap, Landmark, MapPin, PenLine, Quote, Shapes, Target } from "lucide-react";
import Reveal from "./Reveal";

const CV_FILE = "/files/cv-imad-talil.pdf";

const CV_HIGHLIGHTS = [
  { icon: GraduationCap, text: "باحث دكتوراه في التغير المناخي وتأثيره على الماء بمنطقة سهل الغرب (2017–2023)" },
  { icon: BookOpenCheck, text: "ماستر في البيئة، تخصص المناخ والموارد المائية بالمغرب (2007–2009)" },
  { icon: Landmark, text: "إجازة في التاريخ والجغرافيا (2002–2006)" },
  { icon: Target, text: "أستاذ بالتعليم الثانوي، تخصص التاريخ والجغرافيا (2011–2023)" },
];

const GOALS = [
  { icon: BookOpenCheck, text: "تبسيط المفاهيم التاريخية والجغرافية" },
  { icon: FileText, text: "تنمية مهارات تحليل الوثائق" },
  { icon: Shapes, text: "تدريب التلاميذ على قراءة الخرائط والجداول والمبيانات" },
  { icon: PenLine, text: "تطوير مهارات الكتابة التاريخية والجغرافية" },
  { icon: Compass, text: "توفير تمارين تطبيقية متنوعة ومصححة" },
  { icon: Award, text: "مساعدة التلاميذ على الاستعداد للفروض والامتحانات" },
];

export default function About() {
  return (
    <section className="pt-32 pb-20 md:pt-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <Reveal>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <GraduationCap className="size-3.5" aria-hidden="true" />
              نبذة عن الأستاذ
            </span>
            <h1 className="mt-5 font-display text-3xl font-black text-ink-900 sm:text-4xl lg:text-5xl">الأستاذ عماد طليل</h1>
            <p className="mt-3 text-sm font-semibold text-brand-700 sm:text-base">أستاذ مادة الاجتماعيات | التاريخ والجغرافيا</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* بطاقة الأستاذ */}
          <Reveal delay={100}>
            <div className="noise relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-800 to-brand-950 p-8 text-white shadow-[0_35px_70px_-28px_rgba(6,56,40,0.6)]">
              <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-30" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center gap-5">
                  <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 font-display text-3xl font-black text-ink-950 shadow-xl shadow-gold-600/30">
                    ع
                  </span>
                  <div>
                    <p className="font-display text-2xl font-black">الأستاذ عماد طليل</p>
                    <p className="mt-1 text-sm text-gold-300">أستاذ مادة الاجتماعيات</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/60">
                      <Landmark className="size-3.5" aria-hidden="true" />
                      التعليم الثانوي التأهيلي
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-3.5 border-t border-white/10 pt-7">
                  <p className="flex items-center gap-3 text-sm text-white/80">
                    <MapPin className="size-4.5 shrink-0 text-gold-300" aria-hidden="true" />
                    ثانوية القدس التأهيلية — القنيطرة، المغرب
                  </p>
                  <p className="flex items-center gap-3 text-sm text-white/80">
                    <BookOpenCheck className="size-4.5 shrink-0 text-gold-300" aria-hidden="true" />
                    المادة: الاجتماعيات — التاريخ والجغرافيا
                  </p>
                  <p className="flex items-center gap-3 text-sm text-white/80">
                    <Target className="size-4.5 shrink-0 text-gold-300" aria-hidden="true" />
                    مستويات: الجذع المشترك، الأولى والثانية باكالوريا
                  </p>
                </div>

                <div className="relative mt-7 rounded-2xl border border-white/12 bg-white/[0.05] p-5">
                  <Quote className="absolute -top-4 start-5 size-8 rounded-lg bg-brand-950 p-1.5 text-gold-300" aria-hidden="true" />
                  <p className="pt-2 text-sm leading-loose text-white/80">
                    "الاجتماعيات ليست مادة للحفظ، بل مجال للفهم والتحليل وبناء منهجية صلبة —
                    ومهمتي أن أجعل كل تلميذ قادرًا على التعامل مع الوثيقة والخريطة والفقرة بثقة."
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* التعريف المهني + الأهداف */}
          <div>
            <Reveal delay={180}>
              <div className="rounded-3xl border border-ink-900/6 bg-white p-8">
                <h2 className="font-display text-xl font-extrabold text-ink-900">نبذة عن الأستاذ</h2>
                <div className="mt-4 space-y-3 text-[15px] leading-loose text-ink-700">
                  <p>مرحبًا بكم في موقعي التعليمي.</p>
                  <p>
                    أنا <strong className="font-extrabold text-ink-900">عماد طليل</strong>، أستاذ مادة الاجتماعيات، تخصص <strong className="font-extrabold text-ink-900">التاريخ والجغرافيا</strong>، واهتم بالتربية والتعليم وبمجالات البيئة والتغير المناخي والموارد المائية.
                  </p>
                  <p>
                    وفقًا للسيرة الذاتية، راكمت تجربة في تدريس مادة التاريخ والجغرافيا بالتعليم الثانوي، وتابعت مسارًا أكاديميًا في <strong className="font-extrabold text-ink-900">البيئة والمناخ والموارد المائية بالمغرب</strong>، مع بحث حول <strong className="font-extrabold text-ink-900">التغير المناخي وتأثيره على الماء بمنطقة سهل الغرب</strong>.
                  </p>
                  <p>
                    أؤمن بأن تدريس التاريخ والجغرافيا لا يقتصر على حفظ المعلومات، بل يهدف إلى <strong className="font-extrabold text-ink-900">فهم الأحداث والظواهر، وتنمية مهارات التحليل والتفكير النقدي، وربط التعلمات بالواقع</strong>.
                  </p>
                  <p>
                    كما تتضمن خبرتي تنشيط ورشات فنية وبيئية والعمل في مجالات الوسائط المتعددة، وهي خبرات أحرص على توظيفها في تقديم المحتوى التعليمي بطريقة <strong className="font-extrabold text-ink-900">واضحة، تفاعلية ومبتكرة</strong>.
                  </p>
                  <p className="font-bold text-brand-800">
                    <strong className="font-extrabold">مرحبًا بكم في فضائي التعليمي، ونتمنى لكم مسيرة موفقة في التعلم والنجاح.</strong>
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={CV_FILE}
                    download="cv-imad-talil.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-brand-700/20 transition hover:-translate-y-0.5 hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    تحميل السيرة الذاتية
                  </a>
                  <span className="text-xs font-semibold text-ink-500">PDF — السيرة الذاتية الكاملة</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {["التاريخ", "الجغرافيا", "المناخ", "الموارد المائية", "الوسائط المتعددة"].map((t) => (
                    <span key={t} className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={280}>
              <h2 className="mt-10 font-display text-2xl font-extrabold text-ink-900">محطات من السيرة الذاتية</h2>
            </Reveal>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {CV_HIGHLIGHTS.map((item, i) => (
                <Reveal key={item.text} delay={320 + i * 70}>
                  <div className="flex items-start gap-3 rounded-2xl border border-brand-200/70 bg-brand-50/60 p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="pt-1 text-[13px] font-semibold leading-relaxed text-ink-700">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={620}>
              <h2 className="mt-10 font-display text-2xl font-extrabold text-ink-900">أهداف المنصة</h2>
            </Reveal>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {GOALS.map((g, i) => (
                <Reveal key={g.text} delay={660 + i * 70}>
                  <div className="group flex items-start gap-3 rounded-2xl border border-ink-900/6 bg-white p-4.5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_40px_-18px_rgba(12,124,91,0.3)]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                      <g.icon className="size-4.5" strokeWidth={2.2} aria-hidden="true" />
                    </span>
                    <p className="pt-1.5 text-[13px] font-semibold leading-relaxed text-ink-700">{g.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={1080}>
              <p className="mt-8 inline-flex items-start gap-2 rounded-2xl border border-gold-300/50 bg-gold-50 p-4 text-[13px] leading-relaxed text-gold-700">
                <BadgeCheck className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                تُحدَّث محتويات المنصة باستمرار على مدار الموسم الدراسي: دروس، تطبيقات، منهجيات وموارد.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
