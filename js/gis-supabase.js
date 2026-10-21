/* ================================================================
   GIS Cloud — Supabase backend (تسجيل دخول + مزامنة المشاريع)
   الوحدة العامة: window.GIS.cloud
   يعتمد على: js/gis-core.js (نظام الوحدات) + دالتي window.buildSavePayload / window.applyPayload
   ================================================================ */
(function () {
    'use strict';

    var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    var LS_URL = 'gisSbUrl';
    var LS_KEY = 'gisSbKey';
    var APP_VERSION = 'v42';
    var sessionOpenLogged = false;

    /* إعدادات النشر الثابتة (js/gis-config.js) — المصدر الأول دائمًا */
    var PUBLISHED = window.GIS_SUPABASE_CONFIG || {};
    var DEFAULT_URL = normUrl(PUBLISHED.url || '');
    var DEFAULT_KEY = normKey(PUBLISHED.key || '');

    var SB_URL = '';
    var SB_KEY = '';
    var configReady = false;
    var configReadyPromise = null;
    var storageOk = true;
    var client = null;
    var clientSig = '';
    var sdkPromise = null;
    var user = null;
    var projects = [];
    var projectsLoaded = false;
    var root = null;
    /* ما يكتبه المستخدم في نموذج الإعدادات (يُحفظ عند إعادة رسم الشاشة) */
    var draft = { url: null, key: null };

    // ---------- حالة المزامنة التلقائية ----------
    var LS_AUTOSYNC = 'gisAutoSync';
    var LS_SYNCPID = 'gisAutoSyncProjectId';
    var autoSyncOn = localStorage.getItem(LS_AUTOSYNC) === '1';
    var currentProjectId = localStorage.getItem(LS_SYNCPID) || '';
    var syncTimer = null;
    var lastSyncAt = 0;
    var syncBusy = false;

    // ---------- helpers ----------
    /* تخزين آمن: لا يرمي استثناء أبدًا، ومع فشل التخزين يبقى هناك
       نسخة في الذاكرة + الإعدادات المنشورة كاحتياطي دائم. */
    var memStore = {};
    function lsGet(k) {
        try {
            var v = localStorage.getItem(k);
            if (v !== null && v !== undefined && v !== '') return v;
        } catch (e) { storageOk = false; }
        return Object.prototype.hasOwnProperty.call(memStore, k) ? memStore[k] : null;
    }
    function lsSet(k, v) {
        memStore[k] = v;
        try { localStorage.setItem(k, v); storageOk = true; return true; }
        catch (e) { storageOk = false; return false; }
    }
    function lsDel(k) {
        if (Object.prototype.hasOwnProperty.call(memStore, k)) delete memStore[k];
        try { localStorage.removeItem(k); storageOk = true; }
        catch (e) { storageOk = false; }
    }
    function mkErr(kind, msg) { var e = new Error(msg); e.kind = kind; return e; }

    /* هل المفتاح service_role أو مفتاح سري؟ (ممنوع استخدامه في الواجهة)
       يغطي الصيغتين: sb_secret_... (النظام الجديد) و JWT بدور service_role */
    function isSecretKey(k) {
        if (/^sb_secret_/i.test(String(k || ''))) return true;
        try {
            var p = String(k || '').split('.');
            if (p.length !== 3) return false;
            var payload = JSON.parse(atob(p[1].replace(/-/g, '+').replace(/_/g, '/')));
            return !!(payload && payload.role === 'service_role');
        } catch (e) { return false; }
    }

    /* قراءة الإعدادات: ما كتبه المستخدم (لو صالح) وإلا إعدادات النشر،
       ثم تُثبَّت في التخزين حتى لا تُطلب مرة أخرى أبدًا. */
    function readConfig() {
        var u = lsGet(LS_URL);
        var k = lsGet(LS_KEY);
        if (u && k && validUrl(normUrl(u)) && !isSecretKey(normKey(k))) {
            SB_URL = normUrl(u);
            SB_KEY = normKey(k);
        } else {
            SB_URL = DEFAULT_URL;
            SB_KEY = DEFAULT_KEY;
        }
        if (isSecretKey(SB_KEY)) {
            SB_KEY = '';
            try { toast('ممنوع استخدام service_role في الواجهة — استخدم المفتاح العام anon', 'error'); } catch (e) {}
        }
        if (u !== SB_URL || k !== SB_KEY) { lsSet(LS_URL, SB_URL); lsSet(LS_KEY, SB_KEY); }
        client = null; clientSig = '';
        configReady = true;
        return configured();
    }

    /* بوابة الجاهزية: أي استعلام أو تسجيل دخول يمرّ من هنا بعد تحميل الإعدادات */
    function whenReady() {
        if (configReady) return Promise.resolve(configured());
        if (!configReadyPromise) {
            configReadyPromise = new Promise(function (resolve) {
                resolve(readConfig());
            });
        }
        return configReadyPromise;
    }

    function configured() { return !!(SB_URL && SB_KEY && validUrl(SB_URL) && !isSecretKey(SB_KEY)); }

    function resetToDefaults() {
        lsDel(LS_URL); lsDel(LS_KEY);
        readConfig();
        user = null; projects = []; projectsLoaded = false;
        return configured();
    }

    function redirectUri() {
        if (PUBLISHED.redirectUrl) return PUBLISHED.redirectUrl;
        return window.location.origin + window.location.pathname;
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function fmtDate(iso) {
        try { return new Date(iso).toLocaleString(); } catch (e) { return iso || ''; }
    }

    /* فصل الأخطاء: إعدادات ← دخول ← صلاحيات ← جلسة ← شبكة ← خادم */
    function classifyError(err) {
        if (err && err.kind && err.kind !== 'error') {
            var k0 = err.kind;
            if (k0 === 'config' || k0 === 'auth' || k0 === 'permission' || k0 === 'session' || k0 === 'network') {
                return { kind: k0, msg: err.message };
            }
        }
        var m = (err && (err.message || err.error_description || err.msg || err.hint)) || String(err || '');
        var code = String((err && (err.code || err.status)) || '');

        if (!configured()) return { kind: 'config', msg: 'إعدادات Supabase غير مكتملة — راجع js/gis-config.js' };
        if (!validUrl(SB_URL)) return { kind: 'config', msg: 'رابط Supabase غير صالح: «' + SB_URL + '» — الشكل https://xxxx.supabase.co' };
        if (/service_role|secret key/i.test(m)) return { kind: 'config', msg: 'مفتاح سري (service_role) مرفوض — استخدم المفتاح العام anon' };
        if (/api key|apikey|invalid.*key|missing.*key|no api key/i.test(m)) return { kind: 'config', msg: 'مفتاح anon غير صحيح أو غير مفعّل في مشروعك' };

        if (/failed to fetch|networkerror|load failed|fetch failed|net::err|err_internet|timed? ?out|timeout|offline/i.test(m)) {
            return { kind: 'network', msg: 'تعذّر الوصول لسيرفر Supabase — تحقّق من الإنترنت. الإعدادات محفوظة ولا حاجة بإعادة إدخالها.' };
        }
        if (/jwt (has )?expired|token .*expired|refresh_token|refresh token|session_not_found|invalid refresh|not authenticated|401|auth\/session/i.test(m)) {
            return { kind: 'session', msg: 'انتهت الجلسة — سجّل الدخول مرة أخرى (الإعدادات محفوظة)' };
        }
        if (/row-level security|not authorized|permission denied|policy|violates|42501|PGRST116/i.test(m)) {
            return { kind: 'permission', msg: 'ليس لديك صلاحية لهذا الإجراء (RLS) — تأكّد أنك دخلت بالحساب الصحيح' };
        }
        if (/email not confirmed/i.test(m)) return { kind: 'auth', msg: 'لازم تأكيد البريد أولًا (أو عطّل Confirm email في Supabase)' };
        if (/invalid login credentials|invalid credentials/i.test(m)) return { kind: 'auth', msg: 'البريد أو كلمة المرور غير صحيحة' };
        if (/user already registered|already registered/i.test(m)) return { kind: 'auth', msg: 'هذا البريد مسجّل بالفعل — جرّب تسجيل الدخول' };
        if (/password should be at least/i.test(m)) return { kind: 'auth', msg: 'كلمة المرور قصيرة (٦ أحرف على الأقل)' };
        if (/provider is not enabled|not.*enabled/i.test(m)) return { kind: 'auth', msg: 'تسجيل الدخول بهذا المزوّد موقوف — فعّله من Supabase → Authentication → Providers' };
        if (/redirect.*not.*allowed|unauthorized redirect|invalid redirect/i.test(m)) return { kind: 'config', msg: 'رابط إعادة التوجيه غير مسموح — ضعه في Supabase → Authentication → URL Configuration' };
        if (/signup is disabled|signups? not allowed/i.test(m)) return { kind: 'auth', msg: 'التسجيل الجديد موقوف في مشروعك' };

        return { kind: 'server', msg: m };
    }
    function errMsg(err) {
        var c = classifyError(err);
        return c.msg;
    }
    function errKind(err) { return classifyError(err).kind; }

    function normUrl(u) {
        u = String(u || '').trim().replace(/\s+/g, '');
        if (!u) return '';
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        try { return new URL(u).origin; } catch (e) { return u.replace(/\/+$/, ''); }
    }
    function normKey(k) { return String(k || '').trim().replace(/\s+/g, ''); }
    function validUrl(u) { return /^https:\/\/[a-z0-9][a-z0-9.-]*\.[a-z0-9-]{2,}$/i.test(String(u || '')); }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') { try { window.showToast(msg, type || 'info'); return; } catch (e) {} }
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#0f172a;color:#e2e8f0;border:1px solid #334155;padding:10px 16px;border-radius:10px;font:600 13px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.4)';
        document.body.appendChild(t);
        setTimeout(function () { try { t.remove(); } catch (e) {} }, 4200);
    }

    var CARD = 'background:var(--card-bg,#1e293b);border:1px solid var(--card-brd,#334155);border-radius:10px;padding:12px;';
    var INPUT = 'width:100%;box-sizing:border-box;padding:9px 11px;margin:5px 0;border-radius:9px;border:1px solid var(--card-brd,#334155);background:#0f172a;color:var(--txt,#e2e8f0);font:13px inherit;';
    var BTN = 'display:block;width:100%;box-sizing:border-box;padding:10px 12px;margin:6px 0;border:none;border-radius:9px;background:var(--accent,#0284c7);color:#fff;font:700 13px inherit;cursor:pointer;';
    var BTN2 = 'display:inline-block;padding:7px 11px;margin:3px 3px 3px 0;border:1px solid var(--card-brd,#334155);border-radius:8px;background:transparent;color:var(--txt,#e2e8f0);font:600 12px inherit;cursor:pointer;';
    var OAUTH_BTN = 'display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box;padding:9px;margin:6px 0;border:1px solid var(--card-brd,#cbd5e1);border-radius:9px;background:#fff;color:#1f2937;font:700 13px inherit;cursor:pointer;';
    var HINT = 'font-size:11.5px;line-height:1.85;color:var(--txt-dim,#94a3b8);margin:6px 0;';

    // ---------- sdk ----------
    function loadSDK() {
        if (window.supabase && window.supabase.createClient) return Promise.resolve();
        if (sdkPromise) return sdkPromise;
        sdkPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = SDK_URL; s.async = true;
            s.onload = function () {
                if (window.supabase && window.supabase.createClient) resolve();
                else { sdkPromise = null; reject(new Error('Supabase SDK لم يُحمّل بشكل صحيح')); }
            };
            s.onerror = function () { sdkPromise = null; reject(new Error('تعذّر تحميل مكتبة Supabase — تحقّق من الاتصال بالإنترنت')); };
            document.head.appendChild(s);
        });
        return sdkPromise;
    }

    /* العميل الوحيد المشترك (Singleton) — يُنشأ مرة واحدة لكل إعداد ويُعاد
       استخدامه في كل الاستعلامات وتسجيل الدخول والمزامنة. */
    function getClient() {
        return whenReady().then(function (ok) {
            if (!ok) {
                if (!SB_URL || !SB_KEY) throw mkErr('config', 'إعدادات Supabase غير مضبوطة — أضف الرابط والمفتاح في js/gis-config.js');
                throw mkErr('config', 'رابط Supabase غير صالح: «' + SB_URL + '» — الشكل المطلوب https://xxxx.supabase.co');
            }
            if (isSecretKey(SB_KEY)) throw mkErr('config', 'مفتاح سري (service_role) مرفوض — استخدم المفتاح العام anon');
            return loadSDK();
        }).then(function () {
            var sig = SB_URL + '|' + SB_KEY;
            if (client && clientSig === sig) return client;

            client = window.supabase.createClient(SB_URL, SB_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage
                }
            });
            clientSig = sig;
            try {
                client.auth.onAuthStateChange(function (evt, session) {
                    var hadUser = !!user;
                    user = (session && session.user) ? session.user : null;

                    /* تحديث الجلسة الصامت (TOKEN_REFRESHED) لا يمسّ الواجهة
                       حتى لا يُمسح ما يكتبه المستخدم في نموذج الإعدادات */
                    if (evt === 'TOKEN_REFRESHED') return;

                    if (evt !== 'PASSWORD_RECOVERY') projectsLoaded = false;
                    render();

                    if (user && typeof window.enterApp === 'function') {
                        var entered = false;
                        try { entered = localStorage.getItem('gisEntered') === '1'; } catch (e) {}
                        if (!entered) { try { window.enterApp('cloud'); } catch (e) {} }
                    }
                    try {
                        if (evt === 'SIGNED_IN' && user) { logEvent('login'); }
                        else if (evt === 'INITIAL_SESSION' && user && !sessionOpenLogged) { sessionOpenLogged = true; logEvent('open'); }
                        else if (evt === 'SIGNED_OUT' && hadUser && !user) { sessionOpenLogged = false; }
                    } catch (e) {}
                });
            } catch (e) {}
            return client;
        });
    }

    function setConfig(url, key) {
        var nu = normUrl(url);
        var nk = normKey(key);
        if (!validUrl(nu)) return Promise.reject(mkErr('config', 'رابط غير صالح: «' + nu + '» — لازم يكون https://xxxx.supabase.co'));
        if (!nk) return Promise.reject(mkErr('config', 'المفتاح فارغ — أدخل anon public key'));
        if (isSecretKey(nk)) return Promise.reject(mkErr('config', 'ممنوع استخدام service_role — استخدم المفتاح العام anon'));

        SB_URL = nu; SB_KEY = nk;
        var saved = lsSet(LS_URL, nu) && lsSet(LS_KEY, nk);
        client = null; clientSig = '';
        configReady = true;
        draft.url = null; draft.key = null;

        if (!saved) {
            return Promise.reject(mkErr('config', 'المتصفح يمنع تخزين البيانات (وضع خاص/حظر) — الإعدادات ستبقى لآخر هذه الجلسة فقط'));
        }
        return Promise.resolve(true);
    }

    function testConnection(url, key) {
        if (!url || !key) { toast('أدخل الرابط والمفتاح أولًا', 'error'); return; }
        toast('جارٍ اختبار الاتصال...', 'info');
        fetch(url.replace(/\/+$/, '') + '/auth/v1/health', { headers: { apikey: key } })
            .then(function (r) {
                if (r.ok || r.status === 200 || r.status === 401) toast('الاتصال بسيرفر Supabase ناجح ✅', 'success');
                else toast('وصل السيرفر لكن الرد: HTTP ' + r.status, 'info');
            })
            .catch(function () { toast('فشل الاتصال ❌ — راجع Project URL والإنترنت', 'error'); });
    }

    // ---------- project stats from live app ----------
    function projectStats() {
        var o = { files: 0, features: 0, customs: 0, locations: 0, measurements: 0 };
        try {
            var up = (typeof uploadedFiles !== 'undefined' ? uploadedFiles : []) || [];
            o.files = up.length;
            up.forEach(function (f) { o.features += (f && f.data && f.data.features ? f.data.features.length : 0); });
        } catch (e) {}
        try { o.customs = ((typeof customFeaturesData !== 'undefined' ? customFeaturesData : []) || []).length; } catch (e) {}
        try { o.locations = ((typeof locations !== 'undefined' ? locations : []) || []).length; } catch (e) {}
        try { o.measurements = ((typeof measurements !== 'undefined' ? measurements : []) || []).length; } catch (e) {}
        o.total = o.features + o.customs + o.locations;
        return o;
    }

    // ---------- usage events ----------
    function deviceInfo() {
        var ua = navigator.userAgent || '';
        var os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Macintosh|Mac OS X/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown';
        var br = /Edg\//i.test(ua) ? 'Edge' : /OPR\//i.test(ua) ? 'Opera' : /Chrome\//i.test(ua) ? 'Chrome' : /Firefox\//i.test(ua) ? 'Firefox' : /Safari\//i.test(ua) ? 'Safari' : 'Unknown';
        return os + ' · ' + br;
    }
    function logEvent(evt, extra) {
        if (!configured()) { return Promise.resolve(false); }
        var row = {
            event: String(evt || 'event'),
            email: (extra && extra.email) || (user && user.email) || null,
            user_id: (user && user.id) || null,
            device: deviceInfo(),
            app_version: (extra && extra.version) || APP_VERSION
        };
        return getClient()
            .then(function (c) { return c.from('app_events').insert(row); })
            .then(function (r) { if (r && r.error) { throw r.error; } return true; })
            .catch(function () { return false; });
    }
    function listEvents(limit) {
        return getClient()
            .then(function (c) {
                return c.from('app_events').select('*').order('created_at', { ascending: false }).limit(limit || 300);
            })
            .then(function (r) { if (r.error) { throw r.error; } return r.data || []; });
    }

    // ---------- auth ----------
    function signIn(email, password) {
        return getClient()
            .then(function (c) { return c.auth.signInWithPassword({ email: email, password: password }); })
            .then(function (r) {
                if (r.error) throw r.error;
                user = r.data && r.data.user ? r.data.user : null;
                projectsLoaded = false;
                toast('تم تسجيل الدخول', 'success');
                render();
                if (autoSyncOn) autoSync();
            });
    }

    function signUp(email, password) {
        return getClient()
            .then(function (c) { return c.auth.signUp({ email: email, password: password }); })
            .then(function (r) {
                if (r.error) throw r.error;
                if (r.data && r.data.session) {
                    user = r.data.user;
                    projectsLoaded = false;
                    toast('تم إنشاء الحساب وتسجيل الدخول', 'success');
                    render();
                } else {
                    toast('تم إنشاء الحساب — يمكنك تسجيل الدخول الآن', 'success');
                }
                return r.data;
            });
    }

    function clearSyncProject() {
        currentProjectId = '';
        try { localStorage.removeItem(LS_SYNCPID); } catch (e) {}
    }
    function signOut() {
        var finish = function (msg, type) {
            user = null; projects = []; projectsLoaded = false;
            clearSyncProject();
            if (msg) toast(msg, type || 'info');
            render();
        };
        if (!client) { finish('', ''); return Promise.resolve(); }
        return client.auth.signOut()
            .then(function () { finish('تم تسجيل الخروج'); })
            .catch(function (e) {
                /* السيرفر غير متاح أو انتهت الجلسة: ننظّف محليًا حتى لا
                   تعلّق الواجهة في حالة «مسجّل» بشكل خاطئ */
                try {
                    var sk = [];
                    for (var i = 0; i < localStorage.length; i++) {
                        var kk = localStorage.key(i);
                        if (kk && /^sb-.*-auth-token/.test(kk)) sk.push(kk);
                    }
                    sk.forEach(function (x) { try { localStorage.removeItem(x); } catch (e2) {} });
                } catch (e3) {}
                client = null; clientSig = '';
                finish('تم تسجيل الخروج محليًا' + (errKind(e) === 'network' ? ' — تعذّر إشعار السيرفر، الإعدادات محفوظة' : ''), 'info');
            });
    }

    function signInWithOAuth(provider) {
        return getClient()
            .then(function (c) {
                return c.auth.signInWithOAuth({
                    provider: provider,
                    options: { redirectTo: redirectUri() }
                });
            })
            .then(function (r) { if (r && r.error) throw r.error; })
            .catch(function (e) {
                var c = classifyError(e);
                var label = { config: 'إعدادات الاتصال', auth: 'الدخول', permission: 'الصلاحيات', session: 'الجلسة', network: 'الشبكة', server: 'الخادم' }[c.kind] || 'خطأ';
                toast('فشل تسجيل الدخول بـ' + provider + ' [' + label + ']: ' + c.msg, 'error');
            });
    }

    // ---------- projects ----------
    function saveProject(name) {
        if (!user) { toast('سجّل الدخول أولًا', 'error'); return Promise.resolve(); }
        if (typeof window.buildSavePayload !== 'function') { toast('دالة حفظ البيانات غير متاحة', 'error'); return Promise.resolve(); }
        var payload;
        try { payload = window.buildSavePayload(); }
        catch (e) { toast('تعذّر تجهيز البيانات: ' + e.message, 'error'); return Promise.resolve(); }
        var row = {
            owner: user.id,
            name: (name || '').trim() || ('مشروع ' + new Date().toLocaleString()),
            data: payload,
            feature_count: projectStats().total
        };
        return getClient()
            .then(function (c) { return c.from('projects').insert(row).select('id').single(); })
            .then(function (r) {
                if (r.error) throw r.error;
                toast('تم حفظ المشروع سحابيًا', 'success');
                projectsLoaded = false;
                return ensureProjects();
            })
            .catch(function (e) { toast('فشل الحفظ: ' + errMsg(e), 'error'); });
    }

    function ensureProjects() {
        if (!user) return Promise.resolve();
        return getClient()
            .then(function (c) { return c.from('projects').select('id,name,updated_at,feature_count').order('updated_at', { ascending: false }); })
            .then(function (r) {
                if (r.error) throw r.error;
                projects = r.data || [];
                projectsLoaded = true;
                fillList();
            })
            .catch(function (e) { toast('فشل جلب المشاريع: ' + errMsg(e), 'error'); });
    }

    function loadProject(id) {
        return getClient()
            .then(function (c) { return c.from('projects').select('name,data').eq('id', id).single(); })
            .then(function (r) {
                if (r.error) throw r.error;
                if (typeof window.applyPayload !== 'function') throw new Error('دالة الاسترجاع غير متاحة');
                if (!confirm('سيتم استبدال البيانات الحالية بمحتوى المشروع «' + (r.data.name || '') + '». متابعة؟')) return;
                window.applyPayload(r.data.data || {});
                toast('تم تحميل المشروع: ' + (r.data.name || ''), 'success');
            })
            .catch(function (e) { toast('فشل التحميل: ' + errMsg(e), 'error'); });
    }

    function deleteProject(id, name) {
        if (!confirm('حذف المشروع «' + (name || '') + '» نهائيًا؟')) return Promise.resolve();
        return getClient()
            .then(function (c) { return c.from('projects').delete().eq('id', id); })
            .then(function (r) {
                if (r.error) throw r.error;
                projects = projects.filter(function (p) { return p.id !== id; });
                toast('تم الحذف', 'info');
                fillList();
            })
            .catch(function (e) { toast('فشل الحذف: ' + errMsg(e), 'error'); });
    }

    // ---------- auto-sync ----------
    function genId() {
        try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
        function h() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1); }
        return h() + h() + '-' + h() + '-4' + h().slice(0, 3) + '-a' + h().slice(0, 3) + '-' + h() + h() + h();
    }
    function syncStateText() {
        if (!autoSyncOn) return 'متوقفة — فعّلها لمزامنة بياناتك تلقائيًا عند أي تغيير.';
        if (lastSyncAt) return 'مفعّلة · آخر مزامنة: ' + new Date(lastSyncAt).toLocaleTimeString();
        return 'مفعّلة · بانتظار أول تغيير…';
    }
    function updateSyncState() {
        if (!root) return;
        try {
            var st = root.querySelector('[data-syncstate]');
            if (st) st.textContent = syncStateText();
        } catch (e) {}
    }
    function setAutoSync(on) {
        autoSyncOn = !!on;
        try { localStorage.setItem(LS_AUTOSYNC, autoSyncOn ? '1' : '0'); } catch (e) {}
        if (autoSyncOn) { toast('تم تفعيل المزامنة التلقائية', 'success'); autoSync(); }
        else { toast('تم إيقاف المزامنة التلقائية', 'info'); }
        updateSyncState();
    }
    function autoSync() {
        if (!autoSyncOn || !user || !configured()) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(doAutoSync, syncBusy ? 3000 : 2000);
    }
    function doAutoSync() {
        if (!autoSyncOn || !user) return;
        if (syncBusy) { clearTimeout(syncTimer); syncTimer = setTimeout(doAutoSync, 2000); return; }
        if (typeof window.buildSavePayload !== 'function') return;
        var payload;
        try { payload = window.buildSavePayload(); } catch (e) { return; }
        if (!currentProjectId) {
            currentProjectId = genId();
            try { localStorage.setItem(LS_SYNCPID, currentProjectId); } catch (e) {}
        }
        var row = {
            id: currentProjectId,
            owner: user.id,
            name: 'مشروع المزامنة التلقائية',
            data: payload,
            feature_count: projectStats().total
        };
        syncBusy = true;
        getClient()
            .then(function (c) { return c.from('projects').upsert(row, { onConflict: 'id' }).select('id'); })
            .then(function (r) {
                if (r && r.error) throw r.error;
                lastSyncAt = Date.now();
                projectsLoaded = false;
                updateSyncState();
            })
            .catch(function (e) { toast('فشل المزامنة التلقائية: ' + errMsg(e), 'error'); })
            .then(function () { syncBusy = false; });
    }

    // ---------- UI ----------
    function render() {
        if (!root) return;
        if (!configured() || !validUrl(SB_URL)) { root.innerHTML = viewConfig(); wireConfig(); return; }
        if (!user) { root.innerHTML = viewAuth(); wireAuth(); return; }
        root.innerHTML = viewAccount();
        wireAccount();
        wireList();
        if (!projectsLoaded) ensureProjects();
    }

    function viewConfig() {
        var warn = '';
        if (!storageOk) {
            warn = '<div style="color:#f59e0b;font-size:11.5px;margin:4px 0;background:#3b2f10;border:1px solid #78350f;padding:7px 9px;border-radius:8px">' +
                'المتصفح يمنع تخزين البيانات (وضع خاص أو حظر تتبّع) — الإعدادات ستعمل حتى نهاية الجلسة فقط. ' +
                'ادخل الإعدادات يدويًا في كل مرة أو افتح المتصفح في وضع عادي.</div>';
        } else if (configured()) {
            warn = '<div style="color:#34d399;font-size:11.5px;margin:4px 0">الإعدادات محمّلة تلقائيًا — لن تُطلب منك مرة أخرى.</div>';
        }
        var vUrl = (draft.url !== null && draft.url !== undefined) ? draft.url : SB_URL;
        var vKey = (draft.key !== null && draft.key !== undefined) ? draft.key : SB_KEY;
        return '' +
            '<div class="tab-header"><h4><i class="fas fa-cloud"></i> Cloud (Supabase)</h4></div>' +
            '<div style="' + HINT + '">اربط مشروع Supabase الخاص بك: انسخ <b>Project URL</b> و<b>anon public key</b> من ' +
            'Supabase &rarr; Project Settings &rarr; API، ثم اضغط حفظ. رابط الـURL يجب أن يكون بالشكل <b>https://xxxx.supabase.co</b>. ' +
            'الإعدادات الافتراضية تأتي من <b>js/gis-config.js</b> (إعدادات النشر).</div>' +
            warn +
            '<div style="' + CARD + '">' +
            '<input data-f="url" type="text" placeholder="https://xxxx.supabase.co" value="' + esc(vUrl) + '" style="' + INPUT + '">' +
            '<input data-f="key" type="text" placeholder="anon public key" value="' + esc(vKey) + '" style="' + INPUT + '">' +
            '<button data-act="savecfg" style="' + BTN + '"><i class="fas fa-link"></i> حفظ الإعدادات</button>' +
            '<button data-act="testconn" style="' + BTN2 + 'width:100%;box-sizing:border-box;padding:9px;text-align:center"><i class="fas fa-plug-circle-check"></i> اختبار الاتصال</button>' +
            '</div>' +
            '<button data-act="reset" style="' + BTN2 + 'margin-top:10px;color:#f87171;border-color:#7f1d1d"><i class="fas fa-rotate-left"></i> الرجوع لإعدادات النشر</button>';
    }
    function wireConfig() {
        var uInp = root.querySelector('[data-f="url"]');
        var kInp = root.querySelector('[data-f="key"]');
        /* حفظ ما يكتبه المستخدم حتى لا تمسحه إعادة الرسم */
        if (uInp) uInp.addEventListener('input', function () { draft.url = this.value; });
        if (kInp) kInp.addEventListener('input', function () { draft.key = this.value; });

        root.querySelector('[data-act="savecfg"]').addEventListener('click', function () {
            var u = uInp ? uInp.value : '';
            var k = kInp ? kInp.value : '';
            if (!u || !k) { toast('أدخل الرابط والمفتاح', 'error'); return; }
            setConfig(u, k).then(function () {
                toast('تم حفظ إعدادات Supabase', 'success');
                render();
            }).catch(function (e) {
                toast(errMsg(e), 'error');
                render();
            });
        });
        var test = root.querySelector('[data-act="testconn"]');
        if (test) test.addEventListener('click', function () {
            testConnection(normUrl(uInp ? uInp.value : ''), normKey(kInp ? kInp.value : ''));
        });
        var reset = root.querySelector('[data-act="reset"]');
        if (reset) reset.addEventListener('click', function () {
            if (!confirm('الرجوع لإعدادات النشر الافتراضية (js/gis-config.js)؟ لن تُحذف أي بيانات أو مشاريع.')) return;
            resetToDefaults();
            toast('رجعنا لإعدادات النشر الافتراضية', 'success');
            render();
        });
    }

    function viewAuth() {
        return '' +
            '<div class="tab-header"><h4><i class="fas fa-cloud"></i> Cloud (Supabase)</h4></div>' +
            '<div style="' + HINT + '">سجّل الدخول لحفظ مشاريعك ومزامنتها سحابيًا.</div>' +
            '<div style="' + CARD + '">' +
            '<button data-act="google" style="' + OAUTH_BTN + '"><i class="fab fa-google" style="color:#ea4335"></i> Continue with Google</button>' +
            '<button data-act="github" style="' + OAUTH_BTN + 'background:#24292e;color:#fff;border-color:#24292e"><i class="fab fa-github"></i> Continue with GitHub</button>' +
            '<div style="display:flex;align-items:center;gap:8px;margin:10px 0;color:var(--txt-dim,#94a3b8);font-size:11px"><span style="flex:1;height:1px;background:var(--card-brd,#334155)"></span>أو بالبريد<span style="flex:1;height:1px;background:var(--card-brd,#334155)"></span></div>' +
            '<input data-f="email" type="email" placeholder="البريد الإلكتروني" style="' + INPUT + '">' +
            '<input data-f="pass" type="password" placeholder="كلمة المرور" style="' + INPUT + '">' +
            '<button data-act="login" style="' + BTN + '"><i class="fas fa-right-to-bracket"></i> تسجيل الدخول</button>' +
            '<button data-act="register" style="' + BTN2 + 'width:100%;box-sizing:border-box;padding:9px;text-align:center"><i class="fas fa-user-plus"></i> إنشاء حساب جديد</button>' +
            '</div>' +
            '<button data-act="forget" style="' + BTN2 + 'margin-top:10px"><i class="fas fa-gear"></i> تغيير إعدادات الربط</button>';
    }
    function wireAuth() {
        function creds() {
            return { e: root.querySelector('[data-f="email"]').value.trim(), p: root.querySelector('[data-f="pass"]').value };
        }
        var google = root.querySelector('[data-act="google"]');
        if (google) google.addEventListener('click', function () { signInWithOAuth('google'); });
        var github = root.querySelector('[data-act="github"]');
        if (github) github.addEventListener('click', function () { signInWithOAuth('github'); });
        root.querySelector('[data-act="login"]').addEventListener('click', function () {
            var c = creds();
            if (!c.e || !c.p) { toast('أدخل البريد وكلمة المرور', 'error'); return; }
            signIn(c.e, c.p).catch(function (err) { toast(errMsg(err), 'error'); });
        });
        root.querySelector('[data-act="register"]').addEventListener('click', function () {
            var c = creds();
            if (!c.e || !c.p) { toast('أدخل البريد وكلمة المرور', 'error'); return; }
            signUp(c.e, c.p).catch(function (err) { toast(errMsg(err), 'error'); });
        });
        root.querySelector('[data-act="forget"]').addEventListener('click', function () {
            if (!confirm('الرجوع لإعدادات النشر الافتراضية (js/gis-config.js)؟ لن تُحذف المشاريع.')) return;
            resetToDefaults();
            toast('رجعنا لإعدادات النشر الافتراضية', 'success');
            render();
        });
    }

    function renderList() {
        if (!projects.length) return '<div style="' + HINT + '">لا توجد مشاريع محفوظة بعد.</div>';
        return projects.map(function (p) {
            return '<div style="' + CARD + 'margin-bottom:8px">' +
                '<div style="font-weight:700;color:var(--txt,#e2e8f0);margin-bottom:2px">' + esc(p.name) + '</div>' +
                '<div style="font-size:11px;color:var(--txt-dim,#94a3b8);margin-bottom:8px">' +
                (p.feature_count || 0) + ' معلم · ' + fmtDate(p.updated_at) + '</div>' +
                '<button data-load="' + esc(p.id) + '" style="' + BTN2 + '"><i class="fas fa-folder-open"></i> تحميل</button>' +
                '<button data-del="' + esc(p.id) + '" data-name="' + esc(p.name) + '" style="' + BTN2 + 'color:#f87171;border-color:#7f1d1d"><i class="fas fa-trash"></i></button>' +
                '</div>';
        }).join('');
    }
    function wireList() {
        var c = root.querySelector('[data-list]');
        if (!c) return;
        Array.prototype.forEach.call(c.querySelectorAll('[data-load]'), function (b) {
            b.addEventListener('click', function () { loadProject(b.getAttribute('data-load')); });
        });
        Array.prototype.forEach.call(c.querySelectorAll('[data-del]'), function (b) {
            b.addEventListener('click', function () { deleteProject(b.getAttribute('data-del'), b.getAttribute('data-name')); });
        });
    }
    function fillList() {
        var c = root.querySelector('[data-list]');
        if (c) { c.innerHTML = renderList(); wireList(); }
    }

    function viewAccount() {
        var s = projectStats();
        return '' +
            '<div class="tab-header"><h4><i class="fas fa-cloud"></i> Cloud (Supabase)</h4></div>' +
            '<div style="' + CARD + 'margin-bottom:8px">' +
            '<div style="font-size:11.5px;color:var(--txt-dim,#94a3b8)">مسجّل الدخول باسم</div>' +
            '<div style="font-weight:700;color:var(--accent,#0284c7);word-break:break-all">' + esc(user.email || user.id) + '</div>' +
            '<button data-act="signout" style="' + BTN2 + 'margin-top:8px"><i class="fas fa-right-from-bracket"></i> تسجيل الخروج</button>' +
            '</div>' +
            '<div style="' + CARD + 'margin-bottom:8px">' +
            '<div style="font-size:11.5px;color:var(--txt-dim,#94a3b8);margin-bottom:4px">البيانات الحالية: ' +
            s.files + ' ملف · ' + s.features + ' معلم · ' + s.customs + ' رسم · ' + s.locations + ' موقع</div>' +
            '<input data-f="name" type="text" placeholder="اسم المشروع" style="' + INPUT + '">' +
            '<button data-act="save" style="' + BTN + '"><i class="fas fa-cloud-arrow-up"></i> حفظ المشروع الحالي سحابيًا</button>' +
            '</div>' +
            '<div style="' + CARD + 'margin-bottom:8px">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
            '<span style="font-weight:700;color:var(--accent,#0284c7)"><i class="fas fa-rotate"></i> المزامنة التلقائية</span>' +
            '<label class="switch"><input type="checkbox" data-f="autosync"' + (autoSyncOn ? ' checked' : '') + '><span class="slider"></span></label>' +
            '</div>' +
            '<div data-syncstate style="font-size:11.5px;color:var(--txt-dim,#94a3b8);margin-top:6px">' + esc(syncStateText()) + '</div>' +
            '</div>' +
            '<div class="tab-header"><h4><i class="fas fa-database"></i> مشاريعي السحابية</h4>' +
            '<button data-act="reload" class="add-btn" type="button"><i class="fas fa-rotate"></i> تحديث</button></div>' +
            '<div data-list>' + renderList() + '</div>';
    }
    function wireAccount() {
        var save = root.querySelector('[data-act="save"]');
        if (save) save.addEventListener('click', function () {
            var nm = root.querySelector('[data-f="name"]');
            saveProject(nm ? nm.value : '').catch(function (e) { toast('فشل: ' + errMsg(e), 'error'); });
        });
        var so = root.querySelector('[data-act="signout"]');
        if (so) so.addEventListener('click', function () { signOut(); });
        var reload = root.querySelector('[data-act="reload"]');
        if (reload) reload.addEventListener('click', function () { projectsLoaded = false; ensureProjects(); });
        var as = root.querySelector('[data-f="autosync"]');
        if (as) as.addEventListener('change', function () { setAutoSync(this.checked); });
    }

    // ---------- تحميل الإعدادات قبل أي استعلام أو تسجيل دخول ----------
    try { readConfig(); } catch (e) { configReady = false; }

    // ---------- init ----------
    function init() {
        root = document.getElementById('tab-cloud');
        if (!root) return;
        whenReady().then(function (ok) {
            if (!ok) { render(); return; }
            getClient()
                .then(function (c) { return c.auth.getUser(); })
                .then(function (r) { user = (r && r.data) ? r.data.user : null; })
                .catch(function (e) { try { console.warn('[cloud] init:', errKind(e), '—', errMsg(e)); } catch (_) {} })
                .then(render);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    function diagnostics() {
        return {
            ready: configReady,
            configured: configured(),
            url: SB_URL,
            usingDefaults: !!(DEFAULT_URL && DEFAULT_KEY) && SB_URL === DEFAULT_URL && SB_KEY === DEFAULT_KEY,
            hasKey: !!SB_KEY,
            publishedDefaults: !!(DEFAULT_URL && DEFAULT_KEY),
            storageOk: storageOk,
            clientReady: !!client,
            signedIn: !!user,
            userId: user ? user.id : null,
            redirect: redirectUri()
        };
    }

    window.GIS = window.GIS || {};
    window.GIS.cloud = {
        configured: configured,
        setConfig: setConfig,
        testConnection: testConnection,
        signIn: signIn,
        signUp: signUp,
        signOut: signOut,
        signInWithOAuth: signInWithOAuth,
        logEvent: logEvent,
        listEvents: listEvents,
        saveProject: saveProject,
        loadProject: loadProject,
        deleteProject: deleteProject,
        refreshProjects: ensureProjects,
        projectStats: projectStats,
        autoSync: autoSync,
        setAutoSync: setAutoSync,
        getUser: function () { return user; },
        render: render,
        // ---------- واجهة التشخيص والاختبارات ----------
        diagnostics: diagnostics,
        classifyError: classifyError,
        errKind: errKind,
        errMsg: errMsg,
        whenReady: whenReady,
        readConfig: readConfig,
        resetToDefaults: resetToDefaults,
        storageAvailable: function () { return storageOk; },
        isConfigFromDefaults: function () { return !!(DEFAULT_URL && DEFAULT_KEY) && SB_URL === DEFAULT_URL && SB_KEY === DEFAULT_KEY; },
        publishedConfig: function () { return { url: DEFAULT_URL, hasKey: !!DEFAULT_KEY, redirect: redirectUri() }; },
        _getClient: getClient
    };

    // ---------- معالجة العودة من OAuth (Google/GitHub) وتسجيل الدخول المحفوظ ----------
    function bootstrapSession() {
        whenReady().then(function (ok) {
            if (!ok) return;
            var url = String(location.href || '');
            var hasCallback = /[#?&](code|access_token|error|error_description)=/.test(url);
            var hasPersisted = false;
            try {
                for (var i = 0; i < localStorage.length; i++) {
                    var k = localStorage.key(i);
                    if (k && /^sb-.*-auth-token/.test(k)) { hasPersisted = true; break; }
                }
            } catch (e) {}
            if (!hasCallback && !hasPersisted) return;
            return getClient()
                .then(function (c) { return c.auth.getSession(); })
                .then(function (r) {
                    if (r && r.error) {
                        var c = classifyError(r.error);
                        try { console.warn('[cloud] session:', c.kind, '—', c.msg); } catch (_) {}
                        if (c.kind === 'config' || c.kind === 'auth') render();
                    }
                })
                .catch(function (e) {
                    var c = classifyError(e);
                    try { console.warn('[cloud] bootstrap:', c.kind, '—', c.msg); } catch (_) {}
                    if (c.kind === 'config') render();
                });
        }).catch(function () {});
    }
    try { bootstrapSession(); } catch (e) {}
})();
