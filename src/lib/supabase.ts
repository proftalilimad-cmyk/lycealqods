import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * إعدادات Supabase العامة التي يسمح بها المتصفح.
 *
 * لا نقرأ ولا نخزن service_role أو أي مفتاح سري. مفتاح anon وpublicSiteKey
 * مخصصان للعميل العام، وتبقى الخصوصية الحقيقية من مسؤولية RLS وRPC داخل
 * Supabase.
 */
export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  publicSiteKey: string;
  teacherEmail: string;
}

export type SupabaseConfigSource = "vite" | "runtime" | "local" | "none";

export interface ResolvedSupabaseConfig extends SupabaseConfig {
  sources: Record<keyof SupabaseConfig, SupabaseConfigSource>;
}

export type ConnectionCheck = "ok" | "error" | "unknown";

export interface SupabaseConnectionReport {
  status: "connected" | "error" | "unconfigured";
  url: ConnectionCheck;
  publicKey: ConnectionCheck;
  publicSiteKey: ConnectionCheck;
  teacherEmail: ConnectionCheck;
  database: ConnectionCheck;
  rls: ConnectionCheck;
  message: string;
  technical?: string;
}

export const SUPABASE_LOCAL_CONFIG_KEY = "lyceum_supabase_config_v1";
export const SUPABASE_CONFIG_CHANGED_EVENT = "lyceum:supabase-config-changed";

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const runtimeConfig = typeof window !== "undefined" ? window.__LYCEUM_RUNTIME_CONFIG__ : undefined;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** لا نقبل أي قيمة تبدو كمفتاح خدمة أو مفتاح سري داخل إعدادات المتصفح. */
export function containsForbiddenSupabaseSecret(value: string): boolean {
  return /(service[_-]?role|secret[_-]?key|sb_secret)/i.test(value);
}

function safePublicValue(value: unknown): string {
  const cleaned = clean(value);
  return containsForbiddenSupabaseSecret(cleaned) ? "" : cleaned;
}

function emptyConfig(): SupabaseConfig {
  return { supabaseUrl: "", supabaseAnonKey: "", publicSiteKey: "", teacherEmail: "" };
}

function readLocalConfig(): SupabaseConfig {
  if (typeof window === "undefined") return emptyConfig();
  try {
    const raw = window.localStorage.getItem(SUPABASE_LOCAL_CONFIG_KEY);
    if (!raw) return emptyConfig();
    const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
    return {
      supabaseUrl: clean(parsed.supabaseUrl),
      supabaseAnonKey: safePublicValue(parsed.supabaseAnonKey),
      publicSiteKey: safePublicValue(parsed.publicSiteKey),
      teacherEmail: clean(parsed.teacherEmail),
    };
  } catch {
    return emptyConfig();
  }
}

function pick(
  viteValue: string | undefined,
  runtimeValue: string | undefined,
  localValue: string,
): { value: string; source: SupabaseConfigSource } {
  const vite = clean(viteValue);
  if (vite) return { value: vite, source: "vite" };
  const runtime = clean(runtimeValue);
  if (runtime) return { value: runtime, source: "runtime" };
  if (localValue) return { value: localValue, source: "local" };
  return { value: "", source: "none" };
}

/**
 * أولوية الإعدادات المطلوبة: Vite/Netlify ثم runtime-config.js ثم الإعداد
 * المحلي العام الذي يحفظه الأستاذ من لوحة الإعدادات.
 */
export function getSupabaseConfig(): ResolvedSupabaseConfig {
  const local = readLocalConfig();
  const url = pick(runtimeEnv.VITE_SUPABASE_URL, runtimeConfig?.supabaseUrl, local.supabaseUrl);
  const anonKey = pick(runtimeEnv.VITE_SUPABASE_ANON_KEY, runtimeConfig?.supabaseAnonKey, local.supabaseAnonKey);
  const publicSiteKey = pick(runtimeEnv.VITE_PUBLIC_SITE_KEY, runtimeConfig?.publicSiteKey, local.publicSiteKey);
  const teacherEmail = pick(
    runtimeEnv.VITE_SUPABASE_TEACHER_EMAIL ?? runtimeEnv.VITE_TEACHER_EMAIL,
    runtimeConfig?.teacherEmail,
    local.teacherEmail,
  );
  return {
    supabaseUrl: url.value,
    supabaseAnonKey: safePublicValue(anonKey.value),
    publicSiteKey: safePublicValue(publicSiteKey.value),
    teacherEmail: teacherEmail.value,
    sources: {
      supabaseUrl: url.source,
      supabaseAnonKey: anonKey.source,
      publicSiteKey: publicSiteKey.source,
      teacherEmail: teacherEmail.source,
    },
  };
}

