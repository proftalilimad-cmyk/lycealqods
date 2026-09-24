import type { InspectorReport } from "../types";
import { esc, formatDate, round1 } from "./reportDoc";
import type { InspectorAnalysis, InspectorDistribution, InspectorSkillAnalysis } from "./inspectorReports";
import { reportClassLabel } from "./inspectorReports";

const CSS = `
:root{--green:#075b46;--green2:#0c7c5b;--gold:#b8892d;--ink:#17231e;--muted:#64716b;--line:#d9d1c2;--paper:#fffdf8;--red:#b4232a}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{direction:rtl;background:#eeeae1;color:var(--ink);font-family:"Readex Pro","Cairo","Segoe UI",Tahoma,Arial,sans-serif;font-size:11px;line-height:1.75}.document{max-width:190mm;margin:0 auto;background:#fff;padding:10mm 8mm 18mm;min-height:270mm} @page{size:A4;margin:14mm 12mm 18mm;@bottom-center{content:"صفحة " counter(page) " من " counter(pages);font-family:Arial,sans-serif;font-size:9px;color:#64716b}}@media print{body{background:#fff;font-size:10px}.document{max-width:none;margin:0;padding:0;min-height:0}.no-print{display:none!important}.cover{break-after:page;page-break-after:always}.section,.card,table,.chart{break-inside:avoid;page-break-inside:avoid}tr{break-inside:avoid;page-break-inside:avoid}a{color:inherit;text-decoration:none}.print-footer{display:block;position:fixed;bottom:-11mm;left:0;right:0;text-align:center;color:#64716b;font-size:9px}.print-footer .number:after{content:counter(page) " / " counter(pages)}}
.no-print{padding:8px 12px;margin-bottom:9px;border:1px solid #e4cf98;border-radius:8px;background:#fff8e7;color:#795914;font-weight:700}.cover{padding-top:2mm}.masthead{display:flex;gap:13px;align-items:center;border-bottom:3px double var(--green2);padding-bottom:10px}.seal{width:58px;height:58px;flex:0 0 auto;border-radius:50%;border:2px solid var(--gold);background:linear-gradient(145deg,var(--green2),var(--green));color:#f8e8bd;display:grid;place-items:center;text-align:center;font-size:10px;font-weight:900;line-height:1.25}.head-lines{flex:1}.ministry{margin:0;color:var(--muted);font-size:10px;font-weight:700}.school{margin:2px 0;color:var(--green);font-size:15px;font-weight:900}.subhead{margin:1px 0;color:var(--muted);font-size:10px;font-weight:600}.cover h1{margin:20mm 0 4px;text-align:center;color:var(--green);font-size:24px;line-height:1.4;font-weight:950}.cover .subtitle{text-align:center;color:var(--gold);font-size:14px;font-weight:900;margin:0 0 13px}.badge{display:table;margin:0 auto 14px;background:var(--green2);color:#fff;padding:4px 16px;border-radius:999px;font-weight:800}.cover-note{max-width:145mm;margin:12px auto;text-align:center;padding:8px 12px;border:1px dashed #dbb75e;border-radius:10px;background:#fff8e6;color:#735514;font-weight:700}.identity{margin-top:18px}.grid{width:100%;border-collapse:collapse;margin:7px 0 4px}.grid th,.grid td{border:1px solid var(--line);padding:5px 7px;text-align:start;vertical-align:top}.grid thead th{background:var(--green);color:#fff;text-align:center;font-weight:900}.grid tbody tr:nth-child(even) td{background:var(--paper)}.identity th{width:18%;background:#f0ece2;color:var(--green);font-weight:900}.identity td{font-weight:700}.section{margin-top:15px}.section h2{margin:0 0 7px;padding:6px 11px;background:var(--green);border-inline-start:6px solid var(--gold);border-radius:7px;color:#fff;font-size:14px;font-weight:950}.section h3{margin:10px 0 4px;color:var(--green);font-size:12px}.lead{color:var(--muted);font-weight:650;margin:5px 0}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.stat{padding:7px;border:1px solid var(--line);border-radius:9px;background:var(--paper);text-align:center}.stat b{display:block;color:var(--green);font-size:17px;font-weight:950}.stat span{display:block;color:var(--muted);font-size:9px;font-weight:750}.stat.hero{border-color:var(--gold);background:#fff8e6}.chart{border:1px solid var(--line);border-radius:9px;padding:9px;background:#fff;margin-top:8px}.chart-title{margin:0 0 6px;color:var(--green);font-weight:900}.bar-row{display:grid;grid-template-columns:100px 1fr 38px;gap:6px;align-items:center;margin:5px 0}.bar-label{font-size:9px;font-weight:750}.bar-track{height:12px;background:#f0ece2;border-radius:999px;overflow:hidden}.bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--green2),#55b78f)}.bar-fill.gold{background:linear-gradient(90deg,#b8892d,#e9c36e)}.bar-value{text-align:left;font-size:9px;font-weight:900;color:var(--green)}.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.box{border:1px solid var(--line);border-radius:9px;padding:8px}.box.good{background:#f2fbf6;border-color:#bfe3cf}.box.warn{background:#fff7f5;border-color:#f0c4c1}.box h3{margin:0 0 4px;font-size:11px}.box ul,.plan{margin:3px 0;padding-inline-start:18px}.box li,.plan li{margin:2px 0}.note{padding:7px 9px;border-inline-start:4px solid var(--gold);background:#fff8e6;border-radius:5px;color:#604b17;font-weight:650}.individual{font-size:8.6px}.individual th,.individual td{padding:4px 4px}.individual th{font-size:8.5px}.muted{color:var(--muted)}.nowrap{white-space:nowrap}.empty{padding:13px;text-align:center;border:1px dashed var(--line);border-radius:8px;color:var(--muted);font-weight:750}.signature{display:flex;justify-content:space-between;gap:20px;border-top:2px solid var(--green);margin-top:18px;padding-top:9px;color:var(--muted);font-weight:750}.confidential{font-size:9px;color:var(--muted);text-align:center;margin-top:8px}.print-footer{display:none}
`;

