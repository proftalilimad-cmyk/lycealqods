import { createRequire } from "node:module";
import { deflateRawSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getJadada, getJadadatCatalog, jadadaFileName, type JadadaFiche, type JadadaStage } from "../src/lib/jadadatLessons";

/*
   مُولِّد الأرشيف المطلوب: جذاذات PDF حقيقية، لا ملفات HTML باسم PDF.
   يستعمل PDFKit مع خط Noto Naskh Arabic، ثم يكتب ZIP UTF-8 بأسماء عربية.

   التشغيل:
     npm run pdf:jadadat

   الناتج:
     public/exports/jadadat-pdf.zip

   التصميم مستلهم من نموذج الأستاذ: رأس بثلاث خانات، إشكاليات، جدول
   «مراحل الإنجاز / الأهداف / التدبير / الدعامات / المنتوج»، ثم التقويم.
   كل جذاذة ثلاث صفحات A4 كحد أقصى.
*/

const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit") as any;
const { ArabicShaper } = require("arabic-persian-reshaper") as { ArabicShaper: { convertArabic: (value: string) => string } };
const bidiFactory = require("bidi-js") as () => {
  getEmbeddingLevels: (value: string, direction: "ltr" | "rtl") => unknown;
  getReorderedString: (value: string, levels: unknown) => string;
};

const bidi = bidiFactory();
const fontRegular = require.resolve("@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff");
const fontBold = require.resolve("@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-700-normal.woff");

const OUT_DIR = "public/exports";
const OUT_ZIP = join(OUT_DIR, "jadadat-pdf.zip");
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLORS = {
  /* ألوان الطباعة هي ألوان هوية الموقع، لا ألوان النموذج الورقي القديم. */
  brown: "#0c6147",
  brownLight: "#0f7c5b",
  orange: "#18906b",
  amber: "#d99e37",
  yellow: "#fbf3e2",
  cream: "#f7f5ef",
  line: "#d7e5dd",
  ink: "#0b1d17",
  muted: "#3d554c",
  header: "#e7f2ed",
  headerText: "#000000",
  white: "#ffffff",
};

function visualArabic(value: string): string {
  return String(value ?? "")
    .split("\n")
    .map((line) => {
      const shaped = ArabicShaper.convertArabic(line);
      return bidi.getReorderedString(shaped, bidi.getEmbeddingLevels(shaped, "rtl"));
    })
    .join("\n");
}

