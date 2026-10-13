/* ============================================================
   النظام الموحد لاكتشاف الجداول داخل النصوص
   ------------------------------------------------------------
   أي محتوى منسوخ أو مُدخل (وثيقة درس، تمرين، ملف PDF…)
   يمرّ على هذا المحرك: البيانات المنظمة الواضحة (سنوات+نسب،
   فئات+قيم، مؤشرات+أرقام، أعمدة متقابلة) تتحول إلى جدول HTML
   حقيقي <table><thead><tbody>، والنص العادي يبقى نصًا كما هو.

   مبادئ ثابتة:
   - يحافظ على ترتيب البيانات الأصلي وعلى الأرقام والنسب والوحدات
     (٪، مليون، مليار، كم²…) حرفيًا دون أي تغيير.
   - لا يخترع بيانات ناقصة؛ الخانات غير الموجودة تبقى فارغة.
   - إذا كان البنية غير واضحة يترك المحتوى نصًا (لا تخمين).
   ============================================================ */

export interface DetectedTable {
  /** عبارة قيادة قصيرة انتهت بنقطتين واستُعملت عنوانًا للجدول (كما هي) */
  title?: string;
  /** عناوين الأعمدة: مشتقة من العبارة القيادة أو من صف عناوين موجود أو وصف بنيوي */
  head: string[];
  /** صفوف البيانات: الخلايا كما وردت حرفيًا (trim فقط) */
  rows: string[][];
  /** العمود الأول سنوات/تواريخ → بيانات زمنية قابلة لتوليد مبيان لاحقًا */
  timeSeries: boolean;
}

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "table"; table: DetectedTable };

/* ---------- أدوات الأرقام والتواريخ ---------- */

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const toLatinDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));

/** سنة/تاريخ: 3-4 أرقام، اختياريًا مع قرن أو ق.م أو م */
const YEAR_RE = /^(?:القرن\s*)?(?:\d{3,4}|[٠-٩]{3,4})(?:\s*(?:ق\.?\s*م\.?|م|ميلادي[هة]?|هجري[هة]?|ق))?$/;
export const isYear = (s: string) => YEAR_RE.test(toLatinDigits(s.trim()));

const UNITS = "(?:٪|%|مليون(?:ات)?|مليار(?:ات)?|ألف|الف|آلاف|نسمة|كم²|كم2|كلم²|هكتار|متر|كلم|km|دولار|درهم|طن|يوم|سنة|شهر|أسبوع|درجة|°)";
const NUM_PREFIX = /^(?:حوالي|تقريب[ًاا]|نحو|أكثر من|أقل من|فوق|تحت|بين|~|≈)\s+/;

/** خلية رقمية: تبدأ برقم (بعد بادئة تقريب) ويغلب عليها الرقم/الوحدات/الترقيم */
export function numericish(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.length > 45) return false;
  const core = t.replace(NUM_PREFIX, "");
  if (!/^[\d٠-٩]/.test(core)) return false;
  const latin = toLatinDigits(core);
  const stripped = latin
    .replace(/[\d.,\s]/g, "")
    .replace(new RegExp(UNITS, "g"), "")
    .replace(/[+\-−/()±≈~%٪:؛]/g, "")
    .replace(/(مليون|مليار|ألف|الف|نسمة|هكتار|متر|درهم|دولار|طن)/g, "");
  return stripped.length <= 7;
}

const stripBullet = (s: string) => s.replace(/^\s*[-•*·◦‣]\s*/, "").trim();

/** «المفتاح: القيمة» — المفتاح قصير (≤60 حرفًا) */
function splitPair(line: string): [string, string] | null {
  const m = /^(.{1,60}?)[::]\s*(.+)$/.exec(line.trim());
  if (!m) return null;
  return [m[1].trim(), m[2].trim()];
}

type ParsedRow =
  | { type: "pairs"; keys: string[]; values: string[] } // عدة «سنة: قيمة» داخل السطر (| أو فراغات)
  | { type: "pair"; key: string; value: string } // سطر واحد «مفتاح: قيمة» رقمية
  | { type: "grid"; cells: string[] } // سطر أعمدة مفصولة بـ | أو تابو
  | null;