function htmlDocument(body: string, title: string): string {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><main class="document">${body}</main><div class="print-footer">${esc(title)} — <span class="number"></span></div></body></html>`;
}

function dateLabel(value: string): string {
  if (!value) return "غير محدد";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ar-MA", { day: "numeric", month: "long", year: "numeric" });
}

function list(items: string[], empty = "لا توجد معطيات فعلية محفوظة."): string {
  return items.length ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p class="muted">${empty}</p>`;
}

function distributionChart(items: InspectorDistribution[], sourceLabel = "النتائج المركزية"): string {
  if (!items.length) return `<div class="empty">لا توجد ${sourceLabel} لبناء الرسم.</div>`;
  return `<div class="chart"><p class="chart-title">توزيع النتائج حسب الفئات</p>${items.map((item) => `<div class="bar-row"><span class="bar-label">${esc(item.label)}</span><span class="bar-track"><i class="bar-fill gold" style="display:block;width:${Math.max(0, item.percent)}%"></i></span><span class="bar-value">${item.count} (${item.percent}٪)</span></div>`).join("")}</div>`;
}

function skillsChart(items: InspectorSkillAnalysis[], sourceLabel = "النتائج المركزية"): string {
  if (!items.length) return `<div class="empty">لا توجد ${sourceLabel} لتحليل الكفايات.</div>`;
  return `<div class="chart"><p class="chart-title">نسبة التحكم في الكفايات والمهارات</p>${items.map((item) => `<div class="bar-row"><span class="bar-label">${esc(item.skill)}</span><span class="bar-track"><i class="bar-fill" style="display:block;width:${Math.max(0, item.percent)}%"></i></span><span class="bar-value">${item.percent}٪</span></div>`).join("")}</div>`;
}

