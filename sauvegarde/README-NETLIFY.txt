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
  VITE_SUPABASE_TEACHER_EMAIL
ثم أعد Deploy للموقع. عندها تُرسل نتائج التقويم إلى قاعدة البيانات وتظهر
في لوحة الأستاذ من أي جهاز، ويحفظ تبويب «تقارير المفتش» نسخة التقرير ونتائجها
المرتبطة مع RLS. توجد كل خطوات الإعداد في docs/inspector-reports.md داخل
نسخة المصدر.

إذا لم تُضبط متغيرات Supabase، تعمل النسخة في وضع المعاينة المحلي فقط؛
لا تعتمد على localStorage كحفظ مركزي دائم ولا تدّعي الواجهة خلاف ذلك.
