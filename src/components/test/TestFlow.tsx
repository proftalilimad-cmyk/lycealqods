import { useState } from "react";
import {
  BarChart3,
  BookMarked,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  ListOrdered,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  UserRoundPen,
} from "lucide-react";
import { getBank, TEST_BANKS, type TestBankDef } from "../../data/testBanks";
import { ROSTER_CLASSES, ROSTER_SOURCE, ROSTER_YEAR, type RosterStudent } from "../../data/rosters";
import { TEST_DURATION_SECONDS } from "../../data/questions";
import type { Submission } from "../../types";
import { addSubmission } from "../../lib/storage";
import Reveal from "../Reveal";
import TestRunner, { type TestReport } from "./TestRunner";
import TestResult from "./TestResult";

interface TestFlowProps {
  initialBank?: string;
  /** تسمية المستوى في صفحة QR؛ عند تحديدها تُعرض بنوك هذا المستوى فقط. */
  diagnosticLevel?: string;
  onBackToLevels?: () => void;
  onHome: () => void;
}

const INFO_CARDS = [
  { icon: ClipboardList, value: "20", label: "سؤالًا متنوعًا" },
  { icon: BookMarked, value: "10 + 10", label: "تاريخ + جغرافيا" },
  { icon: Timer, value: "60", label: "دقيقة" },
  { icon: BarChart3, value: "20", label: "النقطة العامة /20" },
];

const QUESTION_TYPES = [
  "اختيار من متعدد",
  "صح / خطأ",
  "ترتيب أحداث",
  "ربط مفاهيم",
  "تحليل وثيقة",
  "قراءة جدول ومبيان",
  "كتابة فقرة",
];

const LEVEL_ORDER = ["الجذع المشترك", "الأولى باكالوريا", "الثانية باكالوريا"];

/* الأقسام التي تظهر في بطاقة التلميذ(ة) — منتقاة من اللوائح الرسمية 2026-2027 */
const DIAGNOSTIC_CLASS_LABELS = [
  "جذع مشترك علوم خ ف 1",
  "جذع مشترك علوم خ ف 2",
  "جذع مشترك علوم خ ف 3",
  "جذع مشترك علوم خ ف 4",
  "الثانية بكالوريا علوم إنسانية خ ف 1",
  "الثانية بكالوريا علوم إنسانية خ ف 2",
] as const;

const DIAGNOSTIC_ROSTER_CLASSES = ROSTER_CLASSES.filter((roster) =>
  (DIAGNOSTIC_CLASS_LABELS as readonly string[]).includes(roster.label),
);

