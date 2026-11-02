/* ================================================================
   GIS المياه — منطق الواجهة التعريفية (Intro / Onboarding)
   تظهر قبل شاشة تسجيل الدخول، وتُخفى عند:
     • الضغط على «ابدأ الآن» أو «تخطي»
     • نجاح الدخول / استعادة الجلسة  (window.GisIntro.hide())
   وتُعاد من زر «تعرّف على التطبيق» داخل شاشة تسجيل الدخول،
   أو بفتح الرابط مع  ?intro=1
   ================================================================ */
(function () {
    'use strict';

    var el = document.getElementById('gisIntro');
    if (!el) { return; }

    var KEY = 'gisIntroSeen';
    var hideTimer = null;

    function markSeen() {
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    }

    function isVisible() {
        return !!el && el.style.display !== 'none' && el.parentNode !== null;
    }

    function hide(fast) {
        if (!isVisible()) { return; }
        markSeen();
        document.body.classList.remove('gi-on');

        function done() {
            el.style.display = 'none';
            el.classList.remove('gi-out');
        }

        if (fast) { done(); return; }

        el.classList.add('gi-out');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(done, 340);
    }

    function show() {
        if (!el) { return; }
        clearTimeout(hideTimer);
        el.style.display = 'flex';
        el.classList.remove('gi-out');
        document.body.classList.add('gi-on');
        var wrap = el.querySelector('.gi-wrap');
        if (wrap) { wrap.scrollTop = 0; }
    }

    function openInstall() {
        if (window.GisInstall && typeof window.GisInstall.install === 'function') {
            window.GisInstall.install();
        } else if (window.GisInstall && typeof window.GisInstall.show === 'function') {
            window.GisInstall.show();
        }
    }

    function boot() {
        /* الحالة الابتدائية: الظهور إلا إذا سبق عرضها في نفس الجلسة */
        if (el.style.display === 'none') {
            document.body.classList.remove('gi-on');
        } else {
            document.body.classList.add('gi-on');
        }

        var start = document.getElementById('gisIntroStart');
        var skip = document.getElementById('gisIntroSkip');
        var install = document.getElementById('gisIntroInstall');

        if (start) { start.addEventListener('click', function () { hide(); }); }
        if (skip) { skip.addEventListener('click', function () { hide(); }); }
        if (install) { install.addEventListener('click', openInstall); }

        /* Esc = تخطي */
        document.addEventListener('keydown', function (e) {
            if ((e.key === 'Escape' || e.keyCode === 27) && isVisible()) { hide(); }
        });

        /* لو فتح المستخدم ?intro=1 نضمن ظهورها فوق أي حالة سابقة */
        if (/[?&]intro=1/.test(location.search) && !isVisible()) { show(); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    /* واجهة استخدام من خارج الملف */
    window.GisIntro = { show: show, hide: hide, isVisible: isVisible };
})();
