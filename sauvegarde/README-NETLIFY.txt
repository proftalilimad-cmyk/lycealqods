نشر النسخة الكاملة على Netlify

الملف:
  sauvegarde/site-talil-imad.zip

الخطوات:
1. فك الضغط.
2. افتح https://app.netlify.com/ وسجّل الدخول إلى الحساب الصحيح.
3. اختر Add new site ثم Deploy manually.
4. اسحب المجلد الذي يحتوي index.html إلى Netlify.
5. افتح:
   https://courstalil.netlify.app/#/dashboard

لرفع تحديث لاحق، استعمل الأرشيف الجديد بنفس الطريقة أو اربط الموقع
بمستودع GitHub مع إعداد البناء:
  Build command: npm run build
  Publish directory: dist

مهم بخصوص نتائج التلاميذ وتقارير المفتش:
النسخة تدعم التخزين المركزي عبر Supabase. بعد إنشاء المشروع وتنفيذ:
  supabase/migrations/001_inspector_reports.sql
أضف في Netlify → Site configuration → Environment variables:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_PUBLIC_SITE_KEY
  VITE_SUPABASE_TEACHER_EMAIL

إذا أنشأ تكامل Supabase أسماءً بديلة، يدعم البناء الحالي أيضًا:
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_PUBLIC_SITE_KEY
  SUPABASE_TEACHER_EMAIL

ويدعم كذلك أسماء الإرشادات الشائعة:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  NEXT_PUBLIC_SITE_KEY

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` لا يعوّض `publicSiteKey`؛ يجب إنشاء
مفتاح الإرسال المنفصل وربطه بحساب الأستاذ في `teacher_public_keys`.
لا تضع SUPABASE_SERVICE_ROLE_KEY في الواجهة أو المستودع.
ثم أعد Deploy للموقع. يجب أن يكون VITE_PUBLIC_SITE_KEY
في جدول teacher_public_keys. عندها تُرسل نتائج التقويم مباشرة بعد الإنهاء إلى
قاعدة البيانات وتظهر في لوحة الأستاذ من أي جهاز، ويحفظ تبويب «تقارير المفتش»
نسخة التقرير ونتائجها المرتبطة مع RLS. توجد كل خطوات الإعداد في
`docs/inspector-reports.md` داخل نسخة المصدر.

إذا كان الرفع يدويًا من أرشيف ثابت، عدّل الملف `runtime-config.js` الموجود بجانب
`index.html` بعد فك الضغط وضع فيه `supabaseUrl` و`supabaseAnonKey` و`publicSiteKey`
و`teacherEmail`. لا تحتاج إلى إعادة البناء بعد ذلك. لا تضع `service_role` في هذا
الملف.

إذا لم تُضبط متغيرات Supabase أو `runtime-config.js`، يمنع الموقع بدء التقويم
الحقيقي ولا يدّعي حفظ النتيجة؛ لا تعتمد على localStorage كحفظ مركزي دائم.
