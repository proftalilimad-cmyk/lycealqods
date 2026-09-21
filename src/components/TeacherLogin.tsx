import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldCheck, TimerReset, UserRound } from "lucide-react";
import { isCloudConfigured } from "../lib/supabase";
import {
  LOCKOUT_MS,
  MAX_FAILS,
  failCount,
  isUnlocked,
  lockoutRemaining,
  registerFail,
  resetFails,
  unlock,
  verifyLogin,
} from "../lib/teacherAuth";
import type { Route } from "../routes";

interface TeacherLoginProps {
  onUnlock: () => void;
  go: (r: Route) => void;
}

/* ============================================================
   بوابة ولوج لوحة الأستاذ
   اسم مستعمل + كلمة مرور، مع:
     • إخفاء/إظهار الكلمة
     • فتح الجلسة في التبويب الحالي فقط؛ يُطلب الرمز من جديد في تبويب/جلسة جديدة
     • قفل 30 ثانية بعد 5 محاولات خاطئة
   ============================================================ */
export default function TeacherLogin({ onUnlock, go }: TeacherLoginProps) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(() => failCount());
  const [wait, setWait] = useState(() => lockoutRemaining());
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  /* عدّاد مدة الانتظار بعد المحاولات الخاطئة */
  const locked = wait > 0;

  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => {
      const left = lockoutRemaining();
      setWait(left);
      if (left <= 0) window.clearInterval(t);
    }, 500);
    return () => window.clearInterval(t);
  }, [locked]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || lockoutRemaining() > 0) return;
    setBusy(true);
    setError("");
    const ok = await verifyLogin(user, pass);
    setBusy(false);
    if (ok) {
      resetFails();
      unlock();
      setPass("");
      onUnlock();
      return;
    }
    const penalty = registerFail();
    if (penalty >= LOCKOUT_MS) {
      setWait(penalty);
      setTries(0);
      setError(`محاولات كثيرة خاطئة — انتظر 30 ثانية ثم أعد المحاولة.`);
    } else {
      const n = failCount();
      setTries(n);
      setError(
        `اسم المستعمل أو كلمة المرور غير صحيحة.${
          n >= MAX_FAILS - 2 ? ` (بقيت ${Math.max(0, MAX_FAILS - n)} محاولات قبل الانتظار)` : ""
        }`
      );
    }
    setPass("");
  };

  const seconds = Math.ceil(wait / 1000);

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-36">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-lg px-5 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-ink-900/6 bg-white shadow-[0_28px_70px_-40px_rgba(4,36,26,0.6)]">
          {/* الترويسة */}
          <div className="relative bg-brand-950 px-7 py-8 text-center">
            <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-20" aria-hidden="true" />
            <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Lock className="size-6 text-gold-200" aria-hidden="true" />
            </span>
            <h1 className="relative mt-4 font-display text-2xl font-black text-white">لوحة الأستاذ — دخول محمي</h1>
            <p className="relative mt-1.5 text-xs font-semibold leading-relaxed text-white/60">
              نتائج التقويم التشخيصي · الدخول والأمان
              <br />
              إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة
            </p>
          </div>

          {/* الاستمارة */}
          <form onSubmit={submit} className="space-y-4 px-7 py-7" noValidate>
            <div>
              <label htmlFor="teacher-user" className="mb-1.5 block text-xs font-extrabold text-ink-700">
                اسم المستعمل
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-ink-300" aria-hidden="true" />
                <input
                  id="teacher-user"
                  ref={userRef}
                  type="text"
                  dir="ltr"
                  autoComplete="username"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="imad"
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-warm/40 py-3 ps-10 pe-3.5 text-start text-sm font-bold text-ink-900 outline-none transition-colors placeholder:font-medium placeholder:text-ink-300 focus:border-brand-400 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="teacher-pass" className="mb-1.5 block text-xs font-extrabold text-ink-700">
                كلمة المرور
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-ink-300" aria-hidden="true" />
                <input
                  id="teacher-pass"
                  type={show ? "text" : "password"}
                  dir="ltr"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-warm/40 py-3 ps-10 pe-11 text-start text-sm font-bold text-ink-900 outline-none transition-colors placeholder:font-medium placeholder:text-ink-300 focus:border-brand-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  className="absolute inset-y-0 end-2 my-auto grid size-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold leading-relaxed text-rose-600"
              >
                {error}
              </p>
            )}

            {locked ? (
              <p className="flex items-center justify-center gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-2.5 text-xs font-extrabold text-gold-700">
                <TimerReset className="size-4 animate-spin" style={{ animationDuration: "3s" }} aria-hidden="true" />
                انتظر {seconds} ثانية…
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || locked || !user.trim() || !pass}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-black text-white transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShieldCheck className="size-4.5" aria-hidden="true" />
              {busy ? "جارٍ التحقّق…" : "دخول إلى اللوحة"}
            </button>

            <p className="rounded-xl bg-paper-warm/70 px-4 py-3 text-[10px] leading-relaxed text-ink-500">
              <strong className="text-ink-700">تنبيه أمانة:</strong>{" "}
              {isCloudConfigured()
                ? "الدخول يتحقق عبر Supabase Auth، والنتائج والتقارير مرتبطة بقاعدة مركزية محمية بسياسات RLS. لا تشارك بيانات الحساب."
                : "لم تُضبط قاعدة مركزية بعد؛ هذا القفل المحلي يحجب اللوحة عن الزوّار العاديين، لكن تفعيل Supabase Auth وRLS مطلوب للحماية الدائمة."}
            </p>

            <button
              type="button"
              onClick={() => go({ view: "home" })}
              className="inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-ink-500 transition-colors hover:text-brand-700"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              العودة إلى الرئيسية
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] font-semibold text-ink-500">
          {isUnlocked() ? "الجلسة مفتوحة في هذا التبويب." : "اللوحة مقفلة: لا تُعرض أي نتيجة قبل الدخول."}
          {tries > 0 && !locked ? ` · محاولات خاطئة: ${tries}/${MAX_FAILS}` : ""}
        </p>
      </div>
    </section>
  );
}
