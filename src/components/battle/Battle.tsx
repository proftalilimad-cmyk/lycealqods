import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Crown,
  Flame,
  Hourglass,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Swords,
  Timer,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import QuestionCard from "../test/QuestionCard";
import Reveal from "../Reveal";
import { TEST_BANKS } from "../../data/testBanks";
import {
  AI_LEVELS,
  AI_NAME,
  QUESTION_SECONDS,
  ROUND_OPTIONS,
  STREAK_BONUS_AT,
  aiAnswers,
  battleQuestions,
  champions,
  getBattles,
  gradeFor,
  isFullCredit,
  newBattleId,
  saveBattle,
  type AiLevel,
  type BattleMode,
  type BattleRecord,
} from "../../data/battle";
import type { Answer, Question } from "../../types";
import type { Route } from "../../routes";
import { cn } from "../../utils/cn";

interface BattleProps {
  initialBank?: string;
  go: (r: Route) => void;
}

type Phase = "setup" | "playing" | "result";

interface PlayerState {
  name: string;
  score: number;
  correct: number;
  partial: number;
  streak: number;
  bestStreak: number;
  times: number[];
  isAi?: boolean;
}

interface RevealInfo {
  earned: number;
  full: boolean;
  partial: boolean;
  bonus: boolean;
  timedOut: boolean;
  aiEarned: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

const freshPlayer = (name: string, isAi = false): PlayerState => ({
  name,
  score: 0,
  correct: 0,
  partial: 0,
  streak: 0,
  bestStreak: 0,
  times: [],
  isAi,
});

export default function Battle({ initialBank, go }: BattleProps) {
  /* ---------- إعدادات المباراة ---------- */
  const [mode, setMode] = useState<BattleMode>("duel");
  const [aiLevel, setAiLevel] = useState<AiLevel>("mid");
  const [bankId, setBankId] = useState(initialBank && TEST_BANKS.some((b) => b.id === initialBank) ? initialBank : TEST_BANKS[0].id);
  const [rounds, setRounds] = useState<number>(ROUND_OPTIONS[1]);
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  /* ---------- حالة اللعب ---------- */
  const [phase, setPhase] = useState<Phase>("setup");
  const [qs, setQs] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [players, setPlayers] = useState<PlayerState[]>([freshPlayer("اللاعب 1"), freshPlayer("اللاعب 2")]);
  const [answer, setAnswer] = useState<Answer>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reveal, setReveal] = useState<RevealInfo | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [record, setRecord] = useState<BattleRecord | null>(null);
  const [history, setHistory] = useState<BattleRecord[]>(() => getBattles());

  const bank = useMemo(() => TEST_BANKS.find((b) => b.id === bankId) ?? TEST_BANKS[0], [bankId]);
  const turn = mode === "duel" ? idx % 2 : 0;
  const question = qs[idx];

  /* ---------- المؤقّت: عدّاد ثابت لا يتأثر بتفاعل التلميذ مع السؤال ---------- */
  useEffect(() => {
    if (phase !== "playing" || submitted) return;
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase, submitted, idx]);

  useEffect(() => {
    if (phase === "playing" && !submitted && secondsLeft <= 0) submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, submitted]);

  /* ---------- بدء المباراة ---------- */
  const start = () => {
    const p1 = (name1.trim() || "اللاعب 1").slice(0, 24);
    const p2 = mode === "solo" ? AI_NAME : (name2.trim() || "اللاعب 2").slice(0, 24);
    setPlayers([freshPlayer(p1), freshPlayer(p2, mode === "solo")]);
    setQs(battleQuestions(bankId, rounds));
    setIdx(0);
    setAnswer(null);
    setSubmitted(false);
    setReveal(null);
    setRecord(null);
    setSecondsLeft(QUESTION_SECONDS);
    setPhase("playing");
  };