function levelComparisonChart(analysis: InspectorAnalysis): string {
  const sourceLabel = analysis.dataSource === "demo" ? "بيانات Demo" : "النتائج المركزية";
  const levels = [
    { label: "ممتاز (80٪ فأكثر)", count: analysis.students.filter((student) => (student.percent ?? -1) >= 80).length },
    { label: "جيد جدًا (70–79٪)", count: analysis.students.filter((student) => (student.percent ?? -1) >= 70 && (student.percent ?? -1) < 80).length },
    { label: "متوسط (50–69٪)", count: analysis.students.filter((student) => (student.percent ?? -1) >= 50 && (student.percent ?? -1) < 70).length },
    { label: "يحتاج إلى الدعم", count: analysis.students.filter((student) => (student.percent ?? -1) >= 0 && (student.percent ?? -1) < 50).length },
  ];
  const total = levels.reduce((sum, level) => sum + level.count, 0);
  if (!total) return `<div class="empty">لا توجد ${sourceLabel} لمقارنة مستويات التلاميذ.</div>`;
  const max = Math.max(1, ...levels.map((level) => level.count));
  return `<div class="chart"><p class="chart-title">مقارنة مستويات التلاميذ</p>${levels.map((level) => `<div class="bar-row"><span class="bar-label">${esc(level.label)}</span><span class="bar-track"><i class="bar-fill" style="display:block;width:${(level.count / max) * 100}%"></i></span><span class="bar-value">${level.count}</span></div>`).join("")}</div>`;
}

