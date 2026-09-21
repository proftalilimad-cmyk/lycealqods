/* ============================================================
   بناء وثائق HTML/PDF/Word للتقويم التشخيصي
   ------------------------------------------------------------
   مخرجات هذه المكتبة وثائق مستقلة (HTML كامل بترميز RTL وخطوط
   عربية) تُستعمل في ثلاث حالات:
     1) الطباعة / الحفظ بصيغة PDF من المتصفح (نافذة طباعة مخصّصة).
     2) تحميل ملف HTML قابل للفتح والطباعة في أي وقت.
     3) تحميل ملف Word (.doc) بنفس المحتوى.

   الهوية البصرية: أخضر المؤسسة والذهبي، ورق A4، هوامش مضبوطة،
   ومنع انقسام السؤال أو الجدول بين صفحتين.
   ============================================================ */
import type { Submission } from "../types";
import type { DiagnosticAttendanceSummary, DiagnosticStudentAttendance } from "./storage";
import { RECOMMENDATIONS } from "./grading";
import { displayClassName, scheduleForSubmission, sessionClockLabel, sessionDateLabel, sessionTimeLabel, type DiagnosticSession } from "../data/diagnosticSchedule";
import {
  MINISTRY_LINE,
  SCHOOL_NAME,
  SCHOOL_SHORT,
  SCHOOL_YEAR,
  SIGNATURE,
  SUBJECT_NAME,
  TEACHER_NAME,
  TEST_TITLE,
  analyse,
  bankLevelOf,
  branchOf,
  esc,
  formatDate,
  formatDuration,
  kindLabel,
  nl2br,
  questionRows,
  recommendationsFor,
  round1,
  round2,
  studentBaseName,
  subjectLabel,
  type QuestionRows,
} from "./reportDoc";

