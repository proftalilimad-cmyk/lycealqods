/* ============================================================
   ولوج لوحة الأستاذ — اسم مستخدم + كلمة مرور
   ============================================================

   ⚠️ ملاحظة صريحة للأستاذ (مهمّة):
   عند عدم ضبط Supabase يكون الموقع ثابتًا (HTML/CSS/JS فقط)، لذلك لا توجد
   حماية سرّية حقيقية يمكن تحقيقها من داخل المتصفح وحده. عند ضبط Supabase
   يستعمل الدخول Supabase Auth، وتفرض RLS حماية التقارير والنتائج المركزية.
   ما يفعله هذا القفل فعليًا:

     1) يحجب اللوحة عن التلاميذ والزوّار: لا نتائج، لا تصدير، لا أزرار
        مسح إلا بعد إدخال اسم المستعمل وكلمة المرور.
     2) لا يخزّن كلمة المرور أبدًا، بل «بصمتها» فقط:
        SHA-256 عندما يكون السياق آمنًا (https أو localhost)،
        وإلا بصمة بديلة ثابتة الخوارزمية حتى يشتغل القفل في كل الحالات.
     3) محاولات خاطئة متكررة ← انتظار 30 ثانية (حدّ من التخمين الآلي).

   أمّا الحماية الحقيقية (منع من يعرف تقنية الويب من تجاوز القفل)
   فتتطلّب أحد هذه الحلول خارج كود الموقع:
     • كلمة مرور على مستوى الاستضافة (HTTP auth / cPanel «Directory Privacy»).
     • Netlify أو Vercel: حماية صفحة بكلمة مرور (خطة مؤدى عنها).
     • ملف ‎.htaccess + ‎.htpasswd في مجلد اللوحة (استضافة Apache).
     • خادم صغير (Node/PHP) يتحقّق من الجلسة قبل إرسال الصفحة.

   البيانات الافتراضية الأولى (تُغيَّر من داخل اللوحة ← «الدخول والأمان»):
     اسم المستعمل: imad
     كلمة المرور : qods2026
   ============================================================ */
import { isCloudConfigured } from "./supabase";
import { signInTeacher, signOutTeacher, updateTeacherCredentials } from "./cloudStorage";

export type HashAlgo = "sha256" | "fnv";

const AUTH_KEY = "talil_teacher_auth_v1";
/* إصدار الجلسة v2 يبطل أي جلسة قديمة كانت تسمح بالولوج التلقائي. */
const SESSION_KEY = "talil_teacher_session_v2";
const LEGACY_SESSION_KEY = "talil_teacher_session_v1";
const LEGACY_REMEMBER_KEY = "talil_teacher_remember_v1";
const FAIL_KEY = "talil_teacher_fails_v1";

export const MAX_FAILS = 5;
export const LOCKOUT_MS = 30_000;

/** اسم المستعمل الافتراضي (ظاهر لأن تغييره يتم من اللوحة) */
export const DEFAULT_USER = "imad";

/** بصمات كلمة المرور الافتراضية «qods2026» — لا تُخزَّن الكلمة نفسها */
const DEFAULT_HASH: Record<HashAlgo, string> = {
  sha256: "82e231603dd90af7f624f81994d6e427603f719909e99ed0af7c49ebd097c700",
  fnv: "993b77363abeef3f9d281ebed064ea4f7a4a73032e6a5a7905eae0535e5d3bce",
};

export interface StoredCreds {
  user: string;
  hash: string;
  algo: HashAlgo;
  /** هل غيّر الأستاذ البيانات الافتراضية؟ */
  custom: boolean;
}

/* ------------------------------ أدوات التخزين ------------------------------ */

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* تخزين غير متاح (وضع خاص) — القفل يشتغل داخل الجلسة فقط */
  }
}

function lsDel(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* */
  }
}

function ssGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function ssSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* */
  }
}

function ssDel(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* */
  }
}

/* --------------------------------- البصمة --------------------------------- */

/** الخوارزمية المتاحة في سياق التصفح الحالي */
export function supportedAlgo(): HashAlgo {
  return typeof crypto !== "undefined" && crypto.subtle ? "sha256" : "fnv";
}

/** بصمة بديلة (عند غياب السياق الآمن) — ليست سرّية، لكنها تمنع تخزين الكلمة كما هي */
function fnvDigest(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b + c + i, 0x85ebca6b) >>> 0;
  }
  let out = "";
  for (let r = 0; r < 4; r += 1) {
    a = Math.imul(a ^ (b + r), 0x27d4eb2d) >>> 0;
    b = Math.imul(b ^ (a + r + 1), 0x165667b1) >>> 0;
    out += a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
  }
  return out;
}

/** بصمة كلمة المرور حسب الخوارزمية */
export async function digest(text: string, algo: HashAlgo = supportedAlgo()): Promise<string> {
  if (algo === "fnv") return fnvDigest(text);
  try {
    const bytes = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buf))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return fnvDigest(text);
  }
}

/* ------------------------------- الاعتمادات ------------------------------- */

function parseCreds(raw: string | null): StoredCreds | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<StoredCreds>;
    if (!o || typeof o.user !== "string" || typeof o.hash !== "string") return null;
    const algo: HashAlgo = o.algo === "fnv" ? "fnv" : "sha256";
    return { user: o.user, hash: o.hash, algo, custom: o.custom === true };
  } catch {
    return null;
  }
}

/** الاعتمادات المخزّنة (أو null إن كانت ما تزال الافتراضية) */
export function readCreds(): StoredCreds | null {
  return parseCreds(lsGet(AUTH_KEY));
}

