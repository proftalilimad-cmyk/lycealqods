import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { routeToHash, type Route } from "../routes";
import { cn } from "../utils/cn";

interface CopyLinkButtonProps {
  /** الشاشة التي يُنسخ رابطها */
  route: Route;
  /** نص الزر (افتراضيًا: نسخ الرابط) */
  label?: string;
  className?: string;
  /** وصف يُقرأ لقارئات الشاشة */
  ariaLabel?: string;
}

/** الرابط المطلق للشاشة: يستعمل العنوان الحالي حتى يعمل خلف وسيط المعاينة أو الاستضافة */
export function absoluteRouteUrl(route: Route): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${routeToHash(route)}`;
}

/** نسخ نص إلى الحافظة مع بديل للمتصفحات التي تمنع Clipboard API (سياق غير آمن) */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* نحوّل إلى البديل أدناه */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/**
 * زر «نسخ الرابط»: يسمح للأستاذ بمشاركة رابط درس أو عرض أو مورد
 * مباشرة مع التلاميذ (واتساب، Classroom…)، ويفتح الرابط على الشاشة نفسها.
 */
export default function CopyLinkButton({ route, label = "نسخ الرابط", className, ariaLabel }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const onCopy = useCallback(async () => {
    const ok = await copyText(absoluteRouteUrl(route));
    setCopied(ok);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  }, [route]);

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={ariaLabel ?? `نسخ رابط ${label}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-700 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md",
        copied && "border-brand-400 bg-brand-50 text-brand-800",
        className
      )}
    >
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
      {copied ? "تم نسخ الرابط" : label}
    </button>
  );
}