/* ===================== التنسيقات ===================== */
export const REPORT_CSS = `
:root { --brand:#0c7c5b; --brand-dark:#04241a; --gold:#b98a2e; --line:#d9cdb6; --paper:#fffdf8; --ink:#16211c; --muted:#5d6b64; }
* { box-sizing:border-box; }
html,body { margin:0; padding:0; }
body { direction:rtl; font-family:"Readex Pro","Cairo","Segoe UI",Tahoma,Arial,sans-serif; color:var(--ink); background:#f2efe8; font-size:12.5px; line-height:1.8; }
.page { max-width:190mm; margin:0 auto; padding:6mm 4mm 12mm; background:#fff; }
@page { size:A4; margin:14mm 12mm; }
@media print {
  body { background:#fff; font-size:11.5px; }
  .page { max-width:none; margin:0; padding:0; }
  .no-print { display:none !important; }
  .q, .grid tr, .box, .part > h2 { break-inside:avoid; page-break-inside:avoid; }
  .cover { break-after:page; page-break-after:always; }
  .part { break-before:auto; }
  a { color:inherit; text-decoration:none; }
}
.no-print { background:#fff8e6; border:1px solid #e6d3a3; color:#7a5c14; border-radius:10px; padding:8px 12px; margin-bottom:10px; font-size:11.5px; font-weight:600; }
/* ---------- نسخة أجوبة مختصرة: الغلاف + صفحة واحدة للأسئلة ---------- */
.answers-compact { margin-top:0; }
.answers-compact .compact-lead { margin:0 0 5px; font-size:9px; color:var(--muted); font-weight:600; }
.answers-compact-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px 7px; align-items:start; }
.compact-q { border:1px solid var(--line); border-radius:6px; padding:3px 5px; background:#fff; min-height:22mm; break-inside:avoid; page-break-inside:avoid; }
.compact-q header { display:flex; align-items:center; gap:3px; margin-bottom:2px; font-size:8px; }
.compact-q .compact-number { color:#fff; background:var(--brand); border-radius:999px; padding:0 5px; font-weight:900; }
.compact-q .compact-kind { color:var(--muted); font-weight:700; }
.compact-q .compact-points { margin-inline-start:auto; border-radius:999px; padding:0 4px; font-weight:900; }
.compact-q .compact-points.ok { color:#0f7b52; background:#e3f6ec; }
.compact-q .compact-points.bad { color:#b4232a; background:#fdeceb; }
.compact-q .compact-points.na { color:#5d6b64; background:#f1f1ef; }
.compact-q .compact-title { margin:0 0 2px; font-size:8.5px; line-height:1.35; font-weight:800; }
.compact-q dl { display:grid; grid-template-columns:43px 1fr; gap:0 4px; margin:0; font-size:8px; line-height:1.35; }
.compact-q dt { color:var(--muted); font-weight:800; }
.compact-q dd { margin:0; font-weight:600; overflow-wrap:anywhere; }
.compact-q dd.ok { color:#0f7b52; } .compact-q dd.bad { color:#b4232a; }
.answers-document .answers-compact-grid { gap:4px 6px; }
  .answers-document .compact-q { min-height:18mm; padding:2px 3px; }
  .answers-document .compact-q header { font-size:7px; margin-bottom:1px; }
  .answers-document .compact-q .compact-title { font-size:7.5px; line-height:1.2; margin-bottom:1px; }
  .answers-document .compact-q dl { font-size:7px; line-height:1.2; }
.answers-document .sign { margin-top:5px; padding-top:4px; font-size:8.5px; }
@media print {
  .answers-document .page { padding:0; }
  .answers-document .cover { break-after:page; page-break-after:always; }
}
/* ---------- الغلاف ---------- */
.masthead { display:flex; align-items:center; gap:14px; border-bottom:3px double var(--brand); padding-bottom:10px; }
.emblem { flex:0 0 auto; width:64px; height:64px; border-radius:50%; background:linear-gradient(145deg,var(--brand),var(--brand-dark)); color:#f6e7c3; display:grid; place-items:center; font-weight:800; font-size:13px; text-align:center; line-height:1.25; border:2px solid var(--gold); }
.masthead .lines { flex:1 1 auto; }
.ministry { margin:0; font-size:11px; color:var(--muted); font-weight:600; }
.school { margin:2px 0 0; font-size:16px; font-weight:800; color:var(--brand-dark); }
.year { margin:2px 0 0; font-size:11px; color:var(--muted); font-weight:600; }
.cover { padding-top:6mm; }
.cover h1 { margin:16px 0 4px; font-size:24px; font-weight:900; color:var(--brand-dark); text-align:center; }
.cover .subject { margin:0 0 14px; text-align:center; font-size:14px; font-weight:700; color:var(--gold); }
.cover .doc-kind { margin:0 auto 14px; text-align:center; font-size:12px; font-weight:700; color:#fff; background:var(--brand); display:table; padding:4px 14px; border-radius:999px; }
.stamp { margin:12px auto 0; text-align:center; font-size:11.5px; font-weight:800; color:#8a5a00; background:#fff4d6; border:1px dashed #d9b25f; border-radius:10px; padding:6px 12px; max-width:120mm; }
.teacher-line { margin-top:14px; text-align:center; font-size:12.5px; font-weight:700; color:var(--brand-dark); }
/* ---------- الجداول ---------- */
table { width:100%; border-collapse:collapse; }
.grid { margin:8px 0 4px; font-size:11.8px; }
.grid th, .grid td { border:1px solid var(--line); padding:6px 8px; text-align:start; vertical-align:top; }
.grid thead th { background:var(--brand); color:#fff; font-weight:800; text-align:center; }
.grid tbody tr:nth-child(even) td { background:var(--paper); }
.id-table th { width:22%; background:#f0ece1; color:var(--brand-dark); font-weight:800; }
.id-table td { background:#fff; font-weight:600; }
.num { text-align:center; font-weight:800; }
/* ---------- شارة النتيجة ---------- */
.score-band { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 6px; }
.score-band .cell { flex:1 1 18%; min-width:90px; border:1px solid var(--line); border-radius:12px; padding:8px 10px; text-align:center; background:var(--paper); }
.score-band .cell b { display:block; font-size:19px; font-weight:900; color:var(--brand-dark); }
.score-band .cell span { display:block; font-size:10.5px; color:var(--muted); font-weight:700; }
.score-band .cell.hero { background:linear-gradient(145deg,#f7f1e2,#fff); border-color:var(--gold); }
/* ---------- الأقسام ---------- */
.part { margin-top:14px; }
.part > h2 { margin:0 0 6px; font-size:15px; font-weight:900; color:#fff; background:var(--brand-dark); padding:6px 12px; border-radius:8px; border-inline-start:6px solid var(--gold); }
.part .lead { margin:6px 0; font-size:11.5px; color:var(--muted); font-weight:600; }
/* ---------- الأسئلة ---------- */
.q { border:1px solid var(--line); border-radius:10px; padding:9px 11px; margin:9px 0; background:#fff; }
.q header { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:5px; }
.q .badge { font-size:10px; font-weight:800; color:var(--brand-dark); background:#f0ece1; border:1px solid var(--line); border-radius:999px; padding:2px 9px; }
.q .badge.n { background:var(--brand); color:#fff; border-color:var(--brand); }
.q .pts { margin-inline-start:auto; font-size:12px; font-weight:900; padding:2px 10px; border-radius:999px; }
.pts.ok { background:#e3f6ec; color:#0f7b52; border:1px solid #a9dcc4; }
.pts.bad { background:#fdeceb; color:#b4232a; border:1px solid #f0bfbb; }
.pts.na { background:#f1f1ef; color:#5d6b64; border:1px solid #dcdcd6; }
.q .statement { margin:4px 0 6px; font-weight:700; }
.doc-box { background:var(--paper); border:1px dashed var(--line); border-radius:8px; padding:7px 10px; margin:6px 0; font-size:11.5px; }
.doc-box .lbl { font-weight:800; color:var(--gold); }
.ans { display:grid; grid-template-columns:130px 1fr; gap:4px 10px; margin-top:6px; font-size:11.8px; }
.ans dt { font-weight:800; color:var(--muted); }
.ans dd { margin:0; font-weight:600; }
.ans dd.ok { color:#0f7b52; }
.ans dd.bad { color:#b4232a; }
.note { margin-top:6px; font-size:11.3px; color:var(--brand-dark); background:#f2f8f5; border-inline-start:4px solid var(--brand); padding:5px 9px; border-radius:6px; }
.writing { white-space:pre-wrap; background:#fffef9; border:1px solid var(--line); border-radius:8px; padding:8px 10px; margin:6px 0; font-size:11.8px; }
/* ---------- القوة/الضعف والتوصيات ---------- */
.two-col { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; }
.box { flex:1 1 46%; border:1px solid var(--line); border-radius:10px; padding:8px 11px; }
.box h3 { margin:0 0 5px; font-size:12.5px; font-weight:900; }
.box.good { background:#f2fbf6; border-color:#bfe3cf; } .box.good h3 { color:#0f7b52; }
.box.weak { background:#fdf4f3; border-color:#f0cdca; } .box.weak h3 { color:#b4232a; }
.box ul { margin:0; padding-inline-start:18px; font-size:11.6px; }
.box li { margin:3px 0; }
ol.reco { margin:6px 0; padding-inline-start:20px; font-size:11.8px; }
ol.reco li { margin:5px 0; }
/* ---------- التوقيع ---------- */
.sign { margin-top:16px; border-top:2px solid var(--brand); padding-top:9px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; font-size:11.5px; color:var(--muted); font-weight:700; }
.sign b { color:var(--brand-dark); }
.bar { height:5px; background:linear-gradient(90deg,var(--brand),var(--gold)); border-radius:99px; overflow:hidden; }
.bar > i { display:block; height:100%; background:var(--brand); }
`;