/** تُحفظ إعدادات عامة فقط؛ لا تُستعمل هذه المساحة لتخزين نتائج التلاميذ. */
export function saveLocalSupabaseConfig(config: SupabaseConfig): void {
  if (containsForbiddenSupabaseSecret(config.supabaseAnonKey) || containsForbiddenSupabaseSecret(config.publicSiteKey)) {
    throw new Error("لا يمكن حفظ مفتاح service_role أو أي مفتاح سري داخل المتصفح.");
  }
  if (typeof window === "undefined") return;
  const value: SupabaseConfig = {
    supabaseUrl: clean(config.supabaseUrl),
    supabaseAnonKey: clean(config.supabaseAnonKey),
    publicSiteKey: clean(config.publicSiteKey),
    teacherEmail: clean(config.teacherEmail),
  };
  window.localStorage.setItem(SUPABASE_LOCAL_CONFIG_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_CHANGED_EVENT));
}

export function clearLocalSupabaseConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SUPABASE_LOCAL_CONFIG_KEY);
  window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_CHANGED_EVENT));
}

export function getTeacherEmail(): string {
  return getSupabaseConfig().teacherEmail;
}

export function getPublicSiteKey(): string {
  return getSupabaseConfig().publicSiteKey;
}

function validSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** يبني عميلًا من إعدادات صريحة حتى يمكن اختبار ما كتبه الأستاذ قبل حفظه. */
export function createSupabaseClient(config: Pick<SupabaseConfig, "supabaseUrl" | "supabaseAnonKey">): SupabaseClient | null {
  const supabaseUrl = config.supabaseUrl.trim();
  const supabaseAnonKey = config.supabaseAnonKey.trim();
  if (!supabaseUrl || !supabaseAnonKey || containsForbiddenSupabaseSecret(supabaseAnonKey)) return null;
  if (!validSupabaseUrl(supabaseUrl)) return null;
  try {
    return createClient(supabaseUrl.replace(/\/+$/, ""), supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    return null;
  }
}

let client: SupabaseClient | null = null;
let clientKey = "";

/** عميل قاعدة البيانات المركزي بحسب الإعداد الفعّال الحالي. */
export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const nextKey = `${config.supabaseUrl}\u0000${config.supabaseAnonKey}`;
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
  if (client && clientKey === nextKey) return client;
  client = createSupabaseClient(config);
  clientKey = client ? nextKey : "";
  return client;
}

export function isCloudConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

/** إرسال نتائج التلاميذ جاهز بعد إضافة مفتاح الموقع المربوط بالأستاذ. */
export function isAssessmentSubmissionConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.supabaseUrl && config.supabaseAnonKey && config.publicSiteKey);
}

export function isSupabaseClientConfigured(): boolean {
  return isCloudConfigured();
}

function errorFields(error: unknown): { code: string; message: string; status?: number } {
  if (!error || typeof error !== "object") return { code: "", message: String(error ?? "") };
  const value = error as { code?: unknown; message?: unknown; status?: unknown; statusCode?: unknown };
  const status = Number(value.status ?? value.statusCode);
  return {
    code: String(value.code ?? ""),
    message: String(value.message ?? ""),
    status: Number.isFinite(status) && status > 0 ? status : undefined,
  };
}

function isForbiddenByRls(error: unknown): boolean {
  const { code, message, status } = errorFields(error);
  return code === "42501" || status === 403 || /row[- ]level security|permission denied|not allowed|policy/i.test(message);
}

function isInvalidKey(error: unknown): boolean {
  const { message, status } = errorFields(error);
  return status === 401 || /invalid (api )?key|jwt|apikey|authentication/i.test(message);
}

function isMissingTable(error: unknown): boolean {
  const { code, message } = errorFields(error);
  return code === "PGRST205" || /relation .* does not exist|could not find the table|schema cache/i.test(message);
}

function technicalError(error: unknown): string {
  const { code, message, status } = errorFields(error);
  return [code && `code=${code}`, status && `status=${status}`, message].filter(Boolean).join(" · ") || "Unknown Supabase error";
}

/**
 * اختبار حقيقي غير تعديلي: نطلب صفًا من جدول النتائج. لا نكتب ولا نقرأ
 * بيانات التلاميذ فعليًا؛ ورفض anon المتوقع بسبب RLS يُعد دليلًا على أن
 * قاعدة البيانات وصلت وأن المنع العام يعمل.
 */
