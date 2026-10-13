/* ============================================================
   كاتب ملفات Excel (.xlsx) — تنفيذ ذاتي صغير (بلا مكتبة خارجية)
   ------------------------------------------------------------
   ملف xlsx هو في الحقيقة أرشيف ZIP يحتوي أجزاء XML، لذلك نبنيه
   فوق كاتب الأرشيف في ./zip وننتج ملفًا حقيقيًا يفتحه Excel و
   LibreOffice وGoogle Sheets (وليس CSV مموّهًا).

   مميزات موجّهة للاستعمال التربوي:
   • اتجاه الأوراق من اليمين إلى اليسار (rightToLeft) لأن المعطيات عربية.
   • تجميد صف العناوين + مرشّح تلقائي (AutoFilter).
   • نصوص عربية كاملة داخل الخلايا (inline strings) بلا ملف ترميز إضافي.
   • أنماط جاهزة: عنوان، ترويسة، خلية نصية، خلية رقمية.
   ============================================================ */
import { createZip, zipText, type ZipEntry } from "./zip";

export type Cell = string | number | null | undefined;

export interface Sheet {
  /** اسم الورقة (≤31 حرفًا، بلا رموز : \ / ? * [ ]) */
  name: string;
  /** الصفوف؛ الصف الأول يُعتبر ترويسة (نمط غامق) */
  rows: Cell[][];
  /** عرض الأعمدة بحرف تقريبي (اختياري) */
  widths?: number[];
  /** صفوف عنوان كبيرة قبل الترويسة (تُدمج في أعلى الورقة) */
  title?: string;
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** تهريب نص للاستعمال داخل XML + حذف محارف التحكم الممنوعة */
export function xmlText(s: string): string {
  return s
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

/** A, B, … Z, AA, AB … */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** اسم ورقة صالح لـ Excel */
export function sheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "ورقة";
}

const CONTENT_TYPES = (count: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${Array.from({ length: count }, (_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
<font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF0C7C5B"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0C7C5B"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const workbookXml = (sheets: Sheet[]) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets>
${sheets.map((s, i) => `<sheet name="${xmlText(sheetName(s.name))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("\n")}
</sheets>
</workbook>`;

const workbookRels = (sheets: Sheet[]) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

function sheetXml(sheet: Sheet): string {
  const rows: Cell[][] = [];
  let titleRow = 0;
  if (sheet.title) {
    rows.push([sheet.title]);
    titleRow = 1;
  }
  rows.push(...sheet.rows);

  const cols = Math.max(1, ...rows.map((r) => r.length));
  const widths = sheet.widths ?? [];
  const colsXml =
    widths.length > 0
      ? `<cols>${widths
          .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(6, Math.min(80, w))}" customWidth="1"/>`)
          .join("")}</cols>`
      : "";

  const body = rows
    .map((row, ri) => {
      const cells = row
        .map((cell, ci) => {
          if (cell === null || cell === undefined || cell === "") return "";
          const ref = `${columnLetter(ci)}${ri + 1}`;
          if (typeof cell === "number") {
            return `<c r="${ref}" s="3"><v>${cell}</v></c>`;
          }
          const style = ri === 0 && sheet.title ? 4 : ri === titleRow ? 1 : 2;
          return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlText(String(cell))}</t></is></c>`;
        })
        .join("");
      const ht = ri === 0 && sheet.title ? ' ht="24" customHeight="1"' : "";
      return `<row r="${ri + 1}"${ht}>${cells}</row>`;
    })
    .join("");

  const headerRow = titleRow + 1;
  const lastRow = rows.length;
  const filter = lastRow > headerRow ? `<autoFilter ref="A${headerRow}:${columnLetter(cols - 1)}${lastRow}"/>` : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
${colsXml}
<sheetData>${body}</sheetData>
${filter}
</worksheet>`;
}

/** بناء ملف xlsx حقيقي من ورقة أو أكثر */
export async function buildXlsx(sheets: Sheet[]): Promise<Uint8Array> {
  if (sheets.length === 0) throw new Error("لا توجد ورقة لتصديرها");
  const entries: ZipEntry[] = [
    { path: "[Content_Types].xml", data: zipText(CONTENT_TYPES(sheets.length)) },
    { path: "_rels/.rels", data: zipText(ROOT_RELS) },
    { path: "xl/workbook.xml", data: zipText(workbookXml(sheets)) },
    { path: "xl/_rels/workbook.xml.rels", data: zipText(workbookRels(sheets)) },
    { path: "xl/styles.xml", data: zipText(STYLES) },
    ...sheets.map((s, i) => ({ path: `xl/worksheets/sheet${i + 1}.xml`, data: zipText(sheetXml(s)) })),
  ];
  return createZip(entries);
}