  /* ---------- تأكيد الإجابة (أو انتهاء الوقت) ---------- */
  function submit(timedOut = false) {
    if (!question || submitted) return;
    const earned = timedOut && answer === null ? 0 : gradeFor(question, answer);
    const full = isFullCredit(question, earned);
    const partial = !full && earned > 0;
    const timeUsed = QUESTION_SECONDS - Math.max(0, secondsLeft);

    const nextPlayers = players.map((p) => ({ ...p, times: [...p.times] }));
    const me = nextPlayers[turn];
    const newStreak = full ? me.streak + 1 : 0;
    const bonus = full && newStreak >= STREAK_BONUS_AT ? 1 : 0;
    me.score = round2(me.score + earned + bonus);
    me.correct += full ? 1 : 0;
    me.partial += partial ? 1 : 0;
    me.streak = newStreak;
    me.bestStreak = Math.max(me.bestStreak, newStreak);
    if (!me.isAi) me.times.push(timeUsed);

    let aiEarned: number | null = null;
    if (mode === "solo") {
      aiEarned = aiAnswers(question, AI_LEVELS[aiLevel].accuracy);
      const ai = nextPlayers[1];
      const aiStreak = aiEarned >= question.points ? ai.streak + 1 : 0;
      ai.score = round2(ai.score + aiEarned);
      ai.correct += aiEarned >= question.points ? 1 : 0;
      ai.streak = aiStreak;
      ai.bestStreak = Math.max(ai.bestStreak, aiStreak);
    }

    setPlayers(nextPlayers);
    setReveal({ earned, full, partial, bonus: bonus > 0, timedOut, aiEarned });
    setSubmitted(true);
  }

  /* ---------- السؤال التالي أو النتيجة ---------- */
  const next = () => {
    if (idx + 1 >= qs.length) {
      const results = players.map((p) => ({
        name: p.name,
        score: p.score,
        correct: p.correct,
        partial: p.partial,
        bestStreak: p.bestStreak,
        avgSeconds: p.times.length ? round1(p.times.reduce((a, b) => a + b, 0) / p.times.length) : null,
        isAi: p.isAi,
      }));
      const winner = results[0].score === results[1].score ? null : results[0].score > results[1].score ? results[0].name : results[1].name;
      const rec: BattleRecord = {
        id: newBattleId(),
        date: new Date().toISOString(),
        mode,
        bankId: bank.id,
        bankLabel: bank.branch,
        rounds: qs.length,
        players: results,
        winner,
      };
      setRecord(rec);
      setHistory(saveBattle(rec));
      setPhase("result");
      return;
    }
    setIdx((i) => i + 1);
    setAnswer(null);
    setSubmitted(false);
    setReveal(null);
    setSecondsLeft(QUESTION_SECONDS);
  };

  const champs = useMemo(() => champions(history), [history]);

