/*
 * إعدادات التشغيل للموقع المنشور كملفات ثابتة.
 *
 * عند رفع dist أو site-talil-imad.zip يدويًا إلى Hostinger، عدّل القيم أدناه
 * بدل إعادة البناء. استعمل anon public key فقط، ولا تضع service_role هنا.
 * يجب أن يطابق publicSiteKey المفتاح الموجود في Supabase داخل
 * public.teacher_public_keys والمربوط بحساب الأستاذ.
 */
window.__LYCEUM_RUNTIME_CONFIG__ = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  publicSiteKey: "",
  teacherEmail: "",
};