export async function testSupabaseConnection(config: SupabaseConfig = getSupabaseConfig()): Promise<SupabaseConnectionReport> {
  const urlConfigured = validSupabaseUrl(config.supabaseUrl);
  const publicKeyConfigured = Boolean(config.supabaseAnonKey) && !containsForbiddenSupabaseSecret(config.supabaseAnonKey);
  const siteKeyConfigured = Boolean(config.publicSiteKey);
  const emailConfigured = Boolean(config.teacherEmail);
  const base = {
    url: urlConfigured ? ("ok" as const) : ("error" as const),
    publicKey: publicKeyConfigured ? ("ok" as const) : ("error" as const),
    publicSiteKey: siteKeyConfigured ? ("ok" as const) : ("error" as const),
    teacherEmail: emailConfigured ? ("ok" as const) : ("unknown" as const),
  };

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return { ...base, status: "unconfigured", database: "unknown", rls: "unknown", message: "Supabase غير مهيأ: أدخل رابط المشروع والمفتاح العمومي." };
  }
  if (!urlConfigured) {
    return { ...base, status: "error", database: "error", rls: "unknown", message: "تعذر الاتصال بقاعدة البيانات: رابط Supabase غير صالح." };
  }
  if (!publicKeyConfigured) {
    return { ...base, status: "error", database: "error", rls: "unknown", message: "تعذر المصادقة: المفتاح العمومي غير صالح أو يبدو مفتاحًا سريًا." };
  }

  const client = createSupabaseClient(config);
  if (!client) {
    return { ...base, status: "error", database: "error", rls: "unknown", message: "تعذر إنشاء عميل Supabase." };
  }

  try {
    const { data, error } = await client.from("student_submissions").select("id").limit(1);
    if (!error) {
      return {
        ...base,
        status: "connected",
        database: "ok",
        // إذا أُعيدت صفوف anon فهذه إشارة تستوجب مراجعة RLS؛ لا ندعي نجاح RLS.
        rls: data && data.length > 0 ? "error" : "unknown",
        message: data && data.length > 0
          ? "تم الاتصال، لكن يجب مراجعة RLS لأن القراءة العامة أعادت بيانات."
          : "تم الاتصال بقاعدة بيانات Supabase بنجاح. تعذر الجزم بسياسة RLS من نتيجة فارغة فقط.",
        technical: data && data.length > 0 ? "anon SELECT returned rows" : "student_submissions responded without rows",
      };
    }
    if (isForbiddenByRls(error)) {
      return {
        ...base,
        status: "connected",
        database: "ok",
        rls: "ok",
        message: "تم الاتصال بقاعدة بيانات Supabase بنجاح، ورفضت RLS القراءة العامة كما هو متوقع.",
        technical: technicalError(error),
      };
    }
    if (isInvalidKey(error)) {
      return { ...base, status: "error", database: "error", rls: "unknown", message: "تعذر المصادقة: المفتاح العمومي غير صحيح.", technical: technicalError(error) };
    }
    if (isMissingTable(error)) {
      return { ...base, status: "error", database: "error", rls: "error", message: "تم الوصول إلى Supabase، لكن جدول student_submissions غير موجود. شغّل migration أولًا.", technical: technicalError(error) };
    }
    return { ...base, status: "error", database: "error", rls: "unknown", message: "تعذر الاتصال بقاعدة البيانات.", technical: technicalError(error) };
  } catch (error) {
    return { ...base, status: "error", database: "error", rls: "unknown", message: "تعذر الاتصال بقاعدة البيانات.", technical: error instanceof Error ? error.message : "Failed to fetch" };
  }
}

export function cloudConfigHint(): string {
  const config = getSupabaseConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) return "أضف VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY في Netlify (أو SUPABASE_URL أو SUPABASE_DATABASE_URL مع SUPABASE_ANON_KEY إذا أنشأهما التكامل) ثم أعد Deploy؛ وللرفع اليدوي عدّل runtime-config.js.";
  if (!config.publicSiteKey) return "أضف VITE_PUBLIC_SITE_KEY في Netlify (أو SUPABASE_PUBLIC_SITE_KEY) واربطه بحساب الأستاذ في جدول teacher_public_keys ثم أعد Deploy.";
  return "إعداد Supabase موجود؛ إذا فشل الحفظ اختبر الاتصال وراجع migration وسياسات RLS.";
}
