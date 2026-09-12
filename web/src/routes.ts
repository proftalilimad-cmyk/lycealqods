export type Route =
  | { view: "home" }
  | { view: "about" }
  | { view: "test"; bank?: string }
  | { view: "dashboard" }
  | { view: "lessons"; level?: string }
  | { view: "methods"; id?: string }
  | { view: "apps"; id?: string; level?: string }
  | { view: "lesson"; id: string }
  | { view: "resources" };

export const NAV_LINKS: { label: string; route: Route }[] = [
  { label: "الرئيسية", route: { view: "home" } },
  { label: "نبذة عن الأستاذ", route: { view: "about" } },
  { label: "التقويم التشخيصي", route: { view: "test" } },
  { label: "الدروس", route: { view: "lessons" } },
  { label: "التطبيقات", route: { view: "apps" } },
  { label: "المنهجيات", route: { view: "methods" } },
  { label: "الموارد", route: { view: "resources" } },
];
