import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { LEVELS } from "../src/data/curriculum";
import { getLessonContent, lessonKey } from "../src/data/lessonContent";
import { createLessonPowerPointBlob } from "../src/components/LessonPresentation";
import type { CurriculumLevel, LessonContent } from "../src/types";
import JSZip from "jszip";

/**
 * ينشئ أرشيفات PowerPoint ثابتة قابلة للتحميل من GitHub.
 *
 * الاستعمال:
 *   npx tsx scripts/generate-powerpoint-archives.ts
 *   npx tsx scripts/generate-powerpoint-archives.ts tc
 *
 * يحتاج إلى خادم Vite يعمل على PPTX_ORIGIN حتى تُقرأ صور العرض المحلية.
 */

const OUTPUT_DIR = path.resolve("public/downloads/powerpoint");
const IMAGE_ORIGIN = process.env.PPTX_ORIGIN ?? "http://127.0.0.1:4173";

interface ArchiveLesson {
  key: string;
  title: string;
  content: LessonContent;
  subjectLabel: string;
  branchLabel: string;
}

function configureBrowserStubs(): void {
  (globalThis as any).window = {
    location: { origin: IMAGE_ORIGIN },
    sessionStorage: { getItem: (key: string) => key === "talil_teacher_session_v2" ? "1" : null },
    localStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
  };
  (globalThis as any).FileReader = class {
    result: string | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    async readAsDataURL(blob: Blob): Promise<void> {
      try {
        this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
        this.onload?.();
      } catch {
        this.onerror?.();
      }
    }
  };
}

function collectLessons(level: CurriculumLevel): ArchiveLesson[] {
  const seen = new Set<string>();
  const lessons: ArchiveLesson[] = [];
  level.branches.forEach((branch) => {
    branch.subjects.forEach((subject) => {
      (branch.units[subject.id] ?? []).forEach((unit, unitIndex) => {
        unit.lessons.forEach((item, lessonIndex) => {
          const key = lessonKey(branch.id, subject.id, unitIndex, lessonIndex);
          const content = item.soon ? undefined : getLessonContent(key);
          if (!content || seen.has(key)) return;
          seen.add(key);
          lessons.push({ key, title: content.title || item.title, content, subjectLabel: subject.label, branchLabel: branch.label });
        });
      });
    });
  });
  return lessons;
}

function safeFilePart(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\u0600-\u06ff.-]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "level";
}

function lessonFileName(lesson: ArchiveLesson): string {
  return `presentation-${lesson.key.replace(/[^a-zA-Z0-9.-]+/g, "-")}.pptx`;
}

async function createArchive(level: CurriculumLevel): Promise<{ filePath: string; lessons: number; bytes: number }> {
  const lessons = collectLessons(level);
  const zip = new JSZip();
  const folder = zip.folder(`PowerPoint-${safeFilePart(level.label)}`) ?? zip;
  folder.file(
    "README.txt",
    `عروض PowerPoint قابلة للتحرير في Keynote\nالمستوى: ${level.label}\nعدد العروض: ${lessons.length}\n\nالمحتوى مبني على دروس الموقع الأصلي. افتح ملفات .pptx في Microsoft PowerPoint أو Apple Keynote.\n`,
  );
  for (const [index, lesson] of lessons.entries()) {
    process.stdout.write(`[${level.id}] ${index + 1}/${lessons.length} ${lesson.title}\n`);
    const blob = await createLessonPowerPointBlob(lesson.content, {
      subjectLabel: lesson.subjectLabel,
      levelLabel: level.label,
      branchLabel: lesson.branchLabel,
    });
    folder.file(lessonFileName(lesson), blob);
  }
  const archive = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", streamFiles: true });
  const filePath = path.join(OUTPUT_DIR, `powerpoint-${safeFilePart(level.id)}.zip`);
  await writeFile(filePath, archive);
  return { filePath, lessons: lessons.length, bytes: archive.length };
}

async function main(): Promise<void> {
  configureBrowserStubs();
  await mkdir(OUTPUT_DIR, { recursive: true });
  const requested = new Set(process.argv.slice(2).filter((value) => !value.startsWith("-")));
  const levels = requested.size ? LEVELS.filter((level) => requested.has(level.id)) : LEVELS;
  if (!levels.length) throw new Error(`مستوى غير معروف. المتاح: ${LEVELS.map((level) => level.id).join(", ")}`);
  for (const level of levels) {
    const result = await createArchive(level);
    console.log(`Created ${result.filePath}: ${result.lessons} lessons, ${Math.round(result.bytes / 1024 / 1024 * 10) / 10} MiB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
