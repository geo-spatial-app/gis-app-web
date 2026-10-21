/* ================================================================
   إعدادات النشر الثابتة — Publish-time Supabase settings
   ----------------------------------------------------------------
   هذا الملف يُحمَّل قبل js/gis-supabase.js ويوفّر إعدادات الاتصال
   الثابتة حتى لا يحتاج المستخدم لإدخالها يدويًا بعد أي تحديث للصفحة
   أو إعادة فتح المتصفح أو تحديث الجلسة.

   الأمان: يُستخدم المفتاح العام فقط (anon / publishable).
   ممنوع وضع service_role أو أي مفتاح سري هنا — الحماية عبر RLS.

   ملف هذا الإعداد مقصود أن يكون عامًا (منشور مع الموقع).
   ================================================================ */
window.GIS_SUPABASE_CONFIG = {
    /* Project URL — Supabase → Project Settings → API → Project URL */
    url: 'https://fkwpxintxuvvpxiyurs.supabase.co',

    /* anon public / publishable key — Supabase → Project Settings → API
       (الصيغ الجديدة: sb_publishable_... أو JWT eyJhbGciOi...)
       يبقى فارغًا = لن يعمل الاتصال تلقائيًا وسيظهر نموذج الإدخال. */
    key: 'sb_publishable_wlrPexOz6n_dJrD80h7MMA_qE0XVN7R',

    /* رابط إعادة التوجيه بعد تسجيل الدخول بجوجل/جيت هب.
       يجب أن يكون نفسه في: Supabase → Authentication → URL Configuration → Redirect URLs
       ونفسه في Google Cloud → Authorized redirect URIs (الجذر منه: .../auth/v1/callback) */
    redirectUrl: 'https://geo-spatial-app.github.io/gis-app-web/',

    /* اسم التطبيق الظاهر في رسايل Supabase */
    appName: 'GIS Water'
};
