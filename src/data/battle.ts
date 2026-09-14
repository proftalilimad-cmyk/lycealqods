import type { Question } from "../types";
import { gradeAutoQuestion } from "../lib/grading";
import { TEST_BANKS } from "./testBanks";

/* ============================================================
   وضع المبارزة — إعدادات وقواعد اللعب وحفظ السجل محليًا

   نمطان:
   - duel: مبارزة ثنائية على جهاز واحد (hot-seat): يتناوب اللاعبان
     على أسئلة مختلفة، والنقطة لمن يجيب أفضل في سؤاله.
   - solo: تحدٍّ فردي ضد «البطل الآلي» الذي تُحاكى إجابته حسب مستواه.

   التنقيط: نقاط السؤال كاملة عند الإجابة الصحيحة، ونسبة منها في
   أسئلة الترتيب/الربط عند الصواب الجزئي، + نقطة إضافية عند سلسلة
   3 إجابات صحيحة متتالية («سلسلة 🔥»). انتهاء الوقت = 0 نقطة.
  ============================================================ */

export type BattleMode = "duel" | "solo";
export type AiLevel = "rookie" | "mid" | "pro";

export const AI_LEVELS: Record<AiLevel, { label: string; accuracy: number; desc: string }> = {
  rookie: { label: "مبتدئ", accuracy: 0.45, desc: "يخطئ كثيرًا — مناسب للإحماء" },
  mid: { label: "متوسط", accuracy: 0.65, desc: "منافس متوازن يشبه زميلًا مجتهدًا" },
  pro: { label: "خبير", accuracy: 0.85, desc: "لا يرحم: للتحدي الحقيقي" },
};

export const AI_NAME = "البطل الآلي";

/** عدد الأسئلة في المباراة */
export const ROUND_OPTIONS = [8, 12, 16] as const;

/** زمن التفكير في كل سؤال (ثوانٍ) */
export const QUESTION_SECONDS = 30;

/** طول السلسلة التي تمنح نقطة إضافية */
export const STREAK_BONUS_AT = 3;

/** أنواع الأسئلة المقبولة في المبارزة (تُستبعد الكتابة لأنها إنشائية بطيئة) */
const BATTLE_KINDS: Question["kind"][] = ["mcq", "tf", "ordering", "matching", "doc"];

export function shuffle<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** أسئلة مبارزة لبنك معيّن: موضوعية فقط ومخلوطة عشوائيًا */
export function battleQuestions(bankId: string, count: number): Question[] {
  const bank = TEST_BANKS.find((b) => b.id === bankId);
  if (!bank) return [];
  const pool = bank.questions.filter((q) => BATTLE_KINDS.includes(q.kind));
  return shuffle(pool).slice(0, count);
}

export function isFullCredit(q: Question, earned: number): boolean {
  return earned >= q.points - 1e-9;
}

/** محاكاة إجابة البطل الآلي على سؤال */
export function aiAnswers(q: Question, accuracy: number): number {
  return Math.random() < accuracy ? q.points : 0;
}

export function gradeFor(q: Question, a: Parameters<typeof gradeAutoQuestion>[1]): number {
  return Math.round(gradeAutoQuestion(q, a) * 100) / 100;
}

/* ===================== سجل المبارزات (localStorage) ===================== */

export interface BattlePlayerResult {
  name: string;
  score: number;
  correct: number;
  partial: number;
  bestStreak: number;
  avgSeconds: number | null;
  isAi?: boolean;
}

export interface BattleRecord {
  id: string;
  date: string;
  mode: BattleMode;
  bankId: string;
  bankLabel: string;
  rounds: number;
  players: BattlePlayerResult[];
  winner: string | null;
}

const KEY = "talil_platform_battles_v1";

export function getBattles(): BattleRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BattleRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBattle(record: BattleRecord): BattleRecord[] {
  const all = [record, ...getBattles()].slice(0, 30);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* مساحة ممتلئة أو وضع خاص: نتجاهل بهدوء */
  }
  return all;
}

export interface ChampionRow {
  name: string;
  wins: number;
  plays: number;
  bestScore: number;
}

/** ترتيب الأبطال حسب عدد الانتصارات ثم أفضل نتيجة */
export function champions(records: BattleRecord[]): ChampionRow[] {
  const map = new Map<string, ChampionRow>();
  for (const r of records) {
    for (const p of r.players) {
      if (p.isAi) continue;
      const row = map.get(p.name) ?? { name: p.name, wins: 0, plays: 0, bestScore: 0 };
      row.plays += 1;
      row.bestScore = Math.max(row.bestScore, p.score);
      if (r.winner === p.name) row.wins += 1;
      map.set(p.name, row);
    }
  }
  return [...map.values()].sort((a, b) => b.wins - a.wins || b.bestScore - a.bestScore).slice(0, 5);
}

export function newBattleId(): string {
  return `b-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}