/** الاعتمادات الفعلية المستعملة في التحقّق */
export async function activeCreds(): Promise<StoredCreds> {
  const stored = readCreds();
  if (stored) return stored;
  if (isCloudConfigured()) {
    return {
      user: (import.meta.env.VITE_SUPABASE_TEACHER_EMAIL ?? "الأستاذ عبر Supabase").trim(),
      hash: "",
      algo: "sha256",
      custom: true,
    };
  }
  const algo = supportedAlgo();
  return { user: DEFAULT_USER, hash: DEFAULT_HASH[algo], algo, custom: false };
}

/** هل ما يزال الأستاذ يستعمل البيانات الافتراضية؟ (لتنبيهه) */
export function usingDefaults(): boolean {
  return readCreds() === null;
}

const sameUser = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** التحقّق من اسم المستعمل وكلمة المرور */
export async function verifyLogin(user: string, password: string): Promise<boolean> {
  if (isCloudConfigured()) {
    const configuredEmail = (import.meta.env.VITE_SUPABASE_TEACHER_EMAIL ?? "").trim();
    const email = user.includes("@") ? user.trim() : configuredEmail;
    if (!email) return false;
    const result = await signInTeacher(email, password);
    return result.ok;
  }
  const creds = await activeCreds();
  if (!sameUser(user, creds.user)) return false;
  const algo: HashAlgo = creds.algo === "fnv" || !crypto.subtle ? "fnv" : "sha256";
  if (algo !== creds.algo) {
    /* السياق تغيّر (https ← http): نعيد حساب بصمة الكلمة الافتراضية بالخوارزمية المتاحة */
    if (!creds.custom) {
      return (await digest(password, algo)) === DEFAULT_HASH[algo];
    }
    return false;
  }
  return (await digest(password, algo)) === creds.hash;
}

/* --------------------------------- الجلسة --------------------------------- */

/** هل اللوحة مفتوحة في جلسة التبويب الحالية؟ */
export function isUnlocked(): boolean {
  /* لا نعتمد localStorage حتى لا يفتح رابط اللوحة مباشرة دون كلمة المرور. */
  return ssGet(SESSION_KEY) === "1";
}

/** فتح اللوحة في هذا التبويب فقط؛ لا توجد جلسة دخول دائمة على الجهاز. */
export function unlock(): void {
  ssSet(SESSION_KEY, "1");
  /* تنظيف مفاتيح الإصدارات القديمة التي كانت تحفظ الدخول تلقائيًا. */
  ssDel(LEGACY_SESSION_KEY);
  lsDel(LEGACY_REMEMBER_KEY);
}

export function lock(): void {
  ssDel(SESSION_KEY);
  ssDel(LEGACY_SESSION_KEY);
  lsDel(LEGACY_REMEMBER_KEY);
  if (isCloudConfigured()) void signOutTeacher();
}

/* --------------------------- محاولات الدخول الفاشلة --------------------------- */

interface FailState {
  count: number;
  until: number;
}

function readFails(): FailState {
  const raw = lsGet(FAIL_KEY);
  if (!raw) return { count: 0, until: 0 };
  try {
    const o = JSON.parse(raw) as FailState;
    return { count: Number(o.count) || 0, until: Number(o.until) || 0 };
  } catch {
    return { count: 0, until: 0 };
  }
}

function writeFails(s: FailState): void {
  lsSet(FAIL_KEY, JSON.stringify(s));
}

/** باقي milliseconds من مدة الانتظار (0 = لا انتظار) */
export function lockoutRemaining(): number {
  const { until } = readFails();
  return Math.max(0, until - Date.now());
}

export function failCount(): number {
  return readFails().count;
}

export function registerFail(): number {
  const s = readFails();
  const count = s.count + 1;
  const until = count >= MAX_FAILS ? Date.now() + LOCKOUT_MS : 0;
  writeFails({ count: until ? 0 : count, until });
  return until ? LOCKOUT_MS : count;
}

export function resetFails(): void {
  lsDel(FAIL_KEY);
}

/* ------------------------------ تغيير الاعتمادات ------------------------------ */

export interface ChangeResult {
  ok: boolean;
  error?: string;
}

/** تغيير اسم المستعمل و/أو كلمة المرور (يتطلّب الكلمة الحالية) */
export async function changeCreds(
  currentPassword: string,
  nextUser: string,
  nextPassword: string,
  confirmPassword: string
): Promise<ChangeResult> {
  const user = nextUser.trim();
  if (user.length < 3) return { ok: false, error: "اسم المستعمل قصير جدًا (3 أحرف على الأقل)." };
  if (nextPassword.length < 6) return { ok: false, error: "كلمة المرور قصيرة جدًا (6 أحرف على الأقل)." };
  if (nextPassword !== confirmPassword) return { ok: false, error: "كلمتا المرور غير متطابقتين." };
  if (!(await verifyLogin(user, currentPassword)) && !(await verifyLogin((await activeCreds()).user, currentPassword)))
    return { ok: false, error: "كلمة المرور الحالية غير صحيحة." };

  if (isCloudConfigured()) {
    const result = await updateTeacherCredentials(user.trim(), nextPassword);
    if (!result.ok) return result;
    resetFails();
    return { ok: true };
  }

  const algo = supportedAlgo();
  const hash = await digest(nextPassword, algo);
  lsSet(AUTH_KEY, JSON.stringify({ user, hash, algo, custom: true } satisfies StoredCreds));
  resetFails();
  return { ok: true };
}

/** الرجوع إلى البيانات الافتراضية (imad / qods2026) */
export function restoreDefaults(): void {
  lsDel(AUTH_KEY);
  resetFails();
}
