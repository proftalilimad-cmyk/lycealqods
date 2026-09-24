import { routeToPath, type Route } from "../routes";

export const SITE_ORIGIN = ((import.meta.env?.VITE_SITE_URL as string | undefined) ?? "https://courstalil.netlify.app").replace(/\/+$/, "");
export const SITE_NAME = "فضاء الاجتماعيات — الأستاذ عماد طليل";
export const SCHOOL_NAME = "ثانوية القدس، القنيطرة";
export const TEACHER_NAME = "الأستاذ عماد طليل";
export const SEO_IMAGE = `${SITE_ORIGIN}/og-cover.png`;

export interface SeoLessonContext {
  title: string;
  level: string;
  branch: string;
  subject: string;
  unit: string;
}

export interface SeoDeckContext {
  title: string;
  subject: string;
  level: string;
}

export interface SeoJadadaContext {
  title: string;
  level: string;
  branch: string;
  subject: string;
}

export interface SeoItemContext {
  title: string;
  description?: string;
  level?: string;
  subject?: string;
}

export interface SeoContext {
  lesson?: SeoLessonContext;
  deck?: SeoDeckContext;
  jadada?: SeoJadadaContext;
  methodology?: SeoItemContext;
  application?: SeoItemContext;
  resource?: SeoItemContext;
}

export interface SeoBreadcrumb {
  name: string;
  url: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots: string;
  ogType: "website" | "article";
  breadcrumbs: SeoBreadcrumb[];
  jsonLd: Record<string, unknown>;
}

const LEVEL_LABELS: Record<string, string> = {
  tc: "الجذع المشترك",
  "jad3-moshtarak": "الجذع المشترك",
  bac1: "الأولى باكالوريا",
  "1bac": "الأولى باكالوريا",
  bac2: "الثانية باكالوريا",
  "2bac": "الثانية باكالوريا",
};

function levelIdForLabel(label: string): string | undefined {
  return ["tc", "bac1", "bac2"].find((id) => LEVEL_LABELS[id] === label);
}

const RESOURCE_LABELS: Record<string, string> = {
  pdf: "الدروس وملخصات PDF",
  slides: "العروض التفاعلية",
  map: "الخرائط والخطاطات",
  table: "الجداول الإحصائية",
  chart: "المبيانات",
  exercise: "التمارين والتطبيقات",
  exam: "فروض وتقويمات",
  national: "الامتحانات الوطنية",
  regional: "الامتحانات الجهوية",
  image: "الصور والوثائق البصرية",
};

const SUBJECT_KEYWORDS = ["الاجتماعيات", "التاريخ والجغرافيا", "التعليم الثانوي التأهيلي بالمغرب"];

function urlFor(route: Route): string {
  return `${SITE_ORIGIN}${routeToPath(route)}`;
}

