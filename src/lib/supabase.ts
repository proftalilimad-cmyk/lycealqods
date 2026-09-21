import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * عميل قاعدة البيانات المركزي.
 *
 * لا نضع أي مفتاح سري هنا: VITE_SUPABASE_ANON_KEY مفتاح عام مخصص للمتصفح،
 * وتُفرض الخصوصية الحقيقية بواسطة RLS داخل Supabase. إن لم تُضبط المتغيرات
 * يبقى الموقع صالحًا للمعاينة المحلية، لكن لا ندّعي أن الحفظ مركزي.
 */
const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const url = (runtimeEnv.VITE_SUPABASE_URL ?? "").trim();
const anonKey = (runtimeEnv.VITE_SUPABASE_ANON_KEY ?? "").trim();
/** Public write-only key used by the student diagnostic form. It never grants SELECT. */
export const publicSiteKey = (runtimeEnv.VITE_PUBLIC_SITE_KEY ?? "").trim();

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
  if (!url || !anonKey) return "أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى متغيرات بيئة Netlify ثم أعد البناء.";
  return "أضف VITE_PUBLIC_SITE_KEY واربطه بحساب الأستاذ في جدول teacher_public_keys ثم أعد البناء.";
}
