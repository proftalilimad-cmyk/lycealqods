import type { Submission } from "../types";
import { levelOf } from "./grading";

const KEY = "talil_platform_submissions_v1";
const SEED_FLAG = "talil_platform_seeded_v1";

const DEMO_NAMES: { name: string; className: string; no: string }[] = [
  { name: "سلمى العلوي", className: "الجذع المشترك العلمي", no: "12" },
  { name: "يوسف أيت الحاج", className: "الجذع المشترك العلمي", no: "7" },
  { name: "خديجة بوقنتار", className: "الجذع المشترك آداب وعلوم إنسانية", no: "3" },
  { name: "مهدي الرامي", className: "الجذع المشترك التكنولوجي", no: "18" },
  { name: "سارة الإدريسي", className: "الجذع المشترك العلمي", no: "21" },
  { name: "عمر بناني", className: "الجذع المشترك آداب وعلوم إنسانية", no: "9" },
  { name: "إيمان الشرقاوي", className: "الجذع المشترك العلمي", no: "25" },
  { name: "أيوب التازي", className: "الجذع المشترك التكنولوجي", no: "5" },
  { name: "مريم الفاسي", className: "الجذع المشترك آداب وعلوم إنسانية", no: "14" },
  { name: "حمزة الكتاني", className: "الجذع المشترك العلمي", no: "30" },
  { name: "نور الدين بوزيد", className: "الجذع المشترك التكنولوجي", no: "11" },
  { name: "زينب المرابط", className: "الجذع المشترك العلمي", no: "16" },
  { name: "ياسين حجاجي", className: "الجذع المشترك آداب وعلوم إنسانية", no: "2" },
  { name: "أسماء بلقاضي", className: "الجذع المشترك العلمي", no: "27" },
];

const DEMO_TOTALS = [17.5, 14, 11.5, 9, 16, 12.5, 18, 8.5, 13, 15.5, 10, 7.5, 12, 16.5];

function seeded(): Submission[] {
  return DEMO_NAMES.map((d, i) => {
    const total = DEMO_TOTALS[i % DEMO_TOTALS.length];
    const history = Math.min(10, Math.round((total / 2 + (i % 3) * 0.5) * 2) / 2);
    const geography = Math.round((total - history) * 2) / 2;
    const percent = Math.round((total / 20) * 1000) / 10;
    return {
      id: `demo-${i}`,
      name: d.name,
      className: d.className,
      studentNo: d.no,
      date: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
      history,
      geography,
      total,
      percent,
      level: levelOf(percent).label,
      bankId: i % 2 === 0 ? "tc-sci" : "tc-arts",
      bankLabel: i % 2 === 0 ? "الجذع المشترك العلمي والتكنولوجي" : "الجذع المشترك آداب وعلوم إنسانية",
      skills: {
        "مفاهيم تاريخية": { got: Math.min(3, history * 0.3), max: 3 },
        "التسلسل الزمني للأحداث": { got: Math.min(2, history * 0.24), max: 2 },
        "تحليل الوثائق التاريخية": { got: Math.min(2, history * 0.2), max: 2 },
        "قراءة الجداول الإحصائية": { got: Math.min(1, geography * 0.12), max: 1 },
        "قراءة المبيانات": { got: Math.min(1, geography * 0.1 + 0.1), max: 1 },
        "قراءة الخرائط": { got: Math.min(1, geography * 0.11), max: 1 },
        "التعبير والكتابة": { got: Math.min(1, (total / 20) * 0.9 + 0.05), max: 1 },
      },
      demo: true,
    };
  });
}

export function getSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Submission[]) : [];
  } catch {
    return [];
  }
}

export function addSubmission(sub: Submission): void {
  const list = getSubmissions();
  list.push(sub);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function ensureSeeded(): void {
  if (localStorage.getItem(SEED_FLAG)) return;
  if (getSubmissions().length === 0) {
    localStorage.setItem(KEY, JSON.stringify(seeded()));
  }
  localStorage.setItem(SEED_FLAG, "1");
}

export function clearDemoData(): void {
  const list = getSubmissions().filter((s) => !s.demo);
  localStorage.setItem(KEY, JSON.stringify(list));
  localStorage.setItem(SEED_FLAG, "1"); // لا نعيد البذر
}

export function clearAllData(): void {
  localStorage.removeItem(KEY);
  localStorage.setItem(SEED_FLAG, "1");
}

export function exportCsv(list: Submission[]): void {
  const header = "التلميذ,القسم,المستوى - المسلك,التاريخ /10,الجغرافيا /10,المجموع /20,النسبة,المستوى,التاريخ\n";
  const rows = list
    .map(
      (s) =>
        `"${s.name}","${s.className}","${s.bankLabel ?? "الجذع المشترك"}",${s.history},${s.geography},${s.total},${s.percent}%,${s.level},"${new Date(
          s.date
        ).toLocaleDateString("fr-MA")}"`
    )
    .join("\n");
  const csv = "﻿" + header + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "نتائج-التقويم-التشخيصي.csv";
  a.click();
  URL.revokeObjectURL(url);
}
