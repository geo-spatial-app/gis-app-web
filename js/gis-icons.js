/* ================================================================
   GIS Icons Engine — أيقونات SVG متجهية (نمط Lucide)
   الإصدار: 1.0.0
   المزايا:
     - تحويل تلقائي لكل أيقونات Font Awesome داخل الصفحة إلى SVG متجهي
       داخل نفس عنصر <i> (يحتفظ بكل أنماط CSS القائمة: اللون/الحجم/الدوران).
     - كشف أيقونات بـ MutationObserver (تظهر لاحقًا كبطاقات الوحدات).
     - الوضعان: svg (افتراضي) أو fa (الأصلية) — قابلان للتبديل والعودة.
     - حالات: تحميل/تعطيل/hover عبر .is-loading و [disabled].
     - لا يعتمد على أي مكتبة خارجية، ولا يغيّر أي وظائف قائمة.
   ملاحظة: عند غياب أيقونة في الخريطة يبقى عنصر Font Awesome الأصلي كما هو
           (لا تنكسر أي أيقونة مهما كان نوعها).
   ================================================================ */
(function () {
    'use strict';

    var MODE_KEY = 'gisIconMode_v1';

    /* ---------- خريطة fa-*  =>  محتوى SVG داخلي (viewBox 0 0 24 24) ---------- */
    var P = {
        'fa-adjust': '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
        'fa-arrow-right-arrow-left': '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
        'fa-arrows-left-right-to-line': '<path d="M3 5v14"/><path d="M21 5v14"/><path d="M8 12h8"/><path d="m11 9-3 3 3 3"/><path d="m13 9 3 3-3 3"/>',
        'fa-arrows-up-down-left-right': '<path d="M12 2v20"/><path d="M2 12h20"/><path d="m9 5 3-3 3 3"/><path d="m9 19 3 3 3-3"/><path d="m5 9-3 3 3 3"/><path d="m19 9 3 3-3 3"/>',
        'fa-bars': '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
        'fa-box-archive': '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
        'fa-briefcase': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/>',
        'fa-bullseye': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
        'fa-calculator': '<rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
        'fa-chart-area': '<path d="M3 3v18h18"/><path d="m7 14 4-5 3 3 5-6"/><path d="M7 14h11v5"/>',
        'fa-chart-column': '<path d="M3 3v18h18"/><path d="M7 21v-7h3v7z" fill="currentColor" stroke="none"/><path d="M12 21V9h3v12z" fill="currentColor" stroke="none"/><path d="M17 21v-11h3v11z" fill="currentColor" stroke="none"/>',
        'fa-chart-line': '<path d="M3 3v18h18"/><path d="m7 14 4-5 3 3 5-6"/><path d="m16 6 3 3"/>',
        'fa-chart-simple': '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V9M18 17V6"/>',
        'fa-check': '<path d="M20 6 9 17l-5-5"/>',
        'fa-check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.3 12.4 2.6 2.6 4.8-5.4"/>',
        'fa-chevron-down': '<path d="m6 9 6 6 6-6"/>',
        'fa-chevron-left': '<path d="m15 6-6 6 6 6"/>',
        'fa-chevron-right': '<path d="m9 6 6 6-6 6"/>',
        'fa-circle': '<circle cx="12" cy="12" r="9"/>',
        'fa-circle-check': '<circle cx="12" cy="12" r="9"/><path d="m8.3 12.4 2.6 2.6 4.8-5.4"/>',
        'fa-circle-info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/>',
        'fa-clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 1.9"/>',
        'fa-cloud': '<path d="M17.5 19a4.5 4.5 0 0 0 .4-8.98A6 6 0 0 0 6.2 11.2 3.9 3.9 0 0 0 7 19h10.5z"/>',
        'fa-cloud-arrow-down': '<path d="M17.5 18a4.5 4.5 0 0 0 .4-8.98A6 6 0 0 0 6.2 10.2 3.9 3.9 0 0 0 7 18"/><path d="M12 12v6"/><path d="m9.4 15.6 2.6 2.6 2.6-2.6"/>',
        'fa-cloud-arrow-up': '<path d="M17.5 18a4.5 4.5 0 0 0 .4-8.98A6 6 0 0 0 6.2 10.2 3.9 3.9 0 0 0 7 18"/><path d="M12 18v-6"/><path d="m9.4 14.4 2.6-2.6 2.6 2.6"/>',
        'fa-cog': '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M19.1 4.9l-2.9 2.9M7.8 16.2l-2.9 2.9"/>',
        'fa-crop-alt': '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
        'fa-crosshairs': '<circle cx="12" cy="12" r="9"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>',
        'fa-cube': '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m12 12 9-5M12 12 3 7M12 12v10"/>',
        'fa-cubes': '<path d="m11 3 7 4v8l-7 4-7-4V7z"/><path d="m11 11 7-4M11 11 4 7M11 11v8"/><path d="m17 14 4 2.2v4.6L17 23l-4-2.2v-4.6z"/>',
        'fa-database': '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
        'fa-diagram-cells': '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="3" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M10 9v3h4V9M12 12v3"/>',
        'fa-diagram-project': '<rect x="9" y="2" width="6" height="4.5" rx="1"/><rect x="2" y="17.5" width="6" height="4.5" rx="1"/><rect x="16" y="17.5" width="6" height="4.5" rx="1"/><path d="M12 6.5v5M5 17.5v-3h14v3"/>',
        'fa-download': '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/>',
        'fa-drafting-compass': '<circle cx="12" cy="4.5" r="2"/><path d="M11.2 6.4 6.4 21"/><path d="m12.8 6.4 4.8 14.6"/><path d="M8.6 15h6.8"/><circle cx="12" cy="21" r="1"/>',
        'fa-draw-polygon': '<path d="m6 9 6-4 6 5-3 7H8z"/><circle cx="6" cy="9" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="18" cy="10" r="1.6"/><circle cx="15" cy="18" r="1.6"/><circle cx="8" cy="18" r="1.6"/>',
        'fa-droplet': '<path d="M12 2.7s6.5 6.9 6.5 11.1a6.5 6.5 0 0 1-13 0C5.5 9.6 12 2.7 12 2.7z"/>',
        'fa-earth-africa': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/><path d="M10.5 7.5c-1.4 1-2 2.6-1.4 4 .6 1.3 0 2.3 1 3.4 1 1 1.6 2.4 3 2.6"/>',
        'fa-earth-asia': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/><path d="M14 6.5c1.4.5 1.8 2 1.2 3.2-.7 1.3.2 2 .8 3 .7 1.1.4 2.7-.8 3.6"/>',
        'fa-edit': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        'fa-ellipsis-v': '<circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>',
        'fa-eraser': '<path d="M7 21h13"/><path d="m4.5 16.5 7-7 6 6-4 4H8z"/><path d="m11.5 9.5 4-4a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8l-4 4"/>',
        'fa-eye': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
        'fa-eye-slash': '<path d="m3 3 18 18"/><path d="M10.6 5.1A11 11 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.5 4.4M6.6 6.7A17.4 17.4 0 0 0 2 12s3.6 7 10 7a11 11 0 0 0 4.2-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
        'fa-file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
        'fa-file-circle-plus': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 11v6M9 14h6"/>',
        'fa-file-code': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m10 13-2 2 2 2M14 13l2 2-2 2"/>',
        'fa-file-csv': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h7M8 17h7"/>',
        'fa-file-excel': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 13 6 6M15 13l-6 6"/>',
        'fa-file-export': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9.5 14.5 2.5-2.5 2.5 2.5"/>',
        'fa-file-pdf': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8.5 17v-4h1.6a1.7 1.7 0 0 1 0 3.4H8.5"/><path d="M13.5 17v-4h1.4a2 2 0 0 1 0 4z"/>',
        'fa-file-zipper': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M11 4v1.5M11 7v1.5M11 10v1.5M11 13v1.5M11 16v1.5M10 19.5h2"/>',
        'fa-fill-drip': '<path d="M12 2.7s6.5 6.9 6.5 11.1a6.5 6.5 0 0 1-13 0C5.5 9.6 12 2.7 12 2.7z"/><path d="M19.5 15.5s2.2 2.7 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1.3 2.2-4 2.2-4z"/>',
        'fa-filter': '<path d="M3 4h18l-7 8.2V20l-4 1.5v-9.3z"/>',
        'fa-filter-circle-xmark': '<path d="M3 4h18l-7 8.2V20l-4 1.5v-9.3z"/><path d="m15.5 5.5 3 3M18.5 5.5l-3 3"/>',
        'fa-fire': '<path d="M12 22a7 7 0 0 0 7-7c0-4.8-3.6-6.4-4.4-10.6C11.6 6.6 9.8 9 10.4 12c.4 1.5-.4 2.4-1.2 2.8-1-.6-1.7-1.7-1.6-3-1.4 1.3-2.2 3-2.2 4.7A6.6 6.6 0 0 0 12 22z"/>',
        'fa-floppy-disk': '<path d="M5 3h11l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3"/><rect x="8" y="13" width="8" height="6" rx="1"/>',
        'fa-folder': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.2h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        'fa-folder-open': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v1"/><path d="M3 9.2h18l-2.6 9.4H5.6z"/>',
        'fa-font': '<path d="M5 19 12 5l7 14"/><path d="M8.4 14h7.2"/>',
        'fa-github': '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
        'fa-google': '<path d="M21.6 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" fill="currentColor" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="currentColor" stroke="none"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="currentColor" stroke="none"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" fill="currentColor" stroke="none"/>',
        'fa-globe-asia': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
        'fa-grip-vertical': '<circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none"/>',
        'fa-hand-pointer': '<path d="M8 11.5V5.5a2 2 0 1 1 4 0v5"/><path d="M12 10.5V4.5a2 2 0 1 1 4 0v6"/><path d="M16 11V6.5a2 2 0 1 1 4 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-3.5a2 2 0 1 1 4 0"/>',
        'fa-home': '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
        'fa-industry': '<path d="M2 21V10l6-3v4l6-3v4l6-3v13z"/><path d="M2 21h20"/><path d="M6 21v-4M11 21v-4M16 21v-4"/>',
        'fa-info-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/>',
        'fa-layer-group': '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
        'fa-left-right': '<path d="M8 7 4 11l4 4"/><path d="M4 11h16"/><path d="m16 17 4-4-4-4"/>',
        'fa-link': '<path d="M10.5 13.5a5 5 0 0 0 7 0l2.5-2.5a5 5 0 0 0-7-7l-1.4 1.4"/><path d="M13.5 10.5a5 5 0 0 0-7 0L4 13a5 5 0 0 0 7 7l1.4-1.4"/>',
        'fa-location-crosshairs': '<circle cx="12" cy="12" r="7"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/>',
        'fa-location-dot': '<path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        'fa-magnet': '<path d="M6 19v-8a6 6 0 0 1 12 0v8"/><path d="M6 15h4.5v4H6zM13.5 15H18v4h-4.5z"/>',
        'fa-magnifying-glass': '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.7-4.7"/>',
        'fa-magnifying-glass-chart': '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.7-4.7"/><path d="M8 14v-2.5M11 14V9M14 14v-4"/>',
        'fa-magnifying-glass-location': '<path d="M11 4a7 7 0 1 0 4.6 12.3l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4z"/><circle cx="11" cy="11" r="2.5"/>',
        'fa-map': '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
        'fa-map-location-dot': '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/><path d="M12 21s3.5-3.4 3.5-6a3.5 3.5 0 1 0-7 0c0 2.6 3.5 6 3.5 6z"/><circle cx="12" cy="11.5" r="1.2"/>',
        'fa-map-marker': '<path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        'fa-map-pin': '<path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
        'fa-minus': '<path d="M5 12h14"/>',
        'fa-moon': '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
        'fa-mountain-sun': '<path d="m2 21 6.5-11 3.5 5.5 2-3L22 21z"/><circle cx="17.5" cy="6.5" r="3"/>',
        'fa-object-group': '<rect x="3" y="3" width="13" height="13" rx="2" stroke-dasharray="4 3"/><circle cx="15.5" cy="15.5" r="5.5"/>',
        'fa-palette': '<path d="M12 2a10 10 0 0 0 0 20c1.4 0 2-.9 2-2s-.6-1.5-.6-2.1.6-1.1 1.6-1.1H17a5 5 0 0 0 5-5c0-5.2-4.6-9.8-10-9.8z"/><circle cx="7.5" cy="11.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="7.8" r="1.3" fill="currentColor" stroke="none"/><circle cx="17.6" cy="11.8" r="1.3" fill="currentColor" stroke="none"/>',
        'fa-pen': '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
        'fa-pen-ruler': '<path d="M3 21.5v-4.2L14.4 5.9l4.2 4.2L7.2 21.5z"/><path d="m13 7.3 4.2 4.2"/><path d="M3 21.5h4.2"/>',
        'fa-plane-up': '<path d="M12 2c1.2 0 1.8 1.2 1.8 2.6V9l7.2 4v2.2l-7.2-2v4l2.2 1.8v1.4L12 21.4l-4-1.1v-1.4L10.2 17v-4L3 15.2V13l7.2-4V4.6C10.2 3.2 10.8 2 12 2z"/>',
        'fa-play': '<path d="m7 4 13 8-13 8z"/>',
        'fa-plug-circle-check': '<circle cx="12" cy="12" r="9"/><path d="m8.3 12.4 2.6 2.6 4.8-5.4"/>',
        'fa-plus': '<path d="M12 5v14M5 12h14"/>',
        'fa-plus-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
        'fa-print': '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="7" y="14" width="10" height="7"/>',
        'fa-puzzle-piece': '<path d="M9.5 3H14v2.4a1.6 1.6 0 1 0 3.2 0V7H21v5.5h-2.4a1.6 1.6 0 1 0 0 3.2H21V21h-6.8v-2.4a1.6 1.6 0 1 0-3.2 0V21H3v-6.8h2.4a1.6 1.6 0 1 0 0-3.2H3V7h6.5z"/>',
        'fa-right-from-bracket': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
        'fa-right-to-bracket': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m14 17 5-5-5-5"/><path d="M19 12H9"/>',
        'fa-road': '<path d="M4 21 8 3M20 21 16 3"/><path d="M12 5.5v3M12 11v3M12 16.5v3"/>',
        'fa-rotate': '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3.5V9h-5.5"/>',
        'fa-rotate-left': '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 3.5V9h5.5"/>',
        'fa-route': '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M15.5 5H10a3.5 3.5 0 0 0 0 7h4a3.5 3.5 0 0 1 0 7H8.5"/>',
        'fa-ruler': '<rect x="2" y="9" width="20" height="6" rx="1.2"/><path d="M6.5 9v3M11 9v4M15.5 9v3M19 9v4"/>',
        'fa-ruler-combined': '<path d="M3 17.5 17.5 3 21 6.5 6.5 21z"/><path d="m8 12.5 2 2M11 9.5l2 2M14 6.5l2 2"/>',
        'fa-ruler-horizontal': '<rect x="2" y="9" width="20" height="6" rx="1.2"/><path d="M7 9v3M12 9v4M17 9v3"/>',
        'fa-satellite': '<path d="m9 9 6 6"/><path d="m14.5 4.5 5 5-3.5 3.5-5-5z"/><path d="m4.5 14.5 5 5-3.5 3.5-5-5z" transform="translate(1 0)"/><path d="M7 17a5 5 0 0 1 5-5"/>',
        'fa-satellite-dish': '<path d="M4 20a13 13 0 0 1 13-13"/><path d="M4 20a8.5 8.5 0 0 1 8.5-8.5"/><path d="M4 20 12.5 11.5"/><circle cx="18.5" cy="5.5" r="2.5"/>',
        'fa-scissors': '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.1 7.9 20 20M20 4 8.1 15.9"/>',
        'fa-search': '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.7-4.7"/>',
        'fa-search-plus': '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.7-4.7"/><path d="M11 8.5v5M8.5 11h5"/>',
        'fa-shapes': '<circle cx="8" cy="8" r="5"/><rect x="11" y="11" width="10" height="10" rx="1.5"/><path d="m6 22 5-8 5 8z" transform="translate(0 -1)"/>',
        'fa-share-nodes': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
        'fa-shield-halved': '<path d="M12 2.5 4.5 5.2v6.1c0 4.7 3.3 8.5 7.5 10.2 4.2-1.7 7.5-5.5 7.5-10.2V5.2z"/><path d="M12 2.5v19"/>',
        'fa-sitemap': '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-3.5h14V17"/>',
        'fa-slash': '<path d="M19 5 5 19"/>',
        'fa-sliders': '<path d="M4 6h9M17.5 6H20M4 12h3.5M12 12h8M4 18h9M17.5 18H20"/><circle cx="15" cy="6" r="2.2"/><circle cx="9.5" cy="12" r="2.2"/><circle cx="15" cy="18" r="2.2"/>',
        'fa-spinner': '<path d="M12 3a9 9 0 1 0 9 9"/>',
        'fa-spin': '<path d="M12 3a9 9 0 1 0 9 9"/>',
        'fa-stop': '<rect x="5" y="5" width="14" height="14" rx="2"/>',
        'fa-table': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9.5 10v10"/>',
        'fa-table-cells': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9.5 4v16M16 4v16M3 10h18M3 15h18"/>',
        'fa-table-columns': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9.5 4v16M16 4v16"/>',
        'fa-tag': '<path d="M3 11.5V4.5a1.5 1.5 0 0 1 1.5-1.5h7l9.5 9.5-8 8z"/><circle cx="7.8" cy="7.8" r="1.4"/>',
        'fa-tags': '<path d="M3 10.5V4.5a1.5 1.5 0 0 1 1.5-1.5h6l9.5 9.5-7 7z"/><circle cx="7.4" cy="7.4" r="1.3"/><path d="M21 15v5.5a1.5 1.5 0 0 1-1.5 1.5H13l-3.5-3.5"/>',
        'fa-terminal': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9.5 3 3-3 3M13 15.5h4"/>',
        'fa-times': '<path d="M6 6l12 12M18 6 6 18"/>',
        'fa-tint': '<path d="M12 2.7s6.5 6.9 6.5 11.1a6.5 6.5 0 0 1-13 0C5.5 9.6 12 2.7 12 2.7z"/>',
        'fa-toolbox': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/><rect x="10" y="10.5" width="4" height="5" rx="1"/>',
        'fa-trash': '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="m6 7 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>',
        'fa-trash-can': '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="m6 7 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>',
        'fa-triangle-exclamation': '<path d="M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v5M12 17.6h.01"/>',
        'fa-upload': '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 21h16"/>',
        'fa-user-plus': '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8.5v6M16 11.5h6"/>',
        'fa-users': '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16.5 4.6a4 4 0 0 1 0 6.8"/><path d="M17.5 14.5A6.5 6.5 0 0 1 22 20.6"/>',
        'fa-vector-square': '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="5 4"/><circle cx="3" cy="3" r="1.8" fill="currentColor" stroke="none"/><circle cx="21" cy="3" r="1.8" fill="currentColor" stroke="none"/><circle cx="3" cy="21" r="1.8" fill="currentColor" stroke="none"/><circle cx="21" cy="21" r="1.8" fill="currentColor" stroke="none"/>',
        'fa-wand-magic-sparkles': '<path d="m3 21 11-11"/><path d="m13 7 4 4"/><path d="M17 3v4M15 5h4M6 3v3M4.5 4.5h3"/>',
        'fa-water': '<path d="M2 7c2 0 2 1.6 4 1.6S8 7 10 7s2 1.6 4 1.6S16 7 18 7s2 1.6 4 1.6"/><path d="M2 12.5c2 0 2 1.6 4 1.6s2-1.6 4-1.6 2 1.6 4 1.6 2-1.6 4-1.6 2 1.6 4 1.6"/><path d="M2 18c2 0 2 1.6 4 1.6s2-1.6 4-1.6 2 1.6 4 1.6 2-1.6 4-1.6 2 1.6 4 1.6"/>',
        'fa-wrench': '<path d="M14.9 6.3a4.7 4.7 0 0 0-6.2 5.9L3 17.9V21h3.1l5.7-5.7a4.7 4.7 0 0 0 5.9-6.2l-3 3-2.4-2.4z"/>',
        'fa-xmark': '<path d="M6 6l12 12M18 6 6 18"/>'
    };

    /* ---------- أسماء مترادفة (توفير مساحة) ---------- */
    P['fa-gear'] = P['fa-cog'];
    P['fa-circle-check'] = P['fa-check-circle'];
    P['fa-file-alt'] = P['fa-file'];
    P['fa-map-marker-alt'] = P['fa-map-marker'];
    P['fa-magnifying-glass'] = P['fa-search'];
    P['fa-save'] = P['fa-floppy-disk'];
    P['fa-cloud-upload-alt'] = P['fa-cloud-arrow-up'];
    P['fa-trash-alt'] = P['fa-trash'];
    P['fa-sliders-h'] = P['fa-sliders'];
    P['fa-tint'] = P['fa-droplet'];

    /* ---------- فئات Font Awesome المساعدة (ليست أيقونات) ---------- */
    var META = ['fa-spin', 'fa-pulse', 'fa-beat', 'fa-fade', 'fa-beat-fade', 'fa-flip', 'fa-bounce',
        'fa-fw', 'fa-li', 'fa-ul', 'fa-stack', 'fa-border', 'fa-pull-left', 'fa-pull-right',
        'fa-rotate-90', 'fa-rotate-180', 'fa-rotate-270', 'fa-flip-horizontal', 'fa-flip-vertical',
        'fa-swap-opacity', 'fa-inverse', 'fa-stack-1x', 'fa-stack-2x', 'fa-inverse'];

    var stats = { total: 0, upgraded: 0, missing: {} };
    var MODE = 'svg';
    var observer = null;
    var queued = false;

    function readMode() {
        try {
            var m = localStorage.getItem(MODE_KEY);
            if (m === 'fa' || m === 'svg') { MODE = m; }
        } catch (e) {}
        return MODE;
    }
    function writeMode(m) {
        MODE = (m === 'fa') ? 'fa' : 'svg';
        try { localStorage.setItem(MODE_KEY, MODE); } catch (e) {}
        return MODE;
    }

    /* إيجاد اسم الأيقونة من عنصر <i> أو data-icon */
    function nameOf(el) {
        if (!el || !el.classList) { return null; }
        var explicit = el.getAttribute && el.getAttribute('data-icon');
        if (explicit) { return explicit.indexOf('fa-') === 0 ? explicit : ('fa-' + explicit); }
        var fallback = null;
        for (var i = 0; i < el.classList.length; i++) {
            var c = el.classList[i];
            if (c.indexOf('fa-') !== 0) { continue; }
            if (P[c]) { return c; }
            if (META.indexOf(c) < 0 && !fallback) { fallback = c; }
        }
        return fallback;
    }

    function svgMarkup(name) {
        var body = P[name];
        if (!body) { return ''; }
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
            'stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true" ' +
            'class="gis-ico-svg" part="icon">' + body + '</svg>';
    }

    function upgrade(el) {
        if (!el || el.nodeType !== 1) { return false; }
        if (el.getAttribute('data-gis-ico')) { return false; }
        if (MODE !== 'svg') { return false; }
        var name = nameOf(el);
        if (!name || !P[name]) {
            if (name) { stats.missing[name] = (stats.missing[name] || 0) + 1; stats.total++; }
            return false;
        }
        el.innerHTML = svgMarkup(name);
        el.setAttribute('data-gis-ico', name);
        el.classList.add('gis-ico');
        if (el.classList.contains('fa-spin') || el.classList.contains('fa-pulse')) { el.classList.add('gis-spin'); }
        stats.total++; stats.upgraded++;
        return true;
    }

    function restore(el) {
        if (!el || el.nodeType !== 1) { return false; }
        if (!el.getAttribute('data-gis-ico')) { return false; }
        el.innerHTML = '';
        el.removeAttribute('data-gis-ico');
        el.classList.remove('gis-ico', 'gis-spin');
        return true;
    }

    function scan(root) {
        if (!root || !root.querySelectorAll) { return 0; }
        var n = 0;
        if (root.nodeType === 1 && root.matches && root.matches('i[class*="fa-"], [data-icon]')) {
            if (upgrade(root)) { n++; }
        }
        var list = root.querySelectorAll('i[class*="fa-"], [data-icon]');
        for (var i = 0; i < list.length; i++) { if (upgrade(list[i])) { n++; } }
        return n;
    }

    function scanAll(root) {
        if (!root || !root.querySelectorAll) { return 0; }
        var n = 0;
        var list = root.querySelectorAll('[data-gis-ico]');
        for (var i = 0; i < list.length; i++) { if (restore(list[i])) { n++; } }
        return n;
    }

    function schedule() {
        if (queued) { return; }
        queued = true;
        var run = function () {
            queued = false;
            if (MODE === 'svg') { scan(document); }
        };
        if (window.requestAnimationFrame) { requestAnimationFrame(run); } else { setTimeout(run, 32); }
    }

    function observe() {
        if (observer || typeof MutationObserver === 'undefined') { return; }
        observer = new MutationObserver(function () { schedule(); });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    function setMode(m) {
        writeMode(m);
        stats = { total: 0, upgraded: 0, missing: {} };
        if (MODE === 'svg') { scan(document); } else { scanAll(document); }
        try {
            document.dispatchEvent(new CustomEvent('gis:iconmode', { detail: { mode: MODE } }));
        } catch (e) {}
        return MODE;
    }

    /* عنصر أيقونة جديد جاهز */
    function el(name, extraClass) {
        var i = document.createElement('i');
        var cls = name.indexOf('fa-') === 0 ? name : ('fa-' + name);
        i.className = 'fas ' + cls + (extraClass ? ' ' + extraClass : '');
        i.setAttribute('data-icon', cls);
        if (MODE === 'svg') { upgrade(i); } else { i.classList.add('gis-ico'); }
        return i;
    }

    function loading(elOrSel, on) {
        var t = typeof elOrSel === 'string' ? document.querySelector(elOrSel) : elOrSel;
        if (!t) { return false; }
        t.classList.toggle('is-loading', !!on);
        if (t.tagName === 'BUTTON' || t.tagName === 'A') { t.disabled = !!on; }
        return true;
    }

    var api = {
        map: P,
        stats: function () { return { total: stats.total, upgraded: stats.upgraded, missing: Object.keys(stats.missing) }; },
        resetStats: function () { stats = { total: 0, upgraded: 0, missing: {} }; },
        upgrade: upgrade,
        upgradeAll: scan,
        restore: restore,
        restoreAll: scanAll,
        svg: svgMarkup,
        nameOf: nameOf,
        el: el,
        loading: loading,
        setMode: setMode,
        getMode: function () { return MODE; },
        scan: function () { return scan(document); },
        has: function (n) { return !!P[n]; }
    };

    readMode();
    if (!window.GIS) { window.GIS = {}; }
    window.GIS.icons = api;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (MODE === 'svg') { scan(document); }
            observe();
        });
    } else {
        if (MODE === 'svg') { scan(document); }
        observe();
    }
})();
