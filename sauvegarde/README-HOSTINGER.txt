نسخ احتياطية الموقع — 21/09/2026

1) site-talil-imad.zip
   النسخة الكاملة الجاهزة للنشر على Hostinger أو Netlify.
   تحتوي على index.html في الجذر، وجميع ملفات public المنشورة، وQR،
   والتقارير، وملفات الجذاذات، وSEO routes.

   Hostinger:
   - فك الضغط.
   - ارفع محتويات المجلد الذي يحتوي index.html مباشرة إلى public_html.

   Netlify:
   - فك الضغط.
   - من https://app.netlify.com/ اختر Add new site ثم Deploy manually.
   - اسحب المجلد الذي يحتوي index.html.
   - رابط لوحة الأستاذ بعد النشر:
     https://courstalil.netlify.app/#/dashboard

2) site-talil-imad-source.zip
   نسخة المصدر الكاملة للتطوير وإعادة البناء.

3) rapport-demo-inspecteur.html
   نموذج تقرير «تقرير التقويم الشخصي للمفتش» مُنجز من بيانات Demo المعزولة.
   للمعاينة والتجربة فقط، ولا يمثل نتائج مركزية حقيقية.

حفظ نتائج التلاميذ والتقارير:
- النسخة تدعم قاعدة بيانات مركزية عبر Supabase، وتحتوي على كود الإرسال والجلب
  وسياسات RLS في: supabase/migrations/001_inspector_reports.sql
- قبل النشر، أنشئ حساب الأستاذ في Supabase، نفّذ ملف SQL، واضبط متغيرات
  VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY و VITE_PUBLIC_SITE_KEY
  و VITE_SUPABASE_TEACHER_EMAIL في إعدادات البناء. يجب أيضًا ربط
  VITE_PUBLIC_SITE_KEY بUUID حساب الأستاذ في جدول teacher_public_keys.
  التفاصيل في docs/inspector-reports.md داخل نسخة المصدر.
- عند تفعيل Supabase/Auth، تُرسل نتائج التلاميذ إلى قاعدة مركزية وتظهر في
  لوحة الأستاذ من الأجهزة المختلفة، وتحفظ تقارير المفتش مع مالكها ونسخة HTML.
- إذا نُشرت النسخة دون متغيرات Supabase، يعمل الموقع في وضع المعاينة المحلي
  فقط ويصرّح بذلك داخل اللوحة؛ لا تعتبر localStorage قاعدة بيانات دائمة.

ملاحظة GitHub:
site-talil-imad.zip حجمه يتجاوز 100MB، لذلك يبقى داخل مساحة النسخ الاحتياطي
وخارج GitHub كملف Git عادي. نسخة المصدر وحدها محفوظة داخل مجلد sauvegarde.
