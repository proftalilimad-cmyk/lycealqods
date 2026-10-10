import type { LessonBlock, LessonContent, LessonQuizItem } from "../../types";

/**
 * يبني التقويم النهائي ذي العشرين سؤالًا لدروس الثانية باكالوريا آداب
 * وعلوم إنسانية. تُستخرج الأسئلة من الاختبار الأصلي، والمفاهيم، والخط الزمني،
 * والجداول واللوائح والخلاصات الخاصة بالدرس؛ لذلك لا تتكرر نفس الأسئلة بين
 * درس وآخر حتى عندما يكون مصدر المحتوى alias مشتركًا.
 */
export function buildBac2ArtsFinalQuiz(content: LessonContent, subjectId: "history" | "geography"): LessonQuizItem[] {
  type Candidate = { category: "existing" | "concept" | "timeline" | "evidence" | "synthesis"; item: LessonQuizItem };

  const candidates: Record<Candidate["category"], Candidate[]> = {
    existing: [],
    concept: [],
    timeline: [],
    evidence: [],
    synthesis: [],
  };
  let seed = 0;

  const compact = (value: string, max = 360): string => {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max).replace(/\s+\S*$/, "").trimEnd();
    return `${cut}…`;
  };

  const distinct = (values: string[]): string[] => {
    const seen = new Set<string>();
    return values
      .map((value) => compact(value))
      .filter((value) => {
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  };

  const makeQuestion = (
    q: string,
    correct: string,
    distractors: string[],
    why: string,
  ): LessonQuizItem | null => {
    const options = distinct([correct, ...distractors]).slice(0, 4);
    if (!q.trim() || options.length < 2) return null;
    const answer = seed % options.length;
    seed += 1;
    [options[0], options[answer]] = [options[answer], options[0]];
    return {
      q: compact(q, 300),
      options,
      answer,
      why: compact(why, 420),
    };
  };

  const add = (
    category: Candidate["category"],
    q: string,
    correct: string,
    distractors: string[],
    why: string,
  ) => {
    const item = makeQuestion(q, correct, distractors, why);
    if (item) candidates[category].push({ category, item });
  };

  /* 1) الأسئلة الأصيلة الموجودة في محتوى الدرس */
  content.quiz.forEach((item) => {
    const correct = item.options[item.answer] ?? "";
    add("existing", item.q, correct, item.options.filter((_, index) => index !== item.answer), item.why);
  });

  /* 2) المفاهيم: تعريفات الدرس مع مشتتات من نفس المعجم */
  content.glossary.forEach((concept, index) => {
    add(
      "concept",
      `ما المقصود بمفهوم «${concept.term}» في درس «${content.title}»؟`,
      concept.def,
      content.glossary.filter((_, otherIndex) => otherIndex !== index).map((other) => other.def),
      `لأن تعريف «${concept.term}» يحدد وظيفته وموقعه داخل موضوع الدرس، وليس مجرد معنى عام للمصطلح.`,
    );
  });

  /* 3) التواريخ والمحطات: ربط التاريخ بالحدث أو التحول الذي يشرحه الدرس */
  content.timeline.forEach((point, index) => {
    add(
      "timeline",
      `بماذا يرتبط تاريخ «${point.date}» في درس «${content.title}»؟`,
      point.event,
      content.timeline.filter((_, otherIndex) => otherIndex !== index).map((other) => other.event),
      `يرتبط هذا التاريخ بالمحطة التالية في درس «${content.title}»: ${point.event}.`,
    );
  });

  const blockFacts = (block: LessonBlock): string[] => {
    if (block.type === "p") return [block.text];
    if (block.type === "ul") return block.items;
    if (block.type === "callout") return [block.text];
    return block.rows.map((row) => row.join(" — "));
  };

  /* 4) الوثائق والجداول واللوائح: أسئلة توظيف مباشرة من محاور كل درس */
  content.sections.forEach((section) => {
    section.blocks.forEach((block) => {
      if (block.type === "callout") {
        add(
          "evidence",
          `ما الفكرة التي يقدمها مربع «${block.label}» داخل محور «${section.title}»؟`,
          block.text,
          content.sections.flatMap((otherSection) => otherSection.blocks.flatMap(blockFacts)).filter((fact) => fact !== block.text),
          `لأن مربع «${block.label}» يقدم هذه الفكرة بوصفها مدخلًا لفهم محور «${section.title}».`,
        );
      }
      if (block.type === "table") {
        block.rows.forEach((row, rowIndex) => {
          const label = row[0] ?? section.title;
          add(
            "evidence",
            `ما المعطى الذي يميز «${label}» ضمن محور «${section.title}»؟`,
            row.slice(1).join(" — "),
            block.rows.filter((_, otherIndex) => otherIndex !== rowIndex).map((other) => other.slice(1).join(" — ")),
            `يُقبل الجواب الذي يستخرج معطيات «${label}» من الجدول ويربطها بفكرة محور «${section.title}».`,
          );
        });
        if (block.rows.length > 1) {
          const correct = block.rows[0]?.[0] ?? "";
          add(
            "evidence",
            `أي عنصر يندرج ضمن تصنيف جدول «${section.title}»؟`,
            correct,
            block.rows.slice(1).map((row) => row[0] ?? "").concat(block.head.slice(0, 2)),
            `لأن «${correct}» وارد ضمن خانة «${block.head[0] ?? "المحور"}» في جدول هذا المقطع.`,
          );
        }
      }
      if (block.type === "ul" && block.items.length > 1) {
        block.items.slice(0, 4).forEach((item, itemIndex) => {
          add(
            "evidence",
            `أي عبارة تشرح جانبًا من محور «${section.title}» كما ورد في الدرس؟`,
            item,
            block.items.filter((_, otherIndex) => otherIndex !== itemIndex),
            `هذه العبارة جزء من عناصر محور «${section.title}»، ويُنتظر توظيفها مع بقية العناصر في جواب منظم.`,
          );
        });
      }
    });
  });

  /* 5) التركيب والأهداف: أسئلة تقيس الفهم لا الحفظ المنفصل */
  content.objectives.forEach((objective, index) => {
    add(
      "synthesis",
      `أي هدف تعلمي يرتبط مباشرة بدرس «${content.title}»؟`,
      objective,
      content.objectives.filter((_, otherIndex) => otherIndex !== index),
      `لأن هذا الهدف يوجه الاشتغال على درس «${content.title}» ويحدد المنتوج المنتظر من المتعلم.`,
    );
  });
  content.summary.forEach((summary, index) => {
    add(
      "synthesis",
      `أي عبارة تلخص جانبًا أساسيًا من درس «${content.title}»؟`,
      summary,
      content.summary.filter((_, otherIndex) => otherIndex !== index),
      `لأن هذه العبارة تستخلص فكرة مركزة من خلاصة درس «${content.title}» ويمكن توظيفها في الجواب التركيبي.`,
    );
  });
  content.sections.forEach((section, index) => {
    const fact = section.blocks.flatMap(blockFacts)[0] ?? section.title;
    add(
      "synthesis",
      `يركز محور «${section.title}» أساسًا على:`,
      fact,
      content.sections.filter((_, otherIndex) => otherIndex !== index).map((other) => other.title),
      `لأن هذا المحور يعالج «${section.title}» من خلال المعطيات والوثائق المرفقة به.`,
    );
  });

  const selected: LessonQuizItem[] = [];
  const usedQuestions = new Set<string>();
  const take = (category: Candidate["category"], limit: number) => {
    for (const candidate of candidates[category]) {
      if (selected.length >= limit || usedQuestions.has(candidate.item.q)) continue;
      usedQuestions.add(candidate.item.q);
      selected.push(candidate.item);
    }
  };

  /* توزيع متوازن: أسئلة أصيلة، مفاهيم، كرونولوجيا، تحليل، ثم تركيب. */
  take("existing", 4);
  take("concept", 5);
  take("timeline", 4);
  take("evidence", 17);
  take("synthesis", 20);

  /* ضمان بلوغ 20 سؤالًا حتى في الملفات التطبيقية قليلة الفقرات. */
  const fallbackFacts = [
    ...content.sections.map((section) => `محور «${section.title}»`),
    ...content.summary,
    ...content.objectives,
    content.coreQuestion,
  ];
  let fallbackIndex = 0;
  while (selected.length < 20 && fallbackFacts.length) {
    const fact = fallbackFacts[fallbackIndex % fallbackFacts.length] ?? "";
    const q = `ما الخلاصة التي ينبغي تثبيتها في التقويم النهائي لدرس «${content.title}»؟ (${selected.length + 1})`;
    const item = makeQuestion(
      q,
      fact,
      fallbackFacts.filter((other) => other !== fact),
      subjectId === "geography"
        ? "ينبغي أن يربط الجواب بين الوصف والتفسير والتعميم في موضوع الدرس."
        : "ينبغي أن يؤطر الجواب الظاهرة تاريخيًا ويربط بين العوامل والنتائج.",
    );
    if (item && !usedQuestions.has(item.q)) {
      usedQuestions.add(item.q);
      selected.push(item);
    }
    fallbackIndex += 1;
    if (fallbackIndex > fallbackFacts.length * 3) break;
  }

  return selected.slice(0, 20);
}
