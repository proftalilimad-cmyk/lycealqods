import { useEffect, useState } from "react";
import { GraduationCap, LayoutDashboard, Menu, X } from "lucide-react";
import { NAV_LINKS, type Route } from "../routes";

interface NavbarProps {
  route: Route;
  go: (r: Route) => void;
}

export default function Navbar({ route, go }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (r: Route) => r.view === route.view;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`relative mt-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-all duration-500 sm:px-5 ${
            scrolled ? "glass shadow-[0_16px_50px_-18px_rgba(4,36,26,0.35)]" : "bg-white/55 backdrop-blur-xl border border-white/50"
          }`}
        >
          {/* Brand */}
          <button
            type="button"
            onClick={() => { setOpen(false); go({ view: "home" }); }}
            className="group flex items-center gap-3 text-start"
            aria-label="فضاء الاجتماعيات — الرئيسية"
          >
            <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-700/30 transition-transform duration-500 group-hover:-rotate-6">
              <GraduationCap className="size-5 text-gold-300" strokeWidth={2.2} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-extrabold text-ink-900 sm:text-lg">فضاء الاجتماعيات</span>
              <span className="block text-[10px] font-medium text-ink-500 sm:text-[11px]">الأستاذ عماد طليل · ثانوية القدس — القنيطرة</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-5 lg:flex xl:gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => go(link.route)}
                className={`nav-link text-[13px] font-medium transition-colors xl:text-sm ${
                  isActive(link.route) ? "font-bold text-brand-700" : "text-ink-700 hover:text-brand-700"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => go({ view: "dashboard" })}
              aria-label="لوحة الأستاذ — دخول محمي باسم مستعمل وكلمة مرور"
              title="لوحة الأستاذ (محمية)"
              className={`hidden size-10 place-items-center rounded-xl border transition-all sm:grid ${
                route.view === "dashboard"
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-900/10 bg-white/70 text-ink-700 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              <LayoutDashboard className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
              className="grid size-10 place-items-center rounded-xl border border-ink-900/10 bg-white/70 text-ink-900 transition-colors hover:bg-white lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {open && (
            <div
              id="mobile-menu"
              className="animate-menu-in absolute inset-x-0 top-full mt-2 rounded-2xl border border-ink-900/8 bg-cream p-3 shadow-2xl shadow-brand-950/20 lg:hidden"
            >
              <nav aria-label="قائمة الجوال" className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => { setOpen(false); go(link.route); }}
                    className={`rounded-xl px-4 py-3 text-start text-sm font-semibold transition-colors ${
                      isActive(link.route) ? "bg-brand-50 text-brand-700" : "text-ink-900 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setOpen(false); go({ view: "dashboard" }); }}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/30"
                >
                  <LayoutDashboard className="size-4" />
                  دخول لوحة الأستاذ (محمية)
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