function compact(value: string, max: number): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "").trimEnd()}…`;
}

function listText(items: string[], maxItems: number, maxChars = 110): string {
  return items
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => `• ${compact(item, maxChars)}`)
    .join("\n");
}

function drawText(doc: any, text: string, x: number, y: number, width: number, height: number, options: { size?: number; bold?: boolean; color?: string; align?: "right" | "center" | "left"; pad?: number } = {}): void {
  const size = options.size ?? 7;
  const pad = options.pad ?? 3;
  doc.save();
  doc.rect(x, y, width, height).clip();
  doc.font(options.bold ? "naskhBold" : "naskh").fontSize(size).fillColor(options.color ?? COLORS.ink);
  doc.text(visualArabic(text), x + pad, y + pad, {
    width: Math.max(1, width - pad * 2),
    height: Math.max(1, height - pad * 2),
    align: options.align ?? "right",
    lineGap: 0,
  });
  doc.restore();
}

function heightOf(doc: any, text: string, width: number, size: number): number {
  doc.font("naskh").fontSize(size);
  return doc.heightOfString(visualArabic(text), { width: Math.max(1, width - 6), lineGap: 0 }) + 8;
}

function fillCell(doc: any, x: number, y: number, width: number, height: number, color: string, stroke = COLORS.line): void {
  doc.save().fillColor(color).strokeColor(stroke).lineWidth(0.45).rect(x, y, width, height).fillAndStroke().restore();
}

function drawTableCell(doc: any, text: string, x: number, y: number, width: number, height: number, options: { header?: boolean; phase?: boolean; product?: boolean; size?: number; bold?: boolean } = {}): void {
  const background = options.header ? COLORS.header : options.phase ? "#e7f2ed" : options.product ? "#f7f5ef" : COLORS.white;
  fillCell(doc, x, y, width, height, background);
  drawText(doc, text, x, y, width, height, {
    size: options.size ?? (options.header ? 6.6 : 6.2),
    bold: options.bold ?? options.header,
    color: options.header ? COLORS.headerText : options.phase ? COLORS.brown : COLORS.ink,
  });
}

function drawMetaTable(doc: any, x: number, y: number, width: number, rows: [string, string][]): void {
  const rowH = 20;
  const labelW = Math.min(58, width * 0.4);
  rows.forEach(([label, value], index) => {
    const yy = y + index * rowH;
    fillCell(doc, x, yy, labelW, rowH, COLORS.header);
    drawText(doc, label, x, yy, labelW, rowH, { size: 6.2, bold: true, color: COLORS.headerText, align: "center" });
    fillCell(doc, x + labelW, yy, width - labelW, rowH, COLORS.white);
    drawText(doc, value, x + labelW, yy, width - labelW, rowH, { size: 6.1, bold: true });
  });
}

function drawHeader(doc: any, fiche: JadadaFiche, label: string): number {
  const top = 18;
  const boxH = 64;
  const leftW = 145;
  const rightW = 145;
  const centerW = CONTENT_W - leftW - rightW - 8;
  const leftX = MARGIN;
  const centerX = leftX + leftW + 4;
  const rightX = centerX + centerW + 4;

  drawMetaTable(doc, leftX, top, leftW, [
    ["مدة الإنجاز", fiche.duration],
    ["الكتاب المعتمد", fiche.book],
    ["إعداد الأستاذ", fiche.teacher],
  ]);
  doc.save().fillColor(COLORS.brown).roundedRect(centerX, top, centerW, boxH, 12).fill().restore();
  drawText(doc, fiche.title, centerX + 8, top + 10, centerW - 16, 31, { size: 12, bold: true, color: COLORS.white, align: "center", pad: 2 });
  drawText(doc, `${fiche.authorLabel} — ${fiche.school}`, centerX + 8, top + 44, centerW - 16, 14, { size: 5.8, color: "#f7e7d5", align: "center", pad: 1 });
  doc.save().fillColor("#171411").circle(centerX + centerW - 4, top + 2, 15).fill().restore();
  drawText(doc, String(fiche.lessonIndex + 1).padStart(2, "0"), centerX + centerW - 19, top - 10, 30, 24, { size: 8, bold: true, color: COLORS.white, align: "center", pad: 2 });
  drawMetaTable(doc, rightX, top, rightW, [
    ["المادة", fiche.subjectLabel],
    ["المستوى", fiche.branchLabel],
    ["المجزوءة", String(fiche.unitIndex + 1).padStart(2, "0")],
  ]);

  fillCell(doc, MARGIN, top + boxH + 5, CONTENT_W, 18, COLORS.header);
  drawText(doc, label, MARGIN, top + boxH + 5, CONTENT_W, 18, { size: 7, bold: true, color: COLORS.headerText, align: "center", pad: 3 });
  return top + boxH + 27;
}

function drawProblem(doc: any, fiche: JadadaFiche, y: number): number {
  const rowH = 29;
  const labelW = 145;
  const valueW = CONTENT_W - labelW;
  const rows: [string, string][] = [
    ["الكفاية / الإشكالية المركزية للمجزوءة", compact(fiche.unitKifaya, 330)],
    ["الإشكالية المحورية للدرس", compact(fiche.coreQuestion, 390)],
  ];
  rows.forEach(([label, value], index) => {
    const yy = y + index * rowH;
    fillCell(doc, MARGIN, yy, labelW, rowH, COLORS.header);
    drawText(doc, label, MARGIN, yy, labelW, rowH, { size: 6.2, bold: true, color: COLORS.headerText, align: "center" });
    fillCell(doc, MARGIN + labelW, yy, valueW, rowH, COLORS.yellow);
    drawText(doc, value, MARGIN + labelW, yy, valueW, rowH, { size: 6.4, bold: true });
  });
  return y + rowH * rows.length + 5;
}

function drawObjectives(doc: any, fiche: JadadaFiche, y: number): number {
  const gap = 3;
  const width = (CONTENT_W - gap * 2) / 3;
  const h = 54;
  const rows: [string, string][] = [
    ["أهداف معرفية", listText(fiche.cognitiveObjectives, 3, 115)],
    ["أهداف مهارية", listText(fiche.methodObjectives, 3, 110)],
    ["أهداف قيمية", listText(fiche.valueObjectives, 2, 115)],
  ];
  rows.forEach(([label, value], i) => {
    const x = MARGIN + i * (width + gap);
    fillCell(doc, x, y, width, h, COLORS.white);
    fillCell(doc, x, y, width, 18, COLORS.header);
    drawText(doc, label, x, y, width, 18, { size: 6.4, bold: true, color: COLORS.headerText, align: "center" });
    drawText(doc, value, x, y + 18, width, h - 18, { size: 5.9 });
  });
  return y + h + 6;
}

function rowData(stage: JadadaStage, product: string): string[] {
  return [
    product,
    listText(stage.supports, 4, 85),
    compact(stage.management, 180),
    `${compact(stage.objective, 145)}\n${listText(stage.expected, 2, 110)}`,
    `${stage.name}\n${stage.duration}`,
  ];
}

function drawPlanTable(doc: any, rows: string[][], y: number, maxBottom: number): number {
  const widths = [185, 89, 100, 105, 80];
  const headers = ["المنتوج / الأثر المنتظر", "الدعامات الديداكتيكية", "التدبير الديداكتيكي", "أهداف التعلم المرتبطة بالنشاط", "مراحل إنجاز الدرس"];
  const headerH = 24;
  let x = MARGIN;
  headers.forEach((header, i) => {
    drawTableCell(doc, header, x, y, widths[i], headerH, { header });
    x += widths[i];
  });
  y += headerH;
  for (const row of rows) {
    const estimates = row.map((text, i) => heightOf(doc, text, widths[i], i === 4 ? 6.2 : 5.9));
    const rowH = Math.min(78, Math.max(43, Math.max(...estimates)));
    if (y + rowH > maxBottom) break;
    x = MARGIN;
    row.forEach((text, i) => {
      drawTableCell(doc, text, x, y, widths[i], rowH, { phase: i === 4, product: i === 0, size: i === 4 ? 6.05 : 5.85, bold: i === 4 });
      if (i === 4) {
        fillCell(doc, x, y + rowH - 12, widths[i], 12, COLORS.orange);
        drawText(doc, text.split("\n").at(-1) ?? "", x, y + rowH - 12, widths[i], 12, { size: 5.8, bold: true, color: COLORS.white, align: "center", pad: 1 });
      }
      x += widths[i];
    });
    y += rowH;
  }
  return y;
}

function drawSmallTables(doc: any, fiche: JadadaFiche, y: number): number {
  const gap = 4;
  const w = (CONTENT_W - gap) / 2;
  const h = 142;
  const x1 = MARGIN;
  const x2 = MARGIN + w + gap;
  drawTableCell(doc, "المفاهيم الأساس", x1, y, w, 18, { header: true, size: 6.8 });
  drawTableCell(doc, "الكرونولوجيا والمجالات", x2, y, w, 18, { header: true, size: 6.8 });
  let yy1 = y + 18;
  for (const item of fiche.concepts.slice(0, 10)) {
    const rh = 11;
    drawTableCell(doc, item.term, x1, yy1, w * 0.32, rh, { size: 5.3, phase: true });
    drawTableCell(doc, compact(item.def, 100), x1 + w * 0.32, yy1, w * 0.68, rh, { size: 5.25 });
    yy1 += rh;
  }
  let yy2 = y + 18;
  for (const item of fiche.timeline.slice(0, 10)) {
    const rh = 11;
    drawTableCell(doc, item.date, x2, yy2, w * 0.28, rh, { size: 5.3, phase: true });
    drawTableCell(doc, compact(item.event, 110), x2 + w * 0.28, yy2, w * 0.72, rh, { size: 5.25 });
    yy2 += rh;
  }
  return y + h;
}

function drawQuiz(doc: any, fiche: JadadaFiche, y: number, maxBottom: number): number {
  fillCell(doc, MARGIN, y, CONTENT_W, 18, COLORS.header);
  drawText(doc, "التقويم الإجمالي وأسئلة الدعم", MARGIN, y, CONTENT_W, 18, { size: 7, bold: true, color: COLORS.headerText, align: "center" });
  y += 20;
  for (const [index, q] of fiche.quiz.slice(0, 10).entries()) {
    const text = `${index + 1}) ${compact(q.q, 190)}\nالجواب: ${compact(q.options[q.answer] ?? "", 145)}${q.why ? ` — ${compact(q.why, 105)}` : ""}`;
    const rh = Math.min(38, Math.max(22, heightOf(doc, text, CONTENT_W - 28, 5.7)));
    if (y + rh > maxBottom) break;
    fillCell(doc, MARGIN, y, 25, rh, COLORS.yellow);
    drawText(doc, String(index + 1), MARGIN, y, 25, rh, { size: 7, bold: true, color: COLORS.brown, align: "center" });
    drawTableCell(doc, text, MARGIN + 25, y, CONTENT_W - 25, rh, { size: 5.7 });
    y += rh;
  }
  return y;
}

function drawDocs(doc: any, fiche: JadadaFiche, y: number, maxBottom: number): number {
  if (!fiche.docs.length) return y;
  fillCell(doc, MARGIN, y, CONTENT_W, 18, COLORS.header);
  drawText(doc, "الوثائق والدعامات وأسئلة الاشتغال", MARGIN, y, CONTENT_W, 18, { size: 7, bold: true, color: COLORS.headerText, align: "center" });
  y += 21;
  const gap = 4;
  const w = (CONTENT_W - gap * 2) / 3;
  for (const [index, docItem] of fiche.docs.slice(0, 3).entries()) {
    const x = MARGIN + index * (w + gap);
    const text = `${docItem.label}\n${compact(docItem.text, 150)}\n${docItem.questions.slice(0, 1).map((q) => `س: ${compact(q.q, 75)}\nج: ${compact(q.answer, 95)}`).join("\n")}`;
    const rh = Math.min(100, Math.max(58, heightOf(doc, text, w - 8, 5.5)));
    if (y + rh > maxBottom) return y;
    drawTableCell(doc, text, x, y, w, rh, { product: true, size: 5.5 });
  }
  return y + 102;
}

function drawFooter(doc: any, fiche: JadadaFiche, page: number): void {
  doc.save().strokeColor(COLORS.line).lineWidth(0.5).moveTo(MARGIN, 815).lineTo(PAGE_W - MARGIN, 815).stroke().restore();
  drawText(doc, `${fiche.sign} — الجذاذة مبنية على الدرس المنشور`, MARGIN, 818, CONTENT_W - 45, 14, { size: 5.5, color: COLORS.muted });
  drawText(doc, `${page} / 3`, PAGE_W - MARGIN - 40, 818, 40, 14, { size: 5.5, color: COLORS.muted, align: "left" });
}

async function renderPdf(fiche: JadadaFiche): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true, info: { Title: `جذاذة: ${fiche.title}`, Author: fiche.teacher, Subject: fiche.subjectLabel } });
    doc.registerFont("naskh", fontRegular);
    doc.registerFont("naskhBold", fontBold);
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const sectionCount = fiche.sourceSections.length;
    const split = Math.max(1, Math.ceil(sectionCount / 2));
    const sectionStages = fiche.stages.slice(1, 1 + sectionCount);
    const intro = fiche.stages[0];
    const synthesis = fiche.stages[1 + sectionCount];
    const assessment = fiche.stages[2 + sectionCount];
    const pageOneRows = [
      ...(intro ? [rowData(intro, `${compact(fiche.intro, 250)}\n${listText(intro.activities.slice(1), 2, 105)}`)] : []),
      ...sectionStages.slice(0, split).map((stage, i) => rowData(stage, `${compact(fiche.sourceSections[i].title, 100)}\n${compact(fiche.sourceSections[i].blocks.map((b: any) => b.text ?? b.items?.join(" ") ?? b.label ?? "").join(" "), 260)}`)),
    ];
    const pageTwoRows = [
      ...sectionStages.slice(split).map((stage, i) => rowData(stage, `${compact(fiche.sourceSections[split + i].title, 100)}\n${compact(fiche.sourceSections[split + i].blocks.map((b: any) => b.text ?? b.items?.join(" ") ?? b.label ?? "").join(" "), 260)}`)),
      ...(synthesis ? [rowData(synthesis, `${fiche.summary.slice(0, 2).map((item) => compact(item, 170)).join(" · ")}\n${listText(fiche.examTips, 1, 130)}`)] : []),
    ];

    let y = drawHeader(doc, fiche, "الجذاذة — بطاقة الدرس");
    y = drawProblem(doc, fiche, y);
    y = drawObjectives(doc, fiche, y);
    drawPlanTable(doc, pageOneRows, y, 804);
    drawFooter(doc, fiche, 1);

    doc.addPage({ size: "A4", margin: 0 });
    y = drawHeader(doc, fiche, "الجذاذة — بناء التعلمات");
    fillCell(doc, MARGIN, y, CONTENT_W, 18, COLORS.header);
    drawText(doc, "المقاطع الأساسية للدرس والأثر الكتابي", MARGIN, y, CONTENT_W, 18, { size: 7, bold: true, color: COLORS.headerText, align: "center" });
    y += 22;
    y = drawPlanTable(doc, pageTwoRows, y, 585);
    y += 7;
    drawSmallTables(doc, fiche, y);
    drawFooter(doc, fiche, 2);

    doc.addPage({ size: "A4", margin: 0 });
    y = drawHeader(doc, fiche, "الجذاذة — التقويم والدعم");
    const assessmentRows = assessment ? [rowData(assessment, `${listText(assessment.activities, 3, 135)}\n${listText(assessment.expected, 3, 115)}`)] : [];
    y = drawPlanTable(doc, assessmentRows, y, 300);
    y += 8;
    y = drawQuiz(doc, fiche, y, 565);
    y += 5;
    y = drawDocs(doc, fiche, y, 715);
    drawText(doc, "النسخة المطبوعة مختصرة لتناسب ثلاث صفحات كحد أقصى؛ التفاصيل الكاملة متاحة داخل الموقع.", MARGIN, 748, CONTENT_W, 22, { size: 5.6, color: COLORS.muted });
    drawFooter(doc, fiche, 3);
    doc.end();
  });
}

/* -------------------------- ZIP UTF-8 -------------------------- */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();
function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosDateTime(date = new Date()): { time: number; day: number } {
  const year = Math.max(1980, date.getFullYear());
  return { time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2), day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate() };
}
function zipFiles(files: { name: string; data: Buffer }[]): Buffer {
  const chunks: Buffer[] = [];
  const central: { name: Buffer; crc: number; packed: Buffer; raw: number; offset: number; method: number }[] = [];
  const { time, day } = dosDateTime(new Date());
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name.replace(/^\/+/, ""), "utf8");
    const packed = deflateRawSync(file.data, { level: 9 });
    const body = packed.length < file.data.length ? packed : file.data;
    const method = body === packed ? 8 : 0;
    const crc = crc32(file.data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(method, 8); head.writeUInt16LE(time, 10); head.writeUInt16LE(day, 12); head.writeUInt32LE(crc, 14); head.writeUInt32LE(body.length, 18); head.writeUInt32LE(file.data.length, 22); head.writeUInt16LE(name.length, 26); head.writeUInt16LE(0, 28);
    chunks.push(head, name, body);
    central.push({ name, crc, packed: body, raw: file.data.length, offset, method });
    offset += head.length + name.length + body.length;
  }
  const centralStart = offset;
  for (const item of central) {
    const h = Buffer.alloc(46);
    h.writeUInt32LE(0x02014b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(20, 6); h.writeUInt16LE(0x0800, 8); h.writeUInt16LE(item.method, 10); h.writeUInt16LE(time, 12); h.writeUInt16LE(day, 14); h.writeUInt32LE(item.crc, 16); h.writeUInt32LE(item.packed.length, 20); h.writeUInt32LE(item.raw, 24); h.writeUInt16LE(item.name.length, 28); h.writeUInt16LE(0, 30); h.writeUInt16LE(0, 32); h.writeUInt16LE(0, 34); h.writeUInt16LE(0, 36); h.writeUInt32LE(0, 38); h.writeUInt32LE(item.offset, 42);
    chunks.push(h, item.name);
    offset += h.length + item.name.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length, 8); end.writeUInt16LE(central.length, 10); end.writeUInt32LE(offset - centralStart, 12); end.writeUInt32LE(centralStart, 16); end.writeUInt16LE(0, 20);
  chunks.push(end);
  return Buffer.concat(chunks);
}

function pathPart(value: string): string {
  return String(value ?? "بدون_اسم").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_").replace(/_{2,}/g, "_").replace(/^_+|_+$/g, "") || "بدون_اسم";
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const catalog = getJadadatCatalog();
  const files: { name: string; data: Buffer }[] = [];
  const readme = [
    "أرشيف جذاذات الاجتماعيات بصيغة PDF",
    "إعداد وإنجاز: الأستاذ عماد طليل — ثانوية القدس، القنيطرة",
    "",
    `عدد الجذاذات: ${catalog.length}`,
    "كل ملف PDF حقيقي من ثلاث صفحات A4 كحد أقصى، بتصميم مستلهم من نموذج الجذاذة المرجعي.",
    "المضامين مبنية على الدروس المنشورة في قسم «الدروس»؛ المحتوى المشترك بين المسالك معلن داخل الجذاذة.",
    "",
    "المجلدات مرتبة حسب المستوى ثم المسلك ثم المادة.",
  ].join("\n");
  files.push({ name: "اقرأني.txt", data: Buffer.from(`\ufeff${readme}`, "utf8") });

  for (let i = 0; i < catalog.length; i++) {
    const entry = catalog[i];
    const fiche = getJadada(entry.key);
    if (!fiche) continue;
    const pdf = await renderPdf(fiche);
    const filename = jadadaFileName(fiche, "pdf");
    const name = `الجذاذات_PDF/${pathPart(fiche.levelLabel)}/${pathPart(fiche.branchLabel)}/${pathPart(fiche.subjectLabel)}/${filename}`;
    files.push({ name, data: pdf });
    if ((i + 1) % 20 === 0 || i + 1 === catalog.length) console.log(`✓ ${i + 1}/${catalog.length}`);
  }

  const zip = zipFiles(files);
  writeFileSync(OUT_ZIP, zip);
  console.log(`✓ ${OUT_ZIP}: ${files.length - 1} PDF + اقرأني.txt — ${(zip.length / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