function levelLabel(value?: string): string {
  return value ? LEVEL_LABELS[value] ?? value : "الثانوي التأهيلي";
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function commonKeywords(extra: string[] = []): string[] {
  return Array.from(new Set([...SUBJECT_KEYWORDS, "الأستاذ عماد طليل", "ثانوية القدس القنيطرة", ...extra]));
}

function baseBreadcrumb(): SeoBreadcrumb {
  return { name: "الرئيسية", url: `${SITE_ORIGIN}/` };
}

function breadcrumbsFor(route: Route, context: SeoContext): SeoBreadcrumb[] {
  const home = baseBreadcrumb();
  switch (route.view) {
    case "home":
      return [home];
    case "about":
      return [home, { name: "نبذة عن الأستاذ", url: urlFor({ view: "about" }) }];
    case "diagnostic": {
      const label = route.level ? `تقويم ${levelLabel(route.level)}` : "التقويم التشخيصي";
      return [home, { name: "التقويم التشخيصي", url: urlFor({ view: "diagnostic" }) }, ...(route.level ? [{ name: label, url: urlFor(route) }] : [])];
    }
    case "lessons":
      return [home, { name: "دروس الاجتماعيات", url: urlFor({ view: "lessons" }) }, ...(route.level ? [{ name: levelLabel(route.level), url: urlFor(route) }] : [])];
    case "lesson":
      return [
        home,
        { name: "دروس الاجتماعيات", url: urlFor({ view: "lessons" }) },
        ...(context.lesson
          ? [{ name: context.lesson.level, url: urlFor({ view: "lessons", level: levelIdForLabel(context.lesson.level) }) }]
          : []),
        ...(context.lesson ? [{ name: context.lesson.title, url: urlFor(route) }] : []),
      ];
    case "jadadat":
      return [
        home,
        { name: "جذاذات الاجتماعيات", url: urlFor({ view: "jadadat" }) },
        ...(route.id && context.jadada
          ? [{ name: context.jadada.level, url: urlFor({ view: "jadadat", level: levelIdForLabel(context.jadada.level) }) }]
          : []),
        ...(context.jadada ? [{ name: context.jadada.title, url: urlFor(route) }] : []),
      ];
    case "methods":
      return [home, { name: "منهجيات الاجتماعيات", url: urlFor({ view: "methods" }) }, ...(context.methodology ? [{ name: context.methodology.title, url: urlFor(route) }] : [])];
    case "apps":
      return [home, { name: "تطبيقات وتمارين الاجتماعيات", url: urlFor({ view: "apps" }) }, ...(context.application ? [{ name: context.application.title, url: urlFor(route) }] : [])];
    case "resources": {
      const typeName = route.type ? RESOURCE_LABELS[route.type] ?? "الموارد" : "الموارد التعليمية";
      return [
        home,
        { name: "الموارد التعليمية", url: urlFor({ view: "resources" }) },
        ...(route.type ? [{ name: typeName, url: urlFor({ view: "resources", type: route.type }) }] : []),
        ...(context.resource ? [{ name: context.resource.title, url: urlFor(route) }] : []),
      ];
    }
    case "decks":
      return [home, { name: "العروض التفاعلية", url: urlFor({ view: "decks" }) }, ...(context.deck ? [{ name: context.deck.title, url: urlFor(route) }] : [])];
    case "test":
      return [home, { name: "التقويمات التفاعلية", url: urlFor({ view: "test" }) }, ...(route.bank ? [{ name: "تقويم المستوى", url: urlFor(route) }] : [])];
    case "dashboard":
      return [home, { name: "لوحة الأستاذ", url: urlFor({ view: "dashboard" }) }];
    default:
      return [home];
  }
}

function pageType(route: Route): "WebPage" | "CollectionPage" | "LearningResource" {
  if (route.view === "lesson" || route.view === "jadadat" && route.id) return "LearningResource";
  if (["lessons", "jadadat", "methods", "apps", "resources", "decks", "diagnostic"].includes(route.view)) return "CollectionPage";
  return "WebPage";
}

function jsonLdFor(route: Route, meta: Omit<SeoMetadata, "jsonLd">, context: SeoContext): Record<string, unknown> {
  const isPrivate = route.view === "dashboard";
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: SITE_NAME,
      description: meta.description,
      inLanguage: "ar-MA",
      publisher: { "@id": `${SITE_ORIGIN}/#teacher` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_ORIGIN}/#teacher`,
      name: TEACHER_NAME,
      jobTitle: "أستاذ مادة الاجتماعيات",
      affiliation: { "@id": `${SITE_ORIGIN}/#school` },
      url: `${SITE_ORIGIN}/about`,
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_ORIGIN}/#school`,
      name: SCHOOL_NAME,
      url: `${SITE_ORIGIN}/about`,
      address: { "@type": "PostalAddress", addressCountry: "MA", addressLocality: "القنيطرة" },
    },
  ];

  if (!isPrivate) {
    graph.push({
      "@type": pageType(route),
      "@id": `${meta.canonical}#page`,
      url: meta.canonical,
      name: meta.title,
      description: meta.description,
      inLanguage: "ar-MA",
      isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
      primaryImageOfPage: { "@type": "ImageObject", url: SEO_IMAGE },
    });
  }

  if (route.view === "lessons") {
    graph.push({
      "@type": "Course",
      "@id": `${meta.canonical}#course`,
      name: meta.title,
      description: meta.description,
      provider: { "@id": `${SITE_ORIGIN}/#school` },
      inLanguage: "ar-MA",
      educationalLevel: route.level ? levelLabel(route.level) : "الثانوي التأهيلي",
      about: SUBJECT_KEYWORDS,
    });
  }

  if (context.lesson) {
    graph.push({
      "@type": "LearningResource",
      "@id": `${meta.canonical}#learning-resource`,
      url: meta.canonical,
      name: context.lesson.title,
      description: meta.description,
      inLanguage: "ar-MA",
      learningResourceType: "درس",
      educationalLevel: context.lesson.level,
      about: context.lesson.subject,
      isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
      creator: { "@id": `${SITE_ORIGIN}/#teacher` },
    });
  }

  if (context.jadada) {
    graph.push({
      "@type": "LearningResource",
      "@id": `${meta.canonical}#jadada`,
      url: meta.canonical,
      name: context.jadada.title,
      description: meta.description,
      inLanguage: "ar-MA",
      learningResourceType: "جذاذة درس",
      educationalLevel: context.jadada.level,
      about: context.jadada.subject,
      creator: { "@id": `${SITE_ORIGIN}/#teacher` },
    });
  }

  if (meta.breadcrumbs.length > 1 && !isPrivate) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${meta.canonical}#breadcrumbs`,
      itemListElement: meta.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function getSeoMetadata(route: Route, context: SeoContext = {}): SeoMetadata {
  let title = "الاجتماعيات والتاريخ والجغرافيا بالمغرب | الأستاذ عماد طليل";
  let description = "موقع تعليمي لمادة الاجتماعيات بالمغرب يضم دروس التاريخ والجغرافيا، الجذاذات، الفروض، الخرائط والتقويم التشخيصي لمستويات الثانوي التأهيلي.";
  let keywords = commonKeywords(["دروس الاجتماعيات", "دروس التاريخ", "دروس الجغرافيا"]);
  let robots = "index,follow";
  let ogType: "website" | "article" = "website";

  switch (route.view) {
    case "about":
      title = "الأستاذ عماد طليل وثانوية القدس بالقنيطرة | الاجتماعيات";
      description = "تعرف على الأستاذ عماد طليل ومنصة الاجتماعيات التعليمية بثانوية القدس بالقنيطرة، ومجالات تعلم التاريخ والجغرافيا بالثانوي التأهيلي.";
      keywords = commonKeywords(["أستاذ الاجتماعيات", "ثانوية القدس القنيطرة"]);
      break;
    case "diagnostic":
      title = route.level
        ? `التقويم التشخيصي في الاجتماعيات — ${levelLabel(route.level)} | الأستاذ عماد طليل`
        : "التقويم التشخيصي في الاجتماعيات | الجذع المشترك والأولى والثانية بكالوريا";
      description = route.level
        ? `تقويم تشخيصي تفاعلي في مادة الاجتماعيات لفائدة ${levelLabel(route.level)}، يشمل التاريخ والجغرافيا ويقيس المكتسبات الأولية للتلميذ.`
        : "تقويم تشخيصي تفاعلي في الاجتماعيات لمستويات الجذع المشترك والأولى والثانية بكالوريا في التاريخ والجغرافيا.";
      keywords = commonKeywords(["التقويم التشخيصي", "الجذع المشترك", "الأولى بكالوريا", "الثانية بكالوريا"]);
      break;
    case "lessons":
      title = route.level
        ? `دروس الاجتماعيات — ${levelLabel(route.level)} | التاريخ والجغرافيا`
        : "دروس الاجتماعيات بالمغرب | التاريخ والجغرافيا | الأستاذ عماد طليل";
      description = route.level
        ? `دروس ${levelLabel(route.level)} في التاريخ والجغرافيا وفق تنظيم المستويات والمسالك بالثانوي التأهيلي بالمغرب.`
        : "دروس منظمة في مادة الاجتماعيات بالمغرب، تشمل التاريخ والجغرافيا لمستويات الجذع المشترك والأولى والثانية بكالوريا.";
      keywords = commonKeywords(["دروس الاجتماعيات", "دروس التاريخ", "دروس الجغرافيا", levelLabel(route.level)]);
      break;
    case "lesson":
      if (context.lesson) {
        title = `${context.lesson.title} | ${context.lesson.subject} — ${context.lesson.level} | الأستاذ عماد طليل`;
        description = `درس ${context.lesson.subject} بعنوان «${context.lesson.title}» لفائدة ${context.lesson.level}، ضمن وحدة ${context.lesson.unit} بمادة الاجتماعيات.`;
        keywords = commonKeywords([context.lesson.title, context.lesson.subject, context.lesson.level, "درس الاجتماعيات"]);
        ogType = "article";
      } else {
        title = "دروس الاجتماعيات | الأستاذ عماد طليل";
        description = "درس تعليمي في التاريخ والجغرافيا بالثانوي التأهيلي بالمغرب.";
      }
      break;
    case "jadadat":
      if (context.jadada) {
        title = `جذاذة ${context.jadada.title} | ${context.jadada.subject} — ${context.jadada.level}`;
        description = `جذاذة درس ${context.jadada.subject} بعنوان «${context.jadada.title}» لفائدة ${context.jadada.branch}، من إعداد الأستاذ عماد طليل.`;
        keywords = commonKeywords(["جذاذات الاجتماعيات", "جذاذة درس", context.jadada.title, context.jadada.level]);
        ogType = "article";
      } else {
        title = "جذاذات الاجتماعيات للثانوي التأهيلي | الأستاذ عماد طليل";
        description = "فهرس جذاذات الاجتماعيات المبنية على دروس الموقع، مع تنظيمها حسب المستوى والمسلك والمادة لفائدة أساتذة الثانوي التأهيلي.";
        keywords = commonKeywords(["جذاذات الاجتماعيات", "جذاذات التاريخ", "جذاذات الجغرافيا"]);
      }
      break;
    case "methods":
      title = context.methodology ? `${context.methodology.title} | منهجيات الاجتماعيات` : "منهجيات الاجتماعيات | تحليل الوثائق والكتابة";
      description = context.methodology?.description ?? "منهجيات عملية في الاجتماعيات لتحليل الوثائق التاريخية والجغرافية وقراءة الجداول والمبيانات وكتابة المقال.";
      keywords = commonKeywords(["منهجيات الاجتماعيات", "تحليل الوثائق", "منهجية التاريخ", "منهجية الجغرافيا"]);
      if (context.methodology) ogType = "article";
      break;
    case "apps":
      title = context.application ? `${context.application.title} | تطبيقات الاجتماعيات المصححة` : "تطبيقات وتمارين الاجتماعيات المصححة | الثانوي التأهيلي";
      description = context.application?.description ?? "تطبيقات وتمارين مصححة في التاريخ والجغرافيا، منظمة حسب المستوى والمهارة لفائدة تلاميذ الثانوي التأهيلي.";
      keywords = commonKeywords(["تمارين الاجتماعيات", "تطبيقات التاريخ والجغرافيا", "تمارين مصححة"]);
      if (context.application) ogType = "article";
      break;
    case "resources": {
      const typeName = route.type ? RESOURCE_LABELS[route.type] ?? "الموارد التعليمية" : "الموارد التعليمية";
      title = context.resource ? `${context.resource.title} | ${typeName} | الاجتماعيات` : `${typeName} | الاجتماعيات بالمغرب`;
      description = context.resource?.description ?? `مورد تعليمي في مادة الاجتماعيات: ${typeName}، لفائدة مستويات الثانوي التأهيلي بالمغرب.`;
      keywords = commonKeywords([typeName, "فروض الاجتماعيات", "تصحيح فروض الاجتماعيات", "خرائط التاريخ والجغرافيا"]);
      if (context.resource) ogType = "article";
      break;
    }
    case "decks":
      title = context.deck ? `${context.deck.title} | عرض التاريخ والجغرافيا` : "العروض التفاعلية في التاريخ والجغرافيا | الاجتماعيات";
      description = context.deck
        ? `عرض تفاعلي في ${context.deck.subject} لفائدة ${context.deck.level}، مبني على صفحات الكتاب المدرسي وأنشطة الاشتغال على الوثائق.`
        : "عروض تفاعلية في التاريخ والجغرافيا مبنية على الكتاب المدرسي لفائدة تلاميذ الثانوي التأهيلي.";
      keywords = commonKeywords(["العروض التفاعلية", "عروض التاريخ والجغرافيا", "الكتاب المدرسي"]);
      if (context.deck) ogType = "article";
      break;
    case "test":
      title = route.bank ? "تقويم تفاعلي في الاجتماعيات | التاريخ والجغرافيا" : "فروض الاجتماعيات مع التصحيح | التقويمات التفاعلية";
      description = route.bank
        ? "تقويم تفاعلي في مادة الاجتماعيات لقياس مكتسبات التاريخ والجغرافيا حسب المستوى الدراسي."
        : "تقويمات وفروض تفاعلية في الاجتماعيات مع تصحيح آلي لمستويات الثانوي التأهيلي بالمغرب.";
      keywords = commonKeywords(["فروض الاجتماعيات", "تصحيح فروض الاجتماعيات", "تقويم تفاعلي"]);
      break;
    case "dashboard":
      title = "لوحة الأستاذ | فضاء الاجتماعيات — عماد طليل";
      description = "لوحة خاصة لإدارة نتائج التقويم والتقارير التعليمية للأستاذ عماد طليل.";
      keywords = ["لوحة الأستاذ", "إدارة النتائج"];
      robots = "noindex,nofollow,noarchive";
      break;
    default:
      break;
  }

  const canonical = urlFor(route);
  const breadcrumbs = breadcrumbsFor(route, context);
  const withoutJsonLd: Omit<SeoMetadata, "jsonLd"> = {
    title: cleanText(title),
    description: cleanText(description),
    keywords: keywords.filter(Boolean),
    canonical,
    robots,
    ogType,
    breadcrumbs,
  };
  return { ...withoutJsonLd, jsonLd: jsonLdFor(route, withoutJsonLd, context) };
}
