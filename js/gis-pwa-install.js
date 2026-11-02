/* ================================================================
   GIS PWA — تثبيت التطبيق على الجهاز (Install / Add to Home Screen)
   المؤلف: أ / أحمد محسوب
   الإصدار: 2.0 — واجهة تثبيت متقدمة (Glass / Stepper / Platform-aware)

   الهدف: زر «تثبيت» يظهر دائماً (لا يعتمد فقط على beforeinstallprompt)
   مع إرشادات تلقائية لكل منصة:
     • Android / Chrome  → تثبيت مباشر أو قائمة المتصفح
     • iPhone / Safari   → مشاركة ← إضافة إلى الشاشة الرئيسية
     • سطح المكتب        → أيقونة التثبيت في شريط العنوان
     • متصفحات واتساب/فيسبوك/إنستغرام → فتح الرابط في المتصفح أولاً
   ================================================================ */
(function () {
    'use strict';
    if (window.__gisPwaInstallLoaded) { return; }
    window.__gisPwaInstallLoaded = true;

    var DISMISS_KEY = 'gisPwaInstallDismissedAt';
    var DISMISS_DAYS = 7;
    var INSTALLED_KEY = 'gisPwaInstalled';

    var promptEvent = window.__gisInstallPrompt || null;
    var modal = null;
    var toastTimer = null;
    var keyHandler = null;

    /* ---------------- أدوات مساعدة ---------------- */
    function ua() { return navigator.userAgent || ''; }

    function isStandalone() {
        try {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   window.matchMedia('(display-mode: fullscreen)').matches ||
                   window.matchMedia('(display-mode: minimal-ui)').matches ||
                   window.navigator.standalone === true;
        } catch (e) { return false; }
    }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(ua()) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    function isAndroid() { return /Android/i.test(ua()); }

    function isInAppBrowser() {
        var u = ua();
        return /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|Twitter|MicroMessenger/i.test(u) ||
               (/Android/i.test(u) && /;\s*wv\s*\)/i.test(u));
    }

    function appName() {
        var u = ua();
        if (/WhatsApp/i.test(u)) { return 'واتساب'; }
        if (/Instagram/i.test(u)) { return 'إنستغرام'; }
        if (/FBAN|FBAV|FB_IAB/i.test(u)) { return 'فيسبوك'; }
        if (/TikTok|musical_ly/i.test(u)) { return 'تيك توك'; }
        if (/Snapchat/i.test(u)) { return 'سناب شات'; }
        if (/Line\//i.test(u)) { return 'لاين'; }
        if (/Twitter/i.test(u)) { return 'تويتر / X'; }
        return 'أحد تطبيقات التواصل';
    }

    function browserName() {
        var u = ua();
        if (/Edg\//i.test(u)) { return 'Edge'; }
        if (/OPR\/|Opera/i.test(u)) { return 'Opera'; }
        if (/SamsungBrowser/i.test(u)) { return 'Samsung Internet'; }
        if (/Firefox|FxiOS/i.test(u)) { return 'Firefox'; }
        if (/CriOS/i.test(u)) { return 'Chrome'; }
        if (/Safari/i.test(u) && !/Chrome|Chromium/i.test(u)) { return 'Safari'; }
        if (/Chrome|Chromium/i.test(u)) { return 'Chrome'; }
        return 'المتصفح';
    }

    function platformChip() {
        if (isInAppBrowser()) {
            return { icon: 'fa-comment-dots', label: appName() + ' • متصفح داخلي', tone: 'warn' };
        }
        if (isIOS()) {
            return { icon: 'fa-apple-whole', label: 'iPhone / iPad • ' + browserName(), tone: 'ok' };
        }
        if (isAndroid()) {
            return { icon: 'fa-robot', label: 'Android • ' + browserName(), tone: 'ok' };
        }
        return { icon: 'fa-desktop', label: 'سطح المكتب • ' + browserName(), tone: 'ok' };
    }

    function dismissedRecently() {
        try {
            if (localStorage.getItem(INSTALLED_KEY) === '1') { return true; }
            var t = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
            if (!t) { return false; }
            return (Date.now() - t) < (DISMISS_DAYS * 24 * 60 * 60 * 1000);
        } catch (e) { return false; }
    }

    function rememberDismiss() {
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
    }

    function forgetDismiss() {
        try { localStorage.removeItem(DISMISS_KEY); } catch (e) {}
    }

    function currentUrl() {
        return location.origin + location.pathname.replace(/[^/]*$/, '');
    }

    /* ---------------- الأنماط ---------------- */
    function injectStyles() {
        if (document.getElementById('gisPwaStyles')) { return; }
        var css = `
/* ===== زر التثبيت العائم ===== */
#installAppBtn{
    position:fixed; bottom:18px; right:18px; z-index:11500;
    display:inline-flex; align-items:center; gap:10px;
    padding:12px 18px 12px 16px; border:0; border-radius:999px; cursor:pointer;
    font-family:Tajawal,system-ui,sans-serif; font-size:13.5px; font-weight:800; line-height:1;
    color:#03181c;
    background:linear-gradient(135deg,#5eead4 0%,#14b8ae 45%,#0d9488 100%);
    box-shadow:0 14px 34px -10px rgba(20,184,174,.75), 0 2px 0 rgba(255,255,255,.35) inset;
    transition:transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;
    animation:gisPwaBtnIn .5s cubic-bezier(.22,1,.36,1) both;
    overflow:hidden;
    -webkit-tap-highlight-color:transparent;
}
#installAppBtn:hover{transform:translateY(-3px); box-shadow:0 20px 42px -12px rgba(20,184,174,.9), 0 2px 0 rgba(255,255,255,.4) inset;}
#installAppBtn:active{transform:translateY(-1px) scale(.985);}
#installAppBtn .ipa-ico{
    display:flex; align-items:center; justify-content:center;
    width:28px; height:28px; border-radius:50%;
    background:rgba(3,24,28,.14); font-size:13px;
}
#installAppBtn .ipa-live{
    width:7px; height:7px; border-radius:50%; background:#03181c; opacity:.55; position:relative;
}
#installAppBtn .ipa-live::after{
    content:''; position:absolute; inset:-3px; border-radius:50%;
    border:1.5px solid rgba(3,24,28,.45); animation:gisPwaPulse 2s ease-out infinite;
}
#installAppBtn::before{
    content:''; position:absolute; inset:0; border-radius:inherit;
    background:linear-gradient(120deg,transparent 20%,rgba(255,255,255,.55) 42%,transparent 62%);
    transform:translateX(-120%); animation:gisPwaShine 4.5s ease-in-out infinite; pointer-events:none;
}

/* ===== الطبقة الخلفية ===== */
#gisPwaOverlay{
    position:fixed; inset:0; z-index:11600; padding:18px;
    display:flex; align-items:center; justify-content:center;
    background:radial-gradient(120% 80% at 50% 0%, rgba(13,148,136,.22), transparent 60%), rgba(2,8,16,.72);
    -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
    font-family:Tajawal,system-ui,sans-serif; direction:rtl;
    animation:gisPwaFade .22s ease both;
}

/* ===== البطاقة ===== */
#gisPwaCard{
    position:relative; width:100%; max-width:465px; max-height:90vh; overflow:auto;
    border-radius:26px; color:#e8f1f8;
    background:linear-gradient(180deg,#0b1a2b 0%,#081422 55%,#071120 100%);
    box-shadow:0 40px 90px -30px rgba(0,0,0,.95), 0 0 0 1px rgba(94,234,212,.14) inset;
    animation:gisPwaPop .32s cubic-bezier(.22,1,.36,1) both;
    scrollbar-width:thin; scrollbar-color:rgba(94,234,212,.35) transparent;
}
#gisPwaCard::before{
    content:''; position:absolute; inset:0; border-radius:inherit; padding:1px; pointer-events:none;
    background:linear-gradient(150deg,rgba(94,234,212,.65),rgba(56,189,248,.18) 38%,transparent 62%);
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite:xor; mask-composite:exclude;
}
#gisPwaCard::after{
    content:''; position:absolute; top:-40%; inset-inline-start:-20%; width:70%; height:70%;
    background:radial-gradient(circle, rgba(20,184,174,.20), transparent 65%); pointer-events:none;
}
#gisPwaCard .pwa-grip{display:none;}

/* ===== الرأس ===== */
#gisPwaCard .pwa-head{
    position:relative; display:flex; align-items:center; gap:13px;
    padding:20px 22px 16px;
}
#gisPwaCard .pwa-appicon{
    position:relative; flex:0 0 auto; width:54px; height:54px; border-radius:16px;
    background:linear-gradient(145deg,#0f2f44,#0a1e30); padding:5px;
    box-shadow:0 10px 24px -10px rgba(0,0,0,.9), 0 0 0 1px rgba(94,234,212,.22) inset;
}
#gisPwaCard .pwa-appicon img{
    width:100%; height:100%; border-radius:12px; object-fit:cover; display:block;
}
#gisPwaCard .pwa-appicon::after{
    content:''; position:absolute; inset:-4px; border-radius:20px; z-index:-1;
    background:conic-gradient(from 140deg,rgba(94,234,212,.55),rgba(56,189,248,.25),transparent 65%);
    filter:blur(7px); opacity:.8;
}
#gisPwaCard .pwa-titles{flex:1; min-width:0;}
#gisPwaCard .pwa-titles h3{
    margin:0; font-size:16.5px; font-weight:800; color:#fff; letter-spacing:.2px;
}
#gisPwaCard .pwa-titles p{
    margin:4px 0 0; font-size:11.5px; color:#8fa9bd; font-weight:500;
}
#gisPwaCard .pwa-close{
    flex:0 0 auto; width:32px; height:32px; border-radius:50%; cursor:pointer;
    background:rgba(255,255,255,.06); color:#a9c1d3; border:1px solid rgba(255,255,255,.10);
    display:flex; align-items:center; justify-content:center; font-size:13px;
    transition:background .18s, color .18s, transform .18s;
}
#gisPwaCard .pwa-close:hover{background:rgba(255,80,80,.16); color:#ffb4b4; transform:rotate(90deg);}

/* ===== شريحة المنصة ===== */
#gisPwaCard .pwa-platform{
    display:flex; align-items:center; gap:8px; flex-wrap:wrap;
    margin:0 22px 14px; padding:9px 12px; border-radius:12px;
    font-size:11.5px; font-weight:700; letter-spacing:.1px;
    background:rgba(94,234,212,.07); border:1px solid rgba(94,234,212,.18); color:#a9f0e5;
}
#gisPwaCard .pwa-platform.warn{
    background:rgba(250,204,21,.08); border-color:rgba(250,204,21,.30); color:#fde68a;
}
#gisPwaCard .pwa-platform .pwa-live{
    width:6px; height:6px; border-radius:50%; background:#4ade80; box-shadow:0 0 0 3px rgba(74,222,128,.18);
}
#gisPwaCard .pwa-platform.warn .pwa-live{background:#fbbf24; box-shadow:0 0 0 3px rgba(251,191,36,.18);}

/* ===== المزايا ===== */
#gisPwaCard .pwa-feats{
    display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:0 22px 16px;
}
#gisPwaCard .pwa-feat{
    padding:10px 6px; border-radius:12px; text-align:center;
    background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.055);
}
#gisPwaCard .pwa-feat i{display:block; font-size:14px; color:#5eead4; margin-bottom:5px;}
#gisPwaCard .pwa-feat span{font-size:10.5px; color:#93aec2; font-weight:600; line-height:1.5; display:block;}

/* ===== المسار/الخطوات ===== */
#gisPwaCard .pwa-body{padding:0 22px 4px;}
#gisPwaCard .pwa-note{
    display:flex; gap:9px; align-items:flex-start;
    background:rgba(250,204,21,.09); border:1px solid rgba(250,204,21,.28);
    color:#fde68a; border-radius:12px; padding:10px 12px;
    font-size:12px; line-height:1.85; margin-bottom:16px;
}
#gisPwaCard .pwa-note i{margin-top:2px; font-size:13px;}
#gisPwaCard .pwa-steps{position:relative; margin:0 0 4px; padding:0; list-style:none;}
#gisPwaCard .pwa-step{
    position:relative; display:flex; gap:12px; padding:0 0 16px 0;
    animation:gisPwaStep .36s cubic-bezier(.22,1,.36,1) both;
}
#gisPwaCard .pwa-step:last-child{padding-bottom:2px;}
#gisPwaCard .pwa-step::after{
    content:''; position:absolute; top:30px; inset-inline-start:13px;
    width:2px; height:calc(100% - 34px);
    background:linear-gradient(180deg, rgba(94,234,212,.35), rgba(94,234,212,.06));
}
#gisPwaCard .pwa-step:last-child::after{display:none;}
#gisPwaCard .pwa-num{
    flex:0 0 auto; width:28px; height:28px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:900; color:#04181c;
    background:linear-gradient(140deg,#5eead4,#14b8ae);
    box-shadow:0 6px 16px -6px rgba(20,184,174,.8);
}
#gisPwaCard .pwa-step-text{font-size:12.8px; line-height:1.9; color:#c8dbe8; padding-top:3px;}
#gisPwaCard .pwa-step-text b{color:#5eead4; font-weight:800;}
#gisPwaCard .pwa-step-text .kbd{
    display:inline-flex; align-items:center; gap:4px;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12);
    border-radius:6px; padding:1px 7px; font-size:11.5px; color:#fff; font-weight:700;
}

/* ===== التذييل / الأزرار ===== */
#gisPwaCard .pwa-foot{
    position:sticky; bottom:0; display:flex; flex-wrap:wrap; gap:9px;
    padding:16px 22px calc(18px + env(safe-area-inset-bottom, 0px));
    background:linear-gradient(180deg, rgba(7,17,32,0), rgba(7,17,32,.92) 40%);
}
#gisPwaCard .pwa-foot button{
    position:relative; overflow:hidden; cursor:pointer;
    min-height:46px; border:0; border-radius:14px;
    font-family:inherit; font-size:13.5px; font-weight:800; letter-spacing:.2px;
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    transition:transform .18s cubic-bezier(.22,1,.36,1), box-shadow .18s, background .18s;
    -webkit-tap-highlight-color:transparent;
}
#gisPwaCard .pwa-foot button:active{transform:scale(.985);}
#gisPwaCard .pwa-foot > button{flex:1 1 100%;}
#gisPwaCard .pwa-foot .pwa-primary{
    color:#04181c;
    background:linear-gradient(135deg,#5eead4,#14b8ae 55%,#0d9488);
    box-shadow:0 14px 30px -14px rgba(20,184,174,.95), 0 1px 0 rgba(255,255,255,.35) inset;
}
#gisPwaCard .pwa-foot .pwa-primary:hover{transform:translateY(-2px); box-shadow:0 18px 36px -14px rgba(20,184,174,1);}
#gisPwaCard .pwa-foot .pwa-primary::after{
    content:''; position:absolute; inset:0;
    background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.5) 48%,transparent 66%);
    transform:translateX(-130%); animation:gisPwaShine 3.4s ease-in-out infinite;
}
#gisPwaCard .pwa-foot .pwa-ghost{
    flex:1 1 0; min-width:110px; color:#c8dbe8;
    background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.12);
}
#gisPwaCard .pwa-foot .pwa-ghost:hover{background:rgba(255,255,255,.10); color:#fff;}
#gisPwaCard .pwa-foot .pwa-hint{
    flex:1 1 100%; text-align:center; font-size:10.5px; color:#7d95a8; font-weight:600; padding-top:2px;
}

/* ===== إشعار صغير ===== */
#gisPwaToast{
    position:fixed; right:18px; bottom:82px; z-index:11700;
    display:flex; align-items:center; gap:9px;
    background:linear-gradient(135deg,#0b1a2b,#0f2f44); color:#e8f1f8;
    border:1px solid rgba(94,234,212,.30); border-radius:14px; padding:11px 15px;
    font-family:Tajawal,sans-serif; font-size:12.5px; font-weight:700;
    box-shadow:0 20px 44px -16px rgba(0,0,0,.9);
    opacity:0; transform:translateY(10px) scale(.98);
    transition:opacity .24s ease, transform .24s cubic-bezier(.22,1,.36,1);
    pointer-events:none;
}
#gisPwaToast.show{opacity:1; transform:translateY(0) scale(1);}
#gisPwaToast i{color:#5eead4; font-size:14px;}

/* ===== الموبايل: Bottom Sheet ===== */
@media (max-width:520px){
    #installAppBtn{right:12px; bottom:calc(12px + env(safe-area-inset-bottom, 0px)); padding:11px 15px 11px 13px; font-size:12.5px;}
    #gisPwaOverlay{align-items:flex-end; padding:0;}
    #gisPwaCard{
        max-width:100%; max-height:92vh; border-radius:24px 24px 0 0;
        animation:gisPwaSheet .34s cubic-bezier(.22,1,.36,1) both;
    }
    #gisPwaCard .pwa-grip{
        display:block; width:44px; height:4px; border-radius:99px;
        background:rgba(255,255,255,.18); margin:10px auto 0;
    }
    #gisPwaCard .pwa-head{padding:14px 18px 12px;}
    #gisPwaCard .pwa-platform, #gisPwaCard .pwa-feats, #gisPwaCard .pwa-body{margin-inline:18px;}
    #gisPwaCard .pwa-body{padding:0 18px 4px;}
    #gisPwaCard .pwa-foot{padding:14px 18px calc(16px + env(safe-area-inset-bottom, 0px));}
    #gisPwaToast{right:12px; left:12px; bottom:calc(84px + env(safe-area-inset-bottom, 0px)); justify-content:center;}
}

/* ===== حركات ===== */
@keyframes gisPwaFade{from{opacity:0}to{opacity:1}}
@keyframes gisPwaPop{from{opacity:0; transform:translateY(14px) scale(.97)}to{opacity:1; transform:none}}
@keyframes gisPwaSheet{from{opacity:0; transform:translateY(100%)}to{opacity:1; transform:none}}
@keyframes gisPwaBtnIn{from{opacity:0; transform:translateY(16px) scale(.92)}to{opacity:1; transform:none}}
@keyframes gisPwaStep{from{opacity:0; transform:translateX(10px)}to{opacity:1; transform:none}}
@keyframes gisPwaPulse{0%{transform:scale(.7); opacity:.7}70%{transform:scale(1.5); opacity:0}100%{opacity:0}}
@keyframes gisPwaShine{0%,65%{transform:translateX(-130%)}100%{transform:translateX(130%)}}

@media (prefers-reduced-motion: reduce){
    #installAppBtn, #gisPwaCard, #gisPwaOverlay, #gisPwaCard .pwa-step{animation:none !important;}
    #installAppBtn::before, #gisPwaCard .pwa-foot .pwa-primary::after,
    #installAppBtn .ipa-live::after{animation:none !important;}
}
`;
        var st = document.createElement('style');
        st.id = 'gisPwaStyles';
        st.textContent = css;
        document.head.appendChild(st);
    }

    /* ---------------- إشعار صغير ---------------- */
    function toast(msg) {
        var t = document.getElementById('gisPwaToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'gisPwaToast';
            document.body.appendChild(t);
        }
        t.innerHTML = '<i class="fas fa-circle-check"></i><span></span>';
        t.querySelector('span').textContent = msg;
        // إعادة تشغيل الحركة
        t.classList.remove('show');
        void t.offsetWidth;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3400);
    }

    /* ---------------- زر التثبيت ---------------- */
    function ensureButton() {
        if (isStandalone() || document.getElementById('installAppBtn')) { return; }
        injectStyles();
        var btn = document.createElement('button');
        btn.id = 'installAppBtn';
        btn.type = 'button';
        btn.title = 'تثبيت التطبيق على جهازك';
        btn.innerHTML =
            '<span class="ipa-ico"><i class="fas fa-arrow-down-to-bracket"></i></span>' +
            '<span>تثبيت التطبيق</span>' +
            '<span class="ipa-live"></span>';
        btn.addEventListener('click', onButtonClick);
        document.body.appendChild(btn);
    }

    function removeButton() {
        var b = document.getElementById('installAppBtn');
        if (b && b.parentNode) { b.parentNode.removeChild(b); }
    }

    function onButtonClick() {
        if (promptEvent) { doInstall(); }
        else { openModal(); }
    }

    /* ---------------- التثبيت المباشر (Chrome/Edge) ---------------- */
    function doInstall() {
        if (!promptEvent) { openModal(); return; }
        var ev = promptEvent;
        promptEvent = null;
        try {
            ev.prompt();
            ev.userChoice.then(function (choice) {
                if (choice && choice.outcome === 'accepted') {
                    try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
                    toast('تم تثبيت التطبيق بنجاح');
                    removeButton();
                    closeModal();
                } else {
                    toast('لم يكتمل التثبيت — جرّب من قائمة المتصفح');
                }
            }).catch(function () { openModal(); });
        } catch (e) {
            promptEvent = ev;
            openModal();
        }
    }

    /* ---------------- محتوى الخطوات ---------------- */
    function steps() {
        if (isInAppBrowser()) {
            return {
                note: 'أنت تفتح الرابط الآن داخل <b>' + appName() + '</b> — هذا المتصفح الداخلي لا يسمح بتثبيت التطبيقات.',
                items: [
                    'اضغط زر القائمة <span class="kbd">⋯</span> في أعلى الشاشة أو أسفلها.',
                    'اختر <b>فتح في المتصفح</b> — Open in browser.',
                    'بعد فتح الرابط في المتصفح اضغط <b>تثبيت التطبيق</b> مرة أخرى.'
                ]
            };
        }
        if (isIOS()) {
            return {
                note: '',
                items: [
                    'افتح الرابط في متصفح <b>Safari</b> (وليس داخل تطبيق آخر).',
                    'اضغط زر المشاركة <span class="kbd">⬆︎</span> في شريط Safari.',
                    'اختر <b>إضافة إلى الشاشة الرئيسية</b> — Add to Home Screen.',
                    'اضغط <b>إضافة</b> وسيظهر التطبيق كأيقونة على جهازك.'
                ]
            };
        }
        if (isAndroid()) {
            return {
                note: '',
                items: [
                    'افتح الرابط في متصفح <b>Chrome</b>.',
                    'اضغط قائمة <span class="kbd">⋮</span> أعلى يمين المتصفح.',
                    'اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>.',
                    'أكّد الضغط على <b>تثبيت</b>.'
                ]
            };
        }
        return {
            note: '',
            items: [
                'افتح الرابط في متصفح <b>Chrome</b> أو <b>Edge</b> على الكمبيوتر.',
                'اضغط أيقونة <b>التثبيت</b> في شريط العنوان.',
                'أو من القائمة <span class="kbd">⋮</span> اختر <b>تثبيت التطبيق</b> — Install app.',
                'أكّد <b>تثبيت</b> ليعمل التطبيق في نافذة مستقلة.'
            ]
        };
    }

    /* ---------------- بناء النافذة ---------------- */
    function ensureModal() {
        if (modal) { return modal; }
        injectStyles();

        var overlay = document.createElement('div');
        overlay.id = 'gisPwaOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'gisPwaTitle');

        var card = document.createElement('div');
        card.id = 'gisPwaCard';

        var chip = platformChip();

        card.innerHTML =
            '<div class="pwa-grip"></div>' +
            '<div class="pwa-head">' +
                '<div class="pwa-appicon">' +
                    '<img src="icons/icon-192.png" alt="" onerror="this.style.display=\u0027none\u0027">' +
                '</div>' +
                '<div class="pwa-titles">' +
                    '<h3 id="gisPwaTitle">تثبيت منصة جغرافية</h3>' +
                    '<p>تطبيق ويب تقدمي • يعمل بدون إنترنت</p>' +
                '</div>' +
                '<button type="button" class="pwa-close" aria-label="إغلاق"><i class="fas fa-xmark"></i></button>' +
            '</div>' +
            '<div class="pwa-platform ' + (chip.tone === 'warn' ? 'warn' : '') + '">' +
                '<span class="pwa-live"></span>' +
                '<i class="fas ' + chip.icon + '"></i>' +
                '<span>' + chip.label + '</span>' +
            '</div>' +
            '<div class="pwa-feats">' +
                '<div class="pwa-feat"><i class="fas fa-plug-circle-xmark"></i><span>بدون إنترنت</span></div>' +
                '<div class="pwa-feat"><i class="fas fa-mobile-screen-button"></i><span>أيقونة على جهازك</span></div>' +
                '<div class="pwa-feat"><i class="fas fa-gauge-high"></i><span>تشغيل أسرع</span></div>' +
            '</div>' +
            '<div class="pwa-body"></div>' +
            '<div class="pwa-foot"></div>';

        overlay.appendChild(card);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) { closeModal(); }
        });
        card.querySelector('.pwa-close').addEventListener('click', function () { closeModal(true); });

        modal = { overlay: overlay, card: card, body: card.querySelector('.pwa-body'), foot: card.querySelector('.pwa-foot') };
        return modal;
    }

    function openModal() {
        forgetDismiss();
        var m = ensureModal();
        var data = steps();

        var html = '';
        if (data.note) {
            html += '<div class="pwa-note"><i class="fas fa-triangle-exclamation"></i><div>' + data.note + '</div></div>';
        }
        html += '<ol class="pwa-steps">';
        data.items.forEach(function (txt, i) {
            html += '<li class="pwa-step" style="animation-delay:' + (0.05 + i * 0.06).toFixed(2) + 's">' +
                        '<span class="pwa-num">' + (i + 1) + '</span>' +
                        '<div class="pwa-step-text">' + txt + '</div>' +
                    '</li>';
        });
        html += '</ol>';
        m.body.innerHTML = html;

        m.foot.innerHTML = '';
        var actions = [];

        if (promptEvent) {
            actions.push({ cls: 'pwa-primary', icon: 'fa-download', text: 'تثبيت الآن', fn: doInstall });
        }
        if (isAndroid() && isInAppBrowser()) {
            actions.push({
                cls: 'pwa-primary', icon: 'fa-chrome', text: 'فتح في Chrome',
                fn: function () {
                    var host = location.href.replace(/^https?:\/\//, '');
                    location.href = 'intent://' + host + '#Intent;scheme=https;package=com.android.chrome;end';
                }
            });
        }
        actions.forEach(function (a) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = a.cls;
            b.innerHTML = '<i class="fas ' + a.icon + '"></i> ' + a.text;
            b.addEventListener('click', a.fn);
            m.foot.appendChild(b);
        });

        var row = document.createElement('div');
        row.style.cssText = 'display:flex; gap:9px; width:100%;';

        var copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'pwa-ghost';
        copy.innerHTML = '<i class="fas fa-link"></i> نسخ الرابط';
        copy.addEventListener('click', copyLink);
        row.appendChild(copy);

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'pwa-ghost';
        close.innerHTML = '<i class="fas fa-xmark"></i> إغلاق';
        close.addEventListener('click', function () { closeModal(true); });
        row.appendChild(close);

        m.foot.appendChild(row);

        if (promptEvent) {
            var hint = document.createElement('div');
            hint.className = 'pwa-hint';
            hint.textContent = 'سيظهر مربع تأكيد من المتصفح — اضغط «تثبيت»';
            m.foot.appendChild(hint);
        }

        document.body.appendChild(m.overlay);
        keyHandler = function (e) { if (e.key === 'Escape' || e.keyCode === 27) { closeModal(true); } };
        document.addEventListener('keydown', keyHandler);
    }

    function closeModal(byUser) {
        var m = modal;
        if (m && m.overlay && m.overlay.parentNode) { m.overlay.parentNode.removeChild(m.overlay); }
        if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
        if (byUser) { rememberDismiss(); }
    }

    function copyLink() {
        var url = currentUrl();
        function done() { toast('تم نسخ الرابط — افتحه في المتصفح'); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(done).catch(fallback);
        } else { fallback(); }
        function fallback() {
            try {
                var ta = document.createElement('textarea');
                ta.value = url;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                done();
            } catch (e) { toast('انسخ الرابط من شريط العنوان'); }
        }
    }

    /* ---------------- تسجيل Service Worker ---------------- */
    function registerSW() {
        if (!('serviceWorker' in navigator)) { return; }
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { return; }

        var refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshing) { location.reload(); }
        });

        navigator.serviceWorker.register('sw.js').then(function (reg) {
            setInterval(function () { reg.update(); }, 6 * 60 * 60 * 1000);
            reg.addEventListener('updatefound', function () {
                var nw = reg.installing;
                if (!nw) { return; }
                nw.addEventListener('statechange', function () {
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                        refreshing = true;
                        try { nw.postMessage('SKIP_WAITING'); } catch (e) {}
                        setTimeout(function () { if (refreshing) { location.reload(); } }, 800);
                    }
                });
            });
        }).catch(function (e) {
            if (window.console && console.warn) { console.warn('تعذّر تسجيل Service Worker:', e); }
        });
    }

    /* ---------------- التشغيل ---------------- */
    function boot() {
        registerSW();

        if (isStandalone()) {
            try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
            return;
        }

        try { localStorage.removeItem(INSTALLED_KEY); } catch (e) {}

        if (!dismissedRecently()) { setTimeout(ensureButton, 1200); }

        window.addEventListener('gis:installprompt', function () {
            if (!isStandalone()) { ensureButton(); }
        });

        window.addEventListener('appinstalled', function () {
            try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (e) {}
            removeButton();
            closeModal();
            toast('تم تثبيت التطبيق بنجاح');
        });

        try {
            window.matchMedia('(display-mode: standalone)').addEventListener('change', function (e) {
                if (e.matches) { removeButton(); } else { forgetDismiss(); ensureButton(); }
            });
        } catch (e) { /* متصفحات قديمة */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    /* واجهة للاستخدام من صفحات أخرى (مثل landing.html) */
    window.GisInstall = {
        show: function () { openModal(); },
        install: function () { if (promptEvent) { doInstall(); } else { openModal(); } },
        isStandalone: isStandalone
    };
})();