const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@600;700;800;900&display=swap" rel="stylesheet">';

/** وثيقة HTML مستقلة (تُطبع أو تُحمَّل) */
export function htmlDocument(title: string, bodyHtml: string, css: string = REPORT_CSS, bodyClass = ""): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="author" content="${esc(TEACHER_NAME)}">
<meta name="description" content="${esc(title)} — ${esc(SCHOOL_SHORT)}">
${FONT_LINK}
<style>${css}</style>
</head>
<body class="${esc(bodyClass)}">
<div class="page">
${bodyHtml}
</div>
</body>
</html>`;
}

/** تغليف المحتوى ليُفتح كملف Word (.doc) مع الحفاظ على العربية وRTL */
export function wordDocument(title: string, bodyHtml: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
@page WordSection1 { size:595.3pt 841.9pt; margin:42.5pt 34pt; mso-page-orientation:portrait; }
div.WordSection1 { page:WordSection1; }
body { direction:rtl; font-family:"Segoe UI","Tahoma","Arial",sans-serif; font-size:11pt; color:#16211c; }
table { border-collapse:collapse; width:100%; }
th,td { border:0.75pt solid #d9cdb6; padding:4pt 6pt; text-align:right; vertical-align:top; }
thead th { background:#0c7c5b; color:#ffffff; font-weight:bold; text-align:center; }
h1 { font-size:18pt; color:#04241a; text-align:center; }
h2 { font-size:13pt; color:#ffffff; background:#04241a; padding:4pt 8pt; }
h3 { font-size:11.5pt; }
.q { border:0.75pt solid #d9cdb6; padding:6pt; margin:6pt 0; }
.badge { font-size:9pt; color:#04241a; }
.ok { color:#0f7b52; font-weight:bold; } .bad { color:#b4232a; font-weight:bold; }
.doc-box { background:#fffdf8; border:0.75pt dashed #d9cdb6; padding:5pt; }
.writing { background:#fffef9; border:0.75pt solid #d9cdb6; padding:6pt; }
.sign { border-top:1.5pt solid #0c7c5b; padding-top:6pt; font-size:10pt; }
</style>
</head>
<body><div class="WordSection1" dir="rtl">
${bodyHtml}
</div></body></html>`;
}

/* ===================== أجزاء مشتركة ===================== */
function masthead(): string {
  return `<header class="masthead">
  <div class="emblem" aria-hidden="true">القدس<br>القنيطرة</div>
  <div class="lines">
    <p class="ministry">${esc(MINISTRY_LINE)}</p>
    <p class="school">${esc(SCHOOL_NAME)}</p>
    <p class="year">السنة الدراسية: ${esc(SCHOOL_YEAR)} · المادة: ${esc(SUBJECT_NAME)} · أستاذ المادة: ${esc(TEACHER_NAME)}</p>
  </div>
</header>`;
}

function scoreBand(sub: Submission): string {
  const cells: [string, string, boolean][] = [
    [`${round2(sub.total)}`, "المجموع /20", true],
    [`${round2(sub.history)}`, "التاريخ /10", false],
    [`${round2(sub.geography)}`, "الجغرافيا /10", false],
    [`${round1(sub.percent)}٪`, "النسبة المئوية", false],
    [sub.level || "—", "مستوى التحكّم", false],
  ];
  return `<div class="score-band">${cells
    .map(([v, l, hero]) => `<div class="cell${hero ? " hero" : ""}"><b>${esc(v)}</b><span>${esc(l)}</span></div>`)
    .join("")}</div>`;
}

function signatureBlock(extra?: string): string {
  return `<footer class="sign">
  <span>${esc(SIGNATURE)}</span>
  <span>${extra ? esc(extra) : ""} حُرّر آليًا من منصة «فضاء الاجتماعيات» بتاريخ ${esc(formatDate(new Date().toISOString()))}</span>
</footer>`;
}

function identityTable(sub: Submission, rows: QuestionRows): string {
  const answered = rows.hasAnswers ? `${rows.answeredCount} / ${rows.rows.length}` : "—";
  const session = scheduleForSubmission(sub);
  return `<table class="grid id-table">
<tbody>
<tr><th>المستوى</th><td>${esc(bankLevelOf(sub))}</td><th>الشعبة / المسلك</th><td>${esc(branchOf(sub))}</td></tr>
<tr><th>القسم</th><td>${esc(displayClassName(sub.className))}</td><th>المادة</th><td>${esc(SUBJECT_NAME)} (التاريخ والجغرافيا)</td></tr>
<tr><th>تاريخ التقويم</th><td>${esc(sessionDateLabel(session))}</td><th>التوقيت</th><td>${esc(sessionClockLabel(session))}</td></tr>
<tr><th>اسم التلميذ(ة)</th><td>${esc(sub.name)}</td><th>رقم مسار</th><td>${esc(sub.massar || "—")}</td></tr>
<tr><th>تاريخ الإرسال</th><td>${esc(formatDate(sub.date))}</td><th>المدة المستغرقة</th><td>${esc(formatDuration(sub.timeUsedSeconds))}</td></tr>
<tr><th>الأسئلة المجاب عنها</th><td>${esc(answered)}</td><th>عدد الأسئلة</th><td>${rows.rows.length} سؤالًا (${rows.maxPoints} نقطة)</td></tr>
</tbody>
</table>`;
}

/* ===================== وثيقة التلميذ ===================== */
export type StudentDocMode = "answers" | "report" | "full";

