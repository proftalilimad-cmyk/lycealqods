import { useEffect, useRef, useState } from "react";
import { AlarmClock, ArrowLeft, ArrowRight, Flag, Send, TriangleAlert } from "lucide-react";
import { TEST_DURATION_SECONDS } from "../../data/questions";
import type { Answer, Question, RubricResult, SkillsMap } from "../../types";
import { buildSkillsMap, gradeAutoQuestion, gradeWriting, levelOf } from "../../lib/grading";
import QuestionCard from "./QuestionCard";

export interface TestReport {
  historyScore: number;
  geographyScore: number;
  total: number;
  percent: number;
  levelLabel: string;
  levelTone: ReturnType<typeof levelOf>["tone"];
  skills: SkillsMap;
  answers: Answer[];
  rubric: RubricResult;
  writingText: string;
  timeUsedSeconds: number;
}

interface TestRunnerProps {
  student: { name: string; className: string; massar?: string };
  questions: Question[];
  onFinish: (report: TestReport) => void | Promise<void>;
  saving?: boolean;
  saveError?: string;
}

export default function TestRunner({ student, questions: QUESTIONS, onFinish, saving = false, saveError = "" }: TestRunnerProps) {
  const [answers, setAnswers] = useState<Answer[]>(() => QUESTIONS.map(() => null));
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(TEST_DURATION_SECONDS);
  const [confirming, setConfirming] = useState(false);
  const finishedRef = useRef(false);

  const isAnswered = (i: number): boolean => {
    const q = QUESTIONS[i];
    const a = answers[i];
    if (a === null || a === undefined) return false;
    if (q.kind === "writing") return typeof a === "string" && a.trim().length >= 30;
    return true;
  };

  const answeredCount = QUESTIONS.reduce((s, _, i) => s + (isAnswered(i) ? 1 : 0), 0);
  const unanswered = QUESTIONS.map((q, i) => ({ id: q.id, unanswered: !isAnswered(i) })).filter((x) => x.unanswered);

  const finish = async () => {
    if (finishedRef.current || saving) return;
    finishedRef.current = true;
    let historyScore = 0;
    let geographyScore = 0;
    QUESTIONS.forEach((q, i) => {
      const got = gradeAutoQuestion(q, answers[i]);
      if (q.subject === "history") historyScore += got;
      else geographyScore += got;
    });
    historyScore = Math.round(historyScore * 100) / 100;
    geographyScore = Math.round(geographyScore * 100) / 100;
    const total = Math.round((historyScore + geographyScore) * 100) / 100;
    const percent = Math.round((total / 20) * 1000) / 10;
    const lvl = levelOf(percent);
    const writingQ = QUESTIONS[QUESTIONS.length - 1];
    const writingText = typeof answers[answers.length - 1] === "string" ? (answers[answers.length - 1] as string) : "";
    const rubric = gradeWriting(writingQ.kind === "writing" ? writingText : "");

    try {
      await onFinish({
        historyScore,
        geographyScore,
        total,
        percent,
        levelLabel: lvl.label,
        levelTone: lvl.tone,
        skills: buildSkillsMap(QUESTIONS, answers),
        answers,
        rubric,
        writingText,
        timeUsedSeconds: TEST_DURATION_SECONDS - remaining,
      });
    } catch {
      // Keep the answers open so the student can retry the central save.
      finishedRef.current = false;
    }
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(t);
          finishRef.current();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const urgent = remaining < 5 * 60;
  const q = QUESTIONS[current];

  const setAnswer = (a: Answer) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = a;
      return next;
    });

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        {/* شريط علوي ثابت داخل الصفحة */}
        <div className="sticky top-24 z-30 mb-6 rounded-2xl border border-ink-900/8 bg-white/90 p-3.5 shadow-[0_18px_40px_-20px_rgba(4,36,26,0.3)] backdrop-blur-xl sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Flag className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink-900">
                  السؤال <span className="text-brand-700">{current + 1}</span> من {QUESTIONS.length}
                </p>
                <p className="text-[11px] text-ink-500">
                  {student.name}
                  {student.massar ? ` (مسار ${student.massar})` : ""} · {student.className} · {answeredCount} مجاب عنها
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-lg font-black tabular-nums ${
                urgent ? "animate-pulse bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-700"
              }`}
              role="timer"
              aria-label="الوقت المتبقي"
            >
              <AlarmClock className="size-5" aria-hidden="true" />
              {mm}:{ss}
            </div>

            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={saving}
              className="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden="true" />
              إرسال الاختبار
            </button>
          </div>

          {/* شريط التقدم */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-warm" role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={QUESTIONS.length}>
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-400 to-brand-500 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {saveError && <p role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold leading-relaxed text-rose-700"><TriangleAlert className="me-2 inline size-4" />{saveError} يمكنك إعادة الإرسال بعد التحقق من الاتصال.</p>}
        {saving && <p role="status" className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-bold text-brand-700">جارٍ حفظ النتيجة في قاعدة البيانات المركزية…</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          {/* بطاقة السؤال */}
          <div>
            <div key={current} className="animate-qa-in rounded-3xl border border-ink-900/6 bg-white p-5 shadow-[0_25px_60px_-30px_rgba(4,36,26,0.25)] sm:p-8">
              <QuestionCard question={q} answer={answers[current]} onChange={setAnswer} />
            </div>

            {/* تنقل */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition-all enabled:hover:-translate-y-0.5 enabled:hover:border-brand-400 disabled:opacity-40"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
                السؤال السابق
              </button>
              {current < QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrent((c) => Math.min(QUESTIONS.length - 1, c + 1))}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-all hover:-translate-y-0.5"
                >
                  السؤال التالي
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-400 to-gold-500 px-5 py-3 text-sm font-extrabold text-ink-950 shadow-lg shadow-gold-600/25 transition-all hover:-translate-y-0.5"
                >
                  <Send className="size-4" aria-hidden="true" />
                  إنهاء وإرسال
                </button>
              )}
            </div>
          </div>

          {/* قائمة الأسئلة */}
          <aside className="lg:sticky lg:top-40 lg:self-start" aria-label="قائمة الأسئلة">
            <div className="rounded-3xl border border-ink-900/6 bg-white p-5">
              <p className="text-sm font-extrabold text-ink-900">قائمة الأسئلة</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">انتقل بين الأسئلة بحرية لمراجعة إجاباتك قبل الإرسال.</p>
              <div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">
                {QUESTIONS.map((qq, i) => {
                  const answered = isAnswered(i);
                  const isCurrent = i === current;
                  return (
                    <button
                      key={qq.id}
                      type="button"
                      onClick={() => setCurrent(i)}
                      aria-current={isCurrent ? "true" : undefined}
                      aria-label={`السؤال ${i + 1}${answered ? " — مجاب عنه" : " — غير مجاب عنه"}`}
                      className={`grid aspect-square place-items-center rounded-xl text-sm font-extrabold transition-all duration-300 ${
                        isCurrent
                          ? "scale-110 border-2 border-gold-500 bg-gold-100 text-gold-700 shadow-md"
                          : answered
                            ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                            : "border border-ink-900/12 bg-paper-warm/60 text-ink-500 hover:border-brand-300 hover:text-brand-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-ink-900/6 pt-3.5 text-[11px] font-semibold text-ink-500">
                <p className="flex items-center gap-2">
                  <span className="size-3 rounded-md bg-brand-600" aria-hidden="true" /> مجاب عنه
                </p>
                <p className="flex items-center gap-2">
                  <span className="size-3 rounded-md border-2 border-gold-500 bg-gold-100" aria-hidden="true" /> السؤال الحالي
                </p>
                <p className="flex items-center gap-2">
                  <span className="size-3 rounded-md border border-ink-900/15 bg-paper-warm" aria-hidden="true" /> غير مجاب عنه
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* نافذة تأكيد الإرسال */}
      {confirming && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="تأكيد إرسال الاختبار">
          <button type="button" aria-label="إغلاق" onClick={() => setConfirming(false)} className="animate-fade-in absolute inset-0 bg-brand-950/60 backdrop-blur-sm" />
          <div className="animate-modal-in relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gold-100 text-gold-600">
              <TriangleAlert className="size-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-center font-display text-xl font-black text-ink-900">تأكيد إرسال الاختبار</h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink-500">
              أجبت عن <span className="font-extrabold text-brand-700">{answeredCount}</span> من {QUESTIONS.length} سؤالًا.
              {unanswered.length > 0 && (
                <>
                  {" "}
                  لم تجب بعد عن{" "}
                  <span className="font-extrabold text-rose-600">
                    {unanswered.length} {unanswered.length === 1 ? "سؤال" : "أسئلة"}
                  </span>{" "}
                  (<span className="font-bold">{unanswered.map((u) => u.id).join("، ")}</span>).
                </>
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-ink-900/10 px-4 py-3 text-sm font-bold text-ink-700 transition-colors hover:bg-paper-warm"
              >
                متابعة المراجعة
              </button>
              <button
                type="button"
                onClick={() => { void finish(); }}
                disabled={saving}
                className="rounded-xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ…" : "تأكيد الإرسال"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
