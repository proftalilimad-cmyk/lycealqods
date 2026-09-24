import { createRequire } from "node:module";
import { deflateRawSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getJadada, getJadadatCatalog, jadadaFileName, type JadadaFiche, type JadadaStage } from "../src/lib/jadadatLessons";

/*
   مُولِّد الأرشيف المطلوب: جذاذات PDF حقيقية، لا ملفات HTML باسم PDF.
   تُرسم كل صفحة أولًا بخط عربي كامل عبر Canvas ثم تُضمَّن كصورة عالية
   الدقة داخل PDF؛ لذلك تظهر العربية والأرقام والرموز بوضوح في Acrobat
   وChrome وEdge وباقي قارئات PDF، ولا تعتمد على خط القارئ الموجود في جهازه.

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
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas") as {
  createCanvas: (width: number, height: number) => any;
  GlobalFonts: { registerFromPath: (path: string, family: string) => boolean };
};

const fontRegular = require.resolve("dejavu-fonts-ttf/ttf/DejaVuSans.ttf");
const fontBold = require.resolve("dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf");
const FONT_FAMILY = "Jadada Sans";
const FONT_FAMILY_BOLD = "Jadada Sans Bold";
GlobalFonts.registerFromPath(fontRegular, FONT_FAMILY);
GlobalFonts.registerFromPath(fontBold, FONT_FAMILY_BOLD);

const OUT_DIR = "public/exports";
const OUT_ZIP = join(OUT_DIR, "jadadat-pdf.zip");
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const RENDER_SCALE = 2;

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

type CanvasPage = { canvas: any; ctx: any };
type TextOptions = {
  size?: number;
  bold?: boolean;
  color?: string;
  align?: "right" | "center" | "left";
  pad?: number;
  lineHeight?: number;
};

type CellOptions = {
  header?: boolean;
  phase?: boolean;
  product?: boolean;
  size?: number;
  bold?: boolean;
};

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

function newPage(): CanvasPage {
  const canvas = createCanvas(Math.ceil(PAGE_W * RENDER_SCALE), Math.ceil(PAGE_H * RENDER_SCALE));
  const ctx = canvas.getContext("2d");
  ctx.scale(RENDER_SCALE, RENDER_SCALE);
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.textBaseline = "top";
  ctx.direction = "rtl";
  return { canvas, ctx };
}

function setFont(ctx: any, size: number, bold = false): void {
  ctx.font = `${bold ? 700 : 400} ${size}px "${bold ? FONT_FAMILY_BOLD : FONT_FAMILY}"`;
}

function measure(ctx: any, text: string, size: number, bold = false): number {
  setFont(ctx, size, bold);
  return Number(ctx.measureText(String(text ?? "")).width ?? 0);
}

function wrapLine(ctx: any, text: string, width: number, size: number, bold = false): string[] {
  const value = String(text ?? "").trim();
  if (!value) return [""];
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measure(ctx, candidate, size, bold) <= width) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [value];
}

function wrappedLines(ctx: any, text: string, width: number, size: number, bold = false): string[] {
  return String(text ?? "")
    .split("\n")
    .flatMap((line) => wrapLine(ctx, line, width, size, bold));
}

function drawText(ctx: any, text: string, x: number, y: number, width: number, height: number, options: TextOptions = {}): void {
  const size = options.size ?? 7;
  const pad = options.pad ?? 3;
  const bold = options.bold ?? false;
  const align = options.align ?? "right";
  const lineHeight = options.lineHeight ?? size * 1.34;
  const innerWidth = Math.max(1, width - pad * 2);
  const maxLines = Math.max(1, Math.floor(Math.max(1, height - pad * 2) / lineHeight));
  let lines = wrappedLines(ctx, text, innerWidth, size, bold);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = `${last.replace(/…$/, "")}…`;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  setFont(ctx, size, bold);
  ctx.fillStyle = options.color ?? COLORS.ink;
  ctx.textBaseline = "top";
  ctx.direction = align === "left" ? "ltr" : "rtl";
  ctx.textAlign = align;
  const textX = align === "center" ? x + width / 2 : align === "left" ? x + pad : x + width - pad;
  let textY = y + pad;
  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += lineHeight;
  }
  ctx.restore();
}

function heightOf(ctx: any, text: string, width: number, size: number, bold = false): number {
  const lines = wrappedLines(ctx, text, Math.max(1, width - 6), size, bold);
  return lines.length * size * 1.34 + 8;
}

function fillCell(ctx: any, x: number, y: number, width: number, height: number, color: string, stroke = COLORS.line): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.45;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

function roundedFill(ctx: any, x: number, y: number, width: number, height: number, radius: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, radius);
  else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();
  ctx.restore();
}

function drawTableCell(ctx: any, text: string, x: number, y: number, width: number, height: number, options: CellOptions = {}): void {
  const background = options.header ? COLORS.header : options.phase ? COLORS.header : options.product ? COLORS.cream : COLORS.white;
  fillCell(ctx, x, y, width, height, background);
  drawText(ctx, text, x, y, width, height, {
    size: options.size ?? (options.header ? 7.1 : 6.25),
    bold: options.bold ?? options.header,
    color: options.header || options.phase ? COLORS.headerText : COLORS.ink,
    align: options.header ? "center" : "right",
  });
}

function drawMetaTable(ctx: any, x: number, y: number, width: number, rows: [string, string][]): void {
  const rowH = 20;
  const labelW = Math.min(58, width * 0.4);
  rows.forEach(([label, value], index) => {
    const yy = y + index * rowH;
    fillCell(ctx, x, yy, labelW, rowH, COLORS.header);
    drawText(ctx, label, x, yy, labelW, rowH, { size: 6.8, bold: true, color: COLORS.headerText, align: "center" });
    fillCell(ctx, x + labelW, yy, width - labelW, rowH, COLORS.white);
    drawText(ctx, value, x + labelW, yy, width - labelW, rowH, { size: 6.8, bold: true });
  });
}

function drawHeader(ctx: any, fiche: JadadaFiche, label: string): number {
  const top = 18;
  const boxH = 64;
  const leftW = 145;
  const rightW = 145;
  const centerW = CONTENT_W - leftW - rightW - 8;
  const leftX = MARGIN;
  const centerX = leftX + leftW + 4;
  const rightX = centerX + centerW + 4;

  drawMetaTable(ctx, leftX, top, leftW, [
    ["مدة الإنجاز", fiche.duration],
    ["الكتاب المعتمد", fiche.book],
    ["إعداد الأستاذ", fiche.teacher],
  ]);
  roundedFill(ctx, centerX, top, centerW, boxH, 12, COLORS.brown);
  drawText(ctx, fiche.title, centerX + 8, top + 10, centerW - 16, 31, { size: 13, bold: true, color: COLORS.white, align: "center", pad: 2 });
  drawText(ctx, `${fiche.authorLabel} — ${fiche.school}`, centerX + 8, top + 44, centerW - 16, 14, { size: 6.2, color: "#f7e7d5", align: "center", pad: 1 });
  roundedFill(ctx, centerX + centerW - 19, top - 10, 30, 30, 15, "#171411");
  drawText(ctx, String(fiche.lessonIndex + 1).padStart(2, "0"), centerX + centerW - 19, top - 10, 30, 30, { size: 8.5, bold: true, color: COLORS.white, align: "center", pad: 7 });
  drawMetaTable(ctx, rightX, top, rightW, [
    ["المادة", fiche.subjectLabel],
    ["المستوى", fiche.branchLabel],
    ["المجزوءة", String(fiche.unitIndex + 1).padStart(2, "0")],
  ]);

  fillCell(ctx, MARGIN, top + boxH + 5, CONTENT_W, 18, COLORS.header);
  drawText(ctx, label, MARGIN, top + boxH + 5, CONTENT_W, 18, { size: 7.4, bold: true, color: COLORS.headerText, align: "center", pad: 3 });
  return top + boxH + 27;
}

function drawProblem(ctx: any, fiche: JadadaFiche, y: number): number {
  const rowH = 29;
  const labelW = 145;
  const valueW = CONTENT_W - labelW;
  const rows: [string, string][] = [
    ["الكفاية / الإشكالية المركزية للمجزوءة", compact(fiche.unitKifaya, 330)],
    ["الإشكالية المحورية للدرس", compact(fiche.coreQuestion, 390)],
  ];
  rows.forEach(([label, value], index) => {
    const yy = y + index * rowH;
    fillCell(ctx, MARGIN, yy, labelW, rowH, COLORS.header);
    drawText(ctx, label, MARGIN, yy, labelW, rowH, { size: 6.8, bold: true, color: COLORS.headerText, align: "center" });
    fillCell(ctx, MARGIN + labelW, yy, valueW, rowH, COLORS.yellow);
    drawText(ctx, value, MARGIN + labelW, yy, valueW, rowH, { size: 6.8, bold: true });
  });
  return y + rowH * rows.length + 5;
}

function drawObjectives(ctx: any, fiche: JadadaFiche, y: number): number {
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
    fillCell(ctx, x, y, width, h, COLORS.white);
    fillCell(ctx, x, y, width, 18, COLORS.header);
    drawText(ctx, label, x, y, width, 18, { size: 7, bold: true, color: COLORS.headerText, align: "center" });
    drawText(ctx, value, x, y + 18, width, h - 18, { size: 6.2 });
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

function drawPlanTable(ctx: any, rows: string[][], y: number, maxBottom: number): number {
  const widths = [185, 89, 100, 105, 80];
  const headers = ["المنتوج / الأثر المنتظر", "الدعامات الديداكتيكية", "التدبير الديداكتيكي", "أهداف التعلم المرتبطة بالنشاط", "مراحل إنجاز الدرس"];
  const headerH = 24;
  let x = MARGIN;
  headers.forEach((header, i) => {
    drawTableCell(ctx, header, x, y, widths[i], headerH, { header: true });
    x += widths[i];
  });
  y += headerH;
  for (const row of rows) {
    const estimates = row.map((text, i) => heightOf(ctx, text, widths[i], i === 4 ? 6.35 : 6.15, i === 4));
    const rowH = Math.min(82, Math.max(45, Math.max(...estimates)));
    if (y + rowH > maxBottom) break;
    x = MARGIN;
    row.forEach((text, i) => {
      drawTableCell(ctx, text, x, y, widths[i], rowH, { phase: i === 4, product: i === 0, size: i === 4 ? 6.25 : 6.05, bold: i === 4 });
      if (i === 4) {
        fillCell(ctx, x, y + rowH - 12, widths[i], 12, COLORS.orange);
        drawText(ctx, text.split("\n").at(-1) ?? "", x, y + rowH - 12, widths[i], 12, { size: 6, bold: true, color: COLORS.white, align: "center", pad: 1 });
      }
      x += widths[i];
    });
    y += rowH;
  }
  return y;
}

function drawSmallTables(ctx: any, fiche: JadadaFiche, y: number): number {
  const gap = 4;
  const w = (CONTENT_W - gap) / 2;
  const h = 142;
  const x1 = MARGIN;
  const x2 = MARGIN + w + gap;
  drawTableCell(ctx, "المفاهيم الأساس", x1, y, w, 18, { header: true, size: 7.1 });
  drawTableCell(ctx, "الكرونولوجيا والمجالات", x2, y, w, 18, { header: true, size: 7.1 });
  let yy1 = y + 18;
  for (const item of fiche.concepts.slice(0, 10)) {
    const rh = 11;
    drawTableCell(ctx, item.term, x1, yy1, w * 0.32, rh, { phase: true, size: 5.8 });
    drawTableCell(ctx, compact(item.def, 100), x1 + w * 0.32, yy1, w * 0.68, rh, { size: 5.7 });
    yy1 += rh;
  }
  let yy2 = y + 18;
  for (const item of fiche.timeline.slice(0, 10)) {
    const rh = 11;
    drawTableCell(ctx, item.date, x2, yy2, w * 0.28, rh, { phase: true, size: 5.8 });
    drawTableCell(ctx, compact(item.event, 110), x2 + w * 0.28, yy2, w * 0.72, rh, { size: 5.7 });
    yy2 += rh;
  }
  return y + h;
}

function drawQuiz(ctx: any, fiche: JadadaFiche, y: number, maxBottom: number): number {
  fillCell(ctx, MARGIN, y, CONTENT_W, 18, COLORS.header);
  drawText(ctx, "التقويم الإجمالي وأسئلة الدعم", MARGIN, y, CONTENT_W, 18, { size: 7.4, bold: true, color: COLORS.headerText, align: "center" });
  y += 20;
  for (const [index, q] of fiche.quiz.slice(0, 10).entries()) {
    const text = `${index + 1}) ${compact(q.q, 190)}\nالجواب: ${compact(q.options[q.answer] ?? "", 145)}${q.why ? ` — ${compact(q.why, 105)}` : ""}`;
    const rh = Math.min(38, Math.max(22, heightOf(ctx, text, CONTENT_W - 28, 5.95)));
    if (y + rh > maxBottom) break;
    fillCell(ctx, MARGIN, y, 25, rh, COLORS.yellow);
    drawText(ctx, String(index + 1), MARGIN, y, 25, rh, { size: 7.2, bold: true, color: COLORS.brown, align: "center" });
    drawTableCell(ctx, text, MARGIN + 25, y, CONTENT_W - 25, rh, { size: 5.9 });
    y += rh;
  }
  return y;
}

function drawDocs(ctx: any, fiche: JadadaFiche, y: number, maxBottom: number): number {
  if (!fiche.docs.length) return y;
  fillCell(ctx, MARGIN, y, CONTENT_W, 18, COLORS.header);
  drawText(ctx, "الوثائق والدعامات وأسئلة الاشتغال", MARGIN, y, CONTENT_W, 18, { size: 7.4, bold: true, color: COLORS.headerText, align: "center" });
  y += 21;
  const gap = 4;
  const w = (CONTENT_W - gap * 2) / 3;
  for (const [index, docItem] of fiche.docs.slice(0, 3).entries()) {
    const x = MARGIN + index * (w + gap);
    const text = `${docItem.label}\n${compact(docItem.text, 150)}\n${docItem.questions.slice(0, 1).map((q) => `س: ${compact(q.q, 75)}\nج: ${compact(q.answer, 95)}`).join("\n")}`;
    const rh = Math.min(100, Math.max(58, heightOf(ctx, text, w - 8, 5.7)));
    if (y + rh > maxBottom) return y;
    drawTableCell(ctx, text, x, y, w, rh, { product: true, size: 5.7 });
  }
  return y + 102;
}

function drawFooter(ctx: any, fiche: JadadaFiche, page: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN, 815);
  ctx.lineTo(PAGE_W - MARGIN, 815);
  ctx.stroke();
  ctx.restore();
  drawText(ctx, `${fiche.sign} — الجذاذة مبنية على الدرس المنشور`, MARGIN, 818, CONTENT_W - 45, 14, { size: 6.1, color: COLORS.muted });
  drawText(ctx, `${page} / 3`, PAGE_W - MARGIN - 40, 818, 40, 14, { size: 6.1, color: COLORS.muted, align: "left" });
}

function buildPages(fiche: JadadaFiche): CanvasPage[] {
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

  const pages: CanvasPage[] = [];

  let page = newPage();
  let y = drawHeader(page.ctx, fiche, "الجذاذة — بطاقة الدرس");
  y = drawProblem(page.ctx, fiche, y);
  y = drawObjectives(page.ctx, fiche, y);
  drawPlanTable(page.ctx, pageOneRows, y, 804);
  drawFooter(page.ctx, fiche, 1);
  pages.push(page);

  page = newPage();
  y = drawHeader(page.ctx, fiche, "الجذاذة — بناء التعلمات");
  fillCell(page.ctx, MARGIN, y, CONTENT_W, 18, COLORS.header);
  drawText(page.ctx, "المقاطع الأساسية للدرس والأثر الكتابي", MARGIN, y, CONTENT_W, 18, { size: 7.4, bold: true, color: COLORS.headerText, align: "center" });
  y += 22;
  y = drawPlanTable(page.ctx, pageTwoRows, y, 585);
  y += 7;
  drawSmallTables(page.ctx, fiche, y);
  drawFooter(page.ctx, fiche, 2);
  pages.push(page);

  page = newPage();
  y = drawHeader(page.ctx, fiche, "الجذاذة — التقويم والدعم");
  const assessmentRows = assessment ? [rowData(assessment, `${listText(assessment.activities, 3, 135)}\n${listText(assessment.expected, 3, 115)}`)] : [];
  y = drawPlanTable(page.ctx, assessmentRows, y, 300);
  y += 8;
  y = drawQuiz(page.ctx, fiche, y, 565);
  y += 5;
  y = drawDocs(page.ctx, fiche, y, 715);
  drawText(page.ctx, "النسخة المطبوعة مختصرة لتناسب ثلاث صفحات كحد أقصى؛ التفاصيل الكاملة متاحة داخل الموقع.", MARGIN, 748, CONTENT_W, 22, { size: 6.1, color: COLORS.muted });
  drawFooter(page.ctx, fiche, 3);
  pages.push(page);

  return pages;
}

async function renderPdf(fiche: JadadaFiche): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true, info: { Title: `جذاذة: ${fiche.title}`, Author: fiche.teacher, Subject: fiche.subjectLabel } });
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    for (const [index, page] of buildPages(fiche).entries()) {
      if (index > 0) doc.addPage({ size: "A4", margin: 0 });
      doc.image(page.canvas.toBuffer("image/png"), 0, 0, { width: PAGE_W, height: PAGE_H });
    }
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
  writeFileSync(OUT_ZIP, zipFiles(files));
  console.log(`✓ ${OUT_ZIP}: ${catalog.length} PDF + اقرأني.txt — ${(require("node:fs").statSync(OUT_ZIP).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