/** أزواج «سنة: قيمة» المتكررة داخل سطر واحد (بدون |) */
function inlineYearPairs(t: string): { keys: string[]; values: string[] } | null {
  const re = new RegExp(`((?:1[0-9]|20|21)\\d{2}|[٠-٩]{4})\\s*[::]\\s*((?:حوالي|تقريب[ًاا]|نحو)?\\s*[\\d٠-٩][\\d٠-٩.,]*\\s*${UNITS}*)`, "g");
  const keys: string[] = [];
  const values: string[] = [];
  let covered = 0;
  for (const m of t.matchAll(re)) {
    keys.push(m[1].trim());
    values.push(m[2].trim());
    covered += m[0].length;
  }
  if (keys.length >= 3 && covered >= t.replace(/\s+/g, "").length * 0.6) return { keys, values };
  return null;
}

/** تصنيف سطر واحد كبنية بيانات محتملة (بدون أي تحويل بعد) */
export function parseRow(line: string): ParsedRow {
  const t = stripBullet(line);
  if (!t || t.length > 400) return null;
  if (t.includes("|")) {
    const toks = t.split("|").map((s) => s.trim()).filter((s) => s.length > 0);
    if (toks.length >= 2) {
      // كل الأجزاء «مفتاح: قيمة» رقمية → أزواج
      const pairs = toks.map(splitPair);
      if (toks.length >= 3 && pairs.every((p) => p && numericish(p[1]))) {
        return { type: "pairs", keys: pairs.map((p) => p![0]), values: pairs.map((p) => p![1]) };
      }
      // شبكة أعمدة عادية
      return { type: "grid", cells: toks };
    }
  }
  const inline = inlineYearPairs(t);
  if (inline) return { type: "pairs", keys: inline.keys, values: inline.values };
  const p = splitPair(t);
  if (p && numericish(p[1]) && p[0].length <= 55) return { type: "pair", key: p[0], value: p[1] };
  if (t.includes("\t")) {
    const toks = t.split("\t").map((s) => s.trim());
    if (toks.length >= 2 && toks.filter(Boolean).length >= 2) return { type: "grid", cells: toks };
  }
  return null;
}

/** نسبة الخلايا الرقمية في مجموعة صفوف */
function numericDensity(rows: string[][]): number {
  let n = 0;
  let d = 0;
  for (const r of rows) for (const c of r) { d += 1; if (numericish(c)) n += 1; }
  return d ? n / d : 0;
}

/** فك تكرار العناوين المستنتجة (البيان، البيان…) → البيان، البيان 2… */
function dedupeHead(head: string[]): string[] {
  const seen = new Map<string, number>();
  return head.map((h) => {
    const n = seen.get(h) ?? 0;
    seen.set(h, n + 1);
    return n === 0 ? h : `${h} ${n + 1}`;
  });
}

/** عنوان بنيوي لعمود بلا عنوان واضح: وصف بنيوي وليس بيانات مخترعة */
function inferHeader(cells: string[], vi: number, valueCols: number): string {
  if (cells.filter((c) => isYear(c)).length >= Math.ceil(cells.length * 0.6)) return "السنة";
  if (cells.filter(numericish).length >= Math.ceil(cells.length * 0.6)) return valueCols === 1 ? "القيمة" : `القيمة ${vi + 1}`;
  return "البيان";
}

interface BuildOpts {
  /** عبارة قيادة (تنتهي بنقطتين) تُستهلك عنوانًا/ترويسة — تُحذف من النص */
  lead?: string;
}

/** بناء جدول من أسطر «مفتاح: قيمة» متتالية */
function buildPairs(pairs: { key: string; value: string }[], opts: BuildOpts): DetectedTable {
  const keys = pairs.map((p) => p.key);
  const timeSeries = keys.filter(isYear).length >= Math.ceil(keys.length * 0.6);
  const valueHead = opts.lead?.replace(/[::]\s*$/, "").trim();
  return {
    head: [timeSeries ? "السنة" : "البيان", valueHead || (timeSeries ? "القيمة" : "القيمة")],
    rows: pairs.map((p) => [p.key, p.value]),
    timeSeries,
    title: valueHead ? undefined : opts.lead,
  };
}

