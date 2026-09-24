import { useEffect } from "react";
import type { SeoMetadata } from "../lib/seo";

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(url: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.href = url;
}

/** يحدّث وسم الصفحة دون إعادة تصميم الواجهة أو تكرار عناصر head عند التنقل داخل SPA. */
export default function SeoHead({ metadata }: { metadata: SeoMetadata }) {
  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.title = metadata.title;

    upsertMeta("name", "description", metadata.description);
    upsertMeta("name", "keywords", metadata.keywords.join(", "));
    upsertMeta("name", "robots", metadata.robots);
    upsertMeta("name", "author", "الأستاذ عماد طليل");
    upsertMeta("property", "og:title", metadata.title);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("property", "og:type", metadata.ogType);
    upsertMeta("property", "og:url", metadata.canonical);
    upsertMeta("property", "og:site_name", "فضاء الاجتماعيات — الأستاذ عماد طليل");
    upsertMeta("property", "og:locale", "ar_MA");
    upsertMeta("property", "og:image", `${new URL("/og-cover.png", metadata.canonical).href}`);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", "فضاء الاجتماعيات — الأستاذ عماد طليل، ثانوية القدس، القنيطرة");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", metadata.title);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("name", "twitter:image", `${new URL("/og-cover.png", metadata.canonical).href}`);
    upsertCanonical(metadata.canonical);

    let jsonLd = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld="true"]');
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.type = "application/ld+json";
      jsonLd.dataset.seoJsonld = "true";
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify(metadata.jsonLd);
  }, [metadata]);

  return null;
}