const MODE_LABEL: Record<StudentDocMode, string> = {
  answers: "ملف أجوبة التلميذ(ة) — الأسئلة والإجابات والتصحيح",
  report: "تقرير النتائج — التحليل التربوي وتوصيات الدعم",
  full: "الملف الفردي الكامل — الأجوبة + تقرير النتائج",
};

function compactAnswersPart(rows: QuestionRows): string {
  const items = rows.rows
    .map((r) => {
      const state = !rows.hasAnswers ? "غير محفوظة" : r.isCorrect ? "صحيحة" : r.answered ? "تحتاج مراجعة" : "بدون إجابة";
      const stateClass = !rows.hasAnswers ? "na" : r.isCorrect ? "ok" : "bad";
      return `<article class="compact-q">
  <header><span class="compact-number">${r.index}</span><span class="compact-kind">${esc(kindLabel(r.question))}</span><span class="compact-points ${stateClass}">${esc(rows.hasAnswers ? `${round2(r.got)} / ${r.points}` : `— / ${r.points}`)}</span></header>
  <p class="compact-title">${nl2br(r.question.title)}</p>
  <dl>
    <dt>إجابة التلميذ</dt><dd class="${rows.hasAnswers ? (r.isCorrect ? "ok" : "bad") : ""}">${nl2br(r.studentAnswer)}</dd>
    <dt>الجواب الصحيح</dt><dd>${nl2br(r.correct)}</dd>
    <dt>الحالة</dt><dd>${esc(state)}</dd>
  </dl>
</article>`;
    })
    .join("");
  const warn = rows.hasAnswers
    ? ""
    : `<p class="compact-lead">لا يحتوي هذا السجل على إجابات تفصيلية محفوظة؛ تُعرض الأسئلة والنقط والحالة المحفوظة كما هي.</p>`;
  return `<section class="answers-compact">
  <h2>الأجوبة والتصحيح — صفحة مختصرة</h2>
  ${warn}
  <div class="answers-compact-grid">${items}</div>
</section>`;
}

function answersPart(sub: Submission, rows: QuestionRows, compact = false): string {
  if (compact) return compactAnswersPart(rows);
  const items = rows.rows
    .map((r) => {
      const q = r.question;
      const stateClass = !rows.hasAnswers ? "na" : r.isCorrect ? "ok" : "bad";
      const pts = rows.hasAnswers ? `${round2(r.got)} / ${r.points}` : `— / ${r.points}`;
      const docBox =
        q.kind === "doc"
          ? `<div class="doc-box"><span class="lbl">${esc(q.docLabel)}:</span> ${nl2br(q.doc)}</div>`
          : q.kind === "writing"
            ? `<div class="doc-box"><span class="lbl">التعليمة:</span> ${nl2br(q.prompt)}<br><span class="lbl">إرشادات:</span> ${esc(q.guidance.join(" · "))}</div>`
            : "";
      const writingBox =
        q.kind === "writing"
          ? `<div class="writing">${rows.hasAnswers ? nl2br(sub.writingText || (typeof sub.answers?.[r.index - 1] === "string" ? (sub.answers?.[r.index - 1] as string) : "") || "— لم تُحفظ فقرة —") : "— غير محفوظة في هذا السجل —"}</div>`
          : "";
      const rubric =
        q.kind === "writing" && sub.rubric
          ? `<table class="grid"><thead><tr><th>معيار الشبكة</th><th>الوزن</th><th>نسبة التحقيق</th><th>النقطة</th><th>ملاحظة التصحيح</th></tr></thead><tbody>${sub.rubric.criteria
              .map(
                (c) =>
                  `<tr><td>${esc(c.label)}</td><td class="num">${Math.round(c.weight * 100)}٪</td><td class="num">${Math.round(c.ratio * 100)}٪</td><td class="num">${round2(c.score)}</td><td>${esc(c.note)}</td></tr>`,
              )
              .join("")}</tbody></table>`
          : "";
      return `<article class="q">
  <header>
    <span class="badge n">السؤال ${r.index}</span>
    <span class="badge">${esc(kindLabel(q))}</span>
    <span class="badge">${esc(subjectLabel(q.subject))}</span>
    <span class="badge">المهارة: ${esc(q.skill)}</span>
    <span class="pts ${stateClass}">${esc(pts)}</span>
  </header>
  <p class="statement">${nl2br(q.title)}</p>
  ${docBox}
  ${writingBox}
  <dl class="ans">
    <dt>إجابة التلميذ(ة)</dt><dd class="${rows.hasAnswers ? (r.isCorrect ? "ok" : "bad") : ""}">${nl2br(r.studentAnswer)}</dd>
    <dt>الجواب الصحيح</dt><dd>${nl2br(r.correct)}</dd>
  </dl>
  ${q.explanation ? `<p class="note"><b>توضيح:</b> ${nl2br(q.explanation)}</p>` : ""}
  ${rubric}
</article>`;
    })
    .join("");

  const warn = rows.hasAnswers
    ? ""
    : `<p class="lead">تنبيه: هذا السجل محفوظ قبل تفعيل حفظ الأجوبة التفصيلية، لذلك تُعرض الأسئلة والنقط الإجمالية والمهارات المحفوظة، دون إجابات كل سؤال.</p>`;

  return `<section class="part">
  <h2>1. أسئلة ${esc(TEST_TITLE)} وإجابات التلميذ(ة) والتصحيح</h2>
  ${warn}
  ${items}
</section>`;
}

