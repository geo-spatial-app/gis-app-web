/* ==========================================================================
   منصة جغرافية — مبدّل الوضع (فاتح / داكن)
   - يحفظ الاختيار في localStorage تحت الاسم gisTheme
   - "auto" يتبع إعداد الجهاز
   - يضبط data-theme على <html> ويحدّث لون شريط المتصفح
   ========================================================================== */
(function () {
    'use strict';

    var KEY = 'gisTheme';           // 'light' | 'dark' | 'auto'
    var root = document.documentElement;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function read() {
        try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; }
    }

    function save(v) {
        try { localStorage.setItem(KEY, v); } catch (e) {}
    }

    function isDark(mode) {
        if (mode === 'dark') { return true; }
        if (mode === 'auto') { return !!(mq && mq.matches); }
        return false;
    }

    function paintButton(dark) {
        var btn = document.getElementById('themeToggle');
        if (!btn) { return; }
        btn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.setAttribute('aria-label', dark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
        btn.setAttribute('title', dark ? 'الوضع النهاري' : 'الوضع الليلي');
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }

    function apply(mode) {
        var dark = isDark(mode);
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (document.body) { document.body.classList.toggle('theme-light', !dark); }
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) { meta.setAttribute('content', dark ? '#04121f' : '#0a2a44'); }
        paintButton(dark);
        return dark;
    }

    function set(mode) {
        save(mode);
        apply(mode);
        try { document.dispatchEvent(new CustomEvent('gis:themechange', { detail: { mode: mode } })); } catch (e) {}
    }

    function toggle() {
        set(isDark(read()) ? 'light' : 'dark');
    }

    /* التطبيق المبكر (قبل الرسم) */
    var current = read();
    root.setAttribute('data-theme', isDark(current) ? 'dark' : 'light');

    window.GisTheme = {
        get: function () { return read(); },
        isDark: function () { return isDark(read()); },
        set: set,
        toggle: toggle,
        apply: apply
    };

    function init() {
        apply(read());
        var btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                toggle();
            });
        }
        /* اتباع تغيير النظام لو الاختيار auto */
        if (mq) {
            var onChange = function () { if (read() === 'auto') { apply('auto'); } };
            if (mq.addEventListener) { mq.addEventListener('change', onChange); }
            else if (mq.addListener) { mq.addListener(onChange); }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
