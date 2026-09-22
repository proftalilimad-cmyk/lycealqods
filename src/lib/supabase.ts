import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * عميل قاعدة البيانات المركزي.
 *
 * لا نضع أي مفتاح سري هنا: VITE_SUPABASE_ANON_KEY مفتاح عام مخصص للمتصفح،
 * وتُفرض الخصوصية الحقيقية بواسطة RLS داخل Supabase. إن لم تُضبط المتغيرات
 * يبقى الموقع صالحًا للمعاينة المحلية، لكن لا ندّعي أن الحفظ مركزي.
 *
 * تُقرأ الإعدادات أولًا من runtime-config.js حتى تعمل النسخة الثابتة التي
 * تُرفع يدويًا إلى Hostinger أو أي خادم ملفات دون إعادة بناء. وتبقى متغيرات
 * Vite أولوية بديلة مناسبة لـ Netlify وبيئات البناء.
 */
const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const runtimeConfig = typeof window !== "undefined" ? window.__LYCEUM_RUNTIME_CONFIG__ : undefined;

function firstConfigured(...values: Array<string | undefined>): string {
  return values.find((value) => Boolean(value?.trim()))?.trim() ?? "";
}

const url = firstConfigured(runtimeEnv.VITE_SUPABASE_URL, runtimeConfig?.supabaseUrl);
const anonKey = firstConfigured(runtimeEnv.VITE_SUPABASE_ANON_KEY, runtimeConfig?.supabaseAnonKey);
/** Public write-only key used by the student diagnostic form. It never grants SELECT. */
export const publicSiteKey = firstConfigured(runtimeEnv.VITE_PUBLIC_SITE_KEY, runtimeConfig?.publicSiteKey);
export const teacherEmail = firstConfigured(runtimeEnv.VITE_SUPABASE_TEACHER_EMAIL, runtimeConfig?.teacherEmail);

let client: SupabaseClient | null = null;

/** قاعدة البيانات وAuth جاهزان للوحة الأستاذ والتقارير. */
export function isCloudConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** إرسال نتائج التلاميذ جاهز بعد إضافة مفتاح الموقع المربوط بالأستاذ. */
export function isAssessmentSubmissionConfigured(): boolean {
  return Boolean(url && anonKey && publicSiteKey);
}

export function isSupabaseClientConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseClientConfigured()) return null;
  if (!client) client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function cloudConfigHint(): string {
  if (!url || !anonKey) return "أضف VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY في Netlify (أو SUPABASE_URL أو SUPABASE_DATABASE_URL مع SUPABASE_ANON_KEY إذا أنشأهما التكامل) ثم أعد Deploy؛ وللرفع اليدوي عدّل runtime-config.js.";
  return "أضف VITE_PUBLIC_SITE_KEY في Netlify (أو SUPABASE_PUBLIC_SITE_KEY) واربطه بحساب الأستاذ في جدول teacher_public_keys ثم أعد Deploy.";
}
