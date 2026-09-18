export type Route =
  | { view: "home" }
  | { view: "about" }
  | { view: "test"; bank?: string }
  | { view: "battle"; bank?: string }
  | { view: "dashboard"; tab?: string }
  | { view: "lessons"; level?: string }
  | { view: "jadadat"; id?: string; level?: string }
  | { view: "methods"; id?: string }
  | { view: "apps"; id?: string; level?: string }
  | { view: "lesson"; id: string }
  | { view: "resources"; type?: string; open?: string }
  | { view: "decks"; id?: string; subject?: string };

export const NAV_LINKS: { label: string; route: Route }[] = [
  { label: "الرئيسية", route: { view: "home" } },
  { label: "نبذة عن الأستاذ", route: { view: "about" } },
  { label: "التقويم التشخيصي", route: { view: "test" } },
  { label: "المبارزة", route: { view: "battle" } },
  { label: "الدروس", route: { view: "lessons" } },
  { label: "الجذاذات", route: { view: "jadadat" } },
  { label: "التطبيقات", route: { view: "apps" } },
  { label: "العروض", route: { view: "decks" } },
  { label: "المنهجيات", route: { view: "methods" } },
  { label: "الموارد", route: { view: "resources" } },
  { label: "لوحة الأستاذ", route: { view: "dashboard" } },
];

/* ============================================================
   التوجيه بالعناوين (روابط مباشرة قابلة للمشاركة)

   كل شاشة في الموقع لها عنوان ثابت بصيغة hash، فيعمل زر الرجوع
   في المتصفح، ولا يضيّع التحديثُ الصفحةَ، ويمكن للأستاذ أن يرسل
   رابط درس أو عرض أو مورد مباشرة للتلاميذ:

     #/                       الرئيسية
     #/about                  نبذة عن الأستاذ
     #/test                   التقويم التشخيصي
     #/test/<bank>            تقويم بنك معيّن (tc / bac1 / bac2)
     #/battle                 وضع المبارزة
     #/battle/<bank>          مبارزة ببنك معيّن
     #/dashboard              لوحة الأستاذ (محمية باسم مستعمل وكلمة مرور)
     #/dashboard/<tab>        تبويب اللوحة (results / security)
     #/lessons                الدروس
     #/lessons/<level>        دروس مستوى (tc / bac1 / bac2)
     #/jadadat                فهرس الجذاذات
     #/jadadat/<id>           جذاذة درس كاملة
     #/lesson/<id>            درس معيّن (bac1-sci.geography.0.0 …)
     #/methods                المنهجيات
     #/methods/<id>           منهجية معيّنة
     #/apps                   التطبيقات
     #/apps/<id>              تطبيق معيّن
     #/apps?level=<level>     تطبيقات مصفاة بمستوى
     #/decks                  العروض التفاعلية
     #/decks/<id>             عرض معيّن
     #/decks?subject=<s>      عروض مصفاة بمادة (التاريخ / الجغرافيا)
     #/resources              الموارد
     #/resources/<type>       موارد مصفاة بنوع
     #/resources/<type>/<id>  مورد مفتوح
  ============================================================ */

export const BASE_TITLE = "فضاء الاجتماعيات — الأستاذ عماد طليل";
export const BASE_TITLE_FULL = "فضاء الاجتماعيات — الأستاذ عماد طليل | ثانوية القدس، القنيطرة";

/** تسمية كل شاشة (تُستعمل في عنوان الصفحة وفي رابط «نسخ») */
export const VIEW_LABELS: Record<Route["view"], string> = {
  home: "الرئيسية",
  about: "نبذة عن الأستاذ",
  test: "التقويم التشخيصي",
  battle: "المبارزة",
  dashboard: "لوحة الأستاذ",
  lessons: "الدروس",
  jadadat: "الجذاذات",
  lesson: "الدرس",
  methods: "المنهجيات",
  apps: "التطبيقات",
  resources: "الموارد",
  decks: "العروض التفاعلية",
};