/** بناء جدول من أسطر أزواج داخلية (|) أو شبكة أعمدة */
function buildGrid(rows: string[][], opts: BuildOpts): DetectedTable | null {
  if (!rows.length) return null;
  /* صف أول = عناوين أصلية (لا نستبدلها) إن كانت خاناته قصيرة وغير رقمية أو سنوات
     (أعمدة السنوات شائعة في الترويسات)، ولا يكون باقي الجدول كله "يشبه ترويسة"
     (حماية من ابتلاع أول صف بيانات) */
  const looksLikeHead = (r: string[]) =>
    r.every((c) => !numericish(c) || isYear(c)) && r.some((c) => !numericish(c)) && r.every((c) => c.length <= 40);
  const firstIsHead = rows.length >= 2 && looksLikeHead(rows[0]) && !rows.slice(1).every(looksLikeHead);
  const head = firstIsHead
    ? rows[0].map((c) => c.trim())
    : rows[0].map((_, ci) => {
        const col = rows.map((r) => r[ci] ?? "");
        const numericCols = rows[0].map((_, k) => rows.filter((r) => numericish(r[k] ?? "")).length >= Math.ceil(rows.length * 0.6)).filter(Boolean).length;
        const valueIdx = rows[0].slice(0, ci + 1).map((_, k) => rows.filter((r) => numericish(r[k] ?? "")).length >= Math.ceil(rows.length * 0.6)).filter(Boolean).length - 1;
        return inferHeader(col, Math.max(valueIdx, 0), Math.max(numericCols, 1));
      });
  if (opts.lead && !firstIsHead && head.length >= 2) head[head.length - 1] = opts.lead.replace(/[::]\s*$/, "").trim();
  if (!firstIsHead) return finalizeGrid(dedupeHead(head), rows);
  const body = rows.slice(1);
  const timeSeries = body.length > 0 && body.filter((r) => isYear(r[0] ?? "")).length >= Math.ceil(body.length * 0.6);
  return { title: opts.lead ? opts.lead.replace(/[::]\s*$/, "").trim() : undefined, head, rows: body.map((r) => r.map((c) => c.trim())), timeSeries };
}

function finalizeGrid(head: string[], rows: string[][]): DetectedTable {
  const body = rows;
  const timeSeries = body.length > 0 && body.filter((r) => isYear(r[0] ?? "")).length >= Math.ceil(body.length * 0.6);
  if (timeSeries && head[0] !== "السنة") head[0] = "السنة";
  return { head, rows: body.map((r) => r.map((c) => c.trim())), timeSeries };
}

/* ============================================================
   تقسيم نص كامل إلى مقاطع: نص عادي / جداول مكتشفة
   ============================================================ */

