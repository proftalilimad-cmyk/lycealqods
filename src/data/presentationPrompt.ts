import type { LessonContent } from "../types";

/**
 * تعليمات موحّدة لإنشاء عرض تدريسي من محتوى الدرس فقط.
 * تُعرض للمدرس وتُنسخ عند الحاجة؛ لا تستدعي خدمة خارجية ولا تنشئ محتوى جديدًا داخل الموقع.
 */
export const CLASSROOM_PRESENTATION_PROMPT = `Create a professional educational presentation based ONLY on the lesson content available on this website:

[ضع رابط موقعك هنا]

The website is an educational platform for Moroccan secondary-school History and Geography (Social Studies), created for teachers and students.

TASK:
Browse the website and identify the selected lesson/course, then transform its content into a complete classroom presentation.

IMPORTANT:
- Use ONLY the information contained in the selected lesson and its associated documents.
- Do not invent historical facts, dates, statistics, concepts, sources or examples.
- Preserve the scientific accuracy and the original meaning of the lesson.
- Adapt the content for classroom projection, not for reading a long article.
- Do not simply copy the entire webpage.
- Condense the content into clear educational slides.
- Keep the terminology appropriate for the Moroccan secondary-school curriculum.
- Clearly distinguish between History and Geography.
- Respect the level and stream indicated on the website.

PRESENTATION STRUCTURE:

1. TITLE
   - Lesson title
   - Subject
   - Level/stream
   - Educational platform/teacher name if available

2. LEARNING OBJECTIVES
   - 3 to 5 precise learning objectives.

3. INTRODUCTION
   - Short contextual introduction.
   - Introduce the historical/geographical context.
   - Present the central problematic/question.

4. KEY CONCEPTS
   - Important concepts and definitions from the lesson.
   - Keep definitions short and easy for students.

5. LESSON DEVELOPMENT
   Organize the lesson according to its original structure:
   - Major learning section
   - Minor activity/axis
   - Documents
   - Questions
   - Analysis
   - Conclusions

6. DOCUMENT ANALYSIS
   For every important document:
   - Identify its nature.
   - Source/author if available.
   - Date if available.
   - Context.
   - Main information.
   - Questions for students.
   - Expected answers.
   - Short conclusion.

7. VISUAL MATERIAL
   Use relevant:
   - Historical photographs
   - Maps
   - Statistical graphs
   - Timelines
   - Diagrams
   - Geographic maps

   Visuals must directly support the lesson.
   Do not add decorative images that have no pedagogical purpose.

8. SYNTHESIS
   Create a clear conceptual diagram showing:
   causes → manifestations/development → consequences/results
   or another structure appropriate to the lesson.

9. STUDENT TRACE / SUMMARY
   Produce a concise "trace écrite" that students can copy into their notebooks.
   It must contain the essential knowledge of the lesson without unnecessary details.

10. FINAL ASSESSMENT
   Add 3–5 questions checking:
   - knowledge
   - understanding
   - document analysis
   - synthesis

DESIGN:
- Academic and modern classroom design.
- Clean layout.
- Large readable Arabic typography.
- Very little text per slide.
- Use visual hierarchy.
- Highlight key concepts and dates.
- Use maps, diagrams and timelines when appropriate.
- Avoid overcrowded slides.
- Avoid excessive animations.
- Maintain a coherent visual identity throughout the presentation.

LANGUAGE:
Arabic.

OUTPUT:
Create a complete presentation suitable for classroom teaching.
Target approximately 15–25 slides depending on the length and complexity of the lesson.

The presentation must function as a teaching aid:
the teacher explains, students observe documents, answer questions, analyze evidence and construct the conclusion.`;

export function buildPresentationPrompt(lesson: LessonContent, lessonUrl: string): string {
  return `${CLASSROOM_PRESENTATION_PROMPT.replace("[ضع رابط موقعك هنا]", lessonUrl)}

SELECTED LESSON CONTEXT:
- Lesson: ${lesson.title}
- Duration: ${lesson.duration}
- The URL above is the only source to browse. Do not use external sources.`;
}
