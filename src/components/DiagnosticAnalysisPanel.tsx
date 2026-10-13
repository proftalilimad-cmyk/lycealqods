import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileDown,
  Filter,
  Layers3,
  ListChecks,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Table2,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { TEST_BANKS } from "../data/testBanks";
import {
  academicYearForSubmission,
  allQuestionClassifications,
  buildDiagnosticAnalysis,
  EMPTY_ANALYSIS_FILTERS,
  levelLabel,
  loadDiagnosticModel,
  modelAbilities,
  modelCompetencies,
  priorityLabel,
  questionMappingKey,
  saveDiagnosticModel,
  subjectLabel,
  UNCLASSIFIED_ID,
  type DiagnosticAbility,
  type DiagnosticAnalysis,
  type DiagnosticAnalysisFilters,
  type DiagnosticCompetency,
  type DiagnosticModelState,
  type SupportPriority,
} from "../data/diagnosticCompetencyModel";
import { displayClassName } from "../data/diagnosticSchedule";
import { isDemoSubmission, loadSubmissions } from "../lib/storage";
import type { Subject, Submission } from "../types";

interface DiagnosticAnalysisPanelProps {
  initialView?: "analysis" | "matrix" | "manage";
}

type PanelView = "analysis" | "matrix" | "manage";

const subjectOptions: { value: "all" | Subject; label: string }[] = [
  { value: "all", label: "المادتان" },
  { value: "history", label: "التاريخ" },
  { value: "geography", label: "الجغرافيا" },
];

const levelTone: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  weak: "bg-rose-50 text-rose-700 ring-rose-200",
};

const priorityTone: Record<SupportPriority, string> = {
  critical: "bg-rose-100 text-rose-700",
  high: "bg-orange-100 text-orange-700",
  reinforce: "bg-amber-100 text-amber-700",
  good: "bg-emerald-100 text-emerald-700",
};

const percentText = (value: number) => `${Number.isFinite(value) ? value.toFixed(1).replace(".0", "") : "0"}٪`;
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
const safeFilePart = (value: string) => value.replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/g, "") || "report";

function downloadText(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function filteredMatrixRows(model: DiagnosticModelState, filters: DiagnosticAnalysisFilters) {
  return allQuestionClassifications(model).filter((item) => {
    const bank = TEST_BANKS.find((candidate) => candidate.id === item.bankId);
    if (filters.level !== "all" && bank?.level !== filters.level) return false;
    if (filters.branch !== "all" && bank?.branch !== filters.branch && bank?.id !== filters.branch) return false;
    if (filters.bankId !== "all" && item.bankId !== filters.bankId) return false;
    if (filters.subject !== "all" && item.question.subject !== filters.subject) return false;
    if (filters.competencyId !== "all" && item.competency?.id !== filters.competencyId) return false;
    if (filters.abilityId !== "all" && item.ability?.id !== filters.abilityId) return false;
    return true;
  });
}

function matrixCsv(model: DiagnosticModelState, filters: DiagnosticAnalysisFilters): string {
  const lines = [["الرائز", "رقم السؤال", "المادة", "المهارة الحالية", "الكفاية", "القدرة", "الحالة"].map(csvCell).join(",")];
  filteredMatrixRows(model, filters).forEach((item) => {
    lines.push([
      TEST_BANKS.find((bank) => bank.id === item.bankId)?.branch ?? item.bankId,
      item.questionId,
      subjectLabel(item.question.subject),
      item.question.skill,
      item.competency?.name ?? "غير مستخرجة",
      item.ability?.name ?? "غير مصنفة",
      item.ability && item.competency ? "مصنف" : "غير مصنف",
    ].map(csvCell).join(","));
  });
  return `\ufeff${lines.join("\n")}`;
}

function analysisCsv(analysis: DiagnosticAnalysis): string {
  const lines = [
    ["نوع", "المادة", "الكفاية", "القدرة", "النسبة", "المستوى", "أولوية الدعم", "النقاط المحصلة", "النقاط الممكنة", "عدد المشاركين"].map(csvCell).join(","),
  ];
  analysis.abilities.forEach((item) => {
    lines.push([
      "قدرة",
      subjectLabel(item.subject),
      item.competencyName,
      item.name,
      percentText(item.percent),
      levelLabel(item.level),
      priorityLabel(item.priority),
      item.got.toFixed(2),
      item.max.toFixed(2),
      item.participants,
    ].map(csvCell).join(","));
  });
  analysis.competencies.forEach((item) => {
    lines.push([
      "كفاية",
      subjectLabel(item.subject),
      item.name,
      "",
      percentText(item.percent),
      levelLabel(item.level),
      priorityLabel(item.priority),
      "",
      "",
      item.participants,
    ].map(csvCell).join(","));
  });
  lines.push("");
  lines.push(["السؤال", "المادة", "الكفاية", "القدرة", "النسبة", "الإجابات", "المشاركون"].map(csvCell).join(","));
  analysis.questions.forEach((item) => {
    lines.push([
      `س${item.questionId}`,
      subjectLabel(item.subject),
      item.competencyName ?? "غير مصنف",
      item.abilityName ?? "غير مصنفة",
      percentText(item.percent),
      item.answered,
      item.participants,
    ].map(csvCell).join(","));
  });
  return `\ufeff${lines.join("\n")}`;
}

function reportHtml(analysis: DiagnosticAnalysis, title: string): string {
  const competencyRows = analysis.competencies.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(subjectLabel(item.subject))}</td><td>${escapeHtml(percentText(item.percent))}</td><td>${escapeHtml(levelLabel(item.level))}</td><td>${escapeHtml(priorityLabel(item.priority))}</td></tr>`).join("");
  const abilityRows = analysis.abilities.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.competencyName)}</td><td>${escapeHtml(subjectLabel(item.subject))}</td><td>${escapeHtml(percentText(item.percent))}</td><td>${escapeHtml(priorityLabel(item.priority))}</td></tr>`).join("");
  const priorities = analysis.abilities.filter((item) => item.priority !== "good").slice(0, 8).map((item) => `<li><strong>${escapeHtml(item.name)}</strong> — ${escapeHtml(percentText(item.percent))} (${escapeHtml(priorityLabel(item.priority))})</li>`).join("");
  return `
      <main dir="rtl">
      <header><p class="kicker">منصة التحليل التربوي التركيبي</p><h1>${escapeHtml(title)}</h1><p>تقرير القسم / المجموعة — تاريخ الإنشاء: ${escapeHtml(new Date().toLocaleDateString("ar-MA"))}</p></header>
      <section class="kpis"><div><b>${analysis.participants}</b><span>مشاركًا</span></div><div><b>${percentText(analysis.overallPercent)}</b><span>التحكم العام</span></div><div><b>${percentText(analysis.historyPercent)}</b><span>التاريخ</span></div><div><b>${percentText(analysis.geographyPercent)}</b><span>الجغرافيا</span></div></section>
      <h2>مخطط الكفايات</h2><table><thead><tr><th>الكفاية</th><th>المادة</th><th>النسبة</th><th>المستوى</th><th>الدعم</th></tr></thead><tbody>${competencyRows || "<tr><td colspan=5>لا توجد معطيات كافية</td></tr>"}</tbody></table>
      <h2>تحليل القدرات</h2><table><thead><tr><th>القدرة</th><th>الكفاية</th><th>المادة</th><th>النسبة</th><th>الأولوية</th></tr></thead><tbody>${abilityRows || "<tr><td colspan=5>لا توجد معطيات كافية</td></tr>"}</tbody></table>
      <h2>أهم التعثرات</h2><ul>${priorities || "<li>لا توجد أولوية دعم في النطاق المحدد.</li>"}</ul>
      <h2>المنهجية</h2><ol>${analysis.methodology.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      <footer>هذا التقرير مبني على النتائج المركزية المتاحة للحساب المصادق عليه. لا تُعرض التفاصيل الفردية في التقرير التركيبي.</footer>
    </main>`;
}