export function detectSegments(text: string): Segment[] {
  const lines = text.split("\n");
  const out: Segment[] = [];
  let buf: string[] = [];
  const flush = () => {
    const t = buf.join("\n");
    buf = [];
    if (t.trim().length) {
      const last = out[out.length - 1];
      if (last && last.kind === "text") last.text += `\n${t}`;
      else out.push({ kind: "text", text: t });
    } else if (t.length && out.length && out[out.length - 1].kind === "text") {
      (out[out.length - 1] as { text: string }).text += t;
    }
  };
  const pushTable = (table: DetectedTable, leadConsumed: boolean) => {
    if (leadConsumed && buf.length) {
      // حذف سطر القيادة من آخر النص المتجمع
      while (buf.length && !buf[buf.length - 1].trim()) buf.pop();
      buf.pop();
    }
    flush();
    out.push({ kind: "table", table });
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const parsed = parseRow(raw);
    if (!parsed) { i += 1; buf.push(raw); continue; }

    /* عبارة قيادة محتملة: آخر سطر غير فارغ في المخزون، قصير وينتهي بنقطتين */
    const leadOf = (): string | undefined => {
      for (let k = buf.length - 1; k >= 0; k -= 1) {
        const s = buf[k].trim();
        if (!s) continue;
        if (s.length <= 95 && /[::]\s*$/.test(s) && !numericish(s)) return s;
        return undefined;
      }
      return undefined;
    };

    if (parsed.type === "pairs") {
      // سطر واحد فيه ≥3 أزواج «سنة: قيمة» → جدول فوري (مع استهلاك القيادة)
      const pairs = parsed.keys.map((k, idx) => ({ key: k, value: parsed.values[idx] }));
      // نجمع أيضًا الأسطر التالية من نفس النوع
      let j = i + 1;
      while (j < lines.length) {
        const nx = parseRow(lines[j]);
        if (nx && nx.type === "pairs" && nx.keys.length === parsed.keys.length) {
          nx.keys.forEach((k, idx) => pairs.push({ key: k, value: nx.values[idx] }));
          j += 1;
        } else break;
      }
      const lead = leadOf();
      pushTable(buildPairs(pairs, { lead }), Boolean(lead));
      i = j;
      continue;
    }

    if (parsed.type === "pair") {
      // أسطر «مفتاح: قيمة» متتالية: جدول إن كانت ≥2، أو سطر واحد مفتاحه سنة
      const pairs = [{ key: parsed.key, value: parsed.value }];
      let j = i + 1;
      while (j < lines.length) {
        const nx = parseRow(lines[j]);
        if (nx && nx.type === "pair") { pairs.push({ key: nx.key, value: nx.value }); j += 1; } else break;
      }
      if (pairs.length >= 2 || isYear(pairs[0].key)) {
        const lead = leadOf();
        pushTable(buildPairs(pairs, { lead }), Boolean(lead));
        i = j;
        continue;
      }
      buf.push(raw); i += 1; continue;
    }

    // grid: أسطر متتالية بنفس عدد الأعمدة (مع محاولة محاذاة سطر ناقص)
    {
      const grid: string[][] = [parsed.cells];
      const raws: string[] = [raw];
      let j = i + 1;
      while (j < lines.length) {
        const nx = parseRow(lines[j]);
        if (nx && nx.type === "grid" && Math.abs(nx.cells.length - parsed.cells.length) <= 1) {
          grid.push(nx.cells); raws.push(lines[j]); j += 1;
        } else break;
      }
      /* محاذاة: الصف الذي ينقصه عمود وأول أجزائه «عنوان: قيمة» يُفصل عنوانه عن قيمته
         (بنية المصدر الواضحة — لا تغيير في الأرقام ولا اختراع لخانات) */
      const maxCols = Math.max(...grid.map((r) => r.length));
      const aligned = grid.map((r) => {
        if (r.length === maxCols) return r;
        if (r.length === maxCols - 1) {
          const p = splitPair(r[0]);
          if (p) return [p[0], p[1], ...r.slice(1)];
        }
        return r;
      });
      const consistent = aligned.every((r) => r.length === maxCols);
      const density = numericDensity(aligned);
      const single = aligned.length === 1;
      /* سطر شبكي وحيد تكون كل أعمدته بعد الأول سنوات = ترويسة معزولة → غير واضح، يبقى نصًا */
      const loneYearHead = single && maxCols >= 3 && aligned[0].slice(1).every(isYear);
      /* شروط الوضوح:
         - ≥ سطرين متسقين بفاصل | وخانات قصيرة (أعمدة منظمة متقابلة، رقمية أو وصفية)؛
         - أو ≥ سطرين بتابو/فاصل بكثافة رقمية ≥ 0.4؛
         - أو سطر واحد ≥3 أعمدة بكثافة رقمية ≥ 0.5.
         وما دون ذلك يبقى نصًا (لا تخمين). */
      const pipeBlock = raws.some((l) => l.includes("|"));
      const shortCells = aligned.every((r) => r.every((c) => c.length <= 60));
      const clear =
        consistent &&
        !loneYearHead &&
        ((aligned.length >= 2 && shortCells && (pipeBlock || density >= 0.4)) ||
          (single && maxCols >= 3 && density >= 0.5));
      if (clear) {
        const lead = leadOf();
        const t = buildGrid(aligned, { lead });
        if (t) { pushTable(t, Boolean(lead) && Boolean(t.title || lead)); i = j; continue; }
      }
      buf.push(raw); i += 1; continue;
    }
  }
  flush();
  return out;
}

/* ============================================================
   تحويل قسري (محرر الوثائق: زر «تحويل إلى جدول» على تحديد)
   ============================================================ */