  /* ============================================================
     شاشة الإعداد
  ============================================================ */
  if (phase === "setup") {
    return (
      <section className="pt-32 pb-20 md:pt-36">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <div className="noise relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-800 via-brand-900 to-brand-950 p-8 text-white sm:p-10">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute inset-0 pattern-zellige-light opacity-30" />
                <div className="absolute -top-24 start-1/4 size-72 rounded-full bg-gold-500/15 blur-[100px]" />
              </div>
              <div className="relative flex flex-wrap items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-lg shadow-gold-600/30">
                  <Swords className="size-7" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="font-display text-2xl font-black sm:text-3xl">وضع المبارزة</h1>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/70">
                    تحدي معرفي سريع في التاريخ والجغرافيا: لاعبان يتناوبان على جهاز واحد، أو تحدٍّ فردي ضد البطل الآلي.
                    {QUESTION_SECONDS} ثانية لكل سؤال، ونقطة إضافية عند سلسلة {STREAK_BONUS_AT} إجابات صحيحة.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {/* النمط */}
              <Reveal delay={60}>
                <div className="rounded-3xl border border-ink-900/8 bg-white p-6 sm:p-7">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                    <Users className="size-5 text-brand-600" aria-hidden="true" />
                    نمط المباراة
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode("duel")}
                      className={cn(
                        "rounded-2xl border p-5 text-start transition-all",
                        mode === "duel" ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-600/10" : "border-ink-900/10 bg-paper hover:border-brand-300"
                      )}
                    >
                      <span className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                        <Users className="size-5 text-brand-600" aria-hidden="true" />
                        مبارزة ثنائية
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-ink-500">
                        لاعبان على هذا الجهاز: أسئلة مختلفة بالتناوب، والفوز لمن يجمع أكثر.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("solo")}
                      className={cn(
                        "rounded-2xl border p-5 text-start transition-all",
                        mode === "solo" ? "border-gold-500 bg-gold-50 shadow-md shadow-gold-600/10" : "border-ink-900/10 bg-paper hover:border-gold-300"
                      )}
                    >
                      <span className="flex items-center gap-2 font-display text-base font-extrabold text-ink-900">
                        <Bot className="size-5 text-gold-600" aria-hidden="true" />
                        ضد البطل الآلي
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-ink-500">
                        تجيب وحدك والروبوت ينافسك على السؤال نفسه حسب مستواه.
                      </span>
                    </button>
                  </div>

