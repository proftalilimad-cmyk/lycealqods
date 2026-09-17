import { BookOpenCheck, GraduationCap, MapPin } from "lucide-react";
import { NAV_LINKS, type Route } from "../routes";
import { LEVELS } from "../data/curriculum";

interface FooterProps {
  go: (r: Route) => void;
}

export default function Footer({ go }: FooterProps) {
  return (
    <footer className="noise relative overflow-hidden bg-brand-950 pt-16 pb-8 text-white">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-32 start-1/3 size-96 rounded-full bg-brand-600/15 blur-[120px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-700/40">
                <GraduationCap className="size-5.5 text-gold-300" strokeWidth={2.2} />
              </span>
              <div>
                <p className="font-display text-xl font-black">فضاء الاجتماعيات</p>
                <p className="text-xs text-white/50">الأستاذ عماد طليل · أستاذ مادة الاجتماعيات</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-loose text-white/55">
              منصة تعليمية تهدف إلى مساعدة تلاميذ التعليم الثانوي التأهيلي على تعلم مادة الاجتماعيات من
              خلال دروس مبسطة وتطبيقات وتقويمات تفاعلية.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-gold-300/90">
              <MapPin className="size-3.5" aria-hidden="true" />
              ثانوية القدس التأهيلية — القنيطرة، المغرب
            </p>
          </div>

          <nav aria-label="روابط التذييل" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-display text-sm font-extrabold text-gold-300">أقسام المنصة</h3>
              <ul className="mt-4 space-y-3">
                {NAV_LINKS.map((l) => (
                  <li key={l.label}>
                    <button type="button" onClick={() => go(l.route)} className="text-sm text-white/55 transition-colors hover:text-white">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-gold-300">المستويات</h3>
              <ul className="mt-4 space-y-3">
                {LEVELS.map((lv) => (
                  <li key={lv.id}>
                    <button
                      type="button"
                      onClick={() => go({ view: "lessons", level: lv.id })}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      دروس {lv.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => go({ view: "test" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    التقويم التشخيصي — ج.م
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-gold-300">خدمات سريعة</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <button type="button" onClick={() => go({ view: "dashboard" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    لوحة الأستاذ (دخول محمي)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => go({ view: "dashboard", tab: "jadadat" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    تتبّع إنجاز الجذاذات
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => go({ view: "jadadat" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    قسم الجذاذات (عرض وطباعة)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => go({ view: "jadadatLib" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    جذاذات الجذع المشترك العلمي (PDF)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => go({ view: "methods" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    منهجيات الاجتماعيات
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => go({ view: "apps" })} className="text-sm text-white/55 transition-colors hover:text-white">
                    تطبيقات وتمارين
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row">
          <p className="text-xs text-white/40">© 2026 فضاء الاجتماعيات — إعداد الأستاذ عماد طليل. جميع الحقوق محفوظة.</p>
          <p className="inline-flex items-center gap-2 text-[11px] text-white/35">
            <BookOpenCheck className="size-3.5" aria-hidden="true" />
            منصة تربوية مفتوحة لتلاميذ المؤسسة وعموم المتعلمين.
          </p>
        </div>
      </div>
    </footer>
  );
}