export function parseSelectionToTable(sel: string): DetectedTable {
  const lines = sel.split("\n").map((l) => stripBullet(l)).filter((l) => l.trim());
  const rows: string[][] = lines.map((l) => {
    if (l.includes("|")) return l.split("|").map((s) => s.trim());
    if (l.includes("\t")) return l.split("\t").map((s) => s.trim());
    const p = splitPair(l);
    if (p) return [p[0], p[1]];
    if (l.includes("؛")) return l.split("؛").map((s) => s.trim());
    return [l.trim()];
  });
  let cols = Math.max(...rows.map((r) => r.length), 1);
  /* محاذاة: صف ناقص عمودًا وأول أجزائه «عنوان: قيمة» → فصل العنوان عن القيمة */
  rows.forEach((r, idx) => {
    if (r.length === cols - 1) {
      const p = splitPair(r[0]);
      if (p) rows[idx] = [p[0], p[1], ...r.slice(1)];
    }
  });
  rows.forEach((r) => { while (r.length < cols) r.push(""); }); // خانات فارغة بلا اختراع
  const looksHead = (r: string[]) => r.every((c) => !numericish(c) || isYear(c)) && r.some((c) => !numericish(c)) && r.every((c) => c.length <= 40);
  const firstIsHead = rows.length >= 2 && looksHead(rows[0]) && !rows.slice(1).every(looksHead);
  const head = firstIsHead
    ? rows[0]
    : rows[0].map((_, ci) => {
        const col = rows.map((r) => r[ci] ?? "");
        const numericCols = rows[0].map((_, k) => rows.filter((r) => numericish(r[k] ?? "")).length >= Math.ceil(rows.length * 0.6)).filter(Boolean).length;
        const valueIdx = rows[0].slice(0, ci + 1).map((_, k) => rows.filter((r) => numericish(r[k] ?? "")).length >= Math.ceil(rows.length * 0.6)).filter(Boolean).length - 1;
        return inferHeader(col, Math.max(valueIdx, 0), Math.max(numericCols, 1));
      });
  const body = firstIsHead ? rows.slice(1) : rows;
  const timeSeries = body.length > 0 && body.filter((r) => isYear(r[0] ?? "")).length >= Math.ceil(body.length * 0.6);
  return { head: firstIsHead ? head : dedupeHead(head), rows: body, timeSeries };
}

/* ============================================================
   بيانات زمنية → بنية جاهزة لمبيان مستقبلي
   ============================================================ */

export interface SeriesPoint { label: string; value: number; raw: string }
export function seriesFromTable(t: DetectedTable): { name: string; points: SeriesPoint[] } | null {
  if (!t.timeSeries || t.rows.length < 2) return null;
  const name = t.head[1] ?? "القيمة";
  const points: SeriesPoint[] = [];
  for (const r of t.rows) {
    const raw = (r[1] ?? "").trim();
    const m = /[-+]?[\d٠-٩][\d٠-٩.,]*/.exec(toLatinDigits(raw));
    if (!m) return null;
    points.push({ label: r[0], value: Number(m[0].replace(/,/g, "")), raw });
  }
  return { name, points };
}

/* ============================================================
   توليد HTML للجدول المكتشف (ملفات التحميل والتصدير — نفس النظام)
   ============================================================ */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function detectedTableToHtml(t: DetectedTable, opts?: { nested?: boolean; className?: string }): string {
  const cls = [opts?.className ?? "auto-table", opts?.nested ? "nested" : "", t.timeSeries ? "time-series" : ""].filter(Boolean).join(" ");
  const caption = t.title ? `<caption>${esc(t.title)}</caption>` : "";
  const head = `<thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
  const body = `<tbody>${t.rows
    .map((r) => `<tr>${r.map((c) => `<td${numericish(c) ? ' class="num"' : ""}>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<table class="${cls}"${t.timeSeries ? ' data-time-series="1"' : ""}>${caption}${head}${body}</table>`;
}

/** تحويل نص كامل إلى HTML ذكي (نص + جداول حقيقية) — للتصدير والتحميل */
export function smartTextToHtml(text: string, opts?: { nested?: boolean; className?: string }): string {
  return detectSegments(text)
    .map((s) =>
      s.kind === "text"
        ? s.text.split("\n").map((l) => `<p>${esc(l)}</p>`).join("")
        : detectedTableToHtml(s.table, opts),
    )
    .join("\n");
}