function reportPart(sub: Submission, rows: QuestionRows, startIndex: number): string {
  const a = analyse(sub);
  const recos = recommendationsFor(sub, a);
  const n = startIndex;
  return `<section class="part">
  <h2>${n}. النتيجة النهائية</h2>
  <table class="grid">
    <thead><tr><th>المادة</th><th>النقطة</th><th>المعامل الأقصى</th><th>النسبة</th><th>مؤشر التحكّم</th></tr></thead>
    <tbody>
      <tr><td>التاريخ</td><td class="num">${round2(sub.history)}</td><td class="num">10</td><td class="num">${a.historyPct}٪</td><td>${esc(skillWord(a.historyPct))}</td></tr>
      <tr><td>الجغرافيا</td><td class="num">${round2(sub.geography)}</td><td class="num">10</td><td class="num">${a.geographyPct}٪</td><td>${esc(skillWord(a.geographyPct))}</td></tr>
      <tr><td><b>المجموع العام</b></td><td class="num"><b>${round2(sub.total)}</b></td><td class="num"><b>20</b></td><td class="num"><b>${round1(sub.percent)}٪</b></td><td><b>${esc(a.levelLabel)}</b></td></tr>
    </tbody>
  </table>
  <p class="lead">الأسئلة المجاب عنها: ${rows.hasAnswers ? `${rows.answeredCount} من ${rows.rows.length}` : "—"} · الأجوبة الصحيحة: ${rows.hasAnswers ? `${rows.correctCount}` : "—"} · المدة المستغرقة: ${esc(formatDuration(sub.timeUsedSeconds))}</p>
</section>

<section class="part">
  <h2>${n + 1}. تحليل مواطن القوة والضعف</h2>
  <table class="grid">
    <thead><tr><th>المهارة المستهدفة</th><th>المحصَّل</th><th>الأقصى</th><th>النسبة</th><th>الحالة</th><th style="width:22%">مؤشر</th></tr></thead>
    <tbody>
      ${a.skills
        .map(
          (s) =>
            `<tr><td>${esc(s.skill)}</td><td class="num">${round2(s.got)}</td><td class="num">${round2(s.max)}</td><td class="num">${s.pct}٪</td><td>${esc(s.state)}</td><td><span class="bar"><i style="width:${s.pct}%;background:${s.pct >= 70 ? "#0f7b52" : s.pct >= 50 ? "#b98a2e" : "#b4232a"}"></i></span></td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <div class="two-col">
    <div class="box good"><h3>مواطن القوة</h3><ul>${a.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
    <div class="box weak"><h3>مواطن الضعف</h3><ul>${a.weaknesses.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
  </div>
  ${
    a.writing.length > 0
      ? `<h3 style="margin-top:10px">شبكة تنقيط الفقرة المكتوبة</h3>
  <table class="grid"><thead><tr><th>المعيار</th><th>الوزن</th><th>نسبة التحقيق</th><th>ملاحظة</th></tr></thead><tbody>${a.writing
    .map((w) => `<tr><td>${esc(w.label)}</td><td class="num">—</td><td class="num">${w.ratio}٪</td><td>${esc(w.note)}</td></tr>`)
    .join("")}</tbody></table>`
      : ""
  }
</section>

<section class="part">
  <h2>${n + 2}. توصيات الدعم التربوي</h2>
  <ol class="reco">${recos.map((r) => `<li>${nl2br(r)}</li>`).join("")}</ol>
  <p class="lead">موارد الدعم المتاحة في المنصة: قسم الدروس (شرح المفاهيم والخطوط الزمنية) · قسم التطبيقات (تمارين بتصحيح نموذجي) · قسم المنهجيات (تحليل الوثائق والكتابة) · الموارد (خرائط ومبيانات وجداول).</p>
</section>`;
}

function skillWord(pct: number): string {
  return pct >= 75 ? "تحكّم جيد" : pct >= 50 ? "تحكّم متوسط" : "يحتاج دعمًا";
}

function cover(sub: Submission, mode: StudentDocMode, rows: QuestionRows): string {
  return `<section class="cover">
${masthead()}
<h1>${esc(TEST_TITLE)} في مادة ${esc(SUBJECT_NAME)}</h1>
<p class="subject">التاريخ والجغرافيا · ${esc(bankLevelOf(sub))} · ${esc(branchOf(sub))}</p>
<p class="doc-kind">${esc(MODE_LABEL[mode])}</p>
${identityTable(sub, rows)}
${scoreBand(sub)}
<p class="teacher-line">إنجاز الأستاذ: ${esc(TEACHER_NAME)} — ${esc(SCHOOL_SHORT)}</p>
${rows.hasAnswers ? "" : `<p class="stamp">الإجابات التفصيلية لهذا السجل غير محفوظة — التقرير يعتمد النقط والمهارات المسجَّلة.</p>`}
</section>`;
}

/** وثيقة تلميذ: غلاف + (الأجوبة) + (التقرير) حسب الوضع */
export function studentDocBody(sub: Submission, mode: StudentDocMode = "full"): string {
  const rows = questionRows(sub);
  const parts: string[] = [cover(sub, mode, rows)];
  if (mode === "answers") parts.push(answersPart(sub, rows, true));
  else if (mode === "report") parts.push(reportPart(sub, rows, 1));
  else {
    parts.push(answersPart(sub, rows));
    parts.push(reportPart(sub, rows, 2));
  }
  parts.push(signatureBlock());
  return parts.join("\n");
}

/** ملف HTML كامل لوثيقة تلميذ */
export function studentDocHtml(sub: Submission, mode: StudentDocMode = "full"): string {
  const kind = mode === "answers" ? "أجوبة" : mode === "report" ? "تقرير النتائج" : "الملف الفردي";
  return htmlDocument(`${kind} — ${studentBaseName(sub)}`, studentDocBody(sub, mode), REPORT_CSS, `${mode}-document`);
}

/* ===================== التقرير الشامل للقسم ===================== */
export interface ClassScope {
  /** عنوان وصفي كامل (يظهر في الوثائق) */
  label: string;
  level?: string;
  branch?: string;
  className?: string;
  /** تسمية مختصرة تصلح لاسم ملف (قسم واحد، أو الشعبة، أو «n_أقسام») */
  fileLabel: string;
  /** عدد الأقسام المشمولة */
  classCount: number;
  /** الموعد التنظيمي للقسم، إن كان محددًا */
  schedule?: DiagnosticSession;
  /** اللائحة الكاملة وحالات الحضور والمشاركة، لا النتائج فقط */
  attendance?: DiagnosticAttendanceSummary[];
}

function bins(subs: Submission[]): { label: string; count: number; pct: number }[] {
  const defs = [
    { label: "أقل من 5 /20", test: (t: number) => t < 5 },
    { label: "من 5 إلى 9.99 /20", test: (t: number) => t >= 5 && t < 10 },
    { label: "من 10 إلى 14.99 /20", test: (t: number) => t >= 10 && t < 15 },
    { label: "من 15 إلى 20 /20", test: (t: number) => t >= 15 },
  ];
  return defs.map((d) => {
    const count = subs.filter((s) => d.test(s.total)).length;
    return { label: d.label, count, pct: subs.length ? Math.round((count / subs.length) * 100) : -1 };
  });
}

function aggregateSkills(subs: Submission[]): { skill: string; got: number; max: number; pct: number; state: string }[] {
  const acc: Record<string, { got: number; max: number }> = {};
  for (const s of subs)
    for (const [k, v] of Object.entries(s.skills ?? {})) {
      if (!acc[k]) acc[k] = { got: 0, max: 0 };
      acc[k].got += v.got;
      acc[k].max += v.max;
    }
  return Object.entries(acc)
    .map(([skill, v]) => {
      const pct = v.max > 0 ? Math.round((v.got / v.max) * 100) : 0;
      return { skill, got: round2(v.got), max: round2(v.max), pct, state: skillWord(pct) };
    })
    .sort((a, b) => b.pct - a.pct);
}

function rosterRowsForReport(attendance: DiagnosticAttendanceSummary[]): DiagnosticStudentAttendance[] {
  return attendance
    .flatMap((summary) => summary.students)
    .sort((a, b) => a.student.n - b.student.n || a.student.name.localeCompare(b.student.name, "ar"));
}

/** تقرير شامل: إحصاءات القسم + الحضور الكامل + جدول النتائج + قائمة الدعم + الخلاصة */
export function classReportBody(subs: Submission[], scope: ClassScope): string {
  const list = [...subs].sort((a, b) => b.total - a.total);
  const n = list.length;
  const attendance = scope.attendance ?? [];
  const rosterRows = rosterRowsForReport(attendance);
  const rosterTotal = attendance.reduce((sum, summary) => sum + summary.total, 0);
  const presentCount = attendance.reduce((sum, summary) => sum + summary.present, 0);
  const absentCount = attendance.reduce((sum, summary) => sum + summary.absent, 0);
  const avg = (f: (s: Submission) => number) => (n ? round1(list.reduce((a, s) => a + f(s), 0) / n) : 0);
  const totals = list.map((s) => s.total);
  const best = n ? Math.max(...totals) : 0;
  const worst = n ? Math.min(...totals) : 0;
  const support = list.filter((s) => s.percent < 50);
  const good = list.filter((s) => s.percent >= 70);
  const skills = aggregateSkills(list);
  const weakest = skills[skills.length - 1];
  const strongest = skills[0];
  const withAnswers = list.filter((s) => Array.isArray(s.answers) && (s.answers as unknown[]).length > 0).length;
  const dist = bins(list);
  const avgHist = avg((s) => s.history);
  const avgGeo = avg((s) => s.geography);

  const session = scope.schedule ?? (n ? scheduleForSubmission(list[0]) : undefined);
  const reportClass = scope.className
    ? scope.className.split("،").map((name) => displayClassName(name.trim())).join("، ")
    : n
      ? displayClassName(list[0].className)
      : "—";
  const totalListed = rosterTotal || n;
  const presentListed = attendance.length > 0 ? presentCount : n;
  const absentListed = attendance.length > 0 ? absentCount : 0;

  return `<section class="cover">
${masthead()}
<h1>التقرير الشامل لنتائج ${esc(TEST_TITLE)}</h1>
<p class="subject">مادة ${esc(SUBJECT_NAME)} — التاريخ والجغرافيا</p>
<p class="doc-kind">${esc(scope.label)}</p>
<table class="grid id-table">
<tbody>
<tr><th>المستوى</th><td>${esc(scope.level ?? (n ? bankLevelOf(list[0]) : session?.bankLevel ?? "—"))}</td><th>الشعبة / المسلك</th><td>${esc(scope.branch ?? (n ? branchOf(list[0]) : session?.branch ?? "—"))}</td></tr>
<tr><th>القسم</th><td>${esc(reportClass)}</td><th>مجموع التلاميذ في اللائحة</th><td>${totalListed} تلميذ(ة)</td></tr>
<tr><th>الحاضرون</th><td>${presentListed} تلميذ(ة)</td><th>الغائبون</th><td>${absentListed} تلميذ(ة)</td></tr>
<tr><th>المشاركون في التقويم</th><td>${n} تلميذ(ة)</td><th>تاريخ التقويم</th><td>${esc(sessionDateLabel(session))}</td></tr>
<tr><th>التوقيت</th><td>${esc(sessionTimeLabel(session))}</td><th>تاريخ التحرير</th><td>${esc(formatDate(new Date().toISOString()))}</td></tr>
<tr><th>التقويم</th><td colspan="3">${esc(TEST_TITLE)} — 20 سؤالًا / 20 نقطة / 60 دقيقة</td></tr>
<tr><th>الأستاذ</th><td>${esc(TEACHER_NAME)}</td><th>المؤسسة</th><td>${esc(SCHOOL_NAME)}</td></tr>
</tbody>
</table>
<div class="score-band">
  <div class="cell hero"><b>${n ? avg((s) => s.total) : "—"}</b><span>متوسط القسم /20</span></div>
  <div class="cell"><b>${n ? best : "—"}</b><span>أعلى نقطة</span></div>
  <div class="cell"><b>${n ? worst : "—"}</b><span>أدنى نقطة</span></div>
  <div class="cell"><b>${n ? `${avg((s) => s.percent)}٪` : "—"}</b><span>متوسط النسبة</span></div>
  <div class="cell"><b>${n ? support.length : "—"}</b><span>يحتاجون الدعم</span></div>
</div>
</section>

<section class="part">
  <h2>1. المعطيات الإحصائية العامة</h2>
  <table class="grid">
    <thead><tr><th>المؤشر</th><th>القيمة</th><th>ملاحظة</th></tr></thead>
    <tbody>
      <tr><td>مجموع التلاميذ في اللائحة</td><td class="num">${totalListed}</td><td>${attendance.length ? "اللائحة الكاملة للقسم" : "لا توجد لائحة مرتبطة بهذا النطاق"}</td></tr>
      <tr><td>الحاضرون</td><td class="num">${presentListed}</td><td>${totalListed ? `نسبة الحضور: ${Math.round((presentListed / totalListed) * 100)}٪` : "—"}</td></tr>
      <tr><td>الغائبون</td><td class="num">${absentListed}</td><td>${totalListed ? `نسبة الغياب: ${Math.round((absentListed / totalListed) * 100)}٪` : "—"}</td></tr>
      <tr><td>المشاركون في التقويم</td><td class="num">${n}</td><td>لا يدخل الغائبون في المعدلات أو النجاح أو الدعم</td></tr>
      <tr><td>متوسط القسم /20</td><td class="num">${n ? avg((s) => s.total) : "—"}</td><td>${n ? `النسبة المئوية: ${avg((s) => s.percent)}٪` : "لا توجد نتائج فعلية محفوظة"}</td></tr>
      <tr><td>متوسط التاريخ /10</td><td class="num">${n ? avgHist : "—"}</td><td>${n ? (avgHist >= avgGeo ? "أعلى نسبيًا من الجغرافيا" : "أدنى نسبيًا من الجغرافيا") : "لا توجد نتائج فعلية محفوظة"}</td></tr>
      <tr><td>متوسط الجغرافيا /10</td><td class="num">${n ? avgGeo : "—"}</td><td>${n ? (avgGeo > avgHist ? "أعلى نسبيًا من التاريخ" : "أدنى نسبيًا من التاريخ") : "لا توجد نتائج فعلية محفوظة"}</td></tr>
      <tr><td>أعلى / أدنى نقطة</td><td class="num">${n ? `${best} / ${worst}` : "—"}</td><td>${n ? `المدى: ${round1(best - worst)} نقطة` : "لا توجد نتائج فعلية محفوظة"}</td></tr>
      <tr><td>نسبة التحكّم (≥ 50٪)</td><td class="num">${n ? `${Math.round(((n - support.length) / n) * 100)}٪` : "—"}</td><td>${n ? `${n - support.length} من ${n} تلميذ(ة)` : "لا توجد نتائج فعلية محفوظة"}</td></tr>
      <tr><td>يحتاجون إلى دعم</td><td class="num">${support.length}</td><td>${n ? `${support.length} يحتاجون · ${n - support.length} لا يحتاجون` : "لا توجد نتائج فعلية محفوظة"}</td></tr>
      <tr><td>تحكّم جيد (≥ 70٪)</td><td class="num">${good.length}</td><td>${good.map((s) => s.name).slice(0, 6).join("، ")}${good.length > 6 ? " …" : ""}</td></tr>
      <tr><td>سجلات بأجوبة تفصيلية</td><td class="num">${withAnswers}</td><td>${n === 0 ? "لا توجد نتائج فعلية محفوظة" : withAnswers === n ? "كل السجلات تتضمن أجوبة كل سؤال" : "بقية السجلات محفوظة قبل تفعيل حفظ الأجوبة"}</td></tr>
    </tbody>
  </table>
</section>

<section class="part">
  <h2>2. توزيع النتائج</h2>
  <table class="grid">
    <thead><tr><th>الشريحة</th><th>العدد</th><th>النسبة</th><th style="width:30%">مؤشر</th></tr></thead>
    <tbody>${dist
      .map(
        (d) =>
          `<tr><td>${esc(d.label)}</td><td class="num">${d.count}</td><td class="num">${d.pct < 0 ? "—" : `${d.pct}٪`}</td><td><span class="bar"><i style="width:${Math.max(0, d.pct)}%"></i></span></td></tr>`,
      )
      .join("")}</tbody>
  </table>
</section>

<section class="part">
  <h2>3. مستوى تحكّم القسم في المهارات</h2>
  <table class="grid">
    <thead><tr><th>المهارة</th><th>مجموع النقط</th><th>الأقصى</th><th>نسبة التحكّم</th><th>المؤشر</th></tr></thead>
    <tbody>${skills.length > 0 ? skills
      .map(
        (s) =>
          `<tr><td>${esc(s.skill)}</td><td class="num">${s.got}</td><td class="num">${s.max}</td><td class="num">${s.pct}٪</td><td>${esc(s.state)}</td></tr>`,
      )
      .join("") : `<tr><td colspan="5">لا توجد نتائج فعلية محفوظة لهذا القسم.</td></tr>`}</tbody>
  </table>
  <p class="lead">أقوى مهارة على مستوى القسم: ${esc(strongest ? `${strongest.skill} (${strongest.pct}٪)` : "—")} · أضعف مهارة: ${esc(weakest ? `${weakest.skill} (${weakest.pct}٪)` : "—")}</p>
</section>

<section class="part">
  <h2>4. جدول جميع تلاميذ القسم والحضور والمشاركة</h2>
  <table class="grid">
    <thead><tr><th>ر.ت</th><th>اسم التلميذ(ة)</th><th>رقم مسار</th><th>الحضور</th><th>التقويم</th><th>النقطة /20</th><th>الدعم</th></tr></thead>
    <tbody>${rosterRows.length > 0 ? rosterRows
      .map((entry) => {
        const s = entry.submission;
        const name = s && s.name !== entry.student.name
          ? `${esc(entry.student.name)} <small>(سجل التقويم: ${esc(s.name)})</small>`
          : esc(entry.student.name);
        const score = s ? `${round2(s.total)} /20` : "—";
        const supportLabel = s ? (s.percent < 50 ? "نعم" : "لا") : "—";
        return `<tr><td class="num">${entry.student.n}</td><td>${name}</td><td class="num">${esc(entry.student.massar)}</td><td>${entry.attendanceStatus === "present" ? "حاضر" : "غائب"}</td><td>${entry.assessmentStatus === "completed" ? "أنجز" : entry.assessmentStatus === "not_started" ? "لم يبدأ" : "لم ينجز"}</td><td class="num">${score}</td><td>${supportLabel}</td></tr>`;
      })
      .join("") : list.length > 0 ? list
        .map((s, i) => `<tr><td class="num">${i + 1}</td><td>${esc(s.name)}</td><td class="num">${esc(s.massar || "—")}</td><td>حاضر</td><td>أنجز</td><td class="num">${round2(s.total)} /20</td><td>${s.percent < 50 ? "نعم" : "لا"}</td></tr>`)
        .join("") : `<tr><td colspan="7">لا توجد لائحة أو نتائج محفوظة لهذا النطاق.</td></tr>`}</tbody>
  </table>
  <p class="lead">النقط والتحليل والدعم حُسبت فقط للتلاميذ الذين أنجزوا التقويم؛ الغائبون محفوظون في اللائحة دون إجابات أو نتيجة.</p>
</section>

<section class="part">
  <h2>5. التلاميذ المحتاجون إلى الدعم وخطة المعالجة</h2>
  ${
    support.length === 0
      ? `<p class="lead">${n === 0 ? "لا توجد نتائج فعلية محفوظة لهذا القسم." : "لا يوجد تلميذ(ة) تحت عتبة 50٪ في هذه المجموعة."}</p>`
      : `<table class="grid">
    <thead><tr><th>رقم مسار</th><th>التلميذ(ة)</th><th>المجموع /20</th><th>أضعف مهارة</th><th>إجراء الدعم المقترح</th></tr></thead>
    <tbody>${support
      .map((s) => {
        const a = analyse(s);
        const weak = a.skills[a.skills.length - 1];
        const reco = recommendationsFor(s, a)[0] ?? "دعم موجّه حسب المهارة الأضعف.";
        return `<tr><td class="num">${esc(s.massar || "—")}</td><td>${esc(s.name)}</td><td class="num">${round2(s.total)}</td><td>${esc(weak ? `${weak.skill} (${weak.pct}٪)` : "—")}</td><td>${esc(reco)}</td></tr>`;
      })
      .join("")}</tbody>
  </table>`
  }
</section>

<section class="part">
  <h2>6. الخلاصة التربوية والتوصيات العامة</h2>
  <ol class="reco">
    <li>${n ? `متوسط القسم ${avg((s) => s.total)} /20 (${avg((s) => s.percent)}٪) — مستوى التحكّم العام: ${esc(skillWord(Math.round(avg((s) => s.percent))))}.` : "لا توجد نتائج فعلية محفوظة؛ لا يمكن احتساب متوسط أو نسبة دعم."}</li>
    <li>${n ? (avgHist >= avgGeo ? `التاريخ (${avgHist}/10) أقوى من الجغرافيا (${avgGeo}/10): يُقترح تكثيف الاشتغال على أدوات التعبير الجغرافي (خرائط، مبيانات، جداول).` : `الجغرافيا (${avgGeo}/10) أقوى من التاريخ (${avgHist}/10): يُقترح تدعيم المرجعيات الزمنية والمفاهيم التاريخية.`) : "لا توجد نتائج فعلية للمقارنة بين المادتين."}</li>
    <li>${weakest ? `المهارة الأكثر تعثّرًا «${esc(weakest.skill)}» (${weakest.pct}٪): ${esc(RECOMMENDATIONS[weakest.skill] ?? "إعادة بناء هذا المكتسب عبر تمارين موجّهة وتصحيح جماعي في القسم.")}` : "لا توجد معطيات كافية عن المهارات."}</li>
    <li>${n === 0 ? "لا توجد نتائج فعلية محفوظة؛ لا تُنشأ لائحة دعم لهذا القسم." : support.length > 0 ? `برمجة حصص دعم لفائدة ${support.length} تلميذ(ة) تحت عتبة 50٪، مع تقويم قصير أسبوعيًا لقياس الأثر.` : "لا حاجة إلى دعم مكثّف؛ يُستثمر الوقت في أنشطة التوسّع والتعميق."}</li>
    <li>توظيف موارد المنصة في المعالجة: قسم الدروس للمفاهيم، قسم التطبيقات للتمارين المصححة، قسم المنهجيات لتحليل الوثائق والكتابة.</li>
  </ol>
</section>
${signatureBlock(scope.label)}`;
}

/** ملف HTML كامل للتقرير الشامل */
export function classReportHtml(subs: Submission[], scope: ClassScope): string {
  return htmlDocument(
    `تقرير_شامل_${scope.label.replace(/\s+/g, "_")}`,
    classReportBody(subs, scope),
  );
}