function BankSelector({ onPick, level }: { onPick: (bank: TestBankDef) => void; level?: string }) {
  const levels = level ? LEVEL_ORDER.filter((item) => item === level) : LEVEL_ORDER;

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <Reveal>
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <Target className="size-3.5" aria-hidden="true" />
            التقويم التشخيصي في الاجتماعيات
          </span>
          <h1 className="mt-5 font-display text-3xl font-black leading-[1.3] text-ink-900 sm:text-4xl">
            {level ? `اختر المسلك داخل ${level}` : "اختر مستواك ومسلكك أولًا"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
            {level
              ? "اختر بنك الأسئلة المناسب لمسلكك. يتضمن كل تقويم 20 سؤالًا: 10 تاريخ + 10 جغرافيا، خلال 60 دقيقة، والنقطة العامة /20."
              : "تقويمات تشخيصية مخصصة: لكل مسلك بنك أسئلة ملائم لمناهجه ومكتسباته الجغرافية والتاريخية، وكل واحد يضم 20 سؤالًا: 10 تاريخ + 10 جغرافيا، خلال 60 دقيقة، والنقطة العامة /20."}
          </p>
        </div>
      </Reveal>

      {levels.map((level, li) => {
        const banks = TEST_BANKS.filter((b) => b.level === level);
        if (banks.length === 0) return null;
        return (
          <div key={level} className="mt-12">
            <Reveal delay={li * 100}>
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-display text-sm font-black text-gold-300">
                  {li + 1}
                </span>
                <h2 className="font-display text-xl font-extrabold text-ink-900 sm:text-2xl">{level}</h2>
                <span className="h-px flex-1 bg-ink-900/10" aria-hidden="true" />
              </div>
            </Reveal>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {banks.map((bank, i) => (
                <Reveal key={bank.id} delay={i * 90}>
                  <button
                    type="button"
                    onClick={() => onPick(bank)}
                    className={`group flex h-full w-full flex-col rounded-3xl p-6 text-start transition-all duration-500 hover:-translate-y-2 ${
                      bank.id === "tc-sci"
                        ? "noise overflow-hidden bg-gradient-to-b from-brand-800 to-brand-950 text-white shadow-[0_35px_70px_-28px_rgba(6,56,40,0.6)] ring-2 ring-gold-400/40"
                        : "border border-ink-900/6 bg-white hover:border-brand-200 hover:shadow-[0_28px_60px_-26px_rgba(12,124,91,0.3)]"
                    }`}
                  >
                    {bank.id === "tc-sci" && <div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-30" aria-hidden="true" />}
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`grid size-11 place-items-center rounded-2xl ${
                            bank.id === "tc-sci" ? "bg-white/10 text-gold-300" : "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25"
                          }`}
                        >
                          <GraduationCap className="size-5.5" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${
                            bank.id === "tc-sci" ? "bg-gold-400/15 text-gold-300" : "bg-brand-50 text-brand-700"
                          }`}
                        >
                          {bank.id === "tc-sci" ? "الأكثر إجراءً" : "تقويم متاح"}
                        </span>
                      </div>
                      <h3 className={`mt-4 font-display text-lg font-extrabold leading-relaxed ${bank.id === "tc-sci" ? "text-white" : "text-ink-900"}`}>
                        {bank.branch}
                      </h3>
                      <p className={`mt-2 flex-1 text-[13px] leading-relaxed ${bank.id === "tc-sci" ? "text-white/65" : "text-ink-500"}`}>{bank.desc}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {bank.focus.slice(0, 2).map((f) => (
                          <span
                            key={f}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              bank.id === "tc-sci" ? "bg-white/10 text-white/75" : "bg-paper-warm text-ink-500"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                      <span
                        className={`mt-5 inline-flex items-center gap-2 text-sm font-extrabold transition-transform duration-300 group-hover:-translate-x-1 ${
                          bank.id === "tc-sci" ? "text-gold-300" : "text-brand-700"
                        }`}
                      >
                        ابدأ التقويم ←
                      </span>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TestFlow({ initialBank, diagnosticLevel, onBackToLevels, onHome }: TestFlowProps) {
  const [bank, setBank] = useState<TestBankDef | undefined>(() => getBank(initialBank));
  const [stage, setStage] = useState<"intro" | "run" | "done">("intro");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  /* اختيار الاسم من اللائحة الرسمية للقسم (رقم مسار = المفتاح) */
  const [studentPick, setStudentPick] = useState("");
  const [error, setError] = useState("");
  const [report, setReport] = useState<TestReport | null>(null);
  /* النتيجة كما حُفظت — تُستعمل لأزرار تحميل ملف التلميذ(ة) */
  const [savedSub, setSavedSub] = useState<Submission | null>(null);

  const rosterClass = DIAGNOSTIC_ROSTER_CLASSES.find((roster) => roster.label === className);
  const pickedStudent: RosterStudent | undefined = rosterClass?.students.find((st) => st.massar === studentPick);

  const pickBank = (b: TestBankDef) => {
    setBank(b);
    setClassName("");
    setStudentPick("");
    setStage("intro");
    window.scrollTo({ top: 0 });
  };

  const pickClass = (label: string) => {
    setClassName(label);
    setStudentPick("");
    setName("");
    setStudentNo("");
  };

  /* كتابة رقم التلميذ (ر.ت) بعد اختيار القسم → يظهر اسمه من اللائحة الرسمية */
  const pickNo = (v: string) => {
    setStudentNo(v);
    if (!rosterClass) return;
    const st = rosterClass.students.find((x) => String(x.n) === v.trim());
    if (st) {
      setStudentPick(st.massar);
      setName(st.name);
    } else {
      setStudentPick("");
      setName("");
    }
  };

  const pickStudent = (massar: string) => {
    setStudentPick(massar);
    const st = rosterClass?.students.find((x) => x.massar === massar);
    if (st) {
      setName(st.name);
      setStudentNo(String(st.n));
    }
  };

  const start = () => {
    if (!className) return setError("المرجو اختيار القسم.");
    if (rosterClass && !pickedStudent)
      return setError("المرجو كتابة رقم التلميذ(ة) كما في لائحة القسم (أو اختيار اسمه من القائمة) ليظهر اسمه.");
    if (!rosterClass && name.trim().length < 3) return setError("المرجو إدخال الاسم الكامل (3 حروف على الأقل).");
    setError("");
    setStage("run");
    window.scrollTo({ top: 0 });
  };

  const finish = (r: TestReport) => {
    if (!bank) return;
    const sub: Submission = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}`,
      name: name.trim(),
      className,
      studentNo: studentNo.trim() || undefined,
      bankId: bank.id,
      bankLabel: bank.branch,
      bankLevel: bank.level,
      massar: pickedStudent?.massar,
      date: new Date().toISOString(),
      history: r.historyScore,
      geography: r.geographyScore,
      total: r.total,
      percent: r.percent,
      level: r.levelLabel,
      skills: r.skills,
      /* التفصيل الفردي: تُبنى منه ملفات التحميل (أجوبة، تقرير، Word، Excel) */
      answers: r.answers,
      rubric: r.rubric,
      writingText: r.writingText,
      timeUsedSeconds: r.timeUsedSeconds,
    };
    try {
      addSubmission(sub);
    } catch {
      /* وضع بدون تخزين */
    }
    setSavedSub(sub);
    setReport(r);
    setStage("done");
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    setReport(null);
    setSavedSub(null);
    setName("");
    setClassName(bank ? bank.branch : "");
    setStudentNo("");
    setStage("intro");
    window.scrollTo({ top: 0 });
  };

  const changeBank = () => {
    setBank(undefined);
    setReport(null);
    setSavedSub(null);
    setStage("intro");
    setName("");
    setStudentNo("");
    setClassName("");
    window.scrollTo({ top: 0 });
  };

  const changeLevel = () => {
    changeBank();
    onBackToLevels?.();
  };

  if (stage === "run" && bank) {
    return (
      <TestRunner
        questions={bank.questions}
        student={{ name: name.trim(), className, studentNo: studentNo.trim() || undefined }}
        onFinish={finish}
      />
    );
  }

  if (stage === "done" && report && bank) {
    return (
      <TestResult
        report={report}
        questions={bank.questions}
        name={name.trim()}
        className={className}
        studentNo={studentNo.trim() || undefined}
        submission={savedSub ?? undefined}
        onRestart={restart}
        onHome={onHome}
      />
    );
  }

  if (!bank) {
    return (
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-50" aria-hidden="true" />
        <div className="relative">
          <BankSelector onPick={pickBank} level={diagnosticLevel} />
        </div>
      </section>
    );
  }

  /* ================= شاشة البداية ================= */
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40">
      <div className="pointer-events-none absolute inset-0 pattern-zellige-dark opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal>
          <div className="text-center">
            <button
              type="button"
              onClick={changeLevel}
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-brand-700 transition-colors hover:text-brand-800"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              تغيير المستوى / المسلك
            </button>
            <h1 className="mt-1 font-display text-2xl font-black leading-[1.35] text-ink-900 sm:text-3xl lg:text-[2.4rem]">
              التقويم التشخيصي في الاجتماعيات
            </h1>
            <p className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-sm text-ink-500">
              <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">{bank.level}</span>
              <span className="rounded-full bg-gold-50 px-3.5 py-1.5 text-xs font-bold text-gold-700 ring-1 ring-gold-300">{bank.branch}</span>
              <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200">المدة: 60 دقيقة</span>
              <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-gold-700 ring-1 ring-gold-300">النقطة: /20</span>
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INFO_CARDS.map((c, i) => (
            <Reveal key={c.label} delay={i * 90}>
              <div className="rounded-2xl border border-ink-900/6 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(12,124,91,0.3)]">
                <c.icon className="mx-auto size-5 text-brand-600" aria-hidden="true" />
                <p className="mt-2 font-display text-2xl font-black text-ink-900">{c.value}</p>
                <p className="mt-1 text-[11px] font-semibold text-ink-500">{c.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-7 text-center text-xs font-semibold text-ink-500">
            أنواع الأسئلة:
            <span className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {QUESTION_TYPES.map((t) => (
                <span key={t} className="rounded-full border border-ink-900/8 bg-white px-3 py-1 text-[11px] text-ink-700">
                  {t}
                </span>
              ))}
            </span>
          </p>
        </Reveal>

        <Reveal delay={280}>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
            <Sparkles className="size-4 text-brand-600" aria-hidden="true" />
            <p className="text-xs font-semibold text-brand-800">محاور هذا التقويم: {bank.focus.join(" · ")}</p>
          </div>
        </Reveal>

        <Reveal delay={350}>
          <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-3xl border border-ink-900/6 bg-white shadow-[0_30px_70px_-30px_rgba(4,36,26,0.3)]">
            <div className="flex items-center gap-3 bg-gradient-to-l from-brand-700 to-brand-800 px-7 py-5 text-white">
              <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                <UserRoundPen className="size-5 text-gold-300" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-base font-extrabold">بطاقة التلميذ(ة)</p>
                <p className="text-[11px] text-white/60">املأ المعطيات التالية قبل بداية الاختبار</p>
              </div>
            </div>
            <div className="space-y-4 p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-class" className="field-label">القسم (من اللوائح الرسمية {ROSTER_YEAR}) <span className="text-rose-500">*</span></label>
                  <select id="s-class" value={className} onChange={(e) => pickClass(e.target.value)} className="field">
                    <option value="">— اختر القسم —</option>
                    {DIAGNOSTIC_ROSTER_CLASSES.map((c) => (
                      <option key={c.id} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink-400">
                    المصدر: {ROSTER_SOURCE} — الثانوية التأهيلية القدس، القنيطرة.
                  </p>
                </div>
                <div>
                  <label htmlFor="s-no" className="field-label">
                    رقم التلميذ (ر.ت من لائحة القسم) {rosterClass ? <span className="text-rose-500">*</span> : "(اختياري)"}
                  </label>
                  <input
                    id="s-no"
                    type="text"
                    inputMode="numeric"
                    value={studentNo}
                    onChange={(e) => pickNo(e.target.value)}
                    placeholder={rosterClass ? "اكتب الرقم ليظهر الاسم" : "مثال: 12"}
                    className="field"
                  />
                  {rosterClass && studentNo.trim() && !pickedStudent && (
                    <p className="mt-1 text-[10px] font-bold leading-relaxed text-rose-500">
                      لا يوجد تلميذ(ة) بهذا الرقم في لائحة هذا القسم.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="s-name" className="field-label">
                  الاسم الكامل {pickedStudent ? "(يظهر معتمدًا من اللائحة الرسمية)" : rosterClass ? "(يظهر تلقائيًا بعد كتابة الرقم)" : <span className="text-rose-500">*</span>}
                </label>
                <input
                  id="s-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={rosterClass ? "يظهر هنا اسم التلميذ(ة) بعد كتابة رقمه" : "مثال: أمين العلوي"}
                  className="field"
                  autoComplete="name"
                  readOnly={Boolean(pickedStudent)}
                />
                {pickedStudent && (
                  <p className="mt-1 text-[10px] font-bold leading-relaxed text-brand-700">
                    {pickedStudent.name} — رقم مسار: {pickedStudent.massar} · ر.ت: {pickedStudent.n} · تاريخ الازدياد: {pickedStudent.birth || "—"}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="s-student" className="field-label">أو: اختيار الاسم مباشرة من لائحة القسم</label>
                <select
                  id="s-student"
                  value={studentPick}
                  onChange={(e) => pickStudent(e.target.value)}
                  className="field"
                  disabled={!rosterClass}
                >
                  <option value="">{rosterClass ? "— اختر اسم التلميذ(ة) —" : "اختر القسم أولًا"}</option>
                  {rosterClass?.students.map((st) => (
                    <option key={st.massar} value={st.massar}>
                      {st.n}. {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600" role="alert">
                  {error}
                </p>
              )}

              <div className="rounded-2xl bg-paper-warm/70 p-4 text-[11px] leading-relaxed text-ink-500">
                <p className="font-extrabold text-ink-700">تعليمات مهمة:</p>
                <ul className="mt-1.5 list-inside list-disc space-y-1">
                  <li>سيتوفر لديك <strong>60 دقيقة</strong> وتُرسل الورقة آليًا عند انتهاء الوقت.</li>
                  <li>يمكنك التنقل بين الأسئلة بحرية ومراجعة إجاباتك قبل الإرسال.</li>
                  <li>السؤال الأخير كتابة فقرة، ويُقيَّم وفق شبكة تنقيط خاصة تظهر في النتائج.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={start}
                className="btn-shine group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-gold-400 to-gold-500 px-8 py-4 text-base font-extrabold text-ink-950 shadow-xl shadow-gold-600/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Play className="size-5" aria-hidden="true" />
                ابدأ التقويم التشخيصي
              </button>

              <p className="flex items-center justify-center gap-2 text-center text-[11px] text-ink-500">
                <ListOrdered className="size-3.5" aria-hidden="true" />
                20 سؤالًا · 10 تاريخ + 10 جغرافيا · مدة {TEST_DURATION_SECONDS / 60} دقيقة
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={420}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-center">
            <BookOpenCheck className="size-4 text-brand-600" aria-hidden="true" />
            <p className="text-xs text-ink-500">
              تتوفر أيضًا تقويمات لسبع مستويات ومسالك أخرى —
              <button type="button" onClick={changeLevel} className="font-extrabold text-brand-700 underline-offset-2 hover:underline">
                اختر مستوى آخر
              </button>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