function openPrintReport(analysis: DiagnosticAnalysis, title: string): void {
  const popup = window.open("", "_blank", "width=1000,height=800");
  if (!popup) {
    window.print();
    return;
  }
  popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#17251f;background:#fff;margin:0;font-size:11px}h1{font-size:24px;color:#07553e;margin:5px 0 8px}h2{font-size:16px;color:#07553e;border-bottom:1px solid #dce9e1;padding-bottom:5px;margin:22px 0 8px}.kicker{color:#b17617;font-weight:700;margin:0}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.kpis div{border:1px solid #dce9e1;border-radius:10px;padding:10px;text-align:center}.kpis b{display:block;color:#07553e;font-size:20px}.kpis span{font-size:10px;color:#5b6c64}table{border-collapse:collapse;width:100%;margin-bottom:12px}th{background:#e9f4ee;color:#07553e}td,th{border:1px solid #d6e3dc;padding:6px;text-align:right}ul,ol{line-height:1.9;padding-right:22px}footer{border-top:1px solid #d6e3dc;margin-top:25px;padding-top:9px;color:#63736b;font-size:9px}@media print{button{display:none}}
  </style></head><body>${reportHtml(analysis, title)}</body></html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
}

function SelectField({ label, value, onChange, children, disabled = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold text-ink-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 disabled:bg-ink-50">
        {children}
      </select>
    </label>
  );
}

