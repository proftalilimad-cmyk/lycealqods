import { useState } from "react";

/* ============================================================
   خريطة حي ميموزا — القنيطرة (نمط Google Maps / صورة قمرية)
   مكوّن مشترك: يُستعمل في بطاقة السؤال (التقويم) وفي عارض الوثائق.
   المحاكاة بصرية لأغراض التمرين والمواضع تقريبية.
   ============================================================ */

/** شارة تسمية فوق الخريطة/الصورة القمرية */
function MapChip({ x, y, w, text, color }: { x: number; y: number; w: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 21} width={w} height={36} rx={11} fill="#ffffff" opacity="0.95" stroke={color} strokeWidth="2.5" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="19" fontWeight="800" fill="#0b1d17">
        {text}
      </text>
    </g>
  );
}

/**
 * وثيقة خريطة حي ميموزا — القنيطرة (نمط Google Maps / Google Earth):
 * طبقتان قابلتان للتبديل (خريطة شارع + صورة قمرية) بنفس المعالم والمواضع،
 * مع مفتاح ومؤشر شمال ومقياس: ثانوية القدس هي المدرسة وسط المخطط.
 * المحاكاة بصرية لأغراض التمرين، والمواضع تقريبية.
 */
export default function MimosaMap() {
  const [layer, setLayer] = useState<"map" | "aerial">("map");
  return (
    <figure className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
      {/* مبدّل الطبقتين */}
      <div className="flex items-center justify-between gap-2 border-b border-ink-900/8 bg-cream px-3 py-2">
        <span className="text-[10px] font-extrabold text-ink-500">حي ميموزا — القنيطرة</span>
        <div className="flex overflow-hidden rounded-lg border border-ink-900/12" role="group" aria-label="اختيار طبقة الخريطة">
          <button
            type="button"
            onClick={() => setLayer("map")}
            aria-pressed={layer === "map"}
            className={`px-3 py-1.5 text-[10px] font-extrabold transition-colors ${layer === "map" ? "bg-brand-600 text-white" : "bg-white text-ink-700 hover:bg-brand-50"}`}
          >
            خريطة (نمط Google Maps)
          </button>
          <button
            type="button"
            onClick={() => setLayer("aerial")}
            aria-pressed={layer === "aerial"}
            className={`px-3 py-1.5 text-[10px] font-extrabold transition-colors ${layer === "aerial" ? "bg-brand-600 text-white" : "bg-white text-ink-700 hover:bg-brand-50"}`}
          >
            صورة قمرية
          </button>
        </div>
      </div>

      <div className="relative" style={{ aspectRatio: "1408 / 768" }}>
        <img
          src="/images/mimosa-map.jpg"
          alt="خريطة رقمية تعليمية لحي ميموزا بالقنيطرة: ثانوية القدس وسط المخطط، مسجد في الشمال الغربي، مجرى مائي في الجنوب الشرقي، شارع رئيسي من الشرق إلى الغرب وحديقة في الجنوب الغربي"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${layer === "map" ? "opacity-100" : "opacity-0"}`}
        />
        <img
          src="/images/mimosa-aerial.jpg"
          alt="صورة قمرية تعليمية لحي ميموزا بالقنيطرة بنفس المعالم: ثانوية القدس وسط المخطط، مسجد في الشمال الغربي، مجرى مائي في الجنوب الشرقي، شارع رئيسي وحديقة"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${layer === "aerial" ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
        />
        <svg viewBox="0 0 1408 768" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          {/* إطار ثانوية القدس */}
          <rect x="340" y="228" width="292" height="314" rx="14" fill="none" stroke="#d99e37" strokeWidth="4" strokeDasharray="14 10" />
          <circle cx="432" cy="386" r="11" fill="#d99e37" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={486} y={206} w={216} text="ثانوية القدس" color="#d99e37" />

          {/* المسجد */}
          <circle cx="182" cy="152" r="10" fill="#0f7c5b" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={200} y={106} w={140} text="مسجد الحي" color="#0f7c5b" />

          {/* المجرى المائي */}
          <circle cx="1188" cy="597" r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={1180} y={548} w={150} text="مجرى مائي" color="#0284c7" />

          {/* الحديقة */}
          <circle cx="156" cy="630" r="10" fill="#16a34a" stroke="#ffffff" strokeWidth="4" />
          <MapChip x={186} y={582} w={150} text="حديقة الحي" color="#16a34a" />

          {/* الشارع الرئيسي شرق-غرب */}
          <line x1="648" y1="406" x2="1330" y2="406" stroke={layer === "map" ? "#33473f" : "#ffffff"} strokeWidth="5" strokeDasharray="26 18" opacity="0.85" />
          <MapChip x={985} y={368} w={300} text="الشارع الرئيسي (شرق – غرب)" color="#33473f" />

          {/* مؤشر الشمال */}
          <g>
            <circle cx="1330" cy="66" r="34" fill="#ffffff" opacity="0.95" stroke="#33473f" strokeWidth="2.5" />
            <polygon points="1330,40 1342,74 1330,65 1318,74" fill="#0f7c5b" />
            <text x="1330" y="92" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0b1d17">
              شمال
            </text>
          </g>

          {/* مقياس الرسم */}
          <g>
            <rect x="46" y="684" width="248" height="58" rx="12" fill="#ffffff" opacity="0.95" stroke="#33473f" strokeWidth="2" />
            <rect x="66" y="712" width="80" height="9" fill="#0b1d17" />
            <rect x="146" y="712" width="80" height="9" fill="#ffffff" stroke="#0b1d17" strokeWidth="1.5" />
            <text x="66" y="706" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0b1d17">0</text>
            <text x="146" y="706" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0b1d17">50</text>
            <text x="226" y="706" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0b1d17">100 م</text>
            <text x="270" y="722" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5b6e66">مقياس تقريبي</text>
          </g>
        </svg>
      </div>

      <figcaption className="space-y-2 border-t border-ink-900/8 bg-cream p-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-ink-700">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-gold-500" aria-hidden="true" />
            ثانوية القدس (المدرسة)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand-600" aria-hidden="true" />
            مسجد الحي
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sky-600" aria-hidden="true" />
            مجرى مائي
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-600" aria-hidden="true" />
            حديقة الحي
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-ink-700" aria-hidden="true" />
            الشارع الرئيسي
          </li>
        </ul>
        <p className="text-[10px] leading-relaxed text-ink-500">
          محاكاة تعليمية لنمط خرائط Google (خريطة شارع وصورة قمرية) لحي ميموزا — القنيطرة؛ المواضع تقريبية لأغراض التمرين.
          بدّل الطبقة لتدريب التلاميذ على قراءة الخريطة والصورة القمرية، ووجِّه الوثيقة دائمًا بمؤشر الشمال قبل تحديد الجهات.
        </p>
      </figcaption>
    </figure>
  );
}

