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

مهم بخصوص نتائج التلاميذ:
النسخة الحالية تحفظ النتائج في localStorage داخل المتصفح. هذا مناسب للمعاينة
والاستعمال على نفس الجهاز، لكنه لا يوفر قاعدة نتائج مركزية مشتركة بين أجهزة
التلاميذ والأستاذ. التخزين المركزي يتطلب Backend/قاعدة بيانات منفصلة.
