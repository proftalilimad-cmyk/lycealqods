import type { Question } from "../types";
import { QUESTIONS } from "./questions";
import { BAC1_ARTS_QUESTIONS } from "./banks/testBanksBac1";
import { BAC2_ARTS_QUESTIONS, BAC2_HUM_OVERRIDES } from "./banks/testBanksBac2";
import {
  BAC1_EXP_OVERRIDES,
  BAC1_SCI_OVERRIDES,
  TC_ARTS_OVERRIDES,
  TC_ASIL_OVERRIDES,
} from "./banks/testBanksOverrides";

export interface TestBankDef {
  id: string;
  level: string;
  branch: string;
  desc: string;
  focus: string[];
  questions: Question[];
}

const withOverrides = (base: Question[], overrides: Record<number, Question>): Question[] =>
  base.map((b) => overrides[b.id] ?? b);

export const TEST_BANKS: TestBankDef[] = [
  {
    id: "tc-arts",
    level: "الجذع المشترك",
    branch: "الجذع المشترك آداب وعلوم إنسانية",
    desc: "مكتسبات الإعدادي مع تعمق في تحليل الوثائق والاستنتاج",
    focus: ["وثائق وزمنيات", "تطور العالم 15–18م", "طبوغرافية وسكان", "كتابة فقرة بشبكة تنقيط"],
    questions: withOverrides(QUESTIONS, TC_ARTS_OVERRIDES),
  },
  {
    id: "tc-sci",
    level: "الجذع المشترك",
    branch: "الجذع المشترك العلمي",
    desc: "تقويم شامل للمكتسبات القبلية بالمسلك العلمي والتكنولوجي",
    focus: ["مكتسبات إعدادي للتاريخ والجغرافيا", "قراءة وثائق ومبيانات", "تشخيص المهارات بالتفصيل"],
    questions: QUESTIONS,
  },
  {
    id: "tc-asil",
    level: "الجذع المشترك",
    branch: "الجذع المشترك للتعليم الأصيل",
    desc: "تقويم منطلق لعالم التعليم الأصيل مع وثائق منسجمة",
    focus: ["مفاهيم وثوابت تاريخية", "بنية الدروس بالمجال الإسلامي", "مهارات كتابة الفقرة"],
    questions: withOverrides(QUESTIONS, TC_ASIL_OVERRIDES),
  },
  {
    id: "bac1-arts",
    level: "الأولى باكالوريا",
    branch: "الأولى باكالوريا آداب وعلوم إنسانية",
    desc: "مكتسبات عام 1945 والتاريخ المعاصر + جغرافيا السكان والموارد",
    focus: ["الحربان والأنظمة الدولية", "سكان العالم", "طاقة وموارد", "كتابة عن التنمية"],
    questions: BAC1_ARTS_QUESTIONS,
  },
  {
    id: "bac1-sci",
    level: "الأولى باكالوريا",
    branch: "الأولى باكالوريا علوم",
    desc: "تقويم مكتسبات الجذع المشترك مع ميل لمهارات البيئة والمنهج العلمي",
    focus: ["تاريخ 15–20م", "كوارث ووسط طبيعي", "تحليل معطيات", "فقرة البيئة والموارد"],
    questions: withOverrides(QUESTIONS, BAC1_SCI_OVERRIDES),
  },
  {
    id: "bac1-exp",
    level: "الأولى باكالوريا",
    branch: "الأولى باكالوريا علوم تجريبية",
    desc: "تشخيص مهارات الوثائق والتحليل التجريبي بمفاهيم مادة وقواعد التكنولوجية",
    focus: ["منهجيته العلمية", "وثائق وجداول بيانية", "كوارث وموارد", "كتابة منهجية"],
    questions: withOverrides(QUESTIONS, BAC1_EXP_OVERRIDES),
  },
  {
    id: "bac2-arts",
    level: "الثانية باكالوريا",
    branch: "الثانية باكالوريا آداب",
    desc: "مكتسبات الأولى باكالوريا: الحماية والحركة الوطنية + العالم بعد 1945 + جغرافيا المغرب",
    focus: ["المغرب من 1912 إلى اليوم", "العالم بعد 1945", "سكان وأنشطة المغرب", "تحديات التنمية"],
    questions: BAC2_ARTS_QUESTIONS,
  },
  {
    id: "bac2-hum",
    level: "الثانية باكالوريا",
    branch: "الثانية باكالوريا علوم إنسانية",
    desc: "تقويم ملائم لمسلك العلوم الإنسانية مع تعمق في الجغرافيا الاقتصادية والاجتماعية وقضايا التنمية",
    focus: ["الحركة الوطنية", "العالم بعد 1945", "تنمية وتفاوت", "قضايا العصر الاجتماعية"],
    questions: withOverrides(BAC2_ARTS_QUESTIONS, BAC2_HUM_OVERRIDES),
  },
];

export function getBank(id: string | undefined): TestBankDef | undefined {
  return TEST_BANKS.find((b) => b.id === id);
}