function Kpi({ label, value, note, tone = "brand" }: { label: string; value: string | number; note: string; tone?: "brand" | "gold" | "rose" | "emerald" }) {
  const tones = {
    brand: "border-brand-100 bg-brand-50 text-brand-800",
    gold: "border-gold-100 bg-gold-50 text-gold-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  };
  return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><p className="text-[11px] font-bold opacity-70">{label}</p><p className="mt-1 font-display text-2xl font-black">{value}</p><p className="mt-1 text-[10px] font-semibold opacity-70">{note}</p></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 p-10 text-center"><BarChart3 className="mx-auto size-10 text-brand-300" aria-hidden="true" /><h3 className="mt-4 font-display text-lg font-black text-ink-900">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-500">{text}</p></div>;
}

function ModelManager({ model, setModel }: { model: DiagnosticModelState; setModel: (updater: (current: DiagnosticModelState) => DiagnosticModelState) => void }) {
  const [newCompetency, setNewCompetency] = useState("");
  const [newAbility, setNewAbility] = useState("");
  const [newSubject, setNewSubject] = useState<Subject>("history");
  const [newAbilityCompetency, setNewAbilityCompetency] = useState(model.competencies[0]?.id ?? "");
  const [notice, setNotice] = useState("");

  const addCompetency = () => {
    const name = newCompetency.trim();
    if (!name) return;
    const id = `teacher-competency-${Date.now()}`;
    setModel((current) => ({
      ...current,
      competencies: [...current.competencies, { id, name, description: "كفاية أنشأها الأستاذ ويمكن تعديلها.", subject: newSubject, active: true, order: current.competencies.length + 1, source: "teacher" }],
    }));
    setNewCompetency("");
    setNewAbilityCompetency(id);
    setNotice("تمت إضافة الكفاية إلى النموذج المحلي القابل للتعديل.");
  };

  const addAbility = () => {
    const name = newAbility.trim();
    const competency = model.competencies.find((item) => item.id === newAbilityCompetency);
    if (!name || !competency) return;
    const id = `teacher-ability-${Date.now()}`;
    setModel((current) => ({
      ...current,
      abilities: [...current.abilities, { id, competencyId: competency.id, name, description: "قدرة أنشأها الأستاذ ويمكن وزنها أو تعطيلها.", subject: competency.subject, active: true, order: current.abilities.length + 1, weight: 1, source: "teacher" }],
    }));
    setNewAbility("");
    setNotice("تمت إضافة القدرة. اربط بها الأسئلة من مصفوفة الرائز.");
  };

  const updateCompetency = (id: string, patch: Partial<DiagnosticCompetency>) => setModel((current) => ({ ...current, competencies: current.competencies.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const updateAbility = (id: string, patch: Partial<DiagnosticAbility>) => setModel((current) => ({ ...current, abilities: current.abilities.map((item) => item.id === id ? { ...item, ...patch } : item) }));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gold-200 bg-gold-50/70 p-4 text-sm leading-relaxed text-gold-900">
        <div className="flex items-start gap-2"><Settings2 className="mt-0.5 size-4 shrink-0" /><p><strong>إدارة النموذج:</strong> التصنيفات الافتراضية مسودة مستخرجة من مهارات الأسئلة الحالية وليست كفايات رسمية. التعديلات تحفظ إعدادات التصنيف فقط في المتصفح، أما النتائج الحقيقية فتبقى في Supabase ولا تُنقل إلى localStorage.</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-900/8 bg-white p-4">
          <h3 className="font-display font-black text-ink-900">إضافة كفاية</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_auto]"><input value={newCompetency} onChange={(event) => setNewCompetency(event.target.value)} placeholder="اسم الكفاية" className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-xs outline-none focus:border-brand-500" /><select value={newSubject} onChange={(event) => setNewSubject(event.target.value as Subject)} className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-xs font-bold"><option value="history">التاريخ</option><option value="geography">الجغرافيا</option></select><button type="button" onClick={addCompetency} className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-700 px-3 py-2 text-xs font-extrabold text-white"><Plus className="size-3.5" /> إضافة</button></div>
        </section>
        <section className="rounded-2xl border border-ink-900/8 bg-white p-4">
          <h3 className="font-display font-black text-ink-900">إضافة قدرة ووزنها</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_170px_auto]"><input value={newAbility} onChange={(event) => setNewAbility(event.target.value)} placeholder="اسم القدرة" className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-xs outline-none focus:border-brand-500" /><select value={newAbilityCompetency} onChange={(event) => setNewAbilityCompetency(event.target.value)} className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-xs font-bold">{model.competencies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={addAbility} className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-700 px-3 py-2 text-xs font-extrabold text-white"><Plus className="size-3.5" /> إضافة</button></div>
        </section>
      </div>
      {notice && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{notice}</p>}
      <section className="overflow-hidden rounded-2xl border border-ink-900/8 bg-white">
        <div className="border-b border-ink-900/8 bg-paper-warm/50 px-4 py-3"><h3 className="font-display font-black text-ink-900">الكفايات والقدرات الحالية</h3><p className="mt-1 text-xs text-ink-500">يمكن تعديل الاسم، التفعيل، والوزن مباشرة ثم حفظ النموذج.</p></div>
        <div className="divide-y divide-ink-900/6">
          {model.competencies.map((competency) => <div key={competency.id} className="p-4">
            <div className="grid gap-2 md:grid-cols-[1fr_130px_75px_auto] md:items-center"><input value={competency.name} onChange={(event) => updateCompetency(competency.id, { name: event.target.value })} className="rounded-lg border border-ink-900/10 px-3 py-2 text-sm font-extrabold text-ink-900" /><select value={competency.subject} onChange={(event) => updateCompetency(competency.id, { subject: event.target.value as Subject })} className="rounded-lg border border-ink-900/10 px-2 py-2 text-xs font-bold"><option value="history">التاريخ</option><option value="geography">الجغرافيا</option></select><label className="flex items-center gap-1 text-[11px] font-bold text-ink-600">الترتيب <input type="number" min="0" value={competency.order} onChange={(event) => updateCompetency(competency.id, { order: Number(event.target.value) || 0 })} className="w-14 rounded-lg border border-ink-900/10 px-1.5 py-1.5 text-center" /></label><label className="flex items-center gap-2 text-xs font-bold text-ink-600"><input type="checkbox" checked={competency.active} onChange={(event) => updateCompetency(competency.id, { active: event.target.checked })} className="size-4 accent-brand-600" /> مفعلة</label></div>
            <div className="mt-3 space-y-2 border-s-2 border-brand-100 pe-4">{model.abilities.filter((ability) => ability.competencyId === competency.id).map((ability) => <div key={ability.id} className="grid gap-2 rounded-xl bg-brand-50/60 p-2 sm:grid-cols-[1fr_170px_75px_90px_auto] sm:items-center"><input value={ability.name} onChange={(event) => updateAbility(ability.id, { name: event.target.value })} className="rounded-lg border border-ink-900/10 bg-white px-2.5 py-2 text-xs font-bold" /><select value={ability.competencyId} onChange={(event) => { const next = model.competencies.find((item) => item.id === event.target.value); updateAbility(ability.id, { competencyId: event.target.value, subject: next?.subject ?? ability.subject }); }} className="rounded-lg border border-ink-900/10 bg-white px-2 py-2 text-[11px] font-bold">{model.competencies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label className="flex items-center gap-1 text-[11px] font-bold text-ink-600">الترتيب <input type="number" min="0" value={ability.order} onChange={(event) => updateAbility(ability.id, { order: Number(event.target.value) || 0 })} className="w-14 rounded-lg border border-ink-900/10 bg-white px-1.5 py-1.5 text-center" /></label><label className="flex items-center gap-1 text-[11px] font-bold text-ink-600">الوزن <input type="number" min="0.1" step="0.1" value={ability.weight} onChange={(event) => updateAbility(ability.id, { weight: Math.max(0.1, Number(event.target.value) || 1) })} className="w-16 rounded-lg border border-ink-900/10 bg-white px-2 py-1.5 text-center" /></label><label className="flex items-center gap-2 text-[11px] font-bold text-ink-600"><input type="checkbox" checked={ability.active} onChange={(event) => updateAbility(ability.id, { active: event.target.checked })} className="size-4 accent-brand-600" /> مفعلة</label></div>)}</div>
          </div>)}
        </div>
      </section>
      <button type="button" onClick={() => { saveDiagnosticModel(model); setNotice("تم حفظ إعدادات الكفايات والقدرات."); }} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-brand-700/20"><Save className="size-4" /> حفظ النموذج</button>
    </div>
  );
}

function QuestionMatrix({ model, filters, setModel }: { model: DiagnosticModelState; filters: DiagnosticAnalysisFilters; setModel: (updater: (current: DiagnosticModelState) => DiagnosticModelState) => void }) {
  const rows = useMemo(() => filteredMatrixRows(model, filters), [filters, model]);

  const updateMapping = (bankId: string, questionId: number, abilityId: string) => {
    setModel((current) => ({ ...current, questionMappings: { ...current.questionMappings, [questionMappingKey(bankId, questionId)]: abilityId } }));
  };

  return <section className="overflow-hidden rounded-3xl border border-ink-900/8 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/8 bg-paper-warm/50 p-5"><div><h2 className="font-display text-xl font-black text-ink-900">مصفوفة الرائز</h2><p className="mt-1 text-xs leading-relaxed text-ink-500">ربط كل سؤال بقدرة واحدة، وتستخرج الكفاية تلقائيًا من القدرة. السؤال غير المصنف يمنع التقرير النهائي.</p></div><span className="rounded-full bg-brand-100 px-3 py-1.5 text-xs font-extrabold text-brand-700">{rows.length} سؤالًا</span></div>
    <div className="max-h-[680px] overflow-auto"><table className="w-full min-w-[920px] text-xs"><thead className="sticky top-0 z-10 bg-brand-50 text-brand-800"><tr><th className="px-4 py-3 text-start">الرائز / السؤال</th><th className="px-3 py-3 text-start">المادة</th><th className="px-3 py-3 text-start">المهارة الحالية</th><th className="px-3 py-3 text-start">الكفاية المستخرجة</th><th className="px-3 py-3 text-start">القدرة</th><th className="px-3 py-3 text-center">الحالة</th></tr></thead><tbody>{rows.map((item, index) => <tr key={`${item.bankId}-${item.questionId}`} className={index % 2 ? "bg-paper-warm/30" : "bg-white"}><td className="max-w-[320px] px-4 py-3"><span className="font-bold text-brand-700">س{item.questionId} · {TEST_BANKS.find((bank) => bank.id === item.bankId)?.branch}</span><span className="mt-1 block leading-relaxed text-ink-700">{item.question.title}</span></td><td className="px-3 py-3 font-bold text-ink-600">{subjectLabel(item.question.subject)}</td><td className="px-3 py-3 text-ink-500">{item.question.skill}</td><td className="px-3 py-3 font-bold text-ink-700">{item.competency?.name ?? "غير مستخرجة"}</td><td className="px-3 py-3"><select value={item.ability?.id ?? UNCLASSIFIED_ID} onChange={(event) => updateMapping(item.bankId, item.questionId, event.target.value)} className={`w-full rounded-lg border px-2 py-2 text-[11px] font-bold outline-none ${item.ability ? "border-ink-900/10 bg-white" : "border-rose-300 bg-rose-50 text-rose-700"}`}><option value={UNCLASSIFIED_ID}>غير مصنفة</option>{modelAbilities(model, item.question.subject).map((ability) => <option key={ability.id} value={ability.id}>{ability.name} — {model.competencies.find((competency) => competency.id === ability.competencyId)?.name}</option>)}</select></td><td className="px-3 py-3 text-center">{item.ability && item.competency ? <CheckCircle2 className="mx-auto size-4 text-emerald-600" aria-label="مصنف" /> : <XCircle className="mx-auto size-4 text-rose-600" aria-label="غير مصنف" />}</td></tr>)}</tbody></table></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/8 p-4"><p className="text-xs text-ink-500">التغييرات لا تُطبق على السؤال أو المصدر الأصلي؛ إنها طبقة تصنيف تحليلية قابلة للتراجع.</p><button type="button" onClick={() => saveDiagnosticModel(model)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-3 py-2 text-xs font-extrabold text-white"><Save className="size-3.5" /> حفظ التصنيفات</button></div>
  </section>;
}

function Filters({ filters, setFilters, model, submissions, showDemo, setShowDemo, onRefresh, loading }: { filters: DiagnosticAnalysisFilters; setFilters: (updater: (current: DiagnosticAnalysisFilters) => DiagnosticAnalysisFilters) => void; model: DiagnosticModelState; submissions: Submission[]; showDemo: boolean; setShowDemo: (value: boolean) => void; onRefresh: () => void; loading: boolean }) {
  const years = Array.from(new Set(submissions.map((submission) => academicYearForSubmission(submission)))).sort((a, b) => b.localeCompare(a));
  const levels = Array.from(new Set(TEST_BANKS.map((bank) => bank.level))).sort();
  const branches = TEST_BANKS.filter((bank) => filters.level === "all" || bank.level === filters.level);
  const banks = TEST_BANKS.filter((bank) => filters.level === "all" || bank.level === filters.level).filter((bank) => filters.branch === "all" || bank.branch === filters.branch || bank.id === filters.branch);
  const classes = Array.from(new Set(submissions.map((submission) => submission.className).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar"));
  const set = (patch: Partial<DiagnosticAnalysisFilters>) => setFilters((current) => ({ ...current, ...patch }));
  return <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(4,36,26,0.4)]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-extrabold text-brand-700"><Filter className="size-3" /> فلاتر التقرير الحي</p><h2 className="mt-2 font-display text-xl font-black text-ink-900">اختر نطاق التحليل</h2><p className="mt-1 text-xs text-ink-500">تؤثر التغييرات مباشرة على المؤشرات والجداول والمخططات دون إعادة تحميل.</p></div><div className="flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-[11px] font-extrabold text-gold-800"><input type="checkbox" checked={showDemo} onChange={(event) => setShowDemo(event.target.checked)} className="size-4 accent-gold-600" /> عرض بيانات Demo المعزولة</label><button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] font-extrabold text-brand-700 disabled:opacity-50"><RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> تحديث النتائج</button></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9"><SelectField label="السنة الدراسية" value={filters.schoolYear} onChange={(value) => set({ schoolYear: value })}><option value="all">كل السنوات</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</SelectField><SelectField label="المستوى الدراسي" value={filters.level} onChange={(value) => set({ level: value, branch: "all", bankId: "all" })}><option value="all">كل المستويات</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</SelectField><SelectField label="الشعبة" value={filters.branch} onChange={(value) => set({ branch: value, bankId: "all" })}><option value="all">كل الشعب</option>{branches.map((bank) => <option key={bank.id} value={bank.branch}>{bank.branch}</option>)}</SelectField><SelectField label="القسم" value={filters.className} onChange={(value) => set({ className: value })}><option value="all">كل الأقسام</option>{classes.map((className) => <option key={className} value={className}>{displayClassName(className)}</option>)}</SelectField><SelectField label="المادة" value={filters.subject} onChange={(value) => set({ subject: value as DiagnosticAnalysisFilters["subject"], competencyId: "all", abilityId: "all" })}>{subjectOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField><SelectField label="الرائز" value={filters.bankId} onChange={(value) => set({ bankId: value })}><option value="all">كل الروائز</option>{banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.branch}</option>)}</SelectField><SelectField label="الكفاية" value={filters.competencyId} onChange={(value) => set({ competencyId: value, abilityId: "all" })}><option value="all">كل الكفايات</option>{modelCompetencies(model, filters.subject === "all" ? undefined : filters.subject).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField label="القدرة" value={filters.abilityId} onChange={(value) => set({ abilityId: value })}><option value="all">كل القدرات</option>{modelAbilities(model, filters.subject === "all" ? undefined : filters.subject).filter((item) => filters.competencyId === "all" || item.competencyId === filters.competencyId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><div className="grid grid-cols-2 gap-2"><label className="block"><span className="mb-1.5 block text-[11px] font-extrabold text-ink-600">من</span><input type="date" value={filters.periodFrom} onChange={(event) => set({ periodFrom: event.target.value })} className="w-full rounded-xl border border-ink-900/10 px-2 py-2.5 text-[11px] font-bold" /></label><label className="block"><span className="mb-1.5 block text-[11px] font-extrabold text-ink-600">إلى</span><input type="date" value={filters.periodTo} onChange={(event) => set({ periodTo: event.target.value })} className="w-full rounded-xl border border-ink-900/10 px-2 py-2.5 text-[11px] font-bold" /></label></div></div></section>;
}

export default function DiagnosticAnalysisPanel({ initialView = "analysis" }: DiagnosticAnalysisPanelProps) {
  const [view, setView] = useState<PanelView>(initialView);
  const [model, setModelState] = useState<DiagnosticModelState>(() => loadDiagnosticModel());
  const [filters, setFiltersState] = useState<DiagnosticAnalysisFilters>(() => ({ ...EMPTY_ANALYSIS_FILTERS }));
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [centralError, setCentralError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [showIndividuals, setShowIndividuals] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState("all");

  useEffect(() => setView(initialView), [initialView]);
  useEffect(() => {
    if (filters.subject !== "all" || filters.competencyId !== "all") setSelectedCompetency("all");
  }, [filters.subject, filters.competencyId]);

  const setModel = (updater: (current: DiagnosticModelState) => DiagnosticModelState) => setModelState((current) => updater(current));
  const refresh = () => {
    setLoading(true);
    void loadSubmissions().then((result) => {
      setSubmissions(result.submissions);
      setCentralError(result.error ?? "");
      setLoading(false);
    });
  };
  useEffect(() => { refresh(); }, []);

  const visibleSubmissions = useMemo(() => showDemo ? submissions : submissions.filter((submission) => !isDemoSubmission(submission)), [showDemo, submissions]);
  const analysis = useMemo(() => buildDiagnosticAnalysis(visibleSubmissions, { ...filters, competencyId: selectedCompetency === "all" ? filters.competencyId : selectedCompetency }, model), [visibleSubmissions, filters, model, selectedCompetency]);
  const allClassifications = useMemo(() => allQuestionClassifications(model), [model]);
  const unclassifiedCount = allClassifications.filter((item) => !item.ability || !item.competency).length;

  const resetFilters = () => { setFiltersState({ ...EMPTY_ANALYSIS_FILTERS }); setSelectedCompetency("all"); };
  const updateFilters = (updater: (current: DiagnosticAnalysisFilters) => DiagnosticAnalysisFilters) => setFiltersState(updater);
  const reportTitle = [filters.schoolYear !== "all" ? filters.schoolYear : "كل السنوات", filters.className !== "all" ? displayClassName(filters.className) : "التجميع التركيبي", filters.subject !== "all" ? subjectLabel(filters.subject) : "التاريخ والجغرافيا"].join(" — ");

  return <div className="space-y-6" dir="rtl">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 text-white shadow-[0_28px_70px_-35px_rgba(4,36,26,0.7)] sm:p-8"><div className="pointer-events-none absolute inset-0 pattern-zellige-light opacity-20" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-gold-200"><Layers3 className="size-3.5" /> وحدة التقويم التشخيصي التركيبي</span><h1 className="mt-4 font-display text-2xl font-black sm:text-3xl">من النتائج الفردية إلى قرار الدعم</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">الرائز ← المجال / المادة ← الكفاية ← القدرة ← السؤال ← الإجابة ← نسبة التحكم ← مستوى التحكم ← أولوية الدعم.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/70"><ShieldCheck className="mb-2 size-5 text-gold-300" /><p>المصدر: {showDemo ? "Demo معزول + النتائج المركزية" : "النتائج المركزية فقط"}</p><p className="mt-1">التصنيفات: إعداد الأستاذ، وليست إطارًا رسميًا مفترضًا.</p></div></div></div>
    <Filters filters={filters} setFilters={updateFilters} model={model} submissions={submissions} showDemo={showDemo} setShowDemo={setShowDemo} onRefresh={refresh} loading={loading} />
    <div className="flex flex-wrap items-center justify-between gap-3" data-no-print><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setView("analysis")} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold ${view === "analysis" ? "bg-brand-700 text-white" : "border border-ink-900/10 bg-white text-ink-700"}`}><BarChart3 className="size-4" /> لوحة التحليل</button><button type="button" onClick={() => setView("matrix")} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold ${view === "matrix" ? "bg-brand-700 text-white" : "border border-ink-900/10 bg-white text-ink-700"}`}><Table2 className="size-4" /> مصفوفة الرائز</button><button type="button" onClick={() => setView("manage")} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold ${view === "manage" ? "bg-brand-700 text-white" : "border border-ink-900/10 bg-white text-ink-700"}`}><Settings2 className="size-4" /> إدارة الكفايات والقدرات</button></div><div className="flex flex-wrap gap-2"><button type="button" onClick={resetFilters} className="rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-xs font-bold text-ink-600">إعادة الفلاتر</button><button type="button" onClick={() => downloadText(view === "matrix" ? matrixCsv(model, filters) : analysisCsv(analysis), `${view === "matrix" ? "diagnostic-question-matrix" : `diagnostic-analysis-${safeFilePart(reportTitle)}`}.csv`, "text/csv;charset=utf-8")} disabled={view === "analysis" && !analysis.isReportReady} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs font-extrabold text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"><Download className="size-4" /> CSV / Excel</button><button type="button" onClick={() => openPrintReport(analysis, reportTitle)} disabled={!analysis.isReportReady} className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-3 py-2.5 text-xs font-extrabold text-brand-950 disabled:cursor-not-allowed disabled:opacity-40"><Printer className="size-4" /> طباعة / PDF A4</button></div></div>
    {centralError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p><strong>حالة المصدر:</strong> {centralError} لا تُعرض النتائج الحقيقية من ذاكرة المتصفح. فعّل Supabase من الإعدادات لقراءة النتائج المركزية.</p></div></div>}
    {view === "manage" && <ModelManager model={model} setModel={setModel} />}
    {view === "matrix" && <QuestionMatrix model={model} filters={filters} setModel={setModel} />}
    {view === "analysis" && <>
      {unclassifiedCount > 0 && <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p><strong>{unclassifiedCount} سؤالًا غير مصنف.</strong> افتح «مصفوفة الرائز» واربط كل سؤال بقدرة. سيبقى التصدير والتقرير النهائيان موقوفين إلى أن يكتمل التصنيف.</p></div><button type="button" onClick={() => setView("matrix")} className="rounded-xl bg-rose-600 px-3 py-2 font-extrabold text-white">فتح المصفوفة</button></div>}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Kpi label="المشاركون" value={analysis.participants} note={`${analysis.totalSubmissions} سجلًا داخل الفلاتر`} tone="brand" /><Kpi label="التحكم العام" value={percentText(analysis.overallPercent)} note="من إجابات الأسئلة المتاحة" tone="gold" /><Kpi label="القدرات الجيدة" value={analysis.goodAbilities} note={`${analysis.supportAbilities} تحتاج إلى دعم`} tone="emerald" /><Kpi label="أولوية قصوى" value={analysis.criticalAbilities} note="أقل من 50٪" tone="rose" /><Kpi label="غياب / ناقص" value={analysis.excludedRecords + analysis.missingDataRecords} note={`${analysis.excludedRecords} غياب/غير منجز · ${analysis.missingDataRecords} بلا بيانات`} tone="rose" /></section>
      {analysis.participants === 0 ? <EmptyState title={showDemo ? "لا توجد نتائج داخل هذا النطاق" : "لا توجد نتائج مركزية معروضة"} text={showDemo ? "غيّر الفلاتر أو أعد تحميل النتائج." : "فعّل «عرض بيانات Demo المعزولة» للمعاينة، أو اربط Supabase لقراءة النتائج الحقيقية. بيانات Demo لا تُرسل إلى الإنتاج ولا تمثل نتائج متعلمين حقيقيين."} /> : <>
        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-ink-900/8 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="inline-flex items-center gap-2 text-[10px] font-extrabold text-brand-700"><Target className="size-3.5" /> مخطط الكفايات</p><h2 className="mt-1 font-display text-lg font-black text-ink-900">نسبة التحكم حسب الكفاية</h2></div><span className="text-[10px] font-bold text-ink-400">انقر للتصفية</span></div><div className="mt-5 space-y-4">{analysis.competencies.map((item) => <button type="button" key={item.id} onClick={() => setSelectedCompetency((current) => current === item.id ? "all" : item.id)} className={`block w-full text-start ${selectedCompetency === item.id ? "rounded-xl bg-brand-50 p-2" : ""}`}><div className="flex items-center justify-between gap-3 text-xs"><span className="font-extrabold text-ink-800">{item.name}</span><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ring-1 ${levelTone[item.level]}`}>{percentText(item.percent)} · {levelLabel(item.level)}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-900/8"><div className={`h-full rounded-full transition-all ${item.level === "good" ? "bg-emerald-500" : item.level === "medium" ? "bg-gold-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }} /></div><div className="mt-1 flex justify-between text-[10px] text-ink-400"><span>{subjectLabel(item.subject)} · {item.abilities.length} قدرات</span><span>الدعم: {priorityLabel(item.priority)}</span></div></button>)}{analysis.competencies.length === 0 && <p className="text-sm text-ink-500">لا توجد كفايات ضمن الفلاتر أو البيانات الناقصة.</p>}</div></div>
          <div className="rounded-3xl border border-ink-900/8 bg-white p-5"><p className="inline-flex items-center gap-2 text-[10px] font-extrabold text-brand-700"><BarChart3 className="size-3.5" /> مقارنة المادة</p><h2 className="mt-1 font-display text-lg font-black text-ink-900">التاريخ والجغرافيا</h2><div className="mt-6 space-y-6">{([ ["التاريخ", analysis.historyPercent, "bg-gold-500"], ["الجغرافيا", analysis.geographyPercent, "bg-brand-600"]] as const).map(([label, value, color]) => <div key={label}><div className="flex justify-between text-xs font-extrabold"><span>{label}</span><span>{percentText(value)}</span></div><div className="mt-2 h-4 overflow-hidden rounded-full bg-ink-900/8"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>)}<div className="rounded-2xl bg-paper-warm p-4 text-xs leading-relaxed text-ink-600"><strong className="text-ink-900">منهجية الكفاية:</strong> متوسط مرجح لنسب القدرات التابعة لها. وزن كل قدرة ظاهر في إدارة النموذج، والافتراضي 1.</div></div></div>
        </section>
        <section className="rounded-3xl border border-ink-900/8 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-[10px] font-extrabold text-brand-700"><ListChecks className="size-3.5" /> تحليل القدرات</p><h2 className="mt-1 font-display text-lg font-black text-ink-900">جدول التحكم والأولوية</h2></div><span className="text-xs font-bold text-ink-400">{analysis.abilities.length} قدرة</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-xs"><thead><tr className="border-b border-ink-900/8 text-ink-500"><th className="px-3 py-3 text-start">القدرة</th><th className="px-3 py-3 text-start">الكفاية</th><th className="px-3 py-3 text-center">التحكم</th><th className="px-3 py-3 text-center">المستوى</th><th className="px-3 py-3 text-center">المشاركون</th><th className="px-3 py-3 text-center">المتحكمون</th><th className="px-3 py-3 text-center">الدعم</th></tr></thead><tbody>{analysis.abilities.map((item, index) => <tr key={`${item.id}-${item.competencyId}`} className={index % 2 ? "bg-paper-warm/30" : ""}><td className="px-3 py-3 font-extrabold text-ink-800">{item.name}</td><td className="px-3 py-3 text-ink-500">{item.competencyName}</td><td className="px-3 py-3 text-center font-display font-black text-brand-800">{percentText(item.percent)}</td><td className="px-3 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ${levelTone[item.level]}`}>{levelLabel(item.level)}</span></td><td className="px-3 py-3 text-center text-ink-600">{item.participants}</td><td className="px-3 py-3 text-center text-ink-600">{item.controlledStudents}</td><td className="px-3 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${priorityTone[item.priority]}`}>{priorityLabel(item.priority)}</span></td></tr>)}</tbody></table></div></section>
        <section className="rounded-3xl border border-ink-900/8 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-[10px] font-extrabold text-brand-700"><Table2 className="size-3.5" /> Heatmap السؤال</p><h2 className="mt-1 font-display text-lg font-black text-ink-900">أين يظهر التعثر؟</h2></div><span className="text-xs text-ink-400">لون الخلية يطابق مستوى التحكم</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{analysis.questions.map((item) => <div key={`${item.bankId}-${item.questionId}`} title={item.title} className={`rounded-2xl border p-3 ${item.percent >= 75 ? "border-emerald-200 bg-emerald-50" : item.percent >= 50 ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}><div className="flex items-center justify-between gap-2"><span className="font-display text-sm font-black text-ink-900">س{item.questionId}</span><span className="text-xs font-black text-ink-700">{percentText(item.percent)}</span></div><p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-ink-600">{item.abilityName ?? "غير مصنفة"}</p><p className="mt-1 text-[9px] text-ink-400">{subjectLabel(item.subject)} · {item.answered}/{item.participants} أجابوا</p></div>)}</div></section>
        <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5"><div className="flex items-center gap-2"><AlertTriangle className="size-5 text-rose-600" /><h2 className="font-display text-lg font-black text-rose-900">أهم التعثرات وأولويات الدعم</h2></div><div className="mt-4 space-y-2">{analysis.abilities.filter((item) => item.priority !== "good").slice(0, 6).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3"><div><p className="text-xs font-extrabold text-ink-800">{item.name}</p><p className="mt-1 text-[10px] text-ink-500">{item.competencyName}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${priorityTone[item.priority]}`}>{percentText(item.percent)} · {priorityLabel(item.priority)}</span></div>)}{analysis.supportAbilities === 0 && <p className="text-sm text-emerald-700">لا توجد أولوية دعم داخل النطاق المحدد.</p>}</div></div><div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"><div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" /><h2 className="font-display text-lg font-black text-emerald-900">أهم نقاط القوة</h2></div><div className="mt-4 space-y-2">{analysis.abilities.filter((item) => item.priority === "good").slice(-6).reverse().map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3"><p className="text-xs font-extrabold text-ink-800">{item.name}</p><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">{percentText(item.percent)} · جيد</span></div>)}{analysis.goodAbilities === 0 && <p className="text-sm text-ink-500">ستظهر نقاط القوة بعد توفر إجابات داخل النطاق.</p>}</div></div></section>
        <section className="rounded-3xl border border-brand-100 bg-brand-50/60 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Users className="size-5 text-brand-700" /><h2 className="font-display text-lg font-black text-brand-900">التفاصيل الفردية</h2></div><p className="mt-1 text-xs text-brand-800/70">تبقى خلف زر منفصل حتى يظل التقرير الرئيسي تركيبيًا ويحافظ على خصوصية المتعلمين.</p></div><button type="button" onClick={() => setShowIndividuals((value) => !value)} className="rounded-xl bg-brand-700 px-3 py-2.5 text-xs font-extrabold text-white">{showIndividuals ? "إخفاء التفاصيل" : "عرض التفاصيل الفردية"}</button></div>{showIndividuals && <div className="mt-4 overflow-x-auto rounded-2xl bg-white"><table className="w-full min-w-[620px] text-xs"><thead className="bg-brand-50"><tr><th className="px-3 py-3 text-start">التلميذ(ة)</th><th className="px-3 py-3 text-start">القسم</th><th className="px-3 py-3 text-center">التحكم</th><th className="px-3 py-3 text-center">المستوى</th><th className="px-3 py-3 text-center">المصدر</th></tr></thead><tbody>{analysis.students.map((student, index) => <tr key={student.id} className={index % 2 ? "bg-paper-warm/30" : ""}><td className="px-3 py-3 font-bold">{student.name}</td><td className="px-3 py-3 text-ink-500">{displayClassName(student.className)}</td><td className="px-3 py-3 text-center font-black">{percentText(student.percent)}</td><td className="px-3 py-3 text-center"><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ring-1 ${levelTone[student.level]}`}>{levelLabel(student.level)}</span></td><td className="px-3 py-3 text-center text-[10px] text-ink-500">{student.isDemo ? "Demo معزول" : "مركزي"}</td></tr>)}</tbody></table></div>}</section>
        <section className="rounded-3xl border border-ink-900/8 bg-white p-5"><div className="flex items-center gap-2"><FileDown className="size-5 text-brand-700" /><h2 className="font-display text-lg font-black text-ink-900">جاهزية التقرير التركيبي</h2></div><div className="mt-4 grid gap-3 md:grid-cols-[auto_1fr] md:items-center"><div className={`grid size-14 place-items-center rounded-2xl ${analysis.isReportReady ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{analysis.isReportReady ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}</div><div><p className="font-extrabold text-ink-900">{analysis.isReportReady ? "التقرير جاهز وفق التصنيف الحالي" : "التقرير موقوف"}</p><p className="mt-1 text-xs leading-relaxed text-ink-500">{analysis.isReportReady ? "يمكنك الآن التصدير CSV/Excel أو فتح نسخة A4 للطباعة والحفظ PDF." : "يلزم وجود مشاركين وتصنيف كل أسئلة النطاق بقدرة وكفاية مفعّلتين."}</p><ul className="mt-2 grid gap-1 text-[11px] text-ink-600 sm:grid-cols-2">{analysis.methodology.map((item) => <li key={item} className="flex gap-1.5"><span className="text-brand-600">•</span><span>{item}</span></li>)}</ul></div></div></section>
      </>}
    </>}
  </div>;
}
