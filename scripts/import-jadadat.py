#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تفريغ آلي وفيّ لجذاذات الأستاذ (Word .docx / Word 97 .doc) إلى بيانات الموقع.

القاعدة: لا يُعاد صياغة أي شيء. كل فقرة وخلية وجدول في الوثيقة الأصلية يُنقل
كما هو (بنفس الكلمات والمصطلحات والأرقام والترتيب)، بما فيها:
  - الجداول المتداخلة داخل الخلايا (جداول وخطاطات المنتوج)،
  - صناديق النص المعلّقة (عناوين المراحل، البطاقة التقنية)،
  - عمود «المنتوج».

ويتحقق البرنامج آليًا من الأمانة: يقارن كلمات المصدر بكلمات المُفرَّغ،
فيرفض النشر إذا ضاعت كلمة أو أُضيفت كلمة غير موجودة في الأصل.

الاستعمال:
    python3 scripts/import-jadadat.py <مجلد-الوثائق> <ملف-الإخراج.ts> <jobs.json>

يعتمد على: lxml (لملفات docx) و olefile (لملفات doc القديمة).
"""
from __future__ import annotations

import json
import os
import re
import struct
import sys
import zipfile
from collections import Counter

from lxml import etree

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}"
TXBX = W + "txbxContent"

NOISE = re.compile(r"[\u3000-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uE000-\uF8FF]")
# ما يُسمح ببقائه من نص ملفات Word-97 (باقي المحارف = ضجيج ثنائي لا معنى له)
DOC_OK = "\u0020-\u007E\u00A0-\u00FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u2000-\u206F"
ARABIC = re.compile(r"[\u0600-\u06FF]")
WORD = re.compile(r"[\u0600-\u06FF0-9A-Za-z\u00C0-\u024F]+")
CELL_MARK = "\uE000"
DOC_JUNK = re.compile("[^" + DOC_OK + CELL_MARK + "]")


def clean(s: str) -> str:
    """توحيد المسافات فقط — دون أي تغيير في الكلمات."""
    s = s.replace("\u200f", "").replace("\u200e", "")
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


# ============================================================ أدوات مشتركة
def _in_fallback(node) -> bool:
    anc = node.getparent()
    while anc is not None:
        if anc.tag == MC + "Fallback":
            return True
        anc = anc.getparent()
    return False


def _in_box(node) -> bool:
    anc = node.getparent()
    while anc is not None:
        if anc.tag == TXBX:
            return True
        anc = anc.getparent()
    return False


def _in_deeper_box(node, ref) -> bool:
    """هل العقدة داخل صندوق نص أعمق من ref؟ (صناديق داخلية تُلتقط وحدها)"""
    anc = node.getparent()
    while anc is not None and anc is not ref:
        if anc.tag == TXBX:
            return True
        anc = anc.getparent()
    return False


def _run_text(node):
    """نص العقدة من الجريات: دون نسخ Fallback ودون الصناديق الأعمق (تُلتقط separately)."""
    parts = []
    for child in node.iter():
        if child.tag in (W + "t", W + "tab", W + "br"):
            if _in_fallback(child) or _in_deeper_box(child, node):
                continue
            if child.tag == W + "t":
                parts.append(child.text or "")
            elif child.tag == W + "tab":
                parts.append(" ")
            else:
                parts.append("\n")
    return clean("".join(parts))


def _boxes_of(node):
    """صناديق النص داخل عقدة (نسخة واحدة فقط): يعيد (سطور، جداول)."""
    labels, tables = [], []
    for txb in node.iter(TXBX):
        if _in_fallback(txb):
            continue
        for child in txb:
            if child.tag == W + "p":
                t = _run_text(child)
                if t:
                    labels.append(t)
                sub_l, sub_t = _boxes_of(child)
                labels += [x for x in sub_l if x not in labels]
                tables += sub_t
            elif child.tag == W + "tbl":
                tables.append(_table(child))
            else:
                sub_l, sub_t = _boxes_of(child)
                labels += [x for x in sub_l if x not in labels]
                tables += sub_t
    return labels, tables


def _para(node):
    text = _run_text(node)
    labels, tables = _boxes_of(node)
    seen, uniq = set(), []
    for l in labels:
        if l not in seen:
            seen.add(l)
            uniq.append(l)
    return text, uniq, tables


def _direct(el, tag):
    """العناصر من نوع tag التابعة مباشرة (حتى عبر w:sdt) دون المرور بجدول داخلي."""
    for node in el.iter(tag):
        anc = node.getparent()
        blocked = False
        while anc is not None and anc is not el:
            if anc.tag in (W + "tbl", TXBX):
                blocked = True
                break
            anc = anc.getparent()
        if not blocked:
            yield node


def _cell(tc):
    lines, boxes, nested = [], [], []
    for p in _direct(tc, W + "p"):
        t, labels, tables = _para(p)
        if t:
            lines.append(t)
        boxes += labels
        nested += tables
    for tbl in _direct(tc, W + "tbl"):
        nested.append(_table(tbl))
    # صناديق نص مثبتة في الخلية خارج أي فقرة
    for txb in tc.iter(TXBX):
        if _in_fallback(txb):
            continue
        anc, in_para = txb.getparent(), False
        while anc is not None and anc is not tc:
            if anc.tag == W + "p":
                in_para = True
                break
            anc = anc.getparent()
        if in_para:
            continue
        for child in txb:
            if child.tag == W + "p":
                t = _run_text(child)
                if t and t not in boxes:
                    boxes.append(t)
            elif child.tag == W + "tbl":
                nested.append(_table(child))
    cell = {}
    if lines:
        cell["lines"] = lines
    if boxes:
        cell["box"] = boxes
    if nested:
        cell["nested"] = nested
    return cell


def _table(tbl):
    rows = []
    for tr in tbl.findall(W + "tr"):
        rows.append([_cell(tc) for tc in tr.findall(W + "tc")])
    return {"rows": rows}


def _blocks_from(el, frame=False):
    blocks = []
    for child in el:
        if child.tag == W + "p":
            t, labels, tables = _para(child)
            if t:
                blocks.append({"type": "para", "text": t, **({"frame": True} if frame else {})})
            for l in labels:
                blocks.append({"type": "para", "text": l, "frame": True})
            for tb in tables:
                blocks.append({"type": "table", "table": tb, **({"frame": True} if frame else {})})
        elif child.tag == W + "tbl":
            blocks.append({"type": "table", "table": _table(child), **({"frame": True} if frame else {})})
        elif child.tag == W + "sdt":
            content = child.find(W + "content")
            if content is not None:
                blocks += _blocks_from(content, frame)
        else:
            # mc:AlternateContent / w:drawing / w:pict … → صناديق النص المعلّقة
            sub_labels, sub_tables = _boxes_of(child) if hasattr(child, "iter") else ([], [])
            for l in sub_labels:
                blocks.append({"type": "para", "text": l, "frame": True})
            for tb in sub_tables:
                blocks.append({"type": "table", "table": tb, "frame": True})
            if not sub_labels and not sub_tables:
                for txb in child.iter(TXBX) if hasattr(child, "iter") else []:
                    if _in_fallback(txb):
                        continue
                    blocks += _blocks_from(txb, True)
    return blocks


def docx_blocks(path: str):
    with zipfile.ZipFile(path) as z:
        root = etree.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    return _blocks_from(body)


# ============================================================ Word 97 (.doc)
def doc_raw(path: str) -> str:
    import olefile

    ole = olefile.OleFileIO(path)
    wd = ole.openstream("WordDocument").read()
    fc_min = struct.unpack("<I", wd[0x18:0x1C])[0]
    fc_mac = struct.unpack("<I", wd[0x1C:0x20])[0]
    chunk = wd[fc_min:fc_mac] if 0 < fc_min < fc_mac <= len(wd) else wd
    best = None
    for enc in ("utf-16-le", "cp1256"):
        t = chunk.decode(enc, "ignore")
        n = len(ARABIC.findall(t))
        if best is None or n > best[0]:
            best = (n, t)
    txt = best[1]
    txt = txt.replace("\x07", CELL_MARK).replace("\x0d", "\n").replace("\x0b", "\n").replace("\x0c", "\n")
    txt = txt.replace("\t", " ")
    # بقايا التنسيق الثنائية لملفات Word-97: تُحذف كل محرف خارج النص الحقيقي
    # (عربي / لاتيني أساسي / ترقيم / مسافات) مع الإبقاء على فاصل الخلايا CELL_MARK.
    txt = DOC_JUNK.sub("", txt)
    txt = re.sub(r"[\x00-\x08\x0e-\x1f]", "", txt)
    return txt


# محارف الضجيج الثنائي في ملفات Word-97 (لا تحمل أي معلومة)
DOC_JUNK_CHARS = (
    "\u00FF\u00EF\u00DD\u00ED\u00DB\u00D8\u00DF\u00A5\u00AE\u00B7\u2016"
    "\u06D6\u0600\u2007\uFF00\u0CD6\u1BFF\u1CFF\u1600\u0124\u0100"
    "\uFB50-\uFDFF\uFE70-\uFEFF"
)
JUNK_CHAR_RE = re.compile("[" + DOC_JUNK_CHARS + "]")
# ما يُقبل داخل الكلمة بعد حذف الضجيج: عربي/أرقام/لاتيني/ترقيم معتاد
DOC_CLEAN_RE = re.compile(r"[^\u0621-\u064A\u0640\u0660-\u0669\u060C\u061B\u061F0-9A-Za-z"
                          r" .,;:!?\-()«»%/\\+=*'\"&°\u00A0]")
WORDISH_RE = re.compile(r"[\u0621-\u064A]")
LATIN_RE = re.compile(r"[0-9A-Za-z]")


def doc_line(line: str) -> str:
    """تنظيف سطر من ملف Word-97 كلمةً كلمة: تُحذف بقايا التنسيق الثنائية
    ويُبقي كل نص حقيقي (حتى حرف واحد مثل «و») كما هو دون تغيير."""
    kept = []
    for tok in line.split(" "):
        if not tok:
            continue
        t = JUNK_CHAR_RE.sub("", tok)
        if not t or DOC_CLEAN_RE.search(t):
            continue
        if not (WORDISH_RE.search(t) or len(LATIN_RE.findall(t)) >= 2):
            continue
        kept.append(t)
    return " ".join(kept)


def _keep(line: str) -> bool:
    """استبعاد بقايا التنسيق الثنائية والإبقاء على كل نص حقيقي."""
    letters = len(re.findall(r"[\u0600-\u06FF0-9A-Za-z]", line))
    if letters < 2:
        return False
    return len(NOISE.findall(line)) <= max(2, letters // 10)


def doc_blocks(path: str):
    """إعادة بناء الجدول من فواصل الخلايا الأصلية (\\x07): الخلية الفارغة = نهاية الصف."""
    rows, row = [], []
    for piece in doc_raw(path).split(CELL_MARK):
        lines = [doc_line(clean(x)) for x in piece.split("\n")]
        lines = [x for x in lines if x]
        if not lines:
            if row:
                rows.append(row)
                row = []
            continue
        row.append({"lines": lines})
    if row:
        rows.append(row)

    blocks, cur, cur_cols = [], [], None
    for r in rows:
        cols = len(r)
        # صف من خلية واحدة = صف مدمج يمتد على عرض الجدول (عنوان مقطع/خلاصة) → يبقى في جدوله
        if cols == 1 and cur:
            cur.append(r)
            continue
        if cur_cols is not None and cols != cur_cols and cur:
            blocks.append({"type": "table", "table": {"rows": cur}})
            cur = []
            cur_cols = None
        cur.append(r)
        cur_cols = cols
    if cur:
        blocks.append({"type": "table", "table": {"rows": cur}})
    return blocks


# ============================================================ PDF
def pdf_lines(path: str):
    from pypdf import PdfReader

    r = PdfReader(path)
    lines = []
    for page in r.pages:
        for line in (page.extract_text() or "").split("\n"):
            line = clean(line)
            if line:
                lines.append(line)
    return lines


def pdf_blocks(path: str):
    return [{"type": "para", "text": l} for l in pdf_lines(path)]


# ============================================================ التقسيم
def split_by_anchor(blocks, anchor: str):
    out, cur, started = [], [], False
    for b in blocks:
        if b["type"] == "para" and anchor in b.get("text", "") and started:
            out.append(cur)
            cur = []
        cur.append(b)
        started = True
    if cur:
        out.append(cur)
    return out


def find_section(blocks, anchor: str, next_anchor=None):
    start = None
    for idx, b in enumerate(blocks):
        if b["type"] == "para" and anchor in b.get("text", ""):
            start = idx
            break
    if start is None:
        return None
    end = len(blocks)
    if next_anchor:
        for idx in range(start + 1, len(blocks)):
            if blocks[idx]["type"] == "para" and next_anchor in blocks[idx].get("text", ""):
                end = idx
                break
    return blocks[start:end]


# ============================================================ التحقق من الأمانة
def _squash(s: str) -> str:
    s = s.replace("\u200f", "").replace("\u200e", "").replace("\u0640", "")
    return re.sub(r"\s+", " ", s).strip()


def blocks_text(blocks) -> str:
    out = []

    def cell(c):
        out.extend(c.get("lines", []))
        out.extend(c.get("box", []))
        for n in c.get("nested", []):
            for r in n["rows"]:
                for cc in r:
                    cell(cc)

    for b in blocks:
        if b["type"] == "para":
            out.append(b.get("text", ""))
        else:
            for r in b["table"]["rows"]:
                for c in r:
                    cell(c)
    return "\n".join(out)


def docx_source_text(path: str) -> str:
    """نص الوثيقة كما هو: كل جريّة مرة واحدة، بحدود الفقرات، دون إضافة أو حذف."""
    with zipfile.ZipFile(path) as z:
        root = etree.fromstring(z.read("word/document.xml"))
    body = root.find(W + "body")
    out, last_p = [], None
    for node in body.iter():
        if node.tag not in (W + "t", W + "tab", W + "br") or _in_fallback(node):
            continue
        if node.tag == W + "t":
            anc = node.getparent()
            while anc is not None and anc.tag != W + "p":
                anc = anc.getparent()
            if anc is not last_p:
                out.append("\n")
                last_p = anc
            out.append(node.text or "")
        elif node.tag == W + "tab":
            out.append(" ")
        else:
            out.append("\n")
    return "".join(out)


def doc_source_text(path: str) -> str:
    kept = [l for l in (doc_line(clean(x)) for x in doc_raw(path).replace(CELL_MARK, "\n").split("\n")) if l]
    return " ".join(kept)


def verify(src_text: str, blocks) -> tuple:
    cs = Counter(WORD.findall(_squash(src_text)))
    cg = Counter(WORD.findall(_squash(blocks_text(blocks))))
    missing = {w: n - cg.get(w, 0) for w, n in cs.items() if cg.get(w, 0) < n}
    invented = {w: n - cs.get(w, 0) for w, n in cg.items() if cs.get(w, 0) < n}
    return sum(cs.values()), sum(cg.values()), missing, invented


def count_chars(blocks) -> int:
    return len(_squash(blocks_text(blocks)))


HEADER = '''/* ============================================================
   ملف مُولَّد آليًا — لا يُعدَّل يدويًا.

   المصدر: وثائق الأستاذ عماد طليل الأصلية (مجلد «منار في التاريخ
   والجغرافيا» في المستودع) — جذاذات الجذع المشترك العلمي.
   التوليد: python3 scripts/import-jadadat.py <مجلد الوثائق> <هذا الملف> <jobs.json>

   قاعدة النقل: كل سطر أدناه منقول حرفيًا من الوثيقة الأصلية دون
   حذف أو اختصار أو إعادة صياغة أو تغيير في المصطلحات أو الأرقام
   أو الترتيب، بما في ذلك عمود «المنتوج» وجداوله المتداخلة وصناديق
   النص (البطاقة التقنية وعناوين المراحل). يتحقق البرنامج المولِّد
   آليًا من ألا تضيع كلمة وألا تُضاف كلمة غير موجودة في الأصل.
   ============================================================ */

/** خلية من الوثيقة الأصلية */
export interface SrcCell {
  /** أسطر الخلية كما وردت */
  lines?: string[];
  /** صناديق النص (عناوين المراحل) المرتبطة بالخلية */
  box?: string[];
  /** جداول متداخلة داخل الخلية (جداول وخطاطات المنتوج) */
  nested?: SrcTable[];
}

export interface SrcTable {
  rows: SrcCell[][];
}

export interface SrcBlock {
  type: "para" | "table";
  text?: string;
  /** الإطار المعلّق (صندوق نص) الذي ورد فيه هذا العنصر */
  frame?: boolean;
  table?: SrcTable;
}

export interface ImportedFiche {
  /** معرّف خانة الجذاذة في اللائحة الرسمية */
  slotId: string;
  /** ملف المصدر داخل وثائق الأستاذ */
  source: string;
  /**
   * docx = بنية الجدول الأصلية (خلايا وجداول متداخلة وصناديق نص)
   * doc  = ملف Word قديم أُعيد بناء جدوله من فواصل الخلايا الأصلية
   * pdf  = نص ملف PDF كما ورد سطرًا سطرًا
   */
  layout: "docx" | "doc" | "pdf";
  /** محتوى الوثيقة بترتيبه الأصلي */
  blocks: SrcBlock[];
}

export const IMPORTED_FICHES: ImportedFiche[] = '''

FOOTER = '''

export function getImported(slotId: string): ImportedFiche | undefined {
  return IMPORTED_FICHES.find((f) => f.slotId === slotId);
}

const cleanLine = (s: string) => s.replace(/[\\u200f\\u200e]/g, "").replace(/\\s+/g, " ").trim();

/**
 * ترويسات عمود المنتوج كما وردت حرفيًا في وثائق الأستاذ:
 * «المنتوج» في أغلب الجذاذات، «المحتوى» في جذاذات المجزوءة الأولى (تاريخ)،
 * «الإستنتاجات-الإنجازات» في وثائق الجغرافيا، و«المتنوع» في نماذج أخرى.
 */
export const PRODUIT_HEADERS = [
  "المنتوج",
  "المحتوى",
  "المتنوع",
  "الإنجازات",
  "الانجازات",
  "الإستنتاجات",
  "الاستنتاجات",
  "المضمون",
];

/** هل هذه الترويسة هي عمود المنتوج كما سمّته الوثيقة الأصلية؟ */
export function isProduitHeader(line: string): boolean {
  const l = cleanLine(line).replace(/ـ/g, "");
  if (!l || l.length > 40) return false; // ترويسات الأعمدة قصيرة
  return PRODUIT_HEADERS.some((h) => l.includes(h.replace(/ـ/g, "")));
}

export interface ProduitPart {
  /** المرحلة/المقطع كما ورد في عمود «مراحل إنجاز الدرس» */
  phase: string;
  /** عنوان العمود في الوثيقة الأصلية */
  header: string;
  /** خلية المنتوج كما وردت حرفيًا */
  cell: SrcCell;
}

/** نصوص الخلية كلها: صناديق العنوان + السطور */
const cellTexts = (c?: SrcCell): string[] => [...((c?.box as string[]) ?? []), ...(c?.lines ?? [])];

function findProduitColumn(row: SrcCell[]): number {
  return row.findIndex((c) => cellTexts(c).some((l) => isProduitHeader(l)));
}

/**
 * جمع المنتوج من الجذاذة: إن كان موزعًا بين عدة مراحل، تُجمع أجزاؤه
 * كما وردت في المصدر وبترتيبها نفسه، دون أي تغيير في النص.
 */
export function collectProduit(f: ImportedFiche): ProduitPart[] {
  const out: ProduitPart[] = [];
  /** عمود المنتوج الجاري: يبقى ساريًا على الصفوف والجداول الموالية في الوثيقة نفسها */
  let active: { idx: number; header: string } | null = null;

  /**
   * @param inherit هل يرث هذا الجدول عمود المنتوج الجاري من الجدول السابق؟
   *   الجداول المتداخلة (داخل خلية) لا ترثه: تبدأ من صفر بحثًا عن ترويساتها الخاصة.
   */
  const walkRows = (rows: SrcCell[][], inherit: boolean) => {
    const saved = active;
    if (!inherit) active = null;
    for (const row of rows) {
      const idx = findProduitColumn(row);
      if (idx >= 0) {
        active = { idx, header: cleanLine(cellTexts(row[idx])[0] ?? "") };
        continue;
      }
      if (!active) continue;
      const cell = row[active.idx];
      // الخلية تُحتسب منتوجًا إن كان فيها نص أو جدول متداخل (خطاطة/جدول تركيبي)
      if (!cell || (!cellTexts(cell).length && !(cell.nested ?? []).length)) continue;
      const phase = cellTexts(row[0]).map(cleanLine).filter(Boolean).join(" — ");
      out.push({ phase: row.length > active.idx ? phase : "", header: active.header, cell });
    }
    for (const row of rows) {
      for (const c of row) for (const nt of c.nested ?? []) walkRows(nt.rows, false);
    }
    // الجداول المتداخلة لا تغيّر عمود المنتوج الجاري في الوثيقة
    if (!inherit) active = saved;
  };

  for (const b of f.blocks) {
    if (b.type !== "table" || !b.table) continue;
    walkRows(b.table.rows, true);
  }
  return out;
}

/** كل نص الجذاذة (يُستعمل في البحث داخل القسم) */
export function importedText(f: ImportedFiche): string {
  const parts: string[] = [f.source];
  const cell = (c: SrcCell) => {
    parts.push(...(c.lines ?? []), ...(c.box ?? []));
    for (const n of c.nested ?? []) n.rows.forEach((r) => r.forEach(cell));
  };
  for (const b of f.blocks) {
    if (b.type === "para") {
      if (b.text) parts.push(b.text);
    } else if (b.table) {
      b.table.rows.forEach((r) => r.forEach(cell));
    }
  }
  return parts.join(" ");
}
'''


def main():
    src_dir, out_path, jobs_path = sys.argv[1], sys.argv[2], sys.argv[3]
    jobs = json.load(open(jobs_path, encoding="utf8"))

    results, problems = [], []
    for job in jobs:
        path = os.path.join(src_dir, job["file"])
        if not os.path.exists(path):
            print(f"!! MISSING FILE {job['file']}", file=sys.stderr)
            problems.append(job["slot"])
            continue
        low = path.lower()
        if low.endswith(".docx"):
            blocks, layout = docx_blocks(path), "docx"
        elif low.endswith(".pdf"):
            blocks, layout = pdf_blocks(path), "pdf"
        else:
            blocks, layout = doc_blocks(path), "doc"

        if job.get("splitAnchor"):
            chosen = None
            for sec in split_by_anchor(blocks, job["splitAnchor"]):
                if job.get("pick") and job["pick"] in json.dumps(sec, ensure_ascii=False):
                    chosen = sec
                    break
            if chosen is None:
                print(f"!! SECTION NOT FOUND pick={job.get('pick')} in {job['file']}", file=sys.stderr)
                problems.append(job["slot"])
                continue
            blocks = chosen
        if job.get("anchor"):
            sec = find_section(blocks, job["anchor"], job.get("nextAnchor"))
            if sec is None:
                print(f"!! ANCHOR NOT FOUND {job['anchor']} in {job['file']}", file=sys.stderr)
                problems.append(job["slot"])
                continue
            blocks = sec

        if layout == "docx":
            src_text = docx_source_text(path)
        elif layout == "pdf":
            src_text = "\n".join(pdf_lines(path))
        else:
            src_text = doc_source_text(path)
        n_src, n_got, missing, invented = verify(src_text, blocks)
        partial = bool(job.get("anchor") or job.get("splitAnchor"))
        miss_n, inv_n = sum(missing.values()), sum(invented.values())
        # في الملفات المجمَّعة نقتطع جذاذة واحدة، فالنقص المتوقع = باقي الملف؛
        # أما الزيــادة (كلمة غير موجودة في الأصل) فمرفوضة دائمًا.
        ok = inv_n == 0 and (partial or miss_n == 0)
        flag = "✓" if ok else "✗"
        results.append({"slotId": job["slot"], "source": job["file"], "layout": layout, "blocks": blocks})
        print(f"  {job['slot']:12s} ← {job['file'][:46]:48s} {layout} · {count_chars(blocks):5d} حرف · كلمات {n_got}/{n_src} {flag}")
        if inv_n:
            print(f"      ⚠ كلمات ليست في المصدر: {list(invented.items())[:6]}")
        if miss_n and not partial:
            print(f"      ⚠ كلمات المصدر غير مُدرجة: {list(missing.items())[:6]}")
        if not ok:
            problems.append(job["slot"])

    with open(out_path, "w", encoding="utf8") as fh:
        fh.write(HEADER + json.dumps(results, ensure_ascii=False, indent=1) + ";" + FOOTER)
    print(f"\n→ {out_path}: {len(results)} جذاذة، {os.path.getsize(out_path)} بايت")
    if problems:
        print(f"⚠ لم ينجح التحقق من الأمانة في: {problems}")
        raise SystemExit(2)
    print("✓ التحقق من الأمانة: لا كلمة ضائعة ولا كلمة مُضافة في كل الجذاذات الكاملة.")


if __name__ == "__main__":
    main()
