/* ================================================================
   GIS UI — GIS Command Center (تخصيص الواجهة)
   الإصدار: 1.0.0
   يضيف فوق الواجهة الحالية (بدون إعادة بناء وبدون حذف أي وظيفة):
     - لوحة تحكم "تخصيص الواجهة" داخل تبويب Settings:
       (Icon Manager · Sidebar Manager · Layout Manager · Theme · Presets · Reset)
     - إعدادات منفصلة تمامًا عن إعدادات الاتصال بـ Supabase:
       مخزّنة في gisUiSettings_v1 فقط (لا تمس gisSb* ولا waterGis*).
     - سحب وإفلات (Drag & Drop) لإعادة ترتيب أيقونات الشريط والتبويبات.
     - تحجيم القائمة الجانبية بسحب الحافة + تموضع يمين/يسار + إخفاء تلقائي.
     - حفظ الحالة (طي/عرض/عرض اللوحة/الترتيب) لكل مستخدم على جهازه.
     - عزل اللوحات عن الخريطة (منع تسرّب أحداث السحب/العجلة إلى الخريطة).
   لا يعتمد على أي مكتبة خارجية.
   ================================================================ */
(function () {
    'use strict';

    var KEY = 'gisUiSettings_v1';
    var ICON_KEY = 'gis-icon-size';

    var DEFAULTS = {
        v: 1,
        icon: { mode: 'svg', opacity: 1, mono: false, color: '' },
        dock: { order: [], hidden: [], size: 40, gap: 6, opacity: 1 },
        sidebar: { side: 'left', width: 360, autoHide: false, collapsed: null },
        tabs: { order: [], hidden: [] },
        theme: { accent: '', glow: 'normal' },
        preset: 'default'
    };

    var PRESETS = {
        mapping: {
            label: 'Mapping · المسح',
            desc: 'المواقع والرسم أولًا · لوحة يمين · أيقونات متوسطة',
            tabs: ['locations', 'draw', 'tools', 'export', 'files', 'dashboard', 'cloud', 'settings'],
            hidden: [], side: 'right', width: 360, icon: 22, accent: '', glow: 'normal'
        },
        editing: {
            label: 'Editing · التحرير',
            desc: 'الرسم والتحرير أولًا · لوحة يسار · أيقونات أكبر',
            tabs: ['draw', 'locations', 'modules', 'tools', 'files', 'export', 'dashboard', 'cloud', 'settings'],
            hidden: ['dashboard'], side: 'left', width: 400, icon: 24, accent: '', glow: 'normal'
        },
        analysis: {
            label: 'Analysis · التحليل',
            desc: 'وحدات التحليل ولوحة المؤشرات أولًا · لوحة أعرض',
            tabs: ['modules', 'dashboard', 'tools', 'draw', 'locations', 'files', 'export', 'cloud', 'settings'],
            hidden: [], side: 'left', width: 440, icon: 22, accent: '', glow: 'strong'
        },
        water: {
            label: 'Water · شبكات التوزيع',
            desc: 'المواقع والوحدات الخاصة بشبكات المياه',
            tabs: ['locations', 'modules', 'tools', 'draw', 'export', 'files', 'dashboard', 'cloud', 'settings'],
            hidden: [], side: 'right', width: 380, icon: 23, accent: '#0284c7', glow: 'normal'
        },
        sewer: {
            label: 'Sewerage · الصرف الصحي',
            desc: 'الرسم والوحدات الخاصة بشبكات الصرف',
            tabs: ['locations', 'draw', 'modules', 'tools', 'export', 'files', 'dashboard', 'cloud', 'settings'],
            hidden: ['dashboard'], side: 'left', width: 380, icon: 23, accent: '#0e7490', glow: 'normal'
        }
    };

    var S = null;
    var INITED = false;
    var DRAG = null;          // حالة السحب الجارية
    var DRAG_ACTIVE = false;  // مفعّل أثناء السحب (لمنع التمرير/القوائم)
    var SUPPRESS_CLICK = false;
    var lastListSig = '';
    var autoHideTimer = null;
    var watchers = [];

    /* ================= أدوات ================= */
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function clamp(v, min, max, dflt) {
        v = parseFloat(v);
        if (isNaN(v)) { return dflt; }
        return Math.min(max, Math.max(min, v));
    }
    function merge(base, o) {
        var r = clone(base);
        if (!o || typeof o !== 'object') { return r; }
        ['icon', 'dock', 'sidebar', 'tabs', 'theme'].forEach(function (k) {
            if (o[k] && typeof o[k] === 'object') { Object.assign(r[k], o[k]); }
        });
        if (typeof o.preset === 'string') { r.preset = o.preset; }
        if (typeof o.v === 'number') { r.v = o.v; }
        return r;
    }
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function notify(msg, type) {
        if (window.GIS && typeof GIS.notify === 'function') { GIS.notify(msg, type); }
        else { try { console.log('[GIS.UI]', msg); } catch (e) {} }
    }
    function iconEl(name) {
        if (window.GIS && GIS.icons && typeof GIS.icons.el === 'function') { return GIS.icons.el(name); }
        var i = document.createElement('i');
        i.className = 'fas ' + name;
        return i;
    }

    function sidebarEl() { return document.getElementById('sidebar'); }
    function dockEl() { return document.getElementById('sideDock'); }
    function tabsWrap() { return document.querySelector('.sidebar .tabs'); }
    function tabBtns() { return $$('.sidebar .tabs button[data-tab]'); }
    function dockBtns() { return $$('#sideDock button[data-side]'); }

    /* ================= التخزين ================= */
    function load() {
        var raw = null;
        try { raw = localStorage.getItem(KEY); } catch (e) {}
        if (raw) {
            try { S = merge(DEFAULTS, JSON.parse(raw)); }
            catch (e) { S = clone(DEFAULTS); }
        } else { S = clone(DEFAULTS); }
        normalize(S);
        return S;
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    }
    function normalize(s) {
        s.icon.opacity = clamp(s.icon.opacity, 0.3, 1, 1);
        s.dock.size = clamp(s.dock.size, 28, 64, 40);
        s.dock.gap = clamp(s.dock.gap, 0, 20, 6);
        s.dock.opacity = clamp(s.dock.opacity, 0.3, 1, 1);
        s.sidebar.width = clamp(s.sidebar.width, 280, 560, 360);
        s.sidebar.side = (s.sidebar.side === 'right') ? 'right' : 'left';
        s.sidebar.autoHide = !!s.sidebar.autoHide;
        s.theme.glow = ['off', 'normal', 'strong'].indexOf(s.theme.glow) >= 0 ? s.theme.glow : 'normal';
        if (!Array.isArray(s.dock.order)) { s.dock.order = []; }
        if (!Array.isArray(s.dock.hidden)) { s.dock.hidden = []; }
        if (!Array.isArray(s.tabs.order)) { s.tabs.order = []; }
        if (!Array.isArray(s.tabs.hidden)) { s.tabs.hidden = []; }
        return s;
    }
    function set(path, val) {
        var parts = path.split('.'), o = S;
        for (var i = 0; i < parts.length - 1; i++) { o = o[parts[i]]; }
        o[parts[parts.length - 1]] = val;
        normalize(S);
        save();
        apply();
    }

    /* ================= حجم الأيقونات (مشترك مع Ctrl+عجلة) ================= */
    function iconSize() {
        try {
            var v = parseInt(localStorage.getItem(ICON_KEY), 10);
            if (v >= 10 && v <= 64) { return v; }
        } catch (e) {}
        return 22;
    }
    function setIconSize(v, silent) {
        v = clamp(v, 14, 40, 22);
        try { localStorage.setItem(ICON_KEY, String(v)); } catch (e) {}
        document.documentElement.style.setProperty('--gis-icon-size', v + 'px');
        var sl = $('#ccIconSize'), lb = $('#ccIconSizeVal');
        if (sl) { sl.value = String(v); }
        if (lb) { lb.textContent = v + 'px'; }
        if (!silent) {
            try { document.dispatchEvent(new CustomEvent('gis:iconsize', { detail: { size: v } })); }
            catch (e) {}
        }
        return v;
    }

    /* ================= التطبيق العام ================= */
    function apply() {
        if (!S) { load(); }
        if (!document.body) { return; }
        var root = document.documentElement, body = document.body;
        body.classList.add('gis-cc');

        /* — الأيقونات — */
        body.classList.toggle('gis-cc-mono', !!S.icon.mono);
        if (S.icon.mono && S.icon.color) { root.style.setProperty('--gis-ico-color', S.icon.color); }
        else { root.style.removeProperty('--gis-ico-color'); }
        root.style.setProperty('--gis-ico-opacity', String(S.icon.opacity));

        /* — الشريط السفلي/الجانبي للأيقونات — */
        root.style.setProperty('--gis-dock-size', S.dock.size + 'px');
        root.style.setProperty('--gis-dock-gap', S.dock.gap + 'px');
        root.style.setProperty('--gis-dock-opacity', String(S.dock.opacity));

        /* — القائمة الجانبية — */
        root.style.setProperty('--sidebar-w', S.sidebar.width + 'px');
        body.classList.toggle('cc-side-right', S.sidebar.side === 'right');
        body.classList.toggle('cc-autohide', !!S.sidebar.autoHide);

        /* — التوهج — */
        body.classList.remove('cc-glow-off', 'cc-glow-normal', 'cc-glow-strong');
        body.classList.add('cc-glow-' + S.theme.glow);

        /* — اللون المميز — */
        if (S.theme.accent) { root.style.setProperty('--accent', S.theme.accent); }
        else { root.style.removeProperty('--accent'); }

        /* — نمط الأيقونات (مزامنة بين الملفين) — */
        if (window.GIS && GIS.icons && S.icon.mode && GIS.icons.getMode() !== S.icon.mode) {
            GIS.icons.setMode(S.icon.mode);
        }

        /* — الترتيب والإخفاء — */
        applyOrder(tabBtns(), S.tabs.order, 'data-tab');
        applyHidden(tabBtns(), S.tabs.hidden, 'cc-hidden');
        var dk = dockBtns();
        applyOrder(dk, pinFirst(S.dock.order), 'data-side');
        applyHidden(dk, S.dock.hidden, 'cc-hidden');

        /* — حالة الطي المحفوظة — */
        var sb = sidebarEl();
        if (sb && S.sidebar.collapsed === true) {
            sb.classList.add('collapsed');
            var d = dockEl();
            if (d) { d.classList.remove('hidden'); }
        } else if (sb && S.sidebar.collapsed === false) {
            sb.classList.remove('collapsed');
            var d2 = dockEl();
            if (d2) { d2.classList.add('hidden'); }
        }

        syncLists();
    }

    function pinFirst(order) {
        var arr = (order || []).slice();
        var i = arr.indexOf('expand');
        if (i >= 0) { arr.splice(i, 1); }
        arr.unshift('expand');
        return arr;
    }
    function applyOrder(list, order, attr) {
        if (!list.length || !order || !order.length) { return; }
        var map = {}, seen = {}, seq = [];
        list.forEach(function (el) { map[el.getAttribute(attr)] = el; });
        order.forEach(function (id) {
            if (map[id] && !seen[id]) { seq.push(map[id]); seen[id] = 1; }
        });
        list.forEach(function (el) {
            var id = el.getAttribute(attr);
            if (!seen[id]) { seq.push(el); seen[id] = 1; }
        });
        var parent = seq[0].parentNode;
        seq.forEach(function (el) { parent.appendChild(el); });
    }
    function applyHidden(list, hidden, cls) {
        list.forEach(function (el) {
            var id = el.getAttribute('data-tab') || el.getAttribute('data-side');
            el.classList.toggle(cls, hidden.indexOf(id) >= 0);
        });
    }
    function collectOrder(container, sel, attr) {
        var out = [];
        $$(sel, container).forEach(function (el) { out.push(el.getAttribute(attr)); });
        if (attr === 'data-side') { out = pinFirst(out); }
        return out;
    }

    /* ================= عزل الأحداث عن الخريطة ================= */
    function isolate(el) {
        if (!el || el.__gisIsolated) { return; }
        el.__gisIsolated = true;
        ['pointerdown', 'wheel', 'touchstart', 'dblclick'].forEach(function (ev) {
            el.addEventListener(ev, function (e) { e.stopPropagation(); }, false);
        });
    }

    /* ================= سحب وإفلات (محرك واحد للتبويبات والقوائم) ================= */
    function makeSortable(container, sel, attr, opts) {
        if (!container || container.__gisSortable) { return; }
        container.__gisSortable = true;
        opts = opts || {};
        var axis = opts.axis || 'y';
        var pending = null;

        document.addEventListener('touchmove', function (e) {
            if (DRAG_ACTIVE) { e.preventDefault(); }
        }, { passive: false });
        document.addEventListener('contextmenu', function (e) {
            if (DRAG_ACTIVE) { e.preventDefault(); }
        }, true);

        function clearDrop() {
            $$('.cc-drop', container).forEach(function (n) { n.classList.remove('cc-drop'); });
        }
        function startDrag(e) {
            if (!pending || pending.started) { return; }
            pending.started = true;
            DRAG_ACTIVE = true;
            pending.item.classList.add('cc-dragging');
            if (pending.timer) { clearTimeout(pending.timer); pending.timer = null; }
        }
        function onMove(e) {
            if (!pending) { return; }
            var dx = e.clientX - pending.x, dy = e.clientY - pending.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (!pending.started) {
                if (pending.touch) {
                    if (!pending.touchArmed) { return; }
                } else if (dist < 6) { return; }
                startDrag(e);
            }
            e.preventDefault();
            var under = document.elementFromPoint(e.clientX, e.clientY);
            var over = under && under.closest ? under.closest(sel) : null;
            if (!over || over === pending.item || !container.contains(over)) { over = null; }
            clearDrop();
            if (over) {
                over.classList.add('cc-drop');
                var r = over.getBoundingClientRect();
                var after = (axis === 'y') ? (e.clientY > r.top + r.height / 2)
                                           : (e.clientX > r.left + r.width / 2);
                if (after) { container.insertBefore(pending.item, over.nextSibling); }
                else { container.insertBefore(pending.item, over); }
            }
        }
        function finish(commit) {
            if (!pending) { return; }
            var p = pending;
            pending = null;
            if (p.timer) { clearTimeout(p.timer); }
            p.item.classList.remove('cc-dragging');
            clearDrop();
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onCancel);
            if (!p.started) { DRAG_ACTIVE = false; return; }
            DRAG_ACTIVE = false;
            SUPPRESS_CLICK = true;
            setTimeout(function () { SUPPRESS_CLICK = false; }, 0);
            if (commit === false) {
                /* إلغاء: نعيد الترتيب المحفوظ */
                if (opts.restore) { opts.restore(); }
                return;
            }
            var ids = [];
            $$(sel, container).forEach(function (el) { ids.push(el.getAttribute(attr)); });
            if (opts.onEnd) { opts.onEnd(ids); }
        }
        function onUp() { finish(true); }
        function onCancel() { finish(false); }

        container.addEventListener('pointerdown', function (e) {
            if (e.button && e.button !== 0) { return; }
            if (e.target.closest('input, label, select, textarea, a')) { return; }
            var item = e.target.closest(sel);
            if (!item || !container.contains(item)) { return; }
            pending = {
                item: item, x: e.clientX, y: e.clientY,
                touch: e.pointerType === 'touch', touchArmed: false,
                started: false, timer: null
            };
            if (pending.touch) {
                pending.timer = setTimeout(function () {
                    if (!pending) { return; }
                    pending.touchArmed = true;
                    pending.item.classList.add('cc-dragging');
                }, 330);
            }
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onCancel);
        });

        container.addEventListener('click', function (e) {
            if (SUPPRESS_CLICK) { e.stopPropagation(); e.preventDefault(); }
        }, true);
    }

    /* ================= ربط سحب الشريط والتبويبات مباشرة ================= */
    function wireDirectDnd() {
        var dk = dockEl();
        if (dk) {
            makeSortable(dk, 'button[data-side]', 'data-side', {
                axis: 'y',
                onEnd: function (ids) {
                    S.dock.order = ids;
                    save();
                    syncLists();
                    notify('تم حفظ ترتيب الشريط', 'success');
                },
                restore: function () { apply(); }
            });
        }
        var tw = tabsWrap();
        if (tw) {
            makeSortable(tw, 'button[data-tab]', 'data-tab', {
                axis: 'x',
                onEnd: function (ids) {
                    S.tabs.order = ids;
                    save();
                    syncLists();
                    notify('تم حفظ ترتيب التبويبات', 'success');
                },
                restore: function () { apply(); }
            });
        }
    }

    /* ================= مقبض تحجيم القائمة الجانبية ================= */
    function ensureResizeHandle() {
        var sb = sidebarEl();
        if (!sb) { return null; }
        var h = $('.gis-side-resize', sb);
        if (h) { return h; }
        h = document.createElement('div');
        h.className = 'gis-side-resize';
        h.setAttribute('title', 'اسحب لتعديل عرض اللوحة');
        h.setAttribute('role', 'separator');
        h.setAttribute('aria-label', 'تعديل عرض اللوحة');
        sb.appendChild(h);
        h.addEventListener('pointerdown', function (e) {
            if (e.button && e.button !== 0) { return; }
            e.preventDefault();
            e.stopPropagation();
            var startX = e.clientX;
            var startW = sb.getBoundingClientRect().width;
            var side = S.sidebar.side;
            var live = startW;
            h.classList.add('cc-resizing');
            document.body.classList.add('cc-resizing');
            try { h.setPointerCapture(e.pointerId); } catch (err) {}
            function move(ev) {
                var dx = ev.clientX - startX;
                if (side === 'right') { dx = -dx; }
                live = clamp(startW + dx, 280, 560, startW);
                document.documentElement.style.setProperty('--sidebar-w', live + 'px');
            }
            function up() {
                h.classList.remove('cc-resizing');
                document.body.classList.remove('cc-resizing');
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
                S.sidebar.width = Math.round(live);
                save();
                apply();
                syncPanelUI();
                notify('عرض اللوحة: ' + Math.round(live) + 'px', 'success');
            }
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        });
        return h;
    }

    function setSide(open) {
        var sb = sidebarEl(), dk = dockEl();
        if (!sb || !dk) { return; }
        sb.classList.toggle('collapsed', !open);
        dk.classList.toggle('hidden', open);
    }

    function wireAutoHide() {
        var sb = sidebarEl();
        if (!sb || sb.__gisAutoHide) { return; }
        sb.__gisAutoHide = true;
        sb.addEventListener('mouseenter', function () {
            if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
        });
        sb.addEventListener('mouseleave', function () {
            if (!S.sidebar.autoHide || DRAG_ACTIVE) { return; }
            if (autoHideTimer) { clearTimeout(autoHideTimer); }
            autoHideTimer = setTimeout(function () {
                if (S.sidebar.autoHide && !DRAG_ACTIVE) { setSide(false); }
            }, 500);
        });
    }

    /* ================= مراقبات (حفظ الطي + إظهار التبويب النشط) ================= */
    function addWatchers() {
        if (typeof MutationObserver === 'undefined') { return; }
        var sb = sidebarEl();
        if (sb && !sb.__gisWatch) {
            sb.__gisWatch = true;
            var t = null;
            new MutationObserver(function () {
                clearTimeout(t);
                t = setTimeout(function () {
                    var c = sb.classList.contains('collapsed');
                    if (S.sidebar.collapsed !== c) { S.sidebar.collapsed = c; save(); }
                }, 120);
            }).observe(sb, { attributes: true, attributeFilter: ['class'] });
        }
        var tw = tabsWrap();
        if (tw && !tw.__gisWatch) {
            tw.__gisWatch = true;
            new MutationObserver(function () {
                var act = tw.querySelector('button.active.cc-hidden');
                if (!act) { return; }
                var id = act.getAttribute('data-tab');
                act.classList.remove('cc-hidden');
                var i = S.tabs.hidden.indexOf(id);
                if (i >= 0) { S.tabs.hidden.splice(i, 1); save(); syncLists(); }
            }).observe(tw, { attributes: true, attributeFilter: ['class'], subtree: true });
        }
    }

    /* ================= لوحة التحكم ================= */
    function panelHTML() {
        return '' +
        '<div class="cc-sec" id="ccIcons">' +
            '<h5><i class="fas fa-icons"></i> Icon Manager · الأيقونات <span class="cc-badge" id="ccIconModeBadge">SVG</span></h5>' +
            '<div class="cc-slider-row"><label for="ccIconSize">حجم الأيقونات</label>' +
                '<input type="range" id="ccIconSize" min="14" max="40" step="1" />' +
                '<span class="cc-val" id="ccIconSizeVal">22px</span></div>' +
            '<div class="cc-row"><label>نمط الأيقونات</label>' +
                '<div class="cc-chips">' +
                    '<button type="button" class="cc-chip" id="ccStyleSvg" title="أيقونات SVG متجهية (Lucide) — أخف وأدق"><i class="fas fa-icons"></i> SVG متجهية</button>' +
                    '<button type="button" class="cc-chip" id="ccStyleFa" title="إرجاع أيقونات Font Awesome الأصلية">Font Awesome</button>' +
                '</div></div>' +
            '<div class="cc-slider-row"><label for="ccIconOp">شفافية الأيقونات</label>' +
                '<input type="range" id="ccIconOp" min="30" max="100" step="5" />' +
                '<span class="cc-val" id="ccIconOpVal">100%</span></div>' +
            '<div class="cc-slider-row"><label for="ccIconGap">مسافة الأيقونات</label>' +
                '<input type="range" id="ccIconGap" min="0" max="20" step="1" />' +
                '<span class="cc-val" id="ccIconGapVal">6</span></div>' +
            '<div class="cc-row"><label for="ccMono">لون موحّد للأيقونات</label>' +
                '<div class="cc-chips">' +
                    '<label class="switch"><input type="checkbox" id="ccMono" /><span class="slider"></span></label>' +
                    '<input type="color" id="ccMonoColor" value="#e2e8f0" title="لون الأيقونات الموحّد" />' +
                '</div></div>' +
            '<button type="button" class="cc-btn" id="ccSpinDemo" title="اختبار حالة التحميل على هذا الزر نفسه"><i class="fas fa-spinner fa-spin"></i> اختبار حالة التحميل/التعطيل</button>' +
            '<div class="cc-stats"><span class="cc-stat" id="ccStatUp">متجهة: 0</span><span class="cc-stat" id="ccStatTotal">فحص: 0</span><span class="cc-stat warn" id="ccStatMissing">احتياط FA: 0</span></div>' +
        '</div>' +

        '<div class="cc-sec" id="ccSide">' +
            '<h5><i class="fas fa-arrows-left-right-to-line"></i> Sidebar Manager · القائمة الجانبية</h5>' +
            '<div class="cc-row"><label>تموضع اللوحة</label>' +
                '<div class="cc-chips">' +
                    '<button type="button" class="cc-chip" id="ccSideLeft" title="عرض اللوحة على يسار الشاشة"><i class="fas fa-arrow-right-arrow-left"></i> يسار</button>' +
                    '<button type="button" class="cc-chip" id="ccSideRight" title="عرض اللوحة على يمين الشاشة">يمين <i class="fas fa-arrow-right-arrow-left"></i></button>' +
                '</div></div>' +
            '<div class="cc-slider-row"><label for="ccSideW">عرض اللوحة</label>' +
                '<input type="range" id="ccSideW" min="280" max="560" step="10" />' +
                '<span class="cc-val" id="ccSideWVal">360</span></div>' +
            '<div class="cc-row"><label for="ccAutoHide">إخفاء تلقائي عند الخروج</label>' +
                '<label class="switch"><input type="checkbox" id="ccAutoHide" /><span class="slider"></span></label></div>' +
            '<div class="cc-two">' +
                '<button type="button" class="cc-btn" id="ccCollapse" title="طيّ اللوحة إلى الشريط الجانبي"><i class="fas fa-chevron-left"></i> طيّ اللوحة</button>' +
                '<button type="button" class="cc-btn" id="ccExpand" title="فتح اللوحة كاملة"><i class="fas fa-chevron-right"></i> فتح اللوحة</button>' +
            '</div>' +
            '<div class="cc-slider-row"><label for="ccDockSize">حجم أيقونات الشريط</label>' +
                '<input type="range" id="ccDockSize" min="28" max="64" step="2" />' +
                '<span class="cc-val" id="ccDockSizeVal">40</span></div>' +
            '<div class="cc-slider-row"><label for="ccDockOp">شفافية الشريط</label>' +
                '<input type="range" id="ccDockOp" min="30" max="100" step="5" />' +
                '<span class="cc-val" id="ccDockOpVal">100%</span></div>' +
            '<div class="cc-row"><label>عناصر الشريط (اسحب لإعادة الترتيب)</label></div>' +
            '<div class="cc-list" id="ccDockList"></div>' +
            '<div class="cc-hint"><i class="fas fa-circle-info"></i> يمكنك أيضًا سحب الأيقونات داخل الشريط نفسه مباشرة، وسحب حافة اللوحة لتعديل عرضها. زر الفتح (السهم) يبقى أولًا دائمًا.</div>' +
        '</div>' +

        '<div class="cc-sec" id="ccLayout">' +
            '<h5><i class="fas fa-table-columns"></i> Layout Manager · التبويبات</h5>' +
            '<div class="cc-list" id="ccTabsList"></div>' +
            '<div class="cc-hint"><i class="fas fa-circle-info"></i> التبويب المخفي يظهر تلقائيًا فور اختياره من الشريط الجانبي.</div>' +
        '</div>' +

        '<div class="cc-sec" id="ccTheme">' +
            '<h5><i class="fas fa-palette"></i> Theme Manager · المظهر</h5>' +
            '<div class="cc-row"><label>الوضع</label>' +
                '<div class="cc-chips">' +
                    '<button type="button" class="cc-chip" id="ccDark" title="وضع داكن زجاجي"><i class="fas fa-moon"></i> داكن</button>' +
                    '<button type="button" class="cc-chip" id="ccLight" title="وضع فاتح"><i class="fas fa-adjust"></i> فاتح</button>' +
                '</div></div>' +
            '<div class="cc-row"><label for="ccAccent">اللون المميز</label>' +
                '<div class="cc-chips">' +
                    '<input type="color" id="ccAccent" value="#0284c7" title="لون التمييز في كامل الواجهة" />' +
                    '<button type="button" class="cc-chip" id="ccAccentReset" title="إرجاع اللون الافتراضي">افتراضي</button>' +
                '</div></div>' +
            '<div class="cc-row"><label>شدة التوهج (Glow)</label>' +
                '<div class="cc-chips">' +
                    '<button type="button" class="cc-chip" data-glow="off">إيقاف</button>' +
                    '<button type="button" class="cc-chip" data-glow="normal">عادي</button>' +
                    '<button type="button" class="cc-chip" data-glow="strong">قوي</button>' +
                '</div></div>' +
        '</div>' +

        '<div class="cc-sec" id="ccPresets">' +
            '<h5><i class="fas fa-wand-magic-sparkles"></i> Workspace Presets · أنماط العمل <span class="cc-badge" id="ccPresetBadge">default</span></h5>' +
            '<div class="cc-presets" id="ccPresetGrid"></div>' +
        '</div>' +

        '<div class="cc-sec" id="ccBackup">' +
            '<h5><i class="fas fa-floppy-disk"></i> Reset &amp; Backup · الاستعادة والنسخ</h5>' +
            '<div class="cc-two">' +
                '<button type="button" class="cc-btn" id="ccExportBtn" title="تنزيل إعدادات الواجهة كملف JSON"><i class="fas fa-download"></i> تصدير JSON</button>' +
                '<button type="button" class="cc-btn" id="ccImportBtn" title="استيراد إعدادات الواجهة من ملف JSON"><i class="fas fa-upload"></i> استيراد JSON</button>' +
            '</div>' +
            '<input type="file" id="ccImportFile" accept=".json,application/json" class="cc-file-input" />' +
            '<button type="button" class="cc-btn danger" id="ccResetBtn" title="إعادة إعدادات الواجهة فقط إلى الوضع الافتراضي"><i class="fas fa-rotate-left"></i> استعادة تخطيط الواجهة الافتراضي</button>' +
            '<div class="cc-hint"><i class="fas fa-shield-halved"></i> الاستعادة تعيد إعدادات الواجهة فقط (gisUiSettings_v1 + حجم الأيقونات)، <b>ولا تمس</b> بياناتك ولا إعدادات الاتصال بـ Supabase ولا الوحدات.</div>' +
        '</div>';
    }

    function buildPanel() {
        var host = document.getElementById('tab-settings');
        if (!host) { return null; }
        if (document.getElementById('ccPanel')) { return document.getElementById('ccPanel'); }
        var wrap = document.createElement('div');
        wrap.id = 'ccPanel';
        wrap.innerHTML = panelHTML();
        host.appendChild(wrap);
        return wrap;
    }

    function buildPresets() {
        var grid = document.getElementById('ccPresetGrid');
        if (!grid) { return; }
        grid.innerHTML = '';
        Object.keys(PRESETS).forEach(function (id) {
            var p = PRESETS[id];
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cc-preset' + (S.preset === id ? ' on' : '');
            b.setAttribute('data-preset', id);
            b.title = 'تطبيق نمط ' + p.label;
            b.innerHTML = p.label + '<small>' + p.desc + '</small>';
            b.addEventListener('click', function () { applyPreset(id); });
            grid.appendChild(b);
        });
        var badge = document.getElementById('ccPresetBadge');
        if (badge) { badge.textContent = S.preset || 'default'; }
    }

    function buildDockList() {
        var list = document.getElementById('ccDockList');
        if (!list) { return; }
        list.innerHTML = '';
        dockBtns().forEach(function (btn) {
            var id = btn.getAttribute('data-side');
            if (id === 'expand') { return; }
            var row = document.createElement('div');
            row.className = 'cc-item';
            row.setAttribute('data-side', id);
            var hidden = S.dock.hidden.indexOf(id) >= 0;
            if (hidden) { row.classList.add('is-hidden-item'); }
            var grip = document.createElement('span');
            grip.className = 'cc-grip';
            grip.appendChild(iconEl('fa-grip-vertical'));
            var name = document.createElement('span');
            name.className = 'cc-name';
            name.textContent = btn.getAttribute('title') || id;
            var chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = !hidden;
            chk.title = 'إظهار/إخفاء هذا العنصر';
            chk.addEventListener('change', function () {
                var i = S.dock.hidden.indexOf(id);
                if (this.checked) { if (i >= 0) { S.dock.hidden.splice(i, 1); } }
                else if (i < 0) { S.dock.hidden.push(id); }
                save();
                apply();
            });
            row.appendChild(grip);
            row.appendChild(name);
            row.appendChild(chk);
            list.appendChild(row);
        });
        makeSortable(list, '.cc-item', 'data-side', {
            axis: 'y',
            onEnd: function (ids) {
                if (ids.indexOf('expand') >= 0) { ids.splice(ids.indexOf('expand'), 1); }
                S.dock.order = ids;
                save();
                apply();
                notify('تم حفظ ترتيب الشريط', 'success');
            },
            restore: function () { apply(); }
        });
    }

    function buildTabsList() {
        var list = document.getElementById('ccTabsList');
        if (!list) { return; }
        list.innerHTML = '';
        tabBtns().forEach(function (btn) {
            var id = btn.getAttribute('data-tab');
            var row = document.createElement('div');
            row.className = 'cc-item';
            row.setAttribute('data-tab', id);
            var hidden = S.tabs.hidden.indexOf(id) >= 0;
            if (hidden) { row.classList.add('is-hidden-item'); }
            var grip = document.createElement('span');
            grip.className = 'cc-grip';
            grip.appendChild(iconEl('fa-grip-vertical'));
            var name = document.createElement('span');
            name.className = 'cc-name';
            name.textContent = (btn.textContent || id).trim();
            var chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = !hidden;
            chk.title = 'إظهار/إخفاء هذا التبويب';
            chk.addEventListener('change', function () {
                var i = S.tabs.hidden.indexOf(id);
                if (this.checked) { if (i >= 0) { S.tabs.hidden.splice(i, 1); } }
                else if (i < 0) { S.tabs.hidden.push(id); }
                save();
                apply();
            });
            row.appendChild(grip);
            row.appendChild(name);
            row.appendChild(chk);
            list.appendChild(row);
        });
        makeSortable(list, '.cc-item', 'data-tab', {
            axis: 'y',
            onEnd: function (ids) {
                S.tabs.order = ids;
                save();
                apply();
                notify('تم حفظ ترتيب التبويبات', 'success');
            },
            restore: function () { apply(); }
        });
    }

    function listSignature() {
        return JSON.stringify({
            d: collectOrder(dockEl() || document.createElement('div'), 'button[data-side]', 'data-side'),
            dh: S.dock.hidden,
            t: collectOrder(tabsWrap() || document.createElement('div'), 'button[data-tab]', 'data-tab'),
            th: S.tabs.hidden
        });
    }
    function syncLists() {
        if (!document.getElementById('ccPanel')) { return; }
        if (DRAG_ACTIVE) { return; }
        var sig = listSignature();
        if (sig === lastListSig) { return; }
        lastListSig = sig;
        buildDockList();
        buildTabsList();
    }

    function syncPanelUI() {
        var v;
        v = $('#ccIconSize'); if (v) { v.value = String(iconSize()); }
        v = $('#ccIconSizeVal'); if (v) { v.textContent = iconSize() + 'px'; }
        v = $('#ccIconOp'); if (v) { v.value = String(Math.round(S.icon.opacity * 100)); }
        v = $('#ccIconOpVal'); if (v) { v.textContent = Math.round(S.icon.opacity * 100) + '%'; }
        v = $('#ccIconGap'); if (v) { v.value = String(S.dock.gap); }
        v = $('#ccIconGapVal'); if (v) { v.textContent = String(S.dock.gap); }
        v = $('#ccMono'); if (v) { v.checked = !!S.icon.mono; }
        v = $('#ccMonoColor'); if (v) { v.value = S.icon.color || '#e2e8f0'; }
        v = $('#ccSideW'); if (v) { v.value = String(S.sidebar.width); }
        v = $('#ccSideWVal'); if (v) { v.textContent = String(S.sidebar.width); }
        v = $('#ccAutoHide'); if (v) { v.checked = !!S.sidebar.autoHide; }
        v = $('#ccDockSize'); if (v) { v.value = String(S.dock.size); }
        v = $('#ccDockSizeVal'); if (v) { v.textContent = String(S.dock.size); }
        v = $('#ccDockOp'); if (v) { v.value = String(Math.round(S.dock.opacity * 100)); }
        v = $('#ccDockOpVal'); if (v) { v.textContent = Math.round(S.dock.opacity * 100) + '%'; }
        var mode = (window.GIS && GIS.icons) ? GIS.icons.getMode() : (S.icon.mode || 'svg');
        var bSvg = $('#ccStyleSvg'), bFa = $('#ccStyleFa'), badge = $('#ccIconModeBadge');
        if (bSvg) { bSvg.classList.toggle('on', mode === 'svg'); }
        if (bFa) { bFa.classList.toggle('on', mode !== 'svg'); }
        if (badge) { badge.textContent = mode === 'svg' ? 'SVG' : 'FA'; }
        v = $('#ccSideLeft'); if (v) { v.classList.toggle('on', S.sidebar.side === 'left'); }
        v = $('#ccSideRight'); if (v) { v.classList.toggle('on', S.sidebar.side === 'right'); }
        v = $('#ccAccent'); if (v && S.theme.accent) { v.value = S.theme.accent; }
        $$('[data-glow]').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-glow') === S.theme.glow);
        });
        var isLight = document.body.classList.contains('theme-light');
        var d = $('#ccDark'), l = $('#ccLight');
        if (d) { d.classList.toggle('on', !isLight); }
        if (l) { l.classList.toggle('on', isLight); }
        var pb = $('#ccPresetBadge');
        if (pb) { pb.textContent = S.preset || 'default'; }
        $$('#ccPresetGrid .cc-preset').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-preset') === S.preset);
        });
        updateIconStats();
    }

    function updateIconStats() {
        var up = $('#ccStatUp'), tot = $('#ccStatTotal'), miss = $('#ccStatMissing');
        if (!up || !window.GIS || !GIS.icons) { return; }
        var st = GIS.icons.stats();
        up.textContent = 'متجهة: ' + st.upgraded;
        tot.textContent = 'فحص: ' + st.total;
        miss.textContent = 'احتياط FA: ' + st.missing.length;
        miss.title = st.missing.length ? ('أيقونات بدون SVG (بقيت Font Awesome): ' + st.missing.join(', '))
                                       : 'كل الأيقونات مغطاة بالـ SVG';
    }

    function applyPreset(id) {
        var p = PRESETS[id];
        if (!p) { return; }
        S.tabs.order = p.tabs.slice();
        S.tabs.hidden = p.hidden.slice();
        S.dock.order = [];
        S.sidebar.side = p.side;
        S.sidebar.width = p.width;
        S.theme.accent = p.accent;
        S.theme.glow = p.glow;
        S.preset = id;
        normalize(S);
        save();
        apply();
        setIconSize(p.icon);
        var firstVisible = p.tabs.filter(function (t) { return p.hidden.indexOf(t) < 0; })[0];
        if (firstVisible) {
            var b = document.querySelector('.tabs button[data-tab="' + firstVisible + '"]');
            if (b && !b.classList.contains('active')) { b.click(); }
        }
        syncPanelUI();
        notify('تم تطبيق النمط: ' + p.label, 'success');
    }

    function resetLayout() {
        try { localStorage.removeItem(KEY); } catch (e) {}
        try { localStorage.setItem(ICON_KEY, '22'); } catch (e) {}
        load();
        document.documentElement.style.removeProperty('--accent');
        setIconSize(22, true);
        apply();
        syncPanelUI();
        notify('تمت استعادة تخطيط الواجهة الافتراضي (بياناتك لم تُمس)', 'success');
    }

    function exportJson() {
        var payload = { app: 'gis-command-center', v: 1, exportedAt: new Date().toISOString(), settings: S };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gis-ui-settings-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 400);
        notify('تم تصدير إعدادات الواجهة', 'success');
    }
    function importJson(file, done) {
        var fr = new FileReader();
        fr.onload = function () {
            try {
                var data = JSON.parse(String(fr.result));
                var incoming = (data && data.settings && typeof data.settings === 'object') ? data.settings : data;
                if (!incoming || typeof incoming !== 'object') { throw new Error('bad'); }
                S = merge(DEFAULTS, incoming);
                normalize(S);
                save();
                apply();
                syncPanelUI();
                notify('تم استيراد إعدادات الواجهة بنجاح', 'success');
                if (done) { done(true); }
            } catch (e) {
                notify('ملف غير صالح — لم يتغيّر شيء', 'error');
                if (done) { done(false); }
            }
        };
        fr.onerror = function () { notify('تعذّرت قراءة الملف', 'error'); if (done) { done(false); } };
        fr.readAsText(file);
    }

    /* ================= ربط أزرار اللوحة ================= */
    function wirePanel(panel) {
        function bindRange(id, valId, fn, fmt) {
            var el = $(id, panel); if (!el) { return; }
            var lab = valId ? $(valId, panel) : null;
            var handler = function () {
                var v = parseFloat(el.value);
                fn(v);
                if (lab) { lab.textContent = fmt ? fmt(v) : String(v); }
            };
            el.addEventListener('input', handler);
        }
        function bindClick(id, fn) {
            var el = $(id, panel); if (!el) { return; }
            el.addEventListener('click', fn);
        }

        bindRange('#ccIconSize', '#ccIconSizeVal', function (v) { setIconSize(v); }, function (v) { return v + 'px'; });
        bindRange('#ccIconOp', '#ccIconOpVal', function (v) { set('icon.opacity', v / 100); }, function (v) { return Math.round(v) + '%'; });
        bindRange('#ccIconGap', '#ccIconGapVal', function (v) { set('dock.gap', v); });
        bindRange('#ccSideW', '#ccSideWVal', function (v) { set('sidebar.width', v); });
        bindRange('#ccDockSize', '#ccDockSizeVal', function (v) { set('dock.size', v); });
        bindRange('#ccDockOp', '#ccDockOpVal', function (v) { set('dock.opacity', v / 100); }, function (v) { return Math.round(v) + '%'; });

        bindClick('#ccStyleSvg', function () {
            if (!window.GIS || !GIS.icons) { return; }
            GIS.icons.setMode('svg');
            S.icon.mode = 'svg'; save(); syncPanelUI();
            notify('تم تفعيل الأيقونات المتجهة SVG', 'success');
        });
        bindClick('#ccStyleFa', function () {
            if (!window.GIS || !GIS.icons) { return; }
            GIS.icons.setMode('fa');
            S.icon.mode = 'fa'; save(); syncPanelUI();
            notify('تمت إرجاع أيقونات Font Awesome الأصلية', 'success');
        });

        var mono = $('#ccMono', panel);
        if (mono) { mono.addEventListener('change', function () { set('icon.mono', !!this.checked); }); }
        var monoColor = $('#ccMonoColor', panel);
        if (monoColor) { monoColor.addEventListener('input', function () { set('icon.color', this.value); }); }

        bindClick('#ccSpinDemo', function () {
            var b = $('#ccSpinDemo', panel);
            if (!b || b.disabled) { return; }
            b.classList.add('is-loading');
            b.disabled = true;
            setTimeout(function () {
                b.classList.remove('is-loading');
                b.disabled = false;
                notify('كل الزر يعمل: تم عرض حالة التحميل والتعطيل', 'success');
            }, 1600);
        });
        bindClick('#ccStatUp', function () {
            if (window.GIS && GIS.icons) { GIS.icons.resetStats(); GIS.icons.scan(); updateIconStats(); }
        });

        bindClick('#ccSideLeft', function () { set('sidebar.side', 'left'); syncPanelUI(); });
        bindClick('#ccSideRight', function () { set('sidebar.side', 'right'); syncPanelUI(); });
        var ah = $('#ccAutoHide', panel);
        if (ah) { ah.addEventListener('change', function () { set('sidebar.autoHide', !!this.checked); }); }
        bindClick('#ccCollapse', function () { setSide(false); });
        bindClick('#ccExpand', function () { setSide(true); });

        var th = $('#setTheme');
        bindClick('#ccDark', function () {
            if (th) { th.checked = true; th.dispatchEvent(new Event('change', { bubbles: true })); }
            syncPanelUI();
        });
        bindClick('#ccLight', function () {
            if (th) { th.checked = false; th.dispatchEvent(new Event('change', { bubbles: true })); }
            syncPanelUI();
        });
        var acc = $('#ccAccent', panel);
        if (acc) {
            acc.addEventListener('input', function () { set('theme.accent', this.value); });
        }
        bindClick('#ccAccentReset', function () { set('theme.accent', ''); var a = $('#ccAccent', panel); if (a) { a.value = '#0284c7'; } });
        $$('[data-glow]', panel).forEach(function (b) {
            b.addEventListener('click', function () { set('theme.glow', b.getAttribute('data-glow')); syncPanelUI(); });
        });

        bindClick('#ccExportBtn', exportJson);
        bindClick('#ccImportBtn', function () { var f = $('#ccImportFile', panel); if (f) { f.click(); } });
        var fi = $('#ccImportFile', panel);
        if (fi) {
            fi.addEventListener('change', function () {
                if (this.files && this.files[0]) { importJson(this.files[0]); }
                this.value = '';
            });
        }
        bindClick('#ccResetBtn', function () {
            if (!confirm('استعادة تخطيط الواجهة الافتراضي؟\n(لن تُمس بياناتك ولا إعدادات الاتصال بـ Supabase)')) { return; }
            resetLayout();
        });
    }

    /* ================= تهيئة ================= */
    function init() {
        if (INITED) { apply(); syncPanelUI(); return; }
        if (!document.body) { return; }
        INITED = true;
        load();
        var panel = buildPanel();
        apply();
        if (panel) {
            buildPresets();
            buildDockList();
            buildTabsList();
            wirePanel(panel);
            syncPanelUI();
        }
        ensureResizeHandle();
        wireDirectDnd();
        wireAutoHide();
        addWatchers();
        [sidebarEl(), dockEl(), document.getElementById('gisModPanel')].forEach(function (n) { isolate(n); });

        document.addEventListener('gis:iconsize', function () {
            var sl = $('#ccIconSize'), lb = $('#ccIconSizeVal');
            if (sl) { sl.value = String(iconSize()); }
            if (lb) { lb.textContent = iconSize() + 'px'; }
        });
        document.addEventListener('gis:iconmode', function () { syncPanelUI(); });
        window.addEventListener('resize', function () {
            if (S && document.body) {
                document.documentElement.style.setProperty('--sidebar-w', S.sidebar.width + 'px');
            }
        });
        try { console.log('[GIS.UI] Command Center UI ready'); } catch (e) {}
    }

    /* واجهة للاختبارات والاستخدام الخارجي */
    var api = {
        init: init,
        apply: apply,
        save: save,
        load: load,
        get: function (path) {
            if (!path) { return S; }
            var parts = path.split('.'), o = S;
            for (var i = 0; i < parts.length; i++) { if (!o) { return undefined; } o = o[parts[i]]; }
            return o;
        },
        set: set,
        reset: resetLayout,
        presets: PRESETS,
        applyPreset: applyPreset,
        exportJson: exportJson,
        importJson: importJson,
        setSide: setSide,
        setIconSize: setIconSize,
        iconSize: iconSize,
        isolate: isolate,
        makeSortable: makeSortable,
        syncPanelUI: syncPanelUI,
        buildPanel: buildPanel,
        isInit: function () { return INITED; },
        defaults: function () { return clone(DEFAULTS); }
    };

    if (!window.GIS) { window.GIS = {}; }
    window.GIS.ui = api;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        window.addEventListener('load', init);
    } else if (document.readyState === 'complete') {
        setTimeout(init, 0);
    } else {
        window.addEventListener('load', init);
    }
})();
