/* ============================================================
   كاتب أرشيف ZIP — تنفيذ ذاتي صغير (بلا مكتبة خارجية)
   ------------------------------------------------------------
   الموقع ثابت (بلا خادم)، لذلك يُبنى الأرشيف داخل المتصفح.

   • الضغط: Deflate عبر CompressionStream المتوفر في المتصفحات
     الحديثة، مع رجوع تلقائي إلى «التخزين» (store) إن غاب، فيبقى
     الأرشيف صالحًا في كل الحالات.
   • الأسماء العربية: تُكتب بترميز UTF-8 مع رفع الراية 11
     (Language encoding flag) حتى تظهر سليمة في كل الأدوات.
   • البنية: ترويسة محلية لكل ملف + دليل مركزي + سجل النهاية.
   ============================================================ */

export interface ZipEntry {
  /** المسار داخل الأرشيف، مثال: `الجذع_المشترك/القسم_1/001_محمد.html` */
  path: string;
  data: Uint8Array;
}

export interface ZipOptions {
  /** تاريخ موحَّد لكل الملفات (افتراضيًا الآن) */
  when?: Date;
  /** محاولة الضغط بـ Deflate (افتراضيًا نعم) */
  compress?: boolean;
}

/* ---------- CRC-32 (جدول محسوب مرة واحدة) ---------- */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ---------- أدوات الكتابة ---------- */
const enc = new TextEncoder();

/** تاريخ/وقت بصيغة DOS (ما يستعمله ZIP) */
function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    date: (((year - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** ضغط Deflate خام؛ يعيد null إن لم يتوفر أو لم يكن مفيدًا */
async function deflateRaw(data: Uint8Array): Promise<Uint8Array | null> {
  const Ctor = (globalThis as unknown as { CompressionStream?: new (f: string) => GenericTransformStream })
    .CompressionStream;
  if (!Ctor) return null;
  try {
    const stream = new Blob([data.slice().buffer as ArrayBuffer]).stream().pipeThrough(new Ctor("deflate-raw"));
    const out = new Uint8Array(await new Response(stream).arrayBuffer());
    return out.length < data.length ? out : null;
  } catch {
    return null;
  }
}

class Writer {
  private chunks: Uint8Array[] = [];
  private size = 0;

  bytes(b: Uint8Array): void {
    this.chunks.push(b);
    this.size += b.length;
  }

  u16(v: number): void {
    this.bytes(new Uint8Array([v & 0xff, (v >>> 8) & 0xff]));
  }

  u32(v: number): void {
    this.bytes(new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]));
  }

  get length(): number {
    return this.size;
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this.size);
    let at = 0;
    for (const c of this.chunks) {
      out.set(c, at);
      at += c.length;
    }
    return out;
  }
}

/**
 * بناء أرشيف ZIP كامل.
 * @param entries الملفات (المسارات تُستعمل كما هي، و«/» يفصل المجلدات)
 */
export async function createZip(entries: ZipEntry[], options: ZipOptions = {}): Promise<Uint8Array> {
  const when = options.when ?? new Date();
  const wantCompression = options.compress !== false;
  const { time, date } = dosDateTime(when);
  const out = new Writer();
  const central: { pathBytes: Uint8Array; crc: number; size: number; raw: number; method: number; offset: number }[] = [];

  for (const entry of entries) {
    const pathBytes = enc.encode(entry.path.replace(/^\/+/, ""));
    const crc = crc32(entry.data);
    const packed = wantCompression ? await deflateRaw(entry.data) : null;
    const body = packed ?? entry.data;
    const method = packed ? 8 : 0;
    const offset = out.length;

    /* الترويسة المحلية */
    out.u32(0x04034b50);
    out.u16(20); // الإصدار المطلوب
    out.u16(0x0800); // راية UTF-8 للأسماء العربية
    out.u16(method); // 0 = تخزين، 8 = deflate
    out.u16(time);
    out.u16(date);
    out.u32(crc);
    out.u32(body.length);
    out.u32(entry.data.length);
    out.u16(pathBytes.length);
    out.u16(0); // لا حقل إضافي
    out.bytes(pathBytes);
    out.bytes(body);

    central.push({ pathBytes, crc, size: body.length, raw: entry.data.length, method, offset });
  }

  /* الدليل المركزي */
  const cdStart = out.length;
  for (const c of central) {
    out.u32(0x02014b50);
    out.u16(20);
    out.u16(20);
    out.u16(0x0800);
    out.u16(c.method);
    out.u16(time);
    out.u16(date);
    out.u32(c.crc);
    out.u32(c.size);
    out.u32(c.raw);
    out.u16(c.pathBytes.length);
    out.u16(0);
    out.u16(0);
    out.u16(0);
    out.u16(0);
    out.u32(0);
    out.u32(c.offset);
    out.bytes(c.pathBytes);
  }
  const cdSize = out.length - cdStart;

  /* سجل نهاية الدليل */
  out.u32(0x06054b50);
  out.u16(0);
  out.u16(0);
  out.u16(central.length);
  out.u16(central.length);
  out.u32(cdSize);
  out.u32(cdStart);
  out.u16(0);

  return out.toUint8Array();
}

/** نص → بايتات للأرشيف */
export const zipText = (s: string): Uint8Array => enc.encode(s);