function studentTable(analysis: InspectorAnalysis): string {
  if (!analysis.students.length) return `<div class="empty">لا توجد لائحة مرتبطة بهذا القسم.</div>`;
  return `<div style="overflow-x:auto"><table class="grid individual"><thead><tr><th>ر.ت</th><th>اسم التلميذ(ة)</th><th>المستوى والقسم</th><th>النقطة</th><th>النسبة</th><th>الكفايات المتحكم فيها</th><th>الكفايات غير المتحكم فيها</th><th>الاحتياجات والتوصيات</th></tr></thead><tbody>${analysis.students.map((student) => {
    const score = student.submission && student.score !== undefined ? `${student.score}/${student.maxScore}` : "—";
    const percent = student.percent === undefined ? "—" : `${student.percent}٪`;
    const status = student.attendance === "غائب" ? "<br><span class=\"muted\">غائب / لم ينجز</span>" : "";
    const recommendations = [...student.needs, ...student.recommendations].slice(0, 3);
    return `<tr><td class="nowrap">${student.rosterNo ?? student.rank}</td><td><strong>${esc(student.name)}</strong><br><span class="muted" dir="ltr">${esc(student.massar ?? "—")}</span>${status}</td><td>${esc(student.level)}<br>${esc(reportClassLabel(analysis.report))}</td><td class="nowrap">${score}</td><td class="nowrap">${percent}</td><td>${student.controlled.length ? student.controlled.map(esc).join("، ") : "—"}</td><td>${student.uncontrolled.length ? student.uncontrolled.map(esc).join("، ") : "—"}</td><td>${recommendations.length ? recommendations.map(esc).join("<br>") : "—"}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function supportTable(analysis: InspectorAnalysis): string {
  const rows = analysis.students.filter((student) => student.submission && (student.percent ?? 0) < analysis.successThreshold);
  if (!rows.length) return `<div class="empty">${analysis.hasRealResults ? "لا يوجد تلميذ تحت عتبة الدعم المحددة." : analysis.dataSource === "demo" ? "لا توجد بيانات Demo مطابقة؛ لا تُنشأ لائحة دعم." : "لا توجد نتائج مركزية؛ لا تُنشأ لائحة دعم."}</div>`;
  return `<table class="grid"><thead><tr><th>التلميذ(ة)</th><th>النقطة</th><th>الكفايات ذات الأولوية</th><th>نشاط الدعم المقترح</th><th>مدة ومؤشر التتبع</th></tr></thead><tbody>${rows.map((student) => `<tr><td>${esc(student.name)}<br><span class="muted" dir="ltr">${esc(student.massar ?? "—")}</span></td><td>${student.score}/${student.maxScore} (${student.percent}٪)</td><td>${student.needs.length ? student.needs.map(esc).join("، ") : "تحديد لاحق وفق بطاقة التلميذ"}</td><td>ورشة قصيرة لتحليل وثيقة/خريطة أو بناء مفهوم، ثم تمرين تطبيقي مصحح فرديًا.</td><td>${esc(analysis.report.supportDuration)}<br>مؤشر النجاح: ارتفاع النسبة في التقويم القصير الموالي.</td></tr>`).join("")}</tbody></table>`;
}

export function inspectorReportHtml(report: InspectorReport, analysis: InspectorAnalysis): string {
  const resultNote = analysis.dataSource === "demo"
    ? (analysis.hasRealResults ? "تم احتساب المؤشرات أدناه من بيانات تجريبية معزولة لأغراض المعاينة والتصدير فقط؛ لا تمثل هذه النسخة نتائج مركزية محفوظة." : "لا توجد بيانات Demo مطابقة للقسم والفترة ونوع التقويم؛ لذلك لا تُعرض أرقام مُنشأة ولا تُحتسب مؤشرات وهمية.")
    : analysis.hasRealResults
      ? "تم احتساب المؤشرات أدناه من السجلات المركزية المحفوظة المرتبطة بالقسم والفترة المحددين."
      : "لا توجد نتائج مركزية محفوظة مطابقة للقسم والفترة ونوع التقويم؛ لذلك لا تُعرض أرقام مُنشأة ولا تُحتسب مؤشرات وهمية.";
  const average = analysis.average === null ? "—" : `${analysis.average}/${analysis.maxScoreScale}`;
  const averagePercent = analysis.averagePercent === null ? "—" : `${analysis.averagePercent}٪`;
  const sourceLabel = analysis.dataSource === "demo" ? "بيانات Demo" : "النتائج المركزية";
  const title = report.assessmentType === "diagnostic" ? "تقرير التقويم التشخيصي للمفتش" : "تقرير التقويم الشخصي للمفتش";
  return htmlDocument(`
<section class="cover">
  <header class="masthead"><div class="seal">المملكة<br>المغربية</div><div class="head-lines"><p class="ministry">المملكة المغربية</p><p class="ministry">وزارة التربية الوطنية والتعليم الأولي والرياضة</p><p class="school">${esc(report.academy)}</p><p class="subhead">${esc(report.directorate)} · ${esc(report.institution)}</p><p class="subhead">السنة الدراسية: ${esc(report.schoolYear)}</p></div></header>
  <h1>${title}</h1><p class="subtitle">تقرير تربوي تحليلي رسمي لنتائج التقويم</p><p class="badge">${esc(report.assessmentType === "diagnostic" ? "التقويم التشخيصي" : "التقويم الشخصي")}</p>${analysis.dataSource === "demo" ? "<p class=\"badge\" style=\"background:#b8892d\">نسخة Demo — للمعاينة فقط</p>" : ""}
  <p class="cover-note">${esc(resultNote)}</p>
  <table class="grid identity"><tbody>
    <tr><th>الأستاذ(ة)</th><td>${esc(report.teacherName)}</td><th>المادة</th><td>${esc(report.subject)}</td></tr>
    <tr><th>المستوى</th><td>${esc(report.level)}</td><th>القسم</th><td>${esc(reportClassLabel(report))}</td></tr>
    <tr><th>فترة التقويم</th><td>${dateLabel(report.periodFrom)} — ${dateLabel(report.periodTo)}</td><th>عتبة النجاح/الدعم</th><td>${report.threshold}٪</td></tr>
    <tr><th>تاريخ الإنشاء</th><td>${esc(formatDate(report.updatedAt))}</td><th>حالة التقرير</th><td>${esc(report.status === "approved" ? "معتمد" : report.status === "archived" ? "مؤرشف" : "مسودة")}</td></tr>
  </tbody></table>
  <p class="confidential">وثيقة مهنية سرية — تُتداول في إطار التتبع التربوي للمؤسسة ولا تُنشر للعموم.</p>
</section>
<section class="section"><h2>المحور الأول: تقديم عام</h2><table class="grid"><tbody><tr><th>السياق العام للتقويم</th><td>${esc(report.context)}</td></tr><tr><th>أهداف التقويم</th><td>${esc(report.objectives)}</td></tr><tr><th>الفئة المستهدفة</th><td>${esc(report.level)} — ${esc(reportClassLabel(report))} — ${analysis.totalStudents} تلميذ(ة) في اللائحة</td></tr><tr><th>الفترة الزمنية</th><td>${dateLabel(report.periodFrom)} إلى ${dateLabel(report.periodTo)}</td></tr><tr><th>الأدوات المعتمدة</th><td>${esc(report.tools)}</td></tr></tbody></table></section>
<section class="section"><h2>المحور الثاني: المعطيات الإحصائية</h2><p class="lead">${esc(resultNote)}</p><div class="stats"><div class="stat"><b>${analysis.totalStudents}</b><span>عدد التلاميذ في اللائحة</span></div><div class="stat"><b>${analysis.participants}</b><span>المشاركون في التقويم</span></div><div class="stat"><b>${analysis.participationPercent}٪</b><span>نسبة المشاركة</span></div><div class="stat hero"><b>${average}</b><span>المعدل العام</span></div><div class="stat"><b>${averagePercent}</b><span>المعدل بالنسبة المئوية</span></div><div class="stat"><b>${analysis.maxScore === null ? "—" : `${analysis.maxScore}/${analysis.maxScoreScale}`}</b><span>أعلى نقطة</span></div><div class="stat"><b>${analysis.minScore === null ? "—" : `${analysis.minScore}/${analysis.maxScoreScale}`}</b><span>أدنى نقطة</span></div><div class="stat"><b>${analysis.successPercent === null ? "—" : `${analysis.successPercent}٪`}</b><span>نسبة النجاح (≥ ${analysis.successThreshold}٪)</span></div></div>${distributionChart(analysis.distribution, sourceLabel)}${levelComparisonChart(analysis)}<table class="grid"><thead><tr><th>المؤشر</th><th>العدد</th><th>النسبة</th><th>قراءة تربوية</th></tr></thead><tbody><tr><td>أنجزوا التقويم</td><td>${analysis.participants}</td><td>${analysis.participationPercent}٪ من اللائحة</td><td>تُحسب المشاركة من اللائحة المرتبطة بالقسم لا من عدد النتائج وحده.</td></tr><tr><td>لم ينجزوا/غائبون</td><td>${analysis.absent}</td><td>${analysis.totalStudents ? round1((analysis.absent / analysis.totalStudents) * 100) : 0}٪</td><td>لا تُخترع لهم نقطة أو كفايات؛ يُقترح تتبع وضعية الإنجاز.</td></tr><tr><td>يحتاجون إلى الدعم</td><td>${analysis.supportCount}</td><td>${analysis.supportPercent === null ? "—" : `${analysis.supportPercent}٪ من المشاركين`}</td><td>العتبة المعتمدة في إعداد التقرير: ${analysis.successThreshold}٪.</td></tr></tbody></table></section>
<section class="section"><h2>المحور الثالث: تحليل الكفايات والمهارات</h2><p class="lead">الكفاية المتحكم فيها هي التي بلغت عتبة التقرير أو تجاوزتها، وتُعرض الصعوبات من ${analysis.dataSource === "demo" ? "البيانات التجريبية المعزولة" : "النتائج المركزية"} فقط.</p>${skillsChart(analysis.skills, sourceLabel)}<div class="two"><div class="box good"><h3>الكفايات والمهارات المتحكم فيها</h3>${list(analysis.masteredSkills.map((skill) => `${skill.skill}: ${skill.percent}٪ (${skill.state})`), "لا توجد كفاية بلغت العتبة في النتائج المتاحة.")}</div><div class="box warn"><h3>الكفايات التي تحتاج إلى الدعم</h3>${list(analysis.supportSkills.map((skill) => `${skill.skill}: ${skill.percent}٪ (${skill.state})`), "لا توجد صعوبة تحت العتبة في النتائج المتاحة.")}</div></div><h3>الصعوبات التعليمية المشتركة</h3>${list(analysis.commonDifficulties, `لا توجد صعوبات مشتركة قابلة للاستخلاص من ${sourceLabel}.`)}</section>
<section class="section"><h2>المحور الرابع: تحليل النتائج الفردية</h2><p class="lead">يظهر الجدول داخل هذه الوثيقة المحمية للأستاذ/المفتش فقط، ولا تُنشر بياناته في الواجهة العامة.</p>${studentTable(analysis)}</section>
<section class="section"><h2>المحور الخامس: خطة الدعم والمعالجة</h2><table class="grid"><tbody><tr><th>الكفايات ذات الأولوية</th><td>${analysis.commonDifficulties.length ? analysis.commonDifficulties.map(esc).join("، ") : `تُحدّد بعد توفر ${sourceLabel}.`}</td></tr><tr><th>أنشطة الدعم المقترحة</th><td>إعادة بناء المفاهيم الأساسية، تحليل وثيقة أو خريطة موجهة، قراءة جدول/مبيان، ثم إنتاج فقرة قصيرة مع تصحيح تكويني.</td></tr><tr><th>الفئة المستهدفة</th><td>${analysis.supportCount} تلميذ(ة) حسب العتبة، مع مواكبة باقي التلاميذ بأنشطة التثبيت والتوسّع.</td></tr><tr><th>الوسائل والموارد</th><td>الكتاب المدرسي، وثائق تاريخية وجغرافية، خرائط ومبيانات، بطاقات دعم، وتطبيقات المنصة.</td></tr><tr><th>المدة الزمنية</th><td>${esc(report.supportDuration)}</td></tr><tr><th>مؤشرات تتبع التقدم</th><td>ارتفاع متوسط الكفاية المستهدفة، انخفاض عدد التلاميذ تحت العتبة، وتحسن نتائج التقويم القصير الموالي.</td></tr></tbody></table>${supportTable(analysis)}</section>
<section class="section"><h2>المحور السادس: الخلاصة والتوصيات</h2><ol class="plan"><li>${analysis.hasRealResults ? `بلغ المعدل العام ${average} بنسبة ${averagePercent}، مع مشاركة بلغت ${analysis.participationPercent}٪.` : `لا يمكن بناء خلاصة رقمية قبل توفر ${sourceLabel} مطابقة للمعايير المحددة.`}</li><li>${analysis.commonDifficulties.length ? `تتركز الأولوية في: ${analysis.commonDifficulties.map(esc).join("، ")}.` : `تُستكمل قراءة الصعوبات بعد جمع ${sourceLabel} كافية.`}</li><li>تنفيذ خطة الدعم المقترحة، وتوثيق الأنشطة المنجزة، وإعادة التقويم بعد المدة المحددة.</li><li>استعمال الفروق الفردية في تشكيل مجموعات دعم مرنة، مع حماية أسماء التلاميذ وبياناتهم من التداول العام.</li></ol></section>
<div class="signature"><span>إمضاء الأستاذ(ة): ${esc(report.teacherName)}</span><span>تاريخ التحرير: ${dateLabel(report.updatedAt.slice(0, 10))}</span></div>
`, title);
}
