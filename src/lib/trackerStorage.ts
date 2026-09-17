/* ============================================================
   تخزين تتبّع الجذاذات — لوحة الأستاذ
   ============================================================
   الحالة تُحفظ في متصفّح الأستاذ (localStorage) لأنها معطيات
   تتبّع شخصية، ولا حاجة لنشرها مع الموقع. التصدير CSV متاح
   لأرشفة الحالة أو نقلها إلى حاسوب آخر.
   ============================================================ */

import type { TrackerSlot, TrackerStatus } from "../data/jadadatTracker";
import { TRACKER_SLOTS, TRACKER_STATUS } from "../data/jadadatTracker";

const KEY = "talil_jadadat_progress_v1";

export interface JadadaProgress {
  status: TrackerStatus;
  /** تاريخ الإنجاز أو آخر تحديث (yyyy-mm-dd) */
  date: string;
  /** القسم الذي أُنجزت معه الجذاذة */
  className: string;
  /** ملاحظة حرّة (تعديل، صعوبة، دعم…) */
  note: string;
}

export type ProgressMap = Record<string, JadadaProgress>;

export const emptyProgress = (): JadadaProgress => ({ status: "pending", date: "", className: "", note: "" });

function read(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* وضع تصفّح خاص: التغيير يبقى في الذاكرة خلال الجلسة */
  }
}

export function getProgress(): ProgressMap {
  return read();
}

export function progressOf(map: ProgressMap, slotId: string): JadadaProgress {
  return map[slotId] ?? emptyProgress();
}

export function setSlotProgress(slotId: string, patch: Partial<JadadaProgress>): ProgressMap {
  const map = read();
  const current = progressOf(map, slotId);
  map[slotId] = { ...current, ...patch };
  write(map);
  return { ...map };
}

/** تعليم كل خانات وحدة كاملة بحالة واحدة (اختصار مفيد) */
export function setUnitProgress(unitId: string, status: TrackerStatus, className = ""): ProgressMap {
  const map = read();
  const today = new Date().toISOString().slice(0, 10);
  TRACKER_SLOTS.filter((s) => s.unitId === unitId).forEach((s) => {
    const current = progressOf(map, s.id);
    map[s.id] = {
      ...current,
      status,
      date: status === "pending" ? "" : current.date || today,
      className: className || current.className,
    };
  });
  write(map);
  return { ...map };
}

export function clearSlot(slotId: string): ProgressMap {
  const map = read();
  delete map[slotId];
  write(map);
  return { ...map };
}

export function clearAllProgress(): ProgressMap {
  write({});
  return {};
}

/* --------------------------------- الإحصاءات --------------------------------- */

export interface TrackerStats {
  total: number;
  done: number;
  progress: number;
  pending: number;
  percent: number;
  bySubject: { subject: string; total: number; done: number; percent: number }[];
  byCycle: { cycle: string; total: number; done: number; percent: number }[];
  byUnit: { id: string; title: string; subject: string; cycle: string; total: number; done: number; percent: number }[];
  lastUpdate: string;
}

export function trackerStats(map: ProgressMap, slots: TrackerSlot[] = TRACKER_SLOTS): TrackerStats {
  const count = (list: TrackerSlot[], status: TrackerStatus) =>
    list.filter((s) => progressOf(map, s.id).status === status).length;

  const total = slots.length;
  const done = count(slots, "done");
  const progress = count(slots, "progress");
  const pct = (d: number, t: number) => (t > 0 ? Math.round((d / t) * 100) : 0);

  const subjects = Array.from(new Set(slots.map((s) => s.subject)));
  const cycles = Array.from(new Set(slots.map((s) => s.cycle)));
  const units = Array.from(new Set(slots.map((s) => s.unitId)));

  const dates = slots
    .map((s) => progressOf(map, s.id).date)
    .filter((d) => d.length > 0)
    .sort();

  return {
    total,
    done,
    progress,
    pending: total - done - progress,
    percent: pct(done, total),
    bySubject: subjects.map((subject) => {
      const list = slots.filter((s) => s.subject === subject);
      return { subject, total: list.length, done: count(list, "done"), percent: pct(count(list, "done"), list.length) };
    }),
    byCycle: cycles.map((cycle) => {
      const list = slots.filter((s) => s.cycle === cycle);
      return { cycle, total: list.length, done: count(list, "done"), percent: pct(count(list, "done"), list.length) };
    }),
    byUnit: units.map((id) => {
      const first = slots.find((s) => s.unitId === id)!;
      const list = slots.filter((s) => s.unitId === id);
      return {
        id,
        title: first.unitTitle,
        subject: first.subject,
        cycle: first.cycle,
        total: list.length,
        done: count(list, "done"),
        percent: pct(count(list, "done"), list.length),
      };
    }),
    lastUpdate: dates.length ? dates[dates.length - 1] : "",
  };
}

/* --------------------------------- التصدير --------------------------------- */

/** تصدير حالة التتبّع إلى CSV (يفتح في Excel مع العربية) */
export function exportTrackerCsv(map: ProgressMap, slots: TrackerSlot[] = TRACKER_SLOTS): void {
  const header =
    "المادة,الدورة,الوحدة / المجزوءة,رقم الجذاذة,عنوان الدرس,الحالة,تاريخ الإنجاز,القسم,ملاحظة\n";
  const q = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = slots
    .map((s) => {
      const p = progressOf(map, s.id);
      return [
        q(s.subject),
        q(s.cycle),
        q(s.unitTitle),
        q(s.number),
        q(s.title),
        q(TRACKER_STATUS[p.status].label),
        q(p.date),
        q(p.className),
        q(p.note),
      ].join(",");
    })
    .join("\n");
  const csv = "\uFEFF" + header + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "تتبع-جذاذات-الجذع-المشترك-العلمي.csv";
  a.click();
  URL.revokeObjectURL(url);
}
