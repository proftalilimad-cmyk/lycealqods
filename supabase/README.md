# جدول `fiches_pedagogiques` — جذاذات الجذع المشترك العلمي

هذا المجلد **إضافة اختيارية** للموقع: المشروع الحالي موقع ثابت (statique) بلا خادم ولا قاعدة
بيانات، لذلك تُقرأ الجذاذات داخل الموقع من الملف المولَّد `src/data/jadadatFiles.ts`.
أمّا هذان الملفان فهما جاهزان إن رُبط الموقع لاحقًا بـ Supabase (أو أي PostgreSQL).

| الملف | المحتوى |
| --- | --- |
| `fiches_pedagogiques.sql` | إنشاء الجدول + الفهارس + 25 سجلًا (جذاذات التاريخ والجغرافيا) |
| `fiches_pedagogiques.json` | السجلات نفسها بصيغة JSON (للاستيراد أو لاختبار واجهة قبل ربط القاعدة) |
| `jadadat_prepared.sql` | جدول **الجذاذات المُعدَّة** (25 جذاذة): الكفايات، الإشكالية، المقاطع (jsonb)، عدد الحصص، `pdf_url`، ومصدر المضامين |
| `jadadat_prepared.json` | السجلات نفسها بصيغة JSON |

## طريقة التشغيل

```bash
psql "$SUPABASE_DB_URL" -f supabase/fiches_pedagogiques.sql
```

أو الصق محتوى `fiches_pedagogiques.sql` في **SQL Editor** داخل لوحة Supabase ثم نفّذه.

## الحقول (مطابقة لدفتر التحملات)

`id` · `title` · `level` (= «جذع مشترك علمي») · `subject` (= «التاريخ» أو «الجغرافيا»،
مع `check` يمنع أي قيمة أخرى) · `semester` · `lesson_number` · `sessions_count` ·
`description` · `pdf_url` · `keywords` · `created_at` · `updated_at`

## ملاحظات أمانة البيانات

- **لا قيمة مؤلَّفة:** `sessions_count` مُعبَّأ فقط للجذاذات التي ورد فيها عدد الحصص فعلًا في
  الوثيقة الأصلية (8 من 25)، و`NULL` فيما عداها. وكذلك `pdf_url`: مُعبَّأ فقط حيث توجد نسخة
  PDF حقيقية (17 من 25).
- `pdf_url` مسار **نسبي داخل الموقع** (`/files/jadadat/joth3-mochtrak-scientifique/…`).
  إن استُعمل Supabase Storage بدلًا من مجلد `public/`، يكفي استبدال بادئة المسار برابط
  الحزمة (bucket) مع إبقاء اسم الملف الأصلي كما هو.
- `created_at` هو تاريخ إضافة وثائق الأستاذ إلى المستودع (`6a94e93` — 2026-09-17)، لا تاريخ
  تحرير وهمي.
- الملفات نفسها داخل المستودع روابط رمزية (symlink) إلى مجلد
  «جذع مسترك شعبة علوم تجريبية» حفاظًا على الاسم الأصلي وعلى وزن المستودع؛ البناء
  (`npm run build`) ينسخها ملفات حقيقية داخل `dist/files/…`.

## الجدول الثاني: `jadadat_prepared` (الجذاذات المُعدَّة)

قسم «الجذاذات المُعدَّة» في الموقع يُركَّب في زمن التشغيل من دروس الموقع المنشورة
+ مرجعية التوجيهات التربوية (`src/lib/preparedJadadat.ts`)، فلا يحتاج قاعدة بيانات.
الجدول المُصدَّر هنا نسخة قابلة للاستعلام إن رغبت في ذلك، ويختلف عن
`fiches_pedagogiques` في:

- `status = 'prepared'` (تمييز صريح عن جذاذات الأستاذ الأصلية)؛
- `stages jsonb` يحمل مقاطع الجذاذة كاملة (المرحلة، أهداف التعلم، التدبير
  الديداكتيكي، الدعامات، المتن)؛
- `content_source` و`didactic_source` يُعلنَان مصدر المضامين ومصدر الصياغة
  الديداكتيكية؛
- `sessions_count` و`pdf_url` من وثائق الأستاذ حيثما وُجدت، وإلا `NULL`.

```bash
psql "$SUPABASE_DB_URL" -f supabase/jadadat_prepared.sql
```

## إعادة التوليد

كل هذه الملفات مولَّدة آليًا ولا تُعدَّل يدويًا:

```bash
# مكتبة ملفات الجذاذات (82 ملفًا أصليًا) ← fiches_pedagogiques.sql/.json
./node_modules/.bin/esbuild scripts/build-jadadat-files.tsx --bundle --platform=node \
  --format=cjs --loader:.css=empty --outfile=/tmp/gen.cjs && node /tmp/gen.cjs

# الجذاذات المُعدَّة (25 جذاذة) ← jadadat_prepared.sql/.json
./node_modules/.bin/esbuild scripts/export-prepared-jadadat.tsx --bundle --platform=node \
  --format=cjs --loader:.css=empty --outfile=/tmp/xp.cjs && node /tmp/xp.cjs
```
