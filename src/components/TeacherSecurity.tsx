import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CheckCircle2, KeyRound, Lock, RotateCcw, Save, ShieldAlert, UserRound } from "lucide-react";
import { activeCreds, changeCreds, DEFAULT_USER, restoreDefaults, supportedAlgo } from "../lib/teacherAuth";
import { isSupabaseClientConfigured } from "../lib/supabase";
import Reveal from "./Reveal";

/* ============================================================
   الدخول والأمان — تغيير اسم المستعمل وكلمة المرور
   (يتطلّب كلمة المرور الحالية)
   ============================================================ */
export default function TeacherSecurity() {
  const [current, setCurrent] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    activeCreds().then((c) => {
      if (!alive) return;
      setWho(c.user);
      setUser((v) => v || c.user);
    });
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await changeCreds(current, user || (who ?? DEFAULT_USER), pass, confirm);
    setBusy(false);
    if (res.ok) {
      setMsg({ kind: "ok", text: "تمّ الحفظ: صار الدخول بالبيانات الجديدة من الآن." });
      setCurrent("");
      setPass("");
      setConfirm("");
      setWho(user.trim());
    } else {
      setMsg({ kind: "err", text: res.error ?? "تعذّر الحفظ." });
    }
  };

  const defaults = () => {
    if (isSupabaseClientConfigured()) {
      setMsg({ kind: "err", text: "الحساب المركزي لا يملك بيانات افتراضية محلية. استعمل تغيير كلمة المرور أو Supabase Auth." });
      return;
    }
    restoreDefaults();
    setWho(DEFAULT_USER);
    setUser(DEFAULT_USER);
    setCurrent("");
    setPass("");
    setConfirm("");
    setMsg({ kind: "ok", text: `أُعيدت البيانات الافتراضية: ${DEFAULT_USER} / qods2026 — غيّرها بعد الدخول المقبل.` });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* الاستمارة */}
      <Reveal>
        <form onSubmit={submit} className="rounded-3xl border border-ink-900/6 bg-white p-6 lg:col-span-3">
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
            <KeyRound className="size-5 text-brand-600" aria-hidden="true" />
            تغيير بيانات الدخول
          </p>
          <p className="mt-1 text-[11px] font-semibold text-ink-500">
            المستعمل الحالي: <strong dir="ltr" className="text-brand-700">{who ?? DEFAULT_USER}</strong>{" "}
            {isSupabaseClientConfigured()
              ? "· تتم إدارة كلمة المرور بواسطة Supabase Auth ولا تُخزّن داخل الموقع."
              : <>· بصمة الكلمة محفوظة بخوارزمية <span dir="ltr">{supportedAlgo() === "sha256" ? "SHA-256" : "بديلة (سياق غير آمن)"}</span> — لا تُخزَّن الكلمة نفسها.</>}
          </p>

          <div className="mt-5 space-y-4">
            <Field
              id="sec-current"
              label="كلمة المرور الحالية"
              icon={<Lock className="size-4 text-ink-300" aria-hidden="true" />}
              value={current}
              onChange={setCurrent}
              autoComplete="current-password"
            />
            <Field
              id="sec-user"
              label="اسم المستعمل الجديد"
              icon={<UserRound className="size-4 text-ink-300" aria-hidden="true" />}
              value={user}
              onChange={setUser}
              autoComplete="username"
              hint="3 أحرف على الأقل"
            />
            <Field
              id="sec-pass"
              label="كلمة المرور الجديدة"
              icon={<KeyRound className="size-4 text-ink-300" aria-hidden="true" />}
              value={pass}
              onChange={setPass}
              autoComplete="new-password"
              hint="6 أحرف على الأقل"
            />
            <Field
              id="sec-confirm"
              label="تأكيد كلمة المرور الجديدة"
              icon={<CheckCircle2 className="size-4 text-ink-300" aria-hidden="true" />}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />
          </div>

          {msg && (
            <p
              role={msg.kind === "err" ? "alert" : "status"}
              className={`mt-4 rounded-xl border px-4 py-2.5 text-xs font-bold leading-relaxed ${
                msg.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"
              }`}
            >
              {msg.text}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="submit"
              disabled={busy || !current || !pass}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-xs font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="size-4" aria-hidden="true" />
              {busy ? "جارٍ الحفظ…" : "حفظ بيانات الدخول"}
            </button>
            <button
              type="button"
              onClick={defaults}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-paper-warm/60 px-5 py-3 text-xs font-extrabold text-ink-700 transition-colors hover:bg-paper-warm"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              الرجوع إلى الافتراضي
            </button>
          </div>
        </form>
      </Reveal>

      {/* التنبيه الأمني */}
      <Reveal delay={100}>
        <div className="rounded-3xl border border-gold-300/70 bg-gold-50 p-6 lg:col-span-2">
          <p className="flex items-center gap-2 font-display text-base font-extrabold text-gold-800">
            <ShieldAlert className="size-5" aria-hidden="true" />
            حدود هذه الحماية (بأمانة)
          </p>
          <ul className="mt-4 space-y-2.5 text-[11px] font-semibold leading-relaxed text-gold-800/90">
            {isSupabaseClientConfigured() ? <>
              <li>• الحساب يتحقق عبر Supabase Auth، ولا تُحفظ كلمة المرور في JavaScript.</li>
              <li>• التقارير مرتبطة بمالكها عبر RLS؛ لا يقرأها الزائر أو حساب آخر.</li>
              <li>• نتائج التلاميذ لا تملك الواجهة العامة سياسة قراءة لها، وتُجلب بعد مصادقة الأستاذ.</li>
            </> : <>
              <li>• لم تُضبط قاعدة مركزية بعد؛ التحقّق الحالي محلي داخل المتصفح.</li>
              <li>• القفل المحلي يحجب اللوحة عن التلاميذ والزوّار العاديين، لكنه ليس حماية خادمية كاملة.</li>
              <li>• لا تُخزَّن كلمة المرور، بل بصمتها؛ والنتائج المحلية ليست بديلًا عن قاعدة بيانات.</li>
            </>}
          </ul>
          <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-[11px] font-bold leading-relaxed text-ink-700">
            {isSupabaseClientConfigured() ? "تم تفعيل الحماية المركزية. حافظ على RLS ولا تضع service_role key في الواجهة." : <>لتفعيل الحماية والحفظ الدائم: نفّذ <span dir="ltr">supabase/migrations/001_inspector_reports.sql</span> ثم أضف متغيرات Supabase في Netlify كما في <span dir="ltr">docs/inspector-reports.md</span>.</>}
          </p>
        </div>
      </Reveal>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  autoComplete?: string;
}

function Field({ id, label, icon, value, onChange, hint, autoComplete }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPass = id !== "sec-user";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-extrabold text-ink-700">
        {label}
        {hint && <span className="ms-2 text-[10px] font-semibold text-ink-500">({hint})</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-3.5 my-auto">{icon}</span>
        <input
          id={id}
          type={isPass && !show ? "password" : "text"}
          dir="ltr"
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-ink-900/10 bg-paper-warm/40 py-3 ps-10 pe-11 text-start text-sm font-bold text-ink-900 outline-none transition-colors focus:border-brand-400 focus:bg-white"
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "إخفاء" : "إظهار"}
            className="absolute inset-y-0 end-2 my-auto grid size-8 place-items-center rounded-lg text-xs font-extrabold text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {show ? "إخفاء" : "إظهار"}
          </button>
        )}
      </div>
    </div>
  );
}
