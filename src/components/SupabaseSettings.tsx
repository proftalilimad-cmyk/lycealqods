import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  Wifi,
  XCircle,
} from "lucide-react";
import Reveal from "./Reveal";
import {
  clearLocalSupabaseConfig,
  containsForbiddenSupabaseSecret,
  getSupabaseConfig,
  saveLocalSupabaseConfig,
  testSupabaseConnection,
  type ConnectionCheck,
  type ResolvedSupabaseConfig,
  type SupabaseConfig,
  type SupabaseConnectionReport,
} from "../lib/supabase";

const emptyConfig: SupabaseConfig = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  publicSiteKey: "",
  teacherEmail: "",
};

type Notice = { kind: "ok" | "error" | "info"; text: string };

type BusyAction = "test" | "save" | "reset" | null;

function editableConfig(config: ResolvedSupabaseConfig): SupabaseConfig {
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    publicSiteKey: config.publicSiteKey,
    teacherEmail: config.teacherEmail,
  };
}

function maskKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 3)}********${trimmed.slice(-4)}`;
}

function checkState(value: ConnectionCheck | undefined, fallback: boolean): ConnectionCheck {
  return value ?? (fallback ? "unknown" : "error");
}

function stateIcon(value: ConnectionCheck): string {
  return value === "ok" ? "✓" : value === "error" ? "✕" : "—";
}

function stateClass(value: ConnectionCheck): string {
  return value === "ok" ? "text-emerald-700" : value === "error" ? "text-rose-600" : "text-ink-400";
}

function statusLabel(report: SupabaseConnectionReport | null): string {
  if (!report || report.status === "unconfigured") return "Supabase غير مهيأ";
  if (report.status === "connected") return "Supabase متصل";
  return "Supabase غير متصل";
}

function statusClass(report: SupabaseConnectionReport | null): string {
  if (!report || report.status === "unconfigured") return "border-gold-200 bg-gold-50 text-gold-800";
  if (report.status === "connected") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function sourceLabel(source: ResolvedSupabaseConfig["sources"][keyof SupabaseConfig]): string {
  if (source === "vite") return "Vite / Netlify";
  if (source === "runtime") return "runtime-config.js";
  if (source === "local") return "إعداد محلي";
  return "غير مضبوط";
}

function Field({
  id,
  label,
  value,
  placeholder,
  type = "text",
  onChange,
  show,
  onToggle,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  type?: "text" | "email";
  onChange: (value: string) => void;
  show?: boolean;
  onToggle?: () => void;
  hint?: string;
}) {
  const passwordLike = Boolean(onToggle);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-extrabold text-ink-700">
        {label}
        {hint && <span className="ms-2 text-[10px] font-semibold text-ink-400">({hint})</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={passwordLike && !show ? "password" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          className={`w-full rounded-xl border border-ink-900/10 bg-paper-warm/35 px-3.5 py-3 text-start text-sm font-semibold text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-400 focus:bg-white ${passwordLike ? "pe-24" : ""}`}
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 end-2 my-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-extrabold text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
            aria-label={show ? "إخفاء المفتاح" : "إظهار المفتاح"}
          >
            {show ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
            {show ? "إخفاء" : "إظهار"}
          </button>
        )}
      </div>
    </div>
  );
}

function DiagnosticRow({ label, value, detail }: { label: string; value: ConnectionCheck; detail?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-900/6 bg-white px-3.5 py-3">
      <span className="text-[11px] font-extrabold text-ink-700">{label}</span>
      <span className="flex items-center gap-2 text-end">
        <span className={`font-display text-base font-black ${stateClass(value)}`}>{stateIcon(value)}</span>
        {detail && <span dir="ltr" className="max-w-[170px] truncate text-[10px] font-semibold text-ink-400">{detail}</span>}
      </span>
    </div>
  );
}

export default function SupabaseSettings() {
  const [config, setConfig] = useState<SupabaseConfig>(emptyConfig);
  const [resolved, setResolved] = useState<ResolvedSupabaseConfig | null>(null);
  const [report, setReport] = useState<SupabaseConnectionReport | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [showSiteKey, setShowSiteKey] = useState(false);

  const syncFromActiveConfig = useCallback(() => {
    const active = getSupabaseConfig();
    setResolved(active);
    setConfig(editableConfig(active));
    return active;
  }, []);

  const runTest = useCallback(async (candidate: SupabaseConfig) => {
    setBusy("test");
    setNotice(null);
    try {
      const result = await testSupabaseConnection(candidate);
      setReport(result);
      if (result.status === "connected") {
        setNotice({ kind: "ok", text: result.message });
      } else if (result.status === "error") {
        setNotice({ kind: "error", text: result.message });
      } else {
        setNotice({ kind: "info", text: result.message });
      }
      return result;
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    const active = syncFromActiveConfig();
    void runTest(active);
    const onConfigChanged = () => {
      const next = syncFromActiveConfig();
      void runTest(next);
    };
    window.addEventListener("lyceum:supabase-config-changed", onConfigChanged);
    return () => window.removeEventListener("lyceum:supabase-config-changed", onConfigChanged);
  }, [runTest, syncFromActiveConfig]);

  const update = (field: keyof SupabaseConfig, value: string) => {
    setConfig((current) => ({ ...current, [field]: value }));
    setNotice(null);
  };

  const handleTest = () => {
    void runTest(config);
  };

  const handleSave = async () => {
    if (containsForbiddenSupabaseSecret(config.supabaseAnonKey) || containsForbiddenSupabaseSecret(config.publicSiteKey)) {
      setNotice({ kind: "error", text: "لا تحفظ service_role أو أي مفتاح سري في إعدادات المتصفح. استعمل المفتاح العمومي فقط." });
      return;
    }
    setBusy("save");
    setNotice(null);
    try {
      saveLocalSupabaseConfig(config);
      const active = syncFromActiveConfig();
      const result = await testSupabaseConnection(active);
      setReport(result);
      const hasHigherPriority = Object.values(active.sources).some((source) => source === "vite" || source === "runtime");
      if (result.status === "connected") {
        setNotice({
          kind: "ok",
          text: hasHigherPriority
            ? "تم حفظ الإعداد المحلي، والاتصال الفعّال مأخوذ من Vite أو runtime-config.js."
            : "تم حفظ الإعدادات واختبار الاتصال بقاعدة Supabase بنجاح.",
        });
      } else {
        setNotice({ kind: result.status === "error" ? "error" : "info", text: "تم حفظ الإعدادات، لكن الاتصال يحتاج إلى مراجعة." });
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "تعذر حفظ الإعدادات." });
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    setBusy("reset");
    clearLocalSupabaseConfig();
    const active = syncFromActiveConfig();
    const result = await testSupabaseConnection(active);
    setReport(result);
    setNotice({ kind: "info", text: "تمت إعادة ضبط الإعداد المحلي. القيم القادمة من Vite أو runtime-config.js بقيت كما هي." });
    setBusy(null);
  };

  const currentSources = useMemo(() => resolved?.sources, [resolved]);
  const reportOrDefaults = report ?? {
    status: "unconfigured" as const,
    url: config.supabaseUrl ? "unknown" as const : "error" as const,
    publicKey: config.supabaseAnonKey ? "unknown" as const : "error" as const,
    publicSiteKey: config.publicSiteKey ? "unknown" as const : "error" as const,
    teacherEmail: config.teacherEmail ? "unknown" as const : "error" as const,
    database: "unknown" as const,
    rls: "unknown" as const,
    message: "لم يُختبر الاتصال بعد.",
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Reveal>
        <section className="rounded-3xl border border-brand-200/70 bg-white p-6 shadow-[0_22px_55px_-30px_rgba(4,36,26,0.35)] lg:col-span-3" aria-labelledby="supabase-settings-title">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-display text-lg font-black text-ink-900" id="supabase-settings-title">
                <Database className="size-5 text-brand-600" aria-hidden="true" />
                إعداد وربط قاعدة البيانات
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-500">Supabase — إعداد الاتصال المركزي</p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${statusClass(report)}`} role="status">
              <span className={`size-1.5 rounded-full ${report?.status === "connected" ? "bg-emerald-500" : report?.status === "error" ? "bg-rose-500" : "bg-gold-500"}`} aria-hidden="true" />
              {statusLabel(report)}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              id="supabase-url"
              label="رابط مشروع Supabase"
              value={config.supabaseUrl}
              onChange={(value) => update("supabaseUrl", value)}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              hint={currentSources?.supabaseUrl ? sourceLabel(currentSources.supabaseUrl) : undefined}
            />
            <Field
              id="supabase-anon-key"
              label="المفتاح العمومي"
              value={config.supabaseAnonKey}
              onChange={(value) => update("supabaseAnonKey", value)}
              placeholder="مفتاح anon / publishable العام"
              show={showAnonKey}
              onToggle={() => setShowAnonKey((value) => !value)}
              hint={currentSources?.supabaseAnonKey ? sourceLabel(currentSources.supabaseAnonKey) : undefined}
            />
            <Field
              id="supabase-site-key"
              label="مفتاح الموقع"
              value={config.publicSiteKey}
              onChange={(value) => update("publicSiteKey", value)}
              placeholder="مفتاح إرسال عام مرتبط بحساب الأستاذ"
              show={showSiteKey}
              onToggle={() => setShowSiteKey((value) => !value)}
              hint={currentSources?.publicSiteKey ? sourceLabel(currentSources.publicSiteKey) : undefined}
            />
            <Field
              id="supabase-teacher-email"
              label="بريد الأستاذ"
              value={config.teacherEmail}
              onChange={(value) => update("teacherEmail", value)}
              placeholder="teacher@example.com"
              type="email"
              hint={currentSources?.teacherEmail ? sourceLabel(currentSources.teacherEmail) : undefined}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-[11px] leading-relaxed text-ink-600">
            <p className="flex items-center gap-2 font-extrabold text-brand-800"><Link2 className="size-3.5" aria-hidden="true" /> ترتيب القراءة</p>
            <p className="mt-1.5">متغيرات Vite/Netlify أولًا، ثم <code dir="ltr" className="rounded bg-white px-1">runtime-config.js</code>، ثم الإعداد المحلي. المفتاح العمومي وpublicSiteKey ليسا بديلًا عن RLS، ولا يُقبل هنا أي service_role أو secret key.</p>
          </div>

          {notice && (
            <div className={`mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-bold leading-relaxed ${notice.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : notice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-sky-200 bg-sky-50 text-sky-700"}`} role={notice.kind === "error" ? "alert" : "status"}>
              {notice.kind === "ok" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : notice.kind === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <Wifi className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
              <span>{notice.text}</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button type="button" onClick={handleTest} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs font-black text-brand-700 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40">
              <Wifi className="size-4" aria-hidden="true" />
              {busy === "test" ? "جارٍ اختبار الاتصال…" : "اختبار الاتصال بـ Supabase"}
            </button>
            <button type="button" onClick={() => void handleSave()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-brand-700/20 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40">
              <Save className="size-4" aria-hidden="true" />
              {busy === "save" ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
            </button>
            <button type="button" onClick={() => void handleReset()} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-paper-warm/60 px-4 py-3 text-xs font-extrabold text-ink-700 transition-all enabled:hover:-translate-y-0.5 disabled:opacity-40">
              <RefreshCw className="size-4" aria-hidden="true" />
              {busy === "reset" ? "جارٍ إعادة الضبط…" : "إعادة ضبط الإعدادات"}
            </button>
          </div>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section className="rounded-3xl border border-ink-900/6 bg-white p-6 lg:col-span-2" aria-labelledby="supabase-diagnostic-title">
          <p id="supabase-diagnostic-title" className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
            <ShieldCheck className="size-5 text-brand-600" aria-hidden="true" />
            تشخيص الاتصال
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">لا تُعرض المفاتيح كاملة. اختبار قاعدة البيانات قراءة محدودة وغير تعديلية.</p>
          <div className="mt-4 space-y-2">
            <DiagnosticRow label="Supabase URL" value={checkState(reportOrDefaults.url, Boolean(config.supabaseUrl))} detail={config.supabaseUrl ? config.supabaseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : undefined} />
            <DiagnosticRow label="Public Key" value={checkState(reportOrDefaults.publicKey, Boolean(config.supabaseAnonKey))} detail={maskKey(config.supabaseAnonKey)} />
            <DiagnosticRow label="Public Site Key" value={checkState(reportOrDefaults.publicSiteKey, Boolean(config.publicSiteKey))} detail={maskKey(config.publicSiteKey)} />
            <DiagnosticRow label="Teacher Email" value={checkState(reportOrDefaults.teacherEmail, Boolean(config.teacherEmail))} detail={config.teacherEmail || undefined} />
            <DiagnosticRow label="Database" value={reportOrDefaults.database} />
            <DiagnosticRow label="RLS" value={reportOrDefaults.rls} />
          </div>
          {reportOrDefaults.technical && (
            <p className="mt-4 rounded-xl bg-paper-warm/70 px-3 py-2 text-[10px] font-semibold leading-relaxed text-ink-500" dir="ltr">
              {reportOrDefaults.technical}
            </p>
          )}
          <div className="mt-4 rounded-2xl border border-gold-200 bg-gold-50/70 p-3 text-[10.5px] font-semibold leading-relaxed text-gold-800">
            <p className="flex items-center gap-1.5 font-extrabold"><KeyRound className="size-3.5" aria-hidden="true" /> حماية المفاتيح</p>
            <p className="mt-1">يُسمح فقط بـ anon/public key. لا تُحفظ نتائج حقيقية في localStorage، ولا تُستعمل أي صلاحية تتجاوز RLS.</p>
          </div>
          {reportOrDefaults.status === "error" && (
            <p className="mt-3 flex items-start gap-1.5 text-[10px] font-bold leading-relaxed text-rose-600"><XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{reportOrDefaults.message}</p>
          )}
        </section>
      </Reveal>

      <Reveal delay={160}>
        <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-5 lg:col-span-5">
          <p className="flex items-center gap-2 font-display text-sm font-extrabold text-brand-900"><UserRound className="size-4 text-brand-600" aria-hidden="true" /> ربط التقويم التشخيصي</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-600">بعد نجاح الاختبار وربط publicSiteKey بحساب الأستاذ في جدول <code dir="ltr" className="rounded bg-white px-1">teacher_public_keys</code>، يرسل التقويم التشخيصي النتائج عبر RPC الكتابة فقط. عند فشل Supabase لا تُعرض النتيجة على أنها محفوظة ولا تُنقل إلى localStorage.</p>
        </div>
      </Reveal>
    </div>
  );
}