const SEGMENTS: Record<string, Route["view"]> = {
  "": "home",
  home: "home",
  about: "about",
  test: "test",
  battle: "battle",
  dashboard: "dashboard",
  lessons: "lessons",
  jadadat: "jadadat",
  lesson: "lesson",
  methods: "methods",
  apps: "apps",
  resources: "resources",
  decks: "decks",
};

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Route ← مسار داخل العنوان (بدون `#`) */
export function routeToPath(route: Route): string {
  switch (route.view) {
    case "home":
      return "/";
    case "about":
      return "/about";
    case "dashboard":
      return route.tab ? `/dashboard/${encodeSegment(route.tab)}` : "/dashboard";
    case "test":
      return route.bank ? `/test/${encodeSegment(route.bank)}` : "/test";
    case "battle":
      return route.bank ? `/battle/${encodeSegment(route.bank)}` : "/battle";
    case "lessons":
      return route.level ? `/lessons/${encodeSegment(route.level)}` : "/lessons";
    case "jadadat":
      if (route.id) return `/jadadat/${encodeSegment(route.id)}`;
      return route.level ? `/jadadat?level=${encodeSegment(route.level)}` : "/jadadat";
    case "lesson":
      return `/lesson/${encodeSegment(route.id)}`;
    case "methods":
      return route.id ? `/methods/${encodeSegment(route.id)}` : "/methods";
    case "apps": {
      if (route.id) return `/apps/${encodeSegment(route.id)}`;
      return route.level ? `/apps?level=${encodeSegment(route.level)}` : "/apps";
    }
    case "decks": {
      if (route.id) return `/decks/${encodeSegment(route.id)}`;
      return route.subject ? `/decks?subject=${encodeSegment(route.subject)}` : "/decks";
    }
    case "resources": {
      if (route.open) return `/resources/${encodeSegment(route.type ?? "all")}/${encodeSegment(route.open)}`;
      return route.type ? `/resources/${encodeSegment(route.type)}` : "/resources";
    }
  }
}

/** مسار داخل العنوان (بدون `#`) → Route؛ أي مسار غير معروف يعيد إلى الرئيسية */
export function routeFromPath(rawPath: string): Route {
  const [pathPart, queryPart = ""] = rawPath.split("?");
  const query = new URLSearchParams(queryPart);
  const parts = pathPart.split("/").filter((p) => p.length > 0).map(decodeSegment);
  const view = SEGMENTS[parts[0] ?? ""];
  if (!view) return { view: "home" };

  switch (view) {
    case "home":
    case "about":
      return { view };
    case "dashboard":
      return parts[1] ? { view: "dashboard", tab: parts[1] } : { view: "dashboard" };
    case "test":
      return parts[1] ? { view: "test", bank: parts[1] } : { view: "test" };
    case "battle":
      return parts[1] ? { view: "battle", bank: parts[1] } : { view: "battle" };
    case "lessons":
      return parts[1] ? { view: "lessons", level: parts[1] } : { view: "lessons" };
    case "jadadat": {
      if (parts[1]) return { view: "jadadat", id: parts[1] };
      const level = query.get("level");
      return level ? { view: "jadadat", level } : { view: "jadadat" };
    }
    case "lesson":
      return parts[1] ? { view: "lesson", id: parts[1] } : { view: "lessons" };
    case "methods":
      return parts[1] ? { view: "methods", id: parts[1] } : { view: "methods" };
    case "apps": {
      if (parts[1]) return { view: "apps", id: parts[1] };
      const level = query.get("level");
      return level ? { view: "apps", level } : { view: "apps" };
    }
    case "decks": {
      if (parts[1]) return { view: "decks", id: parts[1] };
      const subject = query.get("subject");
      return subject ? { view: "decks", subject } : { view: "decks" };
    }
    case "resources": {
      const type = parts[1] && parts[1] !== "all" ? parts[1] : undefined;
      const open = parts[2] || undefined;
      return open ? { view: "resources", type, open } : type ? { view: "resources", type } : { view: "resources" };
    }
  }
}

export function routeToHash(route: Route): string {
  return `#${routeToPath(route)}`;
}

export function hashToRoute(hash: string): Route {
  const path = hash.replace(/^#/, "");
  return routeFromPath(path || "/");
}

/** هل المساران يمثلان الشاشة نفسها؟ (لتفادي تكرار الإدخال في التاريخ) */
export function sameRoute(a: Route, b: Route): boolean {
  return routeToPath(a) === routeToPath(b);
}