                  {mode === "solo" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(Object.keys(AI_LEVELS) as AiLevel[]).map((lv) => (
                        <button
                          key={lv}
                          type="button"
                          onClick={() => setAiLevel(lv)}
                          className={cn(
                            "rounded-xl border px-4 py-2 text-xs font-extrabold transition-all",
                            aiLevel === lv ? "border-gold-500 bg-gold-100 text-gold-700" : "border-ink-900/10 bg-white text-ink-500 hover:border-gold-300"
                          )}
                        >
                          {AI_LEVELS[lv].label} · {Math.round(AI_LEVELS[lv].accuracy * 100)}%
                        </button>
                      ))}
                      <span className="self-center text-[11px] text-ink-500">{AI_LEVELS[aiLevel].desc}</span>
                    </div>
                  )}
                </div>
              </Reveal>

              {/* البنك وعدد الأسئلة */}
              <Reveal delay={120}>
                <div className="rounded-3xl border border-ink-900/8 bg-white p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                      <SlidersHorizontal className="size-5 text-brand-600" aria-hidden="true" />
                      بنك الأسئلة وعدد الجولات
                    </h2>
                    <div className="flex gap-2">
                      {ROUND_OPTIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRounds(r)}
                          className={cn(
                            "rounded-xl border px-3.5 py-1.5 text-xs font-extrabold transition-all",
                            rounds === r ? "border-brand-500 bg-brand-600 text-white" : "border-ink-900/10 bg-white text-ink-500 hover:border-brand-300"
                          )}
                        >
                          {r} أسئلة
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {TEST_BANKS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBankId(b.id)}
                        className={cn(
                          "rounded-2xl border p-4 text-start transition-all",
                          bankId === b.id ? "border-brand-500 bg-brand-50" : "border-ink-900/10 bg-paper hover:border-brand-300"
                        )}
                      >
                        <span className="block text-[11px] font-extrabold text-brand-700">{b.level}</span>
                        <span className="mt-0.5 block font-display text-sm font-extrabold text-ink-900">{b.branch}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-ink-500">{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* الأسماء + الانطلاق */}
              <Reveal delay={180}>
                <div className="rounded-3xl border border-ink-900/8 bg-white p-6 sm:p-7">
                  <div className={cn("grid gap-3", mode === "duel" ? "sm:grid-cols-2" : "")}>
                    <label className="block">
                      <span className="text-xs font-extrabold text-ink-700">{mode === "solo" ? "اسمك" : "اسم اللاعب الأول"}</span>
                      <input
                        value={name1}
                        onChange={(e) => setName1(e.target.value)}
                        placeholder={mode === "solo" ? "مثال: أمين" : "مثال: أمين"}
                        className="mt-1.5 w-full rounded-xl border border-ink-900/12 bg-paper px-4 py-2.5 text-sm font-semibold text-ink-900 outline-none transition-colors focus:border-brand-500"
                      />
                    </label>
                    {mode === "duel" && (
                      <label className="block">
                        <span className="text-xs font-extrabold text-ink-700">اسم اللاعب الثاني</span>
                        <input
                          value={name2}
                          onChange={(e) => setName2(e.target.value)}
                          placeholder="مثال: سلمى"
                          className="mt-1.5 w-full rounded-xl border border-ink-900/12 bg-paper px-4 py-2.5 text-sm font-semibold text-ink-900 outline-none transition-colors focus:border-brand-500"
                        />
                      </label>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => start()}
                    className="btn-shine mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-700/25 transition-all hover:-translate-y-0.5"
                  >
                    <Play className="size-5" aria-hidden="true" />
                    انطلاق المبارزة ({rounds} أسئلة — {bank.branch})
                  </button>
                </div>
              </Reveal>
            </div>

            {/* السجل والأبطال */}
            <div className="space-y-6">
              <Reveal delay={120}>
                <div className="rounded-3xl border border-ink-900/8 bg-white p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                    <Crown className="size-5 text-gold-600" aria-hidden="true" />
                    أبطال القسم
                  </h2>
                  {champs.length === 0 ? (
                    <p className="mt-3 text-xs leading-relaxed text-ink-500">
                      لا مباريات بعد. أول مبارزة ستفتح لوحة الأبطال: كل انتصار يُسجَّل باسم اللاعب على هذا الجهاز.
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-2">
                      {champs.map((c, i) => (
                        <li key={c.name} className="flex items-center justify-between gap-2 rounded-xl border border-ink-900/8 bg-paper px-3.5 py-2.5">
                          <span className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
                            <span className={cn("grid size-6 place-items-center rounded-lg text-[11px] font-black", i === 0 ? "bg-gold-400 text-ink-950" : "bg-ink-900/8 text-ink-700")}>
                              {i + 1}
                            </span>
                            {c.name}
                          </span>
                          <span className="text-[11px] font-bold text-ink-500">
                            {c.wins} فوز · أفضل نتيجة {c.bestScore}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </Reveal>

              <Reveal delay={180}>
                <div className="rounded-3xl border border-ink-900/8 bg-white p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                    <Hourglass className="size-5 text-brand-600" aria-hidden="true" />
                    آخر المبارزات
                  </h2>
                  {history.length === 0 ? (
                    <p className="mt-3 text-xs leading-relaxed text-ink-500">السجل فارغ حاليًا.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {history.slice(0, 5).map((h) => (
                        <li key={h.id} className="rounded-xl border border-ink-900/8 bg-paper px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-700">
                          <span className="font-extrabold text-ink-900">{h.winner ? `🏆 ${h.winner}` : "تعادل"}</span>
                          {" — "}
                          {h.players[0].name} {h.players[0].score} / {h.players[1].score} {h.players[1].name}
                          <span className="block text-ink-500">
                            {h.bankLabel} · {new Date(h.date).toLocaleDateString("ar-MA")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ============================================================
     شاشة النتيجة
  ============================================================ */
  if (phase === "result" && record) {
    const [a, b] = record.players;
    return (
      <section className="pt-32 pb-20 md:pt-36">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <div className="noise relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-800 via-brand-900 to-brand-950 p-8 text-center text-white sm:p-12">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute inset-0 pattern-zellige-light opacity-30" />
                <div className="absolute -top-24 start-1/3 size-80 rounded-full bg-gold-500/20 blur-[110px]" />
              </div>
              <div className="relative">
                <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 text-ink-950 shadow-xl shadow-gold-600/30">
                  <Trophy className="size-10" aria-hidden="true" />
                </span>
                <h1 className="mt-5 font-display text-3xl font-black sm:text-4xl">
                  {record.winner ? `الفائز: ${record.winner}` : "تعادل مثير!"}
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  {record.bankLabel} · {record.rounds} أسئلة · {record.mode === "duel" ? "مبارزة ثنائية" : `ضد ${AI_NAME} (${AI_LEVELS[aiLevel].label})`}
                </p>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {record.players.map((p) => (
                    <div
                      key={p.name}
                      className={cn(
                        "rounded-2xl border p-5",
                        record.winner === p.name ? "border-gold-400/60 bg-gold-400/15" : "border-white/12 bg-white/5"
                      )}
                    >
                      <span className="flex items-center justify-center gap-1.5 text-sm font-extrabold">
                        {p.isAi && <Bot className="size-4 text-gold-300" aria-hidden="true" />}
                        {p.name}
                      </span>
                      <span className="mt-1 block font-display text-4xl font-black text-gold-300">{p.score}</span>
                      <span className="mt-1.5 block text-[11px] text-white/60">
                        {p.correct} صحيحة{p.partial ? ` · ${p.partial} جزئية` : ""} · أطول سلسلة {p.bestStreak}
                        {p.avgSeconds !== null ? ` · معدل ${p.avgSeconds} ث` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => start()}
                    className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-gold-400 to-gold-500 px-7 py-3.5 text-sm font-extrabold text-ink-950 shadow-lg shadow-gold-600/25 transition-all hover:-translate-y-0.5"
                  >
                    <RotateCcw className="size-4.5" aria-hidden="true" />
                    إعادة المباراة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("setup")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-extrabold text-white/85 transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    <SlidersHorizontal className="size-4.5" aria-hidden="true" />
                    إعدادات جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ view: "home" })}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-extrabold text-white/85 transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    الرئيسية
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-6 rounded-3xl border border-ink-900/8 bg-white p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink-900">
                <Crown className="size-5 text-gold-600" aria-hidden="true" />
                لوحة الأبطال بعد هذه المباراة
              </h2>
              {champs.length === 0 ? (
                <p className="mt-3 text-xs text-ink-500">—</p>
              ) : (
                <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                  {champs.map((c, i) => (
                    <li key={c.name} className="flex items-center justify-between rounded-xl border border-ink-900/8 bg-paper px-3.5 py-2.5 text-xs font-bold text-ink-700">
                      <span className={cn("font-extrabold", i === 0 && "text-gold-700")}>
                        {i + 1}. {c.name}
                      </span>
                      <span>{c.wins} فوز</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
                النتيجة بين {a.name} و{b.name}: {a.score} — {b.score}. السجل محفوظ على هذا الجهاز فقط.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  /* ============================================================
     شاشة اللعب
  ============================================================ */
  if (!question) return null;
  const me = players[turn];
  const opponent = players[turn === 0 ? 1 : 0];
  const timeRatio = Math.max(0, secondsLeft / QUESTION_SECONDS);

  return (
    <section className="pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* لوحة النتائج المصغّرة */}
        <div className="grid grid-cols-2 gap-3">
          {players.map((p, i) => (
            <div
              key={p.name}
              className={cn(
                "rounded-2xl border p-4 transition-all",
                phase === "playing" && i === turn
                  ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-600/10"
                  : "border-ink-900/8 bg-white"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-extrabold text-ink-900">
                  {p.isAi ? <Bot className="size-4 shrink-0 text-gold-600" aria-hidden="true" /> : <Users className="size-4 shrink-0 text-brand-600" aria-hidden="true" />}
                  <span className="truncate">{p.name}</span>
                </span>
                {p.streak >= 2 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-black text-gold-700">
                    <Flame className="size-3" aria-hidden="true" />
                    {p.streak}
                  </span>
                )}
              </span>
              <span className="mt-1 block font-display text-3xl font-black text-brand-700">{p.score}</span>
            </div>
          ))}
        </div>

        {/* شريط التقدم والمؤقّت */}
        <div className="mt-4 flex items-center gap-3">
          <span className="shrink-0 rounded-xl border border-ink-900/10 bg-white px-3 py-1.5 text-[11px] font-extrabold text-ink-700">
            السؤال {idx + 1}/{qs.length}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-900/8" role="progressbar" aria-label="الوقت المتبقي" aria-valuemin={0} aria-valuemax={QUESTION_SECONDS} aria-valuenow={secondsLeft}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                timeRatio > 0.5 ? "bg-brand-500" : timeRatio > 0.25 ? "bg-gold-500" : "bg-rose-500"
              )}
              style={{ width: `${timeRatio * 100}%` }}
            />
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-black tabular-nums",
              secondsLeft <= 8 ? "bg-rose-100 text-rose-700" : "bg-white text-ink-700 border border-ink-900/10"
            )}
          >
            <Timer className="size-3.5" aria-hidden="true" />
            {secondsLeft} ث
          </span>
        </div>

        {/* دور من؟ */}
        {mode === "duel" && !submitted && (
          <p className="mt-4 text-center text-sm font-extrabold text-brand-700">
            دور <span className="text-ink-900">{me.name}</span> — خصمك <span className="text-ink-900">{opponent.name}</span> ينتظر سؤاله التالي
          </p>
        )}

        {/* السؤال */}
        <div className="mt-4 rounded-3xl border border-ink-900/8 bg-white p-6 sm:p-8">
          <QuestionCard question={question} answer={answer} onChange={setAnswer} />
          {!submitted ? (
            <button
              type="button"
              onClick={() => submit(false)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand-700/25 transition-all hover:-translate-y-0.5"
            >
              <CheckCircle2 className="size-4.5" aria-hidden="true" />
              تأكيد الإجابة
            </button>
          ) : (
            reveal && (
              <div
                className={cn(
                  "mt-6 rounded-2xl border p-5",
                  reveal.full ? "border-brand-300 bg-brand-50" : reveal.partial ? "border-gold-300 bg-gold-50" : "border-rose-300 bg-rose-50"
                )}
              >
                <p className={cn("flex items-center gap-2 font-display text-base font-extrabold", reveal.full ? "text-brand-800" : reveal.partial ? "text-gold-700" : "text-rose-700")}>
                  {reveal.full ? <CheckCircle2 className="size-5" aria-hidden="true" /> : reveal.partial || !reveal.timedOut ? <XCircle className="size-5" aria-hidden="true" /> : <Hourglass className="size-5" aria-hidden="true" />}
                  {reveal.timedOut
                    ? "انتهى الوقت!"
                    : reveal.full
                      ? `إجابة صحيحة: +${reveal.earned} نقطة${reveal.bonus ? " +1 نقطة سلسلة 🔥" : ""}`
                      : reveal.partial
                        ? `صواب جزئي: +${reveal.earned} نقطة`
                        : "إجابة غير صحيحة: 0 نقطة"}
                </p>
                {reveal.aiEarned !== null && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-ink-700">
                    <Bot className="size-4 text-gold-600" aria-hidden="true" />
                    {AI_NAME} ({AI_LEVELS[aiLevel].label}): {reveal.aiEarned > 0 ? `أصاب (+${reveal.aiEarned})` : "أخطأ (0)"}
                  </p>
                )}
                {question.explanation && <p className="mt-2.5 text-xs leading-relaxed text-ink-700">{question.explanation}</p>}
                <button
                  type="button"
                  onClick={next}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-gold-400 to-gold-500 px-8 py-3.5 text-sm font-extrabold text-ink-950 shadow-lg shadow-gold-600/25 transition-all hover:-translate-y-0.5"
                >
                  {idx + 1 >= qs.length ? "عرض النتيجة النهائية" : "السؤال التالي"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
