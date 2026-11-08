/* ================================================================
   GIS Lang — الترجمة الكاملة للواجهة (عربي <-> English)
   - يحفظ الاختيار في localStorage باسم gisLang
   - يضبط html[lang] و html[dir] ويترجم النصوص والسمات
   - يراقب DOM لترجمة أي محتوى يُضاف لاحقًا (الوحدات/النوافذ/الإشعارات)
   - يترجم رسائل confirm / alert / prompt قبل عرضها
   لا يعتمد على أي مكتبة خارجية.
   ================================================================ */
(function () {
    'use strict';
    if (window.GisLang) { return; }

    var KEY = 'gisLang';
    var AR = 'ar';
    var EN = 'en';
    var current = AR;

    /* ---------- أزواج الترجمة: [العربية, English] ---------- */
    var PAIRS = [
        /* العلامة والهيدر */
        ['منصة جغرافية', 'Geo Platform'],
        ['منصة جغرافية شاملة', 'Comprehensive Geo Platform'],
        ['من الفكرة إلى الخريطة', 'From Idea to Map'],
        ['منصة جغرافية · خرائط وتحليل مكاني', 'Geo Platform · Maps & Spatial Analysis'],
        ['خرائط · بيانات · تحليل مكاني', 'Maps · Data · Spatial Analysis'],
        ['منصة جغرافية — خرائط وأدوات تحليل مكاني | إعداد أ / أحمد محسوب', 'Geo Platform — Maps & Spatial Analysis Tools | Prepared by Eng. Ahmed Mahsoub'],
        ['اعداد: أ / أحمد محسوب', 'Prepared by: Eng. Ahmed Mahsoub'],
        ['إعداد: أ / أحمد محسوب', 'Prepared by: Eng. Ahmed Mahsoub'],
        ['أ / أحمد محسوب', 'Eng. Ahmed Mahsoub'],
        ['الإصدار الاحترافي · يعمل بدون إنترنت', 'Professional Edition · Works Offline'],
        ['مشاريعك محفوظة سحابيًا', 'Your projects are saved in the cloud'],
        ['خرائط وطبقات وأدوات رسم وقياس وتحليل في مكان واحد: استورد ملفاتك، اشتغل بدون إنترنت، وزامن مشاريعك سحابيًا — من الموبايل أو الكمبيوتر.', 'Maps, layers, drawing, measurement, and analysis tools in one place: import your files, work offline, and sync your projects to the cloud — from mobile or desktop.'],
        ['استيراد ملفاتك', 'Import Your Files'],
        ['حفظ ومزامنة', 'Save & Sync'],
        ['بالكامل', 'Fully'],
        ['إعداد', 'Prepared by'],
        ['· قطاع المياه', '· Water Sector'],
        ['سجّل الدخول لحفظ مشاريعك ومزامنتها سحابيًا.', 'Sign in to save and sync your projects to the cloud.'],
        ['تغيير إعدادات الربط', 'Change connection settings'],
        ['لا توجد مواقع', 'No locations yet'],
        ['اضغط على "إضافة" لإضافة موقع جديد', 'Click "Add" to add a new location'],
        ['مواقع محفوظة', 'Saved Locations'],
        ['لا توجد ملفات', 'No files yet'],
        ['ارفع ملفاً لعرضه على الخريطة', 'Upload a file to view it on the map'],
        ['لا توجد رسومات', 'No User Drawings'],
        ['استخدم الأزرار بالأعلى لإضافة نقطة أو خط أو مضلع أو نص على الخريطة.', 'Use the buttons above to add a point, line, polygon or text on the map.'],
        ['بيانات متجهية عالمية (OSM)', 'Global Vector Data (OSM)'],
        ['نزّل معالم متجهية حقيقية لأي منطقة في العالم من OpenStreetMap (Overpass API) وصدّرها GeoJSON/KML/DXF/Shapefile بإحداثيات حقيقية.', 'Download real vector features for any area worldwide from OpenStreetMap (Overpass API) and export them as GeoJSON/KML/DXF/Shapefile with real coordinates.'],
        ['مكان واحد لتصدير كل الطبقات (GeoJSON · KML · KMZ · DXF · Shapefile · CSV) مع بوابات مباشرة للصور الجوية واستخراج OSM والمشروع والطباعة.', 'One place to export every layer (GeoJSON · KML · KMZ · DXF · Shapefile · CSV) plus direct portals to imagery, OSM extraction, project and print.'],
        ['الاستخدام والتثبيت', 'Usage & Installs'],
        ['تتبّع من فتح التطبيق وثبّته وسجّل الدخول (من Supabase app_events).', 'Track who opened, installed, and signed into the app (from Supabase app_events).'],
        ['السحابة (Supabase)', 'Cloud (Supabase)'],
        ['المتابعة بحساب Google', 'Continue with Google'],
        ['المتابعة بحساب GitHub', 'Continue with GitHub'],
        ['حقل الخصائص: الاسم', 'Attribute Field: Name'],
        ['حقل الخصائص', 'Attribute Field'],
        ['بكسل', 'px'],
        ['نقاط متعددة', 'MultiPoint'],
        ['خطوط متعددة', 'MultiLineString'],
        ['مضلعات متعددة', 'MultiPolygon'],
        ['مجموعة معالم', 'FeatureCollection'],
        ['معلم', 'Feature'],
        ['ملفات', 'Files'],
        ['ملفات ثنائية مغلقة ولا يمكن قراءتها مباشرة.', 'Binary files are locked and cannot be read directly.'],
        ['من أوتوكاد (', 'From AutoCAD ('],
        ['جارٍ حساب عدد المعالم...', 'Counting features...'],

        /* تسجيل الدخول */
        ['الدخول بحساب Google', 'Sign in with Google'],
        ['أو بالبريد', 'or with email'],
        ['البريد الإلكتروني', 'Email'],
        ['كلمة المرور', 'Password'],
        ['تسجيل الدخول', 'Sign In'],
        ['إنشاء حساب جديد', 'Create New Account'],
        ['سجّل الدخول بحساب Google أو بالبريد لحفظ ومزامنة مشاريعك سحابيًا.', 'Sign in with Google or email to save and sync your projects to the cloud.'],
        ['الدخول متاح للحسابات المصرّح بها فقط — بدون حساب لا يمكن فتح التطبيق.', 'Access is limited to authorized accounts — the app cannot be opened without an account.'],
        ['الدخول متاح للحسابات المصرّح بها فقط —', 'Access is limited to authorized accounts —'],
        ['مميزات التطبيق', 'App Features'],
        ['الواجهة التعريفية', 'Intro Screen'],
        ['ابدأ الآن · تسجيل الدخول', 'Get Started · Sign In'],
        ['أدخل البريد وكلمة المرور', 'Enter your email and password'],
        ['جارٍ الدخول…', 'Signing in…'],
        ['جارٍ الإنشاء…', 'Creating…'],
        ['جارٍ التحويل إلى Google…', 'Redirecting to Google…'],
        ['فشل تسجيل الدخول', 'Sign-in failed'],
        ['تعذّر إنشاء الحساب', 'Could not create account'],
        ['تعذّر الاتصال بالسحابة', 'Could not connect to the cloud'],
        ['تعذّر بدء تسجيل الدخول', 'Could not start sign-in'],
        ['تعذّر بدء تسجيل الدخول — اضبط إعدادات السحابة أولًا', 'Could not start sign-in — configure cloud settings first'],
        ['تم إنشاء الحساب — راجع بريدك للتأكيد ثم سجّل الدخول', 'Account created — check your email to confirm, then sign in'],

        /* الواجهة التعريفية */
        ['خرائط متعددة الطبقات', 'Multi-layer Maps'],
        ['رسم وقياس وتحليل', 'Draw, Measure & Analyze'],
        ['أداة احترافية', 'Professional Tool'],
        ['أوفلاين', 'Offline'],
        ['تثبيت التطبيق', 'Install App'],
        ['تطبيق ويب تقدمي (PWA)', 'Progressive Web App (PWA)'],
        ['تحميل', 'Download'],
        ['تخطي', 'Skip'],
        ['فهمت', 'Got it'],

        /* التبويبات والشريط الجانبي */
        ['المواقع', 'Locations'],
        ['الرسم', 'Draw'],
        ['التصدير', 'Export'],
        ['الأدوات', 'Tools'],
        ['البيانات', 'Data'],
        ['الإحصائيات', 'Statistics'],
        ['السحابة', 'Cloud'],
        ['الإعدادات', 'Settings'],
        ['لوحة التحكم', 'Control Panel'],
        ['التبديل إلى الوضع النهاري', 'Switch to light mode'],
        ['الوضع النهاري', 'Light Mode'],
        ['تصغير اللوحة', 'Collapse panel'],
        ['تصغير إلى شريط الأيقونات', 'Collapse to icon rail'],
        ['فتح اللوحة', 'Open panel'],
        ['فتح القائمة', 'Open menu'],
        ['شريط الأدوات السريع', 'Quick Toolbar'],
        ['أدوات الرسم', 'Drawing Tools'],
        ['البيانات والرفع', 'Data & Upload'],
        ['لوحة المؤشرات', 'Dashboard'],
        ['لوحة الإحصائيات', 'Statistics Panel'],
        ['التنزيل والتصدير', 'Download & Export'],
        ['التصدير والتنزيل', 'Export & Download'],

        /* المواقع */
        ['المواقع المحفوظة', 'Saved Locations'],
        ['إضافة موقع جديد', 'Add New Location'],
        ['اسم الموقع', 'Location Name'],
        ['خط العرض (Latitude)', 'Latitude'],
        ['خط الطول (Longitude)', 'Longitude'],
        ['الوصف (اختياري)', 'Description (optional)'],
        ['حفظ الموقع', 'Save Location'],
        ['تحديث الموقع', 'Update Location'],
        ['إضافة', 'Add'],
        ['إلغاء', 'Cancel'],
        ['تعديل', 'Edit'],
        ['حذف', 'Delete'],
        ['مثال: بغداد - السعة 3000 م³', 'e.g. Baghdad - Capacity 3000 m³'],
        ['مثال: 31.236', 'e.g. 31.236'],
        ['مثال: 44.366', 'e.g. 44.366'],
        ['مثال: شبكة مياه بغداد', 'e.g. Baghdad Water Network'],
        ['مثال: محطة ضخ جديدة', 'e.g. New Pump Station'],
        ['يرجى إدخال اسم الموقع', 'Please enter a location name'],
        ['يرجى إدخال إحداثيات صحيحة: Latitude بين -90 و90 وLongitude بين -180 و180', 'Please enter valid coordinates: Latitude between -90 and 90 and Longitude between -180 and 180'],

        /* الرسم */
        ['نقطة', 'Point'],
        ['خط', 'Line'],
        ['مضلع', 'Polygon'],
        ['نص', 'Text'],
        ['نمط الرسم (مباشر)', 'Draw Style (Live)'],
        ['لون الخط', 'Stroke / Line Color'],
        ['لون التعبئة', 'Fill Color'],
        ['سماكة الخط', 'Line Weight'],
        ['شفافية التعبئة', 'Fill Opacity'],
        ['نقاط الإحداثيات → Excel', 'Coordinate Points → Excel'],
        ['اضغط على الخريطة لوضع النقاط، ثم صدّرها إلى Excel مع الكود وخط العرض وخط الطول.', 'Click on the map to place points, then export them to Excel with code, latitude and longitude.'],
        ['جدول الخصائص (UTM) + تصدير', 'Attribute Table (UTM) + Export'],
        ['كل نقطة/خط/مضلع ترسمه يحصل تلقائيًا على إحداثي UTM (المنطقة / الشرقية / الشمالية). يمكنك تعديل الخصائص لاحقًا ثم تصدير الكل إلى Excel أو CSV.', 'Every point/line/polygon you draw automatically gets a UTM coordinate (Zone / Easting / Northing) stored. You can edit attributes later, then export all to Excel or CSV.'],
        ['مسح', 'Clear'],
        ['إعادة ضبط', 'Reset'],
        ['عرض ثلاثي الأبعاد', '3D View'],
        ['إعادة ضبط عرض الخريطة', 'Reset the map view'],
        ['تبديل العرض ثلاثي الأبعاد', 'Toggle 3D view'],
        ['مسح كل الرسومات', 'Clear all drawings'],
        ['إغلاق العرض ثلاثي الأبعاد', 'Close 3D view'],
        ['دقة الإحداثيات', 'Coordinate Precision'],
        ['3 منازل عشرية', '3 decimals'],
        ['5 منازل عشرية', '5 decimals'],
        ['7 منازل عشرية', '7 decimals'],

        /* الأدوات */
        ['القياس', 'Measurement'],
        ['المسافة', 'Distance'],
        ['المساحة', 'Area'],
        ['التحديد', 'Selection'],
        ['تحديد بمستطيل', 'Select by Rectangle'],
        ['ارسم مستطيلًا لتحديد جزء من البيانات ثم صدّره', 'Draw a rectangle to select part of the data, then export it'],
        ['ارسم مستطيلًا لتحديد المعالم ثم صدّر التحديد فقط.', 'Draw a rectangle to select features, then export only the selection.'],
        ['اضغط على نقاط على الخريطة للقياس. تظهر النتائج في لوحة القياسات على الخريطة.', 'Click points on the map to measure. Results appear in the Measurements panel on the map.'],
        ['وحدات القياس', 'Measurement Units'],
        ['متري (م / كم²)', 'Metric (m / km²)'],
        ['إمبراطوري (قدم / ميل²)', 'Imperial (ft / mi²)'],
        ['الصيغة (Format)', 'Format'],
        ['الصيغة', 'Format'],
        ['خيارات', 'Options'],
        ['تصدير الطبقات الظاهرة (أو التحديد الحالي)', 'Export visible layers (or current selection)'],
        ['خيارات تصدير متقدمة', 'Advanced export options'],
        ['يصدّر كل طبقة ظاهرة (أو التحديد الحالي). تتيح الخيارات اختيار مصدر محدد.', 'Exports every visible layer (or the current selection). Options let you pick a specific source.'],
        ['العرض والخريطة', 'View & Map'],
        ['أدوات ووحدات التحليل المكاني', 'GIS Tools & Modules'],
        ['تكبير على التحديد', 'Zoom to Selection'],
        ['مسح الفلتر', 'Clear Filter'],
        ['تصفية حسب الحقل', 'Filter by Field'],
        ['جدول الخصائص', 'Attribute Table'],
        ['تعديل خصائص المعلم', 'Edit Feature Attributes'],
        ['وصف المعلم', 'Feature description'],
        ['نوع البيانات', 'Data Type'],
        ['اسم العمود', 'Column Name'],
        ['القيمة الافتراضية', 'Default Value'],
        ['الوصف (اختياري)', 'Description (optional)'],
        ['خيارات (مفصولة بفاصلة)', 'Options (comma separated)'],
        ['قائمة منسدلة', 'Select (dropdown)'],
        ['رقم', 'Number'],
        ['حفظ / تم', 'Save / Done'],
        ['إضافة عمود', 'Add Column'],
        ['إغلاق', 'Close'],
        ['حفظ على الجهاز', 'Save to Device'],
        ['تنزيل نسخة محفوظة على جهازك', 'Download a saved copy to your device'],
        ['فتح ملف محفوظ من جهازك', 'Open a saved file from your device'],
        ['بحث في الخصائص...', 'Search attributes...'],
        ['القيمة...', 'Value...'],
        ['مثال: خط رئيسي', 'e.g. Main Line'],
        ['مثال: المادة', 'e.g. Material'],
        ['استيراد', 'Import'],
        ['تصدير Excel', 'Export Excel'],
        ['تصدير CSV', 'Export CSV'],
        ['تصدير GeoJSON', 'Export GeoJSON'],
        ['تصدير KML', 'Export KML'],
        ['تصدير محدّد', 'Export Selection'],
        ['تصدير البيانات المكانية', 'Export Spatial Data'],
        ['تصدير', 'Export'],
        ['توزيع الأنواع', 'Type Distribution'],
        ['صدّر كل ما على الخريطة بصيغة واحدة من مكان واحد، أو انتقل إلى أدوات تصدير متقدّمة (صور جوية، بيانات OSM، مشروع، طباعة).', 'Export everything on the map in one format from one place, or go to advanced exporters (aerial imagery, OSM data, project, print).'],
        ['تصدير الطبقات المتجهة', 'Export Vector Layers'],
        ['تُصدَّر الإحداثيات الحقيقية (WGS84 / WGS84 UTM حسب الصيغة). صيغة Shapefile تُغلّف في ZIP مع ملف الإسناد', 'Real coordinates are exported (WGS84 / WGS84 UTM depending on format). Shapefile is packaged in a ZIP with the projection file'],
        ['وترميز UTF-8.', 'and UTF-8 encoding.'],
        ['خيارات متقدّمة للتصدير…', 'Advanced export options…'],
        ['مصدّرات متخصّصة', 'Specialized Exporters'],
        ['تصدير الصور الجوية', 'Export Aerial Imagery'],
        ['صورة جوية عالية الدقة بدقة مرجعية (PNG + GeoTIFF EPSG:3857) لأي منطقة — Esri / Sentinel-2 / OpenAerialMap.', 'High-resolution georeferenced aerial imagery (PNG + GeoTIFF EPSG:3857) for any area — Esri / Sentinel-2 / OpenAerialMap.'],
        ['سحب البيانات العالمية', 'Global Data Extraction'],
        ['تنزيل بيانات الشوارع والمباني والمياه وكل شيء من OpenStreetMap بعدّاد Overpass لأي منطقة وتصديرها.', 'Download streets, buildings, water, and everything from OpenStreetMap with an Overpass counter for any area, then export it.'],
        ['حفظ ملف المشروع', 'Save Project File'],
        ['حفظ الجلسة كاملة (طبقات + إعدادات + إحداثيات) في ملف واحد واستعادتها لاحقًا.', 'Save the whole session (layers + settings + coordinates) to one file and restore it later.'],
        ['تخطيط الطباعة (PDF)', 'Print Layout (PDF)'],
        ['تكوين لوحة طباعة باحترافية (عنوان / مفتاح / مسطرة / سهم الشمال) وتصديرها PDF.', 'Compose a professional print layout (title / legend / scale bar / north arrow) and export it as PDF.'],
        ['كل عمليات التصدير تتم في متصفحك — لا تُرسل بياناتك إلى أي خادم.', 'All exports happen in your browser — your data is never sent to any server.'],
        ['حذف كل النقاط', 'Delete All Points'],
        ['عرض البيانات في جدول', 'View Data in Table'],
        ['تكبير على الطبقة', 'Zoom to Layer'],
        ['حذف الطبقة', 'Delete Layer'],
        ['ابحث عن مكان... مثال: الحرم في مكة، بغداد', 'Search for a place... e.g. Mecca, Baghdad'],
        ['بحث عن المكان', 'Search Place'],
        ['بحث في الطبقات...', 'Search layers...'],
        ['ابحث في الملفات...', 'Search files...'],
        ['مسح البحث وحذف النتيجة', 'Clear search and remove result'],

        /* البيانات والرفع */
        ['رفع واستيراد البيانات', 'Upload & Import Data'],
        ['رفع ملف جديد', 'Upload New File'],
        ['رفع الملف', 'Upload File'],
        ['الملفات المرفوعة', 'Uploaded Files'],
        ['تظهر كل الطبقات المرفوعة تلقائيًا في لوحة «الطبقات المتقدمة» على اليمين.', 'All uploaded layers appear automatically in the «Advanced Layers» panel on the right.'],
        ['البيانات والتخزين', 'Data & Storage'],
        ['مسح الكاش', 'Clear Cache'],
        ['مشروع جديد (مسح الكل)', 'New Project (Clear All)'],
        ['اسم الملف', 'File Name'],
        ['وصف الملف', 'File Description'],
        ['تحميل ملف Excel', 'Download Excel File'],
        ['«مشروع جديد» يمسح كل البيانات الحالية (المواقع، الملفات، الرسومات) ويبدأ من الصفر. «Clear Cache» يمسح البيانات المؤقتة والكاش ويعيد التحميل.', '“New Project” clears all current data (locations, files, drawings) and starts fresh. “Clear Cache” clears temporary data and cache, then reloads.'],
        ['CSV جدول إحداثيات وخصائص (.csv)', 'CSV coordinate & attribute table (.csv)'],
        ['KMZ مضغوط (.kmz)', 'KMZ compressed (.kmz)'],
        ['DXF R12 (UTM) (.dxf) — لأوتوكاد', 'DXF R12 (UTM) (.dxf) — for AutoCAD'],

        /* الإعدادات */
        ['العرض والوحدات', 'Display & Units'],
        ['الوضع الليلي', 'Dark Theme'],
        ['الترميز الجغرافي', 'Geocoding'],
        ['مفتاح Nominatim API (اختياري)', 'Nominatim API Key (optional)'],
        ['الصق المفتاح هنا...', 'Paste key here...'],
        ['حفظ المفتاح', 'Save Key'],
        ['يعمل البحث تلقائيًا عبر Photon (مجاني ومتعدد اللغات). المفتاح بديل اختياري عبر Nominatim.', 'Search works automatically via Photon (free, multilingual). The key is an optional fallback through Nominatim.'],

        /* لوحة تخصيص الواجهة */
        ['حجم الأيقونات', 'Icon Size'],
        ['نمط الأيقونات', 'Icon Style'],
        ['متجهة SVG', 'Vector SVG'],
        ['شفافية الأيقونات', 'Icon Opacity'],
        ['مسافة الأيقونات', 'Icon Spacing'],
        ['لون موحّد للأيقونات', 'Uniform Icon Color'],
        ['اختبار حالة التحميل/التعطيل', 'Test loading/disabled state'],
        ['متجهة:', 'Vector:'],
        ['فحص:', 'Checked:'],
        ['احتياط FA:', 'FA fallback:'],
        ['SVG متجهية', 'Vector SVG'],
        ['أدوات التحليل المكاني', 'GIS Tools'],
        ['الاستعادة تعيد إعدادات الواجهة فقط (gisUiSettings_v1 + حجم الأيقونات)،', 'Restore resets UI settings only (gisUiSettings_v1 + icon size),'],
        ['ولا تمس', 'and does not touch'],
        ['بياناتك ولا إعدادات الاتصال بـ Supabase ولا الوحدات.', 'your data, Supabase connection settings, or modules.'],
        ['وضع القائمة', 'Sidebar Mode'],
        ['مفتوحة', 'Expanded'],
        ['مضغوطة', 'Compact'],
        ['مخفية', 'Hidden'],
        ['تموضع اللوحة', 'Panel Position'],
        ['يسار', 'Left'],
        ['يمين', 'Right'],
        ['عرض اللوحة', 'Panel Width'],
        ['إخفاء تلقائي عند الخروج', 'Auto-hide when leaving'],
        ['طيّ اللوحة', 'Collapse Panel'],
        ['حجم أيقونات الشريط', 'Dock Icon Size'],
        ['شفافية الشريط', 'Dock Opacity'],
        ['عناصر الشريط (اسحب لإعادة الترتيب)', 'Dock Items (drag to reorder)'],
        ['يمكنك أيضًا سحب الأيقونات داخل الشريط نفسه مباشرة، وسحب حافة اللوحة لتعديل عرضها. زر الفتح (السهم) يبقى أولًا دائمًا.', 'You can also drag icons directly in the dock and drag the panel edge to resize it. The open (arrow) button always stays first.'],
        ['التبويب المخفي يظهر تلقائيًا فور اختياره من الشريط الجانبي.', 'Hidden tabs appear automatically as soon as they are selected from the sidebar.'],
        ['الوضع', 'Mode'],
        ['داكن', 'Dark'],
        ['فاتح', 'Light'],
        ['اللون المميز', 'Accent Color'],
        ['افتراضي', 'Default'],
        ['شدة التوهج (Glow)', 'Glow Intensity'],
        ['إيقاف', 'Off'],
        ['عادي', 'Normal'],
        ['قوي', 'Strong'],
        ['تصدير JSON', 'Export JSON'],
        ['استيراد JSON', 'Import JSON'],
        ['استعادة تخطيط الواجهة الافتراضي', 'Reset Default Layout'],
        ['الاستعادة تعيد إعدادات الواجهة فقط (gisUiSettings_v1 + حجم الأيقونات)، ولا تمس بياناتك ولا إعدادات الاتصال بـ Supabase ولا الوحدات.', 'Restore resets UI settings only (gisUiSettings_v1 + icon size) and does not touch your data, Supabase connection settings, or modules.'],
        ['تطبيق نمط', 'Apply preset'],
        ['كل الأيقونات مغطاة بالـ SVG', 'All icons are covered by SVG'],
        ['أيقونات بدون SVG (بقيت Font Awesome):', 'Icons without SVG (Font Awesome fallback):'],
        ['كل الزر يعمل: تم عرض حالة التحميل والتعطيل', 'Button works: loading and disabled states were shown'],
        ['وحدات التحليل ولوحة المؤشرات أولًا · لوحة أعرض', 'Analysis modules and dashboard first · wider panel'],
        ['الرسم والتحرير أولًا · لوحة يسار · أيقونات أكبر', 'Drawing and editing first · left panel · larger icons'],
        ['المواقع والرسم أولًا · لوحة يمين · أيقونات متوسطة', 'Locations and drawing first · right panel · medium icons'],
        ['الرسم والوحدات الخاصة بشبكات الصرف', 'Drawing and sewer network modules'],
        ['المواقع والوحدات الخاصة بشبكات المياه', 'Locations and water network modules'],

        /* وحدات GIS */
        ['التحليل المكاني', 'Spatial Analysis'],
        ['أدوات التحليل', 'Analysis Tools'],
        ['القياسات', 'Measurements'],
        ['التحرير والموقع', 'Editing & Location'],
        ['العرض المرئي', 'Visualization'],
        ['الجودة والتحقق', 'Quality & Validation'],
        ['التصدير ومساحة العمل', 'Export & Workspace'],
        ['النظام', 'System'],
        ['أدوات أخرى', 'Other Tools'],
        ['معلومات النظام', 'System Info'],
        ['مناطق النطاق', 'Buffer Zones'],
        ['تصفية مرئية', 'Visual Filter'],
        ['خريطة حرارية', 'Heatmap'],
        ['ربط مكاني', 'Spatial Join'],
        ['GPS والتتبع', 'GPS & Tracking'],
        ['محرر الأشكال', 'Geometry Editor'],
        ['فحص الطوبولوجيا', 'Topology Check'],
        ['القياس والإحداثيات', 'Measurement & Coordinates'],
        ['مقارنة الخرائط', 'Map Swipe Compare'],
        ['لوحة تحليلية', 'BI Dashboard'],
        ['ملف المشروع', 'Project File'],
        ['مقطع الارتفاع', 'Elevation Profile'],
        ['تجسيم ثلاثي الأبعاد', '3D Extrusion'],
        ['تخطيط الطباعة', 'Print Layout'],
        ['تصدير صور جوية', 'Aerial Imagery Export'],
        ['المعالجة الجغرافية', 'Geoprocessing'],
        ['تحليل الشبكات', 'Network Analysis'],
        ['لوحة الأوامر', 'Command Palette'],
        ['مناطق الخدمة (ثيسن)', 'Service Areas (Thiessen)'],
        ['شريط زمني', 'Time Slider'],
        ['التسميات', 'Labels'],
        ['طبقة الأساس وحالة الخريطة وأبعاد العرض.', 'Base layer, map state, and viewport dimensions.'],
        ['إنشاء نطاق حول المعالم وحساب التقاطعات.', 'Create a buffer zone around features and count intersections.'],
        ['بناء فلاتر متعددة الشروط وإبراز المعالم المطابقة.', 'Build multi-condition filters and highlight matching features.'],
        ['عرض كثافة النقاط كخريطة حرارية مع التحكم في النصف القطري والتمويه.', 'Render point density as a heatmap with radius and blur control.'],
        ['حساب النقاط داخل المضلعات وكتابة النتائج كحقول.', 'Count points within polygons and write results as fields.'],
        ['تحديد موقعك الحقيقي وتتبع المسار والالتقاط بالرؤوس.', 'Locate your real position, track the path, and snap to vertices.'],
        ['نقل أو إضافة أو حذف الرؤوس مع إعادة حساب المساحة/الطول.', 'Move, add, or delete custom vertices with area/length recalculation.'],
        ['كشف التكرارات والرؤوس المكررة والتقاطعات الذاتية والتداخلات.', 'Detect duplicates, repeated vertices, self-intersections, and overlaps.'],
        ['قراءة الإحداثيات مباشرة (عشري/DMS/UTM) مع الإجماليات التراكمية.', 'Live coordinate readout (decimal/DMS/UTM) with cumulative totals.'],
        ['اسحب فاصلًا عموديًا لمقارنة خريطتي أساس.', 'Drag a vertical divider to compare two base maps.'],
        ['رسوم بيانية إحصائية مبنية من حقول الطبقات.', 'Statistical charts and graphs built from layer fields.'],
        ['حفظ الجلسة كاملة في ملف واحد وإعادة تحميله لاحقًا.', 'Save the whole session to one file and reload it later.'],
        ['رسم مقطع ارتفاع لخط/مضلع باستخدام بيانات DEM.', 'Draw an elevation profile for a line/polygon using DEM data.'],
        ['تحويل المضلعات إلى مجسمات ثلاثية الأبعاد باستخدام حقل ارتفاع رقمي.', 'Extrude polygons into 3D solids using a numeric height field.'],
        ['تكوين تخطيط طباعة (العنوان/المفتاح/المقياس/سهم الشمال) وتصديره PDF.', 'Compose a print layout (title/legend/scale/north arrow) and export to PDF.'],
        ['تصدير صورة جوية/فضائية عالية الدقة بمرجع جغرافي (PNG + GeoTIFF) لأي منطقة مرسومة من مصادر مفتوحة.', 'Export a georeferenced high-res aerial/satellite image (PNG + GeoTIFF) for any drawn area from open sources.'],
        ['قص وتقاطع ودمج وإذابة بين طبقتين مضلعتين.', 'Clip, intersect, union, and dissolve between two polygon layers.'],
        ['تتبع شبكة متصلة من معلم خطي وإيجاد أقرب جار.', 'Trace a connected network from a line feature and find the nearest neighbour.'],
        ['بحث سريع لفتح أي وحدة، مع دليل استخدام مختصر.', 'Quick search to open any module, plus a short usage guide.'],
        ['مناطق خدمة ثيسن (فورونوي) للنقاط مع الغلاف المحدب.', 'Thiessen (Voronoi) service areas for points plus the convex hull.'],
        ['إظهار المعالم تدريجيًا حسب حقل زمني أو رقمي.', 'Reveal features progressively by a temporal or numeric field.'],
        ['عرض تسميات المعالم من حقل مع التحكم في الحجم واللون.', 'Show feature labels from a field with size and colour control.'],

        /* عناصر مشتركة داخل نوافذ الوحدات */
        ['طبقة المصدر', 'Source Layer'],
        ['الطبقة النشطة / المعلم المحدد (رسومات المستخدم)', 'Active Layer / Selected Feature (User Drawings)'],
        ['رسومات المستخدم فقط', 'User Drawings Only'],
        ['طبقة الملف الحالي', 'Current File Layer'],
        ['كل الطبقات', 'All Layers'],
        ['المعلم المحدد', 'Selected Feature'],
        ['رسم المستخدم', 'User Drawing'],
        ['الوحدة', 'Unit'],
        ['متر', 'Meters'],
        ['كيلومتر', 'Kilometers'],
        ['قدم', 'Feet'],
        ['إنشاء نطاق', 'Create Buffer'],
        ['أدخل مسافة صحيحة', 'Enter a valid distance'],
        ['تم حذف النطاق', 'Buffer deleted'],
        ['اختر معلمًا على الخريطة للتحليل', 'Select a feature on the map to analyze'],
        ['أضف شرطًا واحدًا على الأقل', 'Add at least one condition'],
        ['لا توجد بيانات في المصدر المحدد', 'No data found in the selected source'],
        ['لا توجد معالم في المصدر المحدد', 'No features found in the selected source'],
        ['لا توجد حقول في الطبقة الهدف', 'No fields in the target layer'],
        ['الطبقة الهدف فارغة', 'The target layer is empty'],
        ['يحتوي', 'Contains'],
        ['يساوي', 'Equals'],
        ['يبدأ بـ', 'Starts with'],
        ['أكبر من', 'Greater than'],
        ['أكبر من أو يساوي', 'Greater or equal'],
        ['أصغر من', 'Less than'],
        ['أصغر من أو يساوي', 'Less or equal'],
        ['لا يساوي', 'Not equal'],
        ['ليس فارغًا', 'Not empty'],
        ['فارغ', 'Empty'],
        ['القيمة', 'Value'],
        ['مصدر مخصص', 'Custom source'],
        ['الأبعاد :', 'Dimensions :'],
        ['الدقة :', 'Resolution :'],
        ['التكبير :', 'Zoom :'],
        ['المصدر     :', 'Source     :'],
        ['الإسناد:', 'Attribution:'],
        ['تم التصدير   :', 'Exported   :'],
        ['لا ينطبق', 'n/a'],
        ['الطبقة الهدف', 'Target Layer'],
        ['إضافة شرط', 'Add Condition'],
        ['تطبيق الفلتر', 'Apply Filter'],
        ['إنشاء الرسم البياني', 'Generate Chart'],
        ['معلم خط/مضلع (رسومات المستخدم)', 'Line / Polygon Feature (User Drawings)'],
        ['— لا توجد معالم —', '— No features —'],
        ['نقاط العينة', 'Sample Points'],
        ['رسم المقطع', 'Draw Profile'],

        /* الطبقات المتقدمة */
        ['الطبقات المتقدمة', 'Advanced Layers'],
        ['جدول المحتويات المتقدم', 'Advanced Table of Contents'],
        ['لوحة الطبقات المتقدمة', 'Advanced Layers Panel'],
        ['المعالم المكانية', 'Spatial Features'],
        ['المعالم المرسومة', 'Drawn Features'],
        ['الملفات المرفوعة', 'Uploaded Files'],
        ['خريطة الأساس', 'Basemap'],
        ['خرائط الأساس', 'Basemaps'],
        ['طبقات مرفوعة', 'Uploaded Layers'],
        ['طبقة', 'Layer'],
        ['عنصر', 'Feature'],
        ['وحدة', 'Module'],
        ['نقاط', 'Points'],
        ['خطوط', 'Lines'],
        ['مضلعات', 'Polygons'],
        ['موقع', 'Location'],
        ['عنصر مرسوم', 'Drawn Feature'],
        ['نقاط الإحداثيات', 'Coordinate Points'],

        /* قيم الطبقات والرموز */
        ['مياه', 'Water'],
        ['صرف صحي', 'Sewerage'],
        ['شبكة مياه', 'Water Network'],
        ['بئر', 'Well'],
        ['خزان', 'Tank'],
        ['خزان مياه', 'Water Tank'],
        ['محطة ضخ', 'Pump Station'],
        ['محطة معالجة', 'Treatment Plant'],
        ['محطة معالجة الصرف', 'Sewage Treatment Plant'],
        ['صمام', 'Valve'],
        ['محبس', 'Gate Valve'],
        ['حنفية حريق', 'Fire Hydrant'],
        ['حوض/صنبور', 'Basin/Tap'],
        ['عداد', 'Meter'],
        ['منهل', 'Manhole'],
        ['مضخة', 'Pump'],
        ['نهر', 'River'],
        ['ترعة', 'Canal'],
        ['طريق', 'Road'],
        ['ري', 'Irrigation'],
        ['زراعي', 'Agricultural'],
        ['أنبوب رئيسي', 'Main Pipe'],
        ['أنبوب فرعي', 'Branch Pipe'],
        ['خارج الخدمة', 'Out of Service'],
        ['يحتاج صيانة', 'Needs Maintenance'],
        ['جيد', 'Good'],
        ['ملاحظة', 'Note'],
        ['ملاحظات', 'Notes'],
        ['أخرى', 'Other'],
        ['مربع', 'Square'],
        ['دائرة', 'Circle'],
        ['مثلث', 'Triangle'],
        ['نجمة', 'Star'],
        ['معيّن', 'Diamond'],
        ['صليب', 'Cross'],
        ['دبوس', 'Pin'],
        ['قطرة ماء', 'Water Drop'],
        ['موجة ماء', 'Water Wave'],
        ['متصل', 'Solid'],
        ['متقطع', 'Dashed'],
        ['منقّط', 'Dotted'],
        ['متدرج', 'Gradient'],
        ['شرطة قصيرة', 'Short Dash'],
        ['شرطة طويلة', 'Long Dash'],
        ['شرطة طويلة جداً', 'Very Long Dash'],
        ['شرطة ونقطة', 'Dash Dot'],
        ['شرطة ونقطتين', 'Dash Dot Dot'],
        ['نقوش نقط', 'Dot Pattern'],
        ['نقش مائل', 'Diagonal Hatch'],
        ['نقش مائل عكسي', 'Reverse Diagonal Hatch'],

        /* حقول البيانات */
        ['الاسم', 'Name'],
        ['الكود', 'Code'],
        ['النوع', 'Type'],
        ['المادة', 'Material'],
        ['القطر', 'Diameter'],
        ['القطر (مم)', 'Diameter (mm)'],
        ['الطول', 'Length'],
        ['الطول الكلي', 'Total Length'],
        ['العرض', 'Width'],
        ['الارتفاع', 'Height'],
        ['العمق', 'Depth'],
        ['المساحة الكلية', 'Total Area'],
        ['الحالة', 'Status'],
        ['التاريخ', 'Date'],
        ['الوصف', 'Description'],
        ['العنوان', 'Address'],
        ['المصدر', 'Source'],
        ['المصدر (Source)', 'Source'],
        ['التصنيف', 'Classification'],
        ['المعرّف', 'ID'],
        ['الملف', 'File'],
        ['العنوان', 'Address'],
        ['نوع الميزة', 'Feature Type'],

        /* لوحة الإحصائيات */
        ['إجمالي المعالم', 'Total Features'],
        ['إجمالي الأطوال', 'Total Lengths'],
        ['الأطوال الكلية', 'Total Lengths'],
        ['المساحات الكلية', 'Total Areas'],
        ['العناصر المرسومة', 'Drawn Features'],
        ['لا توجد بيانات بعد — ارفع ملفاً أو ارسم عنصراً لعرض الإحصائيات.', 'No data yet — upload a file or draw a feature to view statistics.'],

        /* خرائط الأساس */
        ['ESRI Satellite (عالية الدقة)', 'ESRI Satellite (High Resolution)'],
        ['ESRI World Imagery (فائقة الدقة)', 'ESRI World Imagery (Ultra High Resolution)'],
        ['Google Satellite (أوضح)', 'Google Satellite (Clearest)'],
        ['OpenAerialMap (طائرات مسيّرة)', 'OpenAerialMap (UAV)'],
        ['Sentinel-2 Cloudless (مفتوح)', 'Sentinel-2 Cloudless (Open)'],

        /* وحدات القياس */
        ['م', 'm'],
        ['كم', 'km'],
        ['م²', 'm²'],
        ['كم²', 'km²'],
        ['قدم', 'ft'],
        ['قدم²', 'ft²'],
        ['ميل', 'mi'],
        ['فدان', 'acres'],

        /* الرسائل */
        ['البيانات ليست JSON صحيحة.', 'The data is not valid JSON.'],
        ['تم استيراد إعدادات الواجهة بنجاح', 'UI settings imported successfully'],
        ['تم تصدير إعدادات الواجهة', 'UI settings exported'],
        ['تم حفظ ترتيب التبويبات', 'Tab order saved'],
        ['تم حفظ ترتيب الشريط', 'Dock order saved'],
        ['تم تفعيل الأيقونات المتجهة SVG', 'Vector SVG icons enabled'],
        ['تمت إرجاع أيقونات Font Awesome الأصلية', 'Original Font Awesome icons restored'],
        ['تمت إزالة المفتاح.', 'Key removed.'],
        ['تمت استعادة تخطيط الواجهة الافتراضي (بياناتك لم تُمس)', 'Default UI layout restored (your data was not touched)'],
        ['استعادة تخطيط الواجهة الافتراضي؟ (لن تُمس بياناتك ولا إعدادات الاتصال بـ Supabase)', 'Restore the default UI layout? (Your data and Supabase settings will not be touched)'],
        ['هل تريد حذف كل نقاط الإحداثيات؟', 'Delete all coordinate points?'],
        ['هل تريد مسح كل نتائج القياس؟', 'Clear all measurement results?'],
        ['بدء مشروع جديد؟ سيتم مسح كل البيانات الحالية (المواقع والملفات والرسومات) نهائيًا. متابعة؟', 'Start a new project? All current data (locations, files, drawings) will be permanently cleared. Continue?'],
        ['سيتم مسح البيانات المحفوظة والملفات المؤقتة وإعادة تحميل التطبيق. متابعة؟', 'Saved data and temporary files will be cleared and the app will reload. Continue?'],
        ['لا توجد بيانات للتصدير', 'No data to export'],
        ['لا توجد معالم للتصدير', 'No features to export'],
        ['لا توجد معالم في هذا المصدر.', 'No features in this source.'],
        ['لا توجد معالم للتصدير من المصدر المحدد.', 'No features to export from the selected source.'],
        ['لا توجد معالم على الخريطة للتصدير. ارسم عنصراً أو ارفع طبقة.', 'No features on the map to export. Draw a feature or upload a layer.'],
        ['لم يتم اختيار ملف', 'No file selected'],
        ['ملف غير صالح — لم يتغيّر شيء', 'Invalid file — nothing changed'],
        ['تعذر قراءة الملف: ليس ملف بيانات صالحاً.', 'Could not read the file: not a valid data file.'],
        ['تعذّرت قراءة الملف', 'Could not read the file'],
        ['الملف لا يحتوي على عناصر جغرافية صالحة.', 'The file contains no valid geographic features.'],
        ['الملف ZIP ليس Shapefile ولا KMZ', 'The ZIP file is neither a Shapefile nor a KMZ'],
        ['صيغة غير مدعومة:', 'Unsupported format:'],
        ['صيغة DWG غير مدعومة', 'DWG format is not supported'],
        ['نوع GeoJSON غير مدعوم.', 'Unsupported GeoJSON type.'],
        ['لم يتم العثور على KML داخل KMZ.', 'No KML found inside the KMZ.'],
        ['لم يتم العثور على ملف SHP داخل ZIP.', 'No SHP file found inside the ZIP.'],
        ['ملف KML غير صالح XML.', 'Invalid KML/XML file.'],
        ['ملف SHP موجود لكن DBF المقابل غير موجود.', 'SHP file found but the matching DBF is missing.'],
        ['مكتبة قراءة DXF لم يتم تحميلها.', 'DXF reader library was not loaded.'],
        ['مكتبة تصدير Shapefile غير متاحة.', 'Shapefile export library is not available.'],
        ['لم يتم العثور على عناصر DXF مدعومة (POINT/LINE/POLYLINE/CIRCLE).', 'No supported DXF entities found (POINT/LINE/POLYLINE/CIRCLE).'],
        ['لم يتم العثور على عناصر داخل المنطقة المحددة.', 'No features found inside the selected area.'],
        ['الـShapefile يبدو بإحداثيات مسقطة، لكن ملف PRJ غير موجود. أضف .prj إلى ZIP.', 'The Shapefile appears to use projected coordinates, but the PRJ file is missing. Add .prj to the ZIP.'],
        ['تمت قراءة SHP لكن تعذر تحويل الإسقاط من ملف PRJ إلى WGS84:', 'SHP was read but projection conversion from the PRJ file to WGS84 failed:'],
        ['تم تحويل الإحداثيات المسقطة (UTM', 'Projected coordinates converted (UTM'],
        ['لا توجد نقاط بعد. اضغط على الخريطة أولاً لوضع النقاط.', 'No points yet. Click on the map first to place points.'],
        ['لا يوجد عناصر من هذا النوع لحذفها', 'There are no items of this type to delete'],
        ['لم أجد المكان، جرّب كتابة مثل: مكة المكرمة، بغداد، الرياض', 'Place not found. Try typing: Mecca, Baghdad, Riyadh'],
        ['لم يبدأ التحويل إلى Google — أعد المحاولة أو تحقّق من اتصالك', 'Google redirect did not start — try again or check your connection'],
        ['لم يكتمل التحويل إلى Google. قد يكون الاتصال بطيئًا أو مانع نوافذ فعّالًا — أعد المحاولة.', 'Google redirect did not complete. The connection may be slow or a popup blocker is active — try again.'],
        ['⏳ جاري التحميل...', '⏳ Loading...'],
        ['جارٍ التصدير...', 'Exporting...'],
        ['❌ تعذر التصدير:', '❌ Export failed:'],
        ['❌ الملف غير صالح أو تالف', '❌ The file is invalid or corrupted'],
        ['❌ مكتبة العرض ثلاثي الأبعاد لم يتم تحميلها.', '❌ The 3D viewer library was not loaded.'],
        ['⬇️ تم تصدير', '⬇️ Exported'],
        ['⬇️ تم تنزيل الملف على جهازك بدلاً من ذلك', '⬇️ The file was downloaded to your device instead'],
        ['⬇️ تم تنزيل الملف على جهازك — احفظه في مكان ثابت', '⬇️ The file was downloaded to your device — save it to a permanent location'],
        ['✅ تم استرجاع البيانات من الملف بنجاح', '✅ Data restored from the file successfully'],
        ['✅ تم الحفظ في ملف على جهازك وسيُستعاد تلقائياً عند الفتح', '✅ Saved to a file on your device and will be restored automatically when opened'],
        ['✅ تم حفظ المفتاح. الآن البحث بيعمل بلا تقطيع.', '✅ Key saved. Search now works without interruption.'],
        ['📂 تم استرجاع آخر نسخة محلية', '📂 Last local copy restored'],
        ['📂 تم استرجاع بياناتك تلقائياً من الملف المحفوظ', '📂 Your data was restored automatically from the saved file'],
        ['📍 تم نقل العنصر إلى الإحداثي الجديد وحفظ UTM', '📍 The feature was moved to the new coordinate and UTM was saved'],
        ['خطأ في الاسترجاع المحلي', 'Local restore error'],
        ['خطأ في الاسترجاع من IndexedDB', 'IndexedDB restore error'],
        ['خطأ في الاسترجاع من الملف', 'File restore error'],
        ['فشل استرجاع IndexedDB', 'IndexedDB restore failed'],
        ['فشل الاسترجاع التلقائي', 'Automatic restore failed'],
        ['فشل تحميل النسخة المحلية', 'Failed to load the local copy'],
        ['إحداثيات العنصر غير صالحة (0,0) أو غير رقمية — لا يمكن التكبير', 'Invalid coordinates (0,0) or non-numeric — cannot zoom'],
        ['يُرجى حفظ الملف بصيغة', 'Please save the file as'],
        [') أو رفعه كمضغوط', ') or upload it compressed'],
        ['ليُقرأ مباشرة.', 'to be read directly.'],
        ['تفاصيل أكثر', 'More details'],
        ['(بدون قيمة)', '(no value)'],
        ['0 طبقة', '0 layers'],
        ['لا عناصر في هذه المجموعة', 'No items in this group'],

        /* ---------- مصادر الطبقات والقوائم المشتركة ---------- */
        ['الطبقات الظاهرة على الخريطة', 'Visible layers on the map'],
        ['كل الطبقات (ظاهرة ومخفية)', 'All layers (visible and hidden)'],
        ['الرسومات المخصّصة فقط', 'Custom drawings only'],
        ['الملفات المرفوعة فقط', 'Uploaded files only'],
        ['المواقع المحفوظة فقط', 'Saved locations only'],
        ['التحديد الحالي', 'Current selection'],
        ['كل الطبقات الظاهرة على الخريطة', 'All visible layers on the map'],
        ['كل الطبقات (بما فيها المخفية)', 'All layers (including hidden)'],
        ['العناصر المحددة (إن وجدت)', 'Selected features (if any)'],
        ['العناصر المحدّدة', 'Selected features'],
        ['كل العناصر', 'All features'],
        ['كل النقاط', 'All points'],
        ['كل المضلعات', 'All polygons'],
        ['المضلعات المخصصة', 'Custom polygons'],
        ['النقاط المخصصة', 'Custom points'],
        ['نقاط الملف الحالي', 'Current file points'],
        ['مضلعات الملف الحالي', 'Current file polygons'],
        ['عناصر الملف الحالي', 'Current file features'],
        ['— لا حقول —', '— No fields —'],
        ['لا توجد حقول في البيانات الحالية.', 'No fields in the current data.'],
        ['— اختر عنصرًا —', '— Select a feature —'],

        /* ---------- وحدة الأوامر ---------- */
        ['دليل سريع', 'Quick Guide'],
        ['• اختر أي وحدة من التبويب «وحدات» أو ابحث هنا.', '• Choose any module from the “Modules” tab or search here.'],
        ['• مفتاح', '• Key'],
        ['يغلق نافذة الوحدة.', 'closes the module window.'],
        ['• نتائج التحليل تُضاف كطبقات في لوحة الطبقات (قابلة للحذف/التصدير).', '• Analysis results are added as layers in the Layers panel (deletable/exportable).'],
        ['• بعض الوحدات تتطلّب وجود بيانات (خطوط/نقاط/مضلعات) في الملف أو العناصر المخصصة.', '• Some modules require data (lines/points/polygons) in the file or custom features.'],

        /* ---------- محرر الأشكال ---------- */
        ['العنصر المراد تحريره', 'Feature to edit'],
        ['تحريك', 'Move'],
        ['إنهاء التحرير', 'Finish editing'],

        /* ---------- التجسيم ثلاثي الأبعاد ---------- */
        ['حقل الارتفاع (رقمي)', 'Height field (numeric)'],
        ['ارتفاع ثابت', 'Fixed height'],
        ['ارتفاع أساسي (م)', 'Base height (m)'],
        ['شفافية', 'Opacity'],

        /* ---------- المعالجة الجغرافية ---------- */
        ['العملية', 'Operation'],
        ['الطبقة أ', 'Layer A'],
        ['الطبقة ب', 'Layer B'],
        ['حقل الإذابة (اختياري)', 'Dissolve field (optional)'],
        ['— بدون تجميع —', '— No grouping —'],
        ['تنفيذ العملية', 'Run operation'],

        /* ---------- GPS والتتبع ---------- */
        ['تحديد الموقع', 'Locate'],
        ['موقعي', 'My Location'],
        ['تتبّع', 'Track'],
        ['تسامح الالتقاط بالبكسل للمؤشّر', 'Snapping tolerance in pixels for the cursor'],
        ['إظهار مؤشّر أقرب رأس أثناء الحركة', 'Show nearest vertex indicator while moving'],
        ['التقاط رؤوس عنصر مخصّص', 'Snap to custom feature vertices'],

        /* ---------- الخريطة الحرارية ---------- */
        ['مصدر النقاط', 'Point source'],
        ['الكل', 'All'],
        ['حقل الوزن (اختياري)', 'Weight field (optional)'],
        ['وزن موحّد (1)', 'Uniform weight (1)'],
        ['نصف القطر:', 'Radius:'],
        ['الضبابية:', 'Blur:'],
        ['تشغيل الخريطة الحرارية', 'Run heatmap'],

        /* ---------- تصدير الصور الجوية ---------- */
        ['مصدر الصور', 'Imagery source'],
        ['أقصى تكبير للمصدر', 'Max source zoom'],
        ['مستوى التكبير (الدقة)', 'Zoom level (resolution)'],
        ['19  (الأقصى — الأعلى دقة)', '19  (max — highest resolution)'],
        ['شكل منطقة التصدير', 'Export area shape'],
        ['صيغة تصدير فيكتور النطاق', 'Area vector export format'],
        ['تصدير فيكتور النطاق فقط (مطابق للصورة)', 'Export area vector only (matches the image)'],
        ['ارسم مستطيل المنطقة على الخريطة', 'Draw the area rectangle on the map'],
        ['لم تُحدَّد منطقة بعد.', 'No area defined yet.'],
        ['صدّر صورة جوية عالية الدقة لمنطقة تختارها، مع إسناد جغرافي جاهز لـ QGIS / ArcGIS / AutoCAD', 'Export a high-resolution aerial image for a chosen area, with georeferencing ready for QGIS / ArcGIS / AutoCAD'],
        ['ملاحظة: بعض المصادر (مثل Google) قد تمنع التصدير بسياسة CORS — استخدم Esri World Imagery أو OpenAerialMap.', 'Note: some sources (such as Google) may block export due to CORS policy — use Esri World Imagery or OpenAerialMap.'],
        ['تضمين بيانات الفيكتور داخل الحزمة (ZIP)', 'Include vector data in the package (ZIP)'],
        ['مستطيل (Bounding Box)', 'Rectangle (Bounding Box)'],
        ['مضلع (Polygon)', 'Polygon'],
        ['— رابط XYZ مخصّص —', '— Custom XYZ URL —'],
        ['قالب رابط XYZ', 'XYZ URL template'],
        ['Google Earth KML (.kml)', 'Google Earth KML (.kml)'],
        ['Google Earth KMZ (.kmz)', 'Google Earth KMZ (.kmz)'],
        ['AutoCAD DXF — إحداثيات UTM (.dxf)', 'AutoCAD DXF — UTM coordinates (.dxf)'],
        ['Shapefile مضغوط (.zip)', 'Compressed Shapefile (.zip)'],
        ['جدول CSV (.csv)', 'CSV table (.csv)'],
        ['تصدير الصورة (ZIP + GeoTIFF)', 'Export image (ZIP + GeoTIFF)'],
        ['تصدير صورة جوية/فضائية عالية الدقة بمرجع جغرافي (PNG + GeoTIFF) لأي منطقة مرسومة من مصادر مفتوحة.', 'Export a georeferenced high-res aerial/satellite image (PNG + GeoTIFF) for any drawn area from open sources.'],

        /* ---------- مفتاح الإحداثيات والقياس ---------- */
        ['مفتاح الإحداثيات', 'Coordinate readout'],
        ['تشغيل المفتاح (يتبع حركة الفأرة)', 'Enable readout (follows the mouse)'],
        ['نسخ الإحداثيات عند النقر', 'Copy coordinates on click'],
        ['حرّك الفأرة فوق الخريطة…', 'Move the mouse over the map…'],
        ['القياس التراكمي', 'Cumulative measurement'],
        ['مسافة', 'Distance'],
        ['مساحة', 'Area'],
        ['إجمالي المسافات', 'Total distances'],
        ['إجمالي المساحات', 'Total areas'],
        ['لا توجد قياسات بعد.', 'No measurements yet.'],
        ['تحديث', 'Refresh'],

        /* ---------- تحليل الشبكات ---------- */
        ['نوع التحليل', 'Analysis type'],
        ['تتبّع الشبكة المتصلة', 'Trace connected network'],
        ['عنصر البدء (خطّي)', 'Start feature (line)'],
        ['لا توجد عناصر خطّية', 'No line features'],
        ['تنفيذ', 'Run'],

        /* ---------- مستخرج OSM ---------- */
        ['اسحب بيانات فيكتور حقيقية لأي منطقة في العالم من OpenStreetMap (Overpass API) — مبانٍ، طرق، مياه، حدود، ومعالم — ثم صدّرها بإحداثياتها الحقيقية.', 'Pull real vector data for any area worldwide from OpenStreetMap (Overpass API) — buildings, roads, water, boundaries, and POIs — then export it with real coordinates.'],
        ['منطقة الاهتمام (AOI)', 'Area of Interest (AOI)'],
        ['نافذة الخريطة الحالية', 'Current map window'],
        ['مستطيل — أرسمه على الخريطة', 'Rectangle — draw it on the map'],
        ['مضلع — أرسمه على الخريطة', 'Polygon — draw it on the map'],
        ['ابدأ الرسم', 'Start drawing'],
        ['إنهاء المضلع', 'Finish polygon'],
        ['المنطقة:', 'Area:'],
        ['نوع البيانات', 'Data type'],
        ['شبكات المياه والصرف', 'Water & Sewer Networks'],
        ['المباني', 'Buildings'],
        ['الطرق والشوارع', 'Roads & Streets'],
        ['استخدامات الأراضي', 'Land Use'],
        ['المعالم والنشاطات (POI)', 'POIs & Amenities'],
        ['شبكات الكهرباء', 'Power Networks'],
        ['الحدود الإدارية', 'Administrative Boundaries'],
        ['الغطاء النباتي', 'Vegetation'],
        ['الأماكن المأهولة', 'Populated Places'],
        ['— استعلام Overpass مخصّص —', '— Custom Overpass query —'],
        ['تنزيل البيانات من OSM', 'Download OSM data'],
        ['تصدير البيانات المُنزّلة', 'Export downloaded data'],
        ['تكبير', 'Zoom'],
        ['إزالة من الخريطة', 'Remove from map'],
        ['البيانات تخضع لرخصة ODbL من OpenStreetMap. الصيغ المدعومة: GeoJSON · KML · DXF · Shapefile · CSV.', 'Data is under the ODbL license from OpenStreetMap. Supported formats: GeoJSON · KML · DXF · Shapefile · CSV.'],

        /* ---------- التخطيط للطباعة ---------- */
        ['عنوان اللوحة', 'Layout title'],
        ['إظهار المفتاح والمقياس', 'Show legend and scale'],
        ['معاينة الطباعة', 'Print preview'],

        /* ---------- ملف المشروع ---------- */
        ['ملفات:', 'Files:'],
        ['عناصر مخصّصة:', 'Custom features:'],
        ['مواقع:', 'Locations:'],
        ['قياسات:', 'Measurements:'],
        ['حفظ المشروع (.gisproj)', 'Save project (.gisproj)'],
        ['تحميل مشروع', 'Load project'],
        ['يشمل المشروع: الملفات، العناصر المخصّصة، المواقع، الأنماط، والقياسات.', 'The project includes: files, custom features, locations, styles, and measurements.'],

        /* ---------- الربط المكاني ---------- */
        ['طبقة المضلعات (الهدف)', 'Polygon layer (target)'],
        ['طبقة النقاط (المصدر)', 'Point layer (source)'],
        ['تنفيذ الربط المكاني', 'Run spatial join'],

        /* ---------- مقارنة الخرائط ---------- */
        ['الخريطة اليسرى (أ)', 'Left map (A)'],
        ['الخريطة اليمنى (ب)', 'Right map (B)'],
        ['موضع الفاصل', 'Divider position'],
        ['تشغيل المقارنة', 'Run comparison'],
        ['عند التشغيل تُخفى الخريطة النشطة وتُعرض الخريطتان مع فاصل قابل للسحب.', 'When running, the active map is hidden and both maps are shown with a draggable divider.'],

        /* ---------- معلومات النظام ---------- */
        ['إصدار طبقة الأساس', 'Basemap version'],
        ['عدد الوحدات المسجّلة', 'Registered modules count'],
        ['ارتفاع الهيدر', 'Header height'],
        ['حجم أيقونة الواجهة', 'UI icon size'],
        ['مركز الخريطة', 'Map center'],
        ['مستوى التكبير', 'Zoom level'],
        ['نشِط ✓', 'Active ✓'],
        ['هذه الوحدة مُحمَّلة من ملف مستقل', 'This module is loaded from a standalone file'],
        ['وتُثبت أن نظام الوحدات يعمل بدون أخطاء.', 'proving the module system works without errors.'],

        /* ---------- فحص الطوبولوجيا ---------- */
        ['نطاق الفحص', 'Check scope'],
        ['الملف الحالي', 'Current file'],
        ['تسامح الرؤوس المكرّرة (متر)', 'Duplicate vertex tolerance (m)'],
        ['فحص التراكب بين المضلعات', 'Check overlap between polygons'],
        ['بدء الفحص', 'Start check'],

        /* ---------- سجل الاستخدام ---------- */
        ['سجل الاستخدام والتثبيت', 'Usage & Installs log'],
        ['تأكد أنك مسجّل الدخول وأن جدول', 'Make sure you are signed in and the table'],
        ['منشأ مع سياسة القراءة.', 'is created with a read policy.'],

        /* ---------- مناطق الخدمة (ثيسن) ---------- */
        ['المصدر (نقاط)', 'Source (points)'],
        ['حدود التغطية', 'Coverage bounds'],
        ['حول البيانات (هامش 20%)', 'Around data (20% margin)'],
        ['نطاق العرض الحالي للخريطة', 'Current map view extent'],
        ['تسميات الخلايا', 'Cell labels'],
        ['إظهار أسماء النقاط في لوحة الطبقات', 'Show point names in the Layers panel'],
        ['ثيسن', 'Thiessen'],
        ['مغلّف محدّب', 'Convex hull'],
        ['القص (Clip) — أ داخل ب', 'Clip (A inside B)'],
        ['التقاطع (Intersect) — أ ∩ ب', 'Intersect (A ∩ B)'],
        ['الاتحاد (Union) — دمج أ و ب', 'Union (merge A and B)'],
        ['الإذابة (Dissolve) — دمج أ فقط', 'Dissolve (merge A only)'],
        ['الالتقاط (Snapping)', 'Snapping'],
        ['العناصر المخصصة', 'Custom features'],
        ['العناصر المخصّصة', 'Custom features'],
        ['أقرب جار (Nearest Neighbor)', 'Nearest Neighbor'],
        ['غير نشِط', 'Inactive'],
        ['جارٍ التحميل…', 'Loading…'],

        /* ---------- صفحة landing.html التعريفية ---------- */
        ['نظام معلومات جغرافي لقطاع المياه', 'A GIS for the Water Sector'],
        ['شعار منصة جغرافية', 'Geo Platform logo'],
        ['القائمة', 'Menu'],
        ['المميزات', 'Features'],
        ['الصور الجوية', 'Aerial Imagery'],
        ['كيف يعمل', 'How It Works'],
        ['الأسئلة', 'FAQ'],
        ['افتح التطبيق', 'Open App'],
        ['فتح التطبيق', 'Open App'],
        ['يعمل دون إنترنت • مجاني بالكامل', 'Works offline • Completely free'],
        ['نظام معلومات جغرافي', 'A geographic information system'],
        ['متكامل', 'fully integrated'],
        ['لإدارة شبكات المياه', 'for water network management'],
        ['منصة ويب واحدة تجمع الطبقات الجغرافية، الرسم والقياس، التحليل المكاني، الصور الجوية عالية الدقة، والتصدير بصيغ متعددة — بسرعة وبساطة على الجوال والحاسوب.', 'One web platform combining geographic layers, drawing and measurement, spatial analysis, high-resolution aerial imagery, and multi-format export — fast and simple on mobile and desktop.'],
        ['افتح التطبيق الآن', 'Open the App Now'],
        ['استعرض المميزات', 'Explore Features'],
        ['أكثر من 20 أداة', '20+ Tools'],
        ['صور جوية مفتوحة', 'Open Aerial Imagery'],
        ['يعمل كتطبيق PWA', 'Works as a PWA'],
        ['خزان المياه الرئيسي', 'Main Water Tank'],
        ['السعة: 5000 م³', 'Capacity: 5000 m³'],
        ['المفتاح', 'Legend'],
        ['خط رئيسي', 'Main line'],
        ['حدود منطقة', 'Area boundary'],
        ['محطة رفع', 'Pump station'],
        ['أداة جغرافية جاهزة', 'Ready geo tools'],
        ['يعمل دون إنترنت', 'Works offline'],
        ['صيغة استيراد وتصدير', 'Import/export formats'],
        ['تكلفة — مجاني بالكامل', 'Cost — completely free'],
        ['كل ما تحتاجه لإدارة شبكة المياه في مكان واحد', 'Everything you need to manage a water network in one place'],
        ['منصة متكاملة صُمّمت للعمل الميداني والمكتبي: تعرض، ترسم، تقيس، تحلّل، وتصدّر — دون تعقيد ودون تثبيت.', 'An integrated platform designed for field and office work: view, draw, measure, analyze, and export — without complexity or installation.'],
        ['طبقات وخرائط أساس', 'Layers & Basemaps'],
        ['أضف طبقات متعددة (نقاط، خطوط، مضلعات) فوق خرائط أساس متنوعة، وتحكّم في الألوان والشفافية والترتيب بحرية.', 'Add multiple layers (points, lines, polygons) over various basemaps, and freely control colors, opacity, and order.'],
        ['رفع ملفات متعدد الصيغ', 'Multi-format File Upload'],
        ['استورد ملفات GeoJSON و KML و Shapefile (ZIP) و CSV بسهولة، واعرضها فورًا على الخريطة مع حقولها.', 'Import GeoJSON, KML, Shapefile (ZIP), and CSV files easily, and display them on the map instantly with their fields.'],
        ['رسم وتحرير كامل', 'Full Drawing & Editing'],
        ['ارسم نقاط وخطوط ومضلعات ودوائر، ثم حرّك الرؤوس أو أضفها أو احذفها مع إعادة حساب الأطوال والمساحات.', 'Draw points, lines, polygons, and circles, then move, add, or delete vertices with automatic length and area recalculation.'],
        ['قياس وإحداثيات لحظية', 'Live Measurement & Coordinates'],
        ['اقرأ الإحداثيات لحظيًا (عشري/DMS/UTM) وقِس المسافات والمساحات مع مجاميع تراكمية دقيقة.', 'Read coordinates live (decimal/DMS/UTM) and measure distances and areas with accurate cumulative totals.'],
        ['تحليل مكاني متقدّم', 'Advanced Spatial Analysis'],
        ['نطاقات عازلة، ربط مكاني، تغطية خدمة (ثيسن)، تحليل شبكة، قص واتحاد ودمج — بأدوات احترافية.', 'Buffers, spatial joins, service areas (Thiessen), network analysis, clip/union/dissolve — with professional tools.'],
        ['لوحات معلومات ورسوم بيانية', 'Dashboards & Charts'],
        ['حوّل بياناتك إلى رسوم بيانية وخرائط حرارية ومقاطع ارتفاع وبثق ثلاثي الأبعاد لرؤية أوضح.', 'Turn your data into charts, heatmaps, elevation profiles, and 3D extrusion for clearer insight.'],
        ['تصدير بصيغ متعددة', 'Multi-format Export'],
        ['صدّر نتائجك إلى Shapefile و KML و DXF و GeoJSON و CSV وارسم مخططات جاهزة للطباعة بصيغة PDF.', 'Export your results to Shapefile, KML, DXF, GeoJSON, and CSV, and create print-ready PDF layouts.'],
        ['فحص الجودة والتوبولوجي', 'Quality & Topology Checks'],
        ['اكتشف التكرار والرؤوس المزدوجة والتقاطعات والتراكبات، وحافظ على بيانات نظيفة ودقيقة.', 'Detect duplicates, double vertices, intersections, and overlaps, and keep your data clean and accurate.'],
        ['يعمل دون إنترنت + حفظ تلقائي', 'Works Offline + Auto-save'],
        ['يُثبَّت كتطبيق PWA ويعمل بلا اتصال، مع حفظ تلقائي لعملك محليًا واستعادة فورية عند العودة.', 'Installs as a PWA and works offline, with automatic local saving and instant restore when you return.'],
        ['صندوق الأدوات', 'Toolbox'],
        ['أكثر من 20 وحدة جاهزة للاستخدام', '20+ Ready-to-use Modules'],
        ['كل وحدة تُفتح بنقرة واحدة من واجهة التطبيق، مصمّمة لتكامل سلس مع بقية الأدوات.', 'Each module opens with one click from the app interface, designed for smooth integration with the rest of the tools.'],
        ['الطبقات والرسم', 'Layers & Drawing'],
        ['النطاقات العازلة', 'Buffer Zones'],
        ['الفلترة المرئية', 'Visual Filtering'],
        ['الخريطة الحرارية', 'Heatmap'],
        ['الربط المكاني', 'Spatial Join'],
        ['المواقع GPS والتتبّع', 'GPS & Tracking'],
        ['محرّر الأشكال', 'Geometry Editor'],
        ['فحص التوبولوجي', 'Topology Check'],
        ['مقارنة الخرائط', 'Map Swipe Compare'],
        ['لوحة المعلومات البيانية', 'BI Dashboard'],
        ['مقطع الارتفاع', 'Elevation Profile'],
        ['البثق ثلاثي الأبعاد', '3D Extrusion'],
        ['تخطيط الطباعة PDF', 'PDF Print Layout'],
        ['تصدير الصور الجوية', 'Aerial Imagery Export'],
        ['القص والاتحاد والدمج', 'Clip, Union & Dissolve'],
        ['تحليل الشبكة', 'Network Analysis'],
        ['تغطية الخدمات (ثيسن)', 'Service Areas (Thiessen)'],
        ['الخط الزمني', 'Time Slider'],
        ['التسميات', 'Labels'],
        ['ملف المشروع .gisproj', 'Project File .gisproj'],
        ['لوحة الأوامر السريعة', 'Command Palette'],
        ['جديد', 'New'],
        ['تصدير صور جوية عالية الدقة من مصادر مفتوحة', 'High-resolution aerial imagery export from open sources'],
        ['ارسم المنطقة التي تريدها، واختر مصدر الصور (بما فيها Esri World Imagery و Sentinel-2 Cloudless)، واحصل على صورة جغرافية مُرمَّزة جاهزة للاستخدام في برامج GIS.', 'Draw the area you want, choose the imagery source (including Esri World Imagery and Sentinel-2 Cloudless), and get a georeferenced image ready for use in GIS software.'],
        ['اختيار مصدر الصور ومستوى التكبير تلقائيًا', 'Choose the imagery source and zoom level automatically'],
        ['دمج البلاطات في صورة واحدة متّصلة', 'Merge tiles into one seamless image'],
        ['تصدير GeoTIFF + World File بإحداثيات EPSG:3857', 'Export GeoTIFF + World File in EPSG:3857'],
        ['ملف GeoJSON لحدود المنطقة المختارة', 'GeoJSON file for the selected area boundary'],
        ['الصيغة', 'Format'],
        ['نظام الإحداثيات', 'Coordinate system'],
        ['مصادر مفتوحة', 'Open sources'],
        ['أقصى تكبير', 'Max zoom'],
        ['حتى 19', 'Up to 19'],
        ['المنطقة', 'Area'],
        ['مستطيل مخصّص', 'Custom rectangle'],
        ['ابدأ العمل في أربع خطوات', 'Get started in four steps'],
        ['لا يحتاج أي تثبيت أو خبرة برمجية — افتح المتصفح وابدأ فورًا.', 'No installation or programming experience needed — open your browser and start right away.'],
        ['افتح التطبيق', 'Open the App'],
        ['سجّل الدخول بحساب Google أو بالبريد للوصول إلى التطبيق وحفظ مشاريعك في السحابة.', 'Sign in with Google or email to access the app and save your projects to the cloud.'],
        ['ارفع أو ارسم', 'Upload or Draw'],
        ['أضف طبقاتك من ملفات، أو ارسم العناصر مباشرة على الخريطة.', 'Add your layers from files, or draw features directly on the map.'],
        ['حلّل وحرّر', 'Analyze & Edit'],
        ['استخدم أدوات القياس والتحليل المكاني والجودة لفهم بياناتك.', 'Use measurement, spatial analysis, and quality tools to understand your data.'],
        ['صدّر وشارك', 'Export & Share'],
        ['صدّر النتائج بصيغ GIS القياسية أو اطبعها، واحفظ مشروعك.', 'Export results in standard GIS formats or print them, and save your project.'],
        ['جاهز لتبدأ؟ التطبيق متاح الآن مجانًا', 'Ready to start? The app is now available for free'],
        ['افتحه مباشرة من المتصفح على الجوال أو الحاسوب، ولا تحتاج أي تثبيت.', 'Open it directly in your browser on mobile or desktop — no installation required.'],
        ['الأسئلة الشائعة', 'FAQ'],
        ['أسئلة قد تهمّك', 'Questions you may find useful'],
        ['هل يعمل التطبيق دون اتصال بالإنترنت؟', 'Does the app work offline?'],
        ['نعم، التطبيق يعمل كتطبيق PWA ويمكن تثبيته على الجوال، وتُخزَّن ملفاته محليًا ليعمل حتى عند انقطاع الإنترنت بعد أول زيارة.', 'Yes, the app works as a PWA and can be installed on mobile. Its files are stored locally so it works even when the internet is down after the first visit.'],
        ['هل التطبيق مجاني؟', 'Is the app free?'],
        ['نعم، التطبيق مجاني بالكامل ومفتوح الاستخدام لإدارة شبكات المياه وأعمال GIS الميدانية.', 'Yes, the app is completely free and open to use for water network management and field GIS work.'],
        ['ما الصيغ المدعومة للاستيراد والتصدير؟', 'What formats are supported for import and export?'],
        ['الاستيراد: GeoJSON و KML و Shapefile (ZIP) و CSV. التصدير: Shapefile و KML و DXF و GeoJSON و CSV، بالإضافة إلى GeoTIFF والصور الجوية ومخططات PDF.', 'Import: GeoJSON, KML, Shapefile (ZIP), and CSV. Export: Shapefile, KML, DXF, GeoJSON, and CSV, plus GeoTIFF, aerial imagery, and PDF layouts.'],
        ['هل تُحفظ بياناتي بشكل آمن؟', 'Is my data saved securely?'],
        ['تُحفظ بياناتك محليًا على جهازك تلقائيًا، ويمكنك اختياريًا تسجيل الدخول لمزامنة مشاريعك مع حسابك السحابي الخاص.', 'Your data is saved automatically on your device locally, and you can optionally sign in to sync your projects with your own cloud account.'],
        ['كيف أثبّت التطبيق على الجوال؟', 'How do I install the app on mobile?'],
        ['افتح التطبيق في المتصفح ثم اختر «إضافة إلى الشاشة الرئيسية» (Android) أو «إضافة إلى الشاشة الرئيسية» من قائمة المشاركة (iOS)، ليصبح كأي تطبيق مستقل.', 'Open the app in your browser, then choose “Add to Home Screen” (Android) or “Add to Home Screen” from the share menu (iOS) so it becomes like any standalone app.'],
        ['منصة ويب متكاملة لإدارة شبكات المياه: طبقات، رسم، قياس، تحليل مكاني، صور جوية، وتصدير متعدد الصيغ — تعمل على الجوال والحاسوب ودون إنترنت.', 'An integrated web platform for water network management: layers, drawing, measurement, spatial analysis, aerial imagery, and multi-format export — works on mobile and desktop, even offline.'],
        ['روابط سريعة', 'Quick Links'],
        ['عن التطبيق', 'About the App'],
        ['إعداد: أ / أحمد محسوب', 'Prepared by: Eng. Ahmed Mahsoub'],
        ['تطبيق ويب (PWA)', 'Web App (PWA)'],
        ['منصة جغرافية — جميع الحقوق محفوظة.', 'Geo Platform — All rights reserved.'],
        ['صُنع بعناية لقطاع المياه', 'Crafted with care for the water sector'],
        ['صدّر صورة جوية عالية الدقة لمنطقة تختارها، مع إسناد جغرافي جاهز لـ QGIS / ArcGIS / AutoCAD — من المصادر المفتوحة (Esri World Imagery، Sentinel-2).', 'Export a high-resolution aerial image for a chosen area, with georeferencing ready for QGIS / ArcGIS / AutoCAD — from open sources (Esri World Imagery, Sentinel-2).'],
        ['ملاحظة: بعض المصادر (مثل Google) قد تمنع التصدير بسياسة CORS — استخدم Esri World Imagery أو Sentinel-2. الملف يُصدَّر بنظام إحداثيات Web Mercator (EPSG:3857) وهو مدعوم مباشرةً في QGIS/ArcGIS.', 'Note: some sources (such as Google) may block export due to CORS policy — use Esri World Imagery or Sentinel-2. The file is exported in Web Mercator (EPSG:3857), supported directly in QGIS/ArcGIS.']
    ];

    /* ---------- نصوص ثنائية اللغة في المصدر: [المصدر, العربية, English] ---------- */
    var MIXED = [
        ['Icon Manager · الأيقونات', 'مدير الأيقونات', 'Icon Manager'],
        ['Sidebar Manager · القائمة الجانبية', 'مدير القائمة الجانبية', 'Sidebar Manager'],
        ['Layout Manager · التبويبات', 'مدير التخطيط', 'Layout Manager'],
        ['Theme Manager · المظهر', 'مدير المظهر', 'Theme Manager'],
        ['Workspace Presets · أنماط العمل', 'أنماط العمل', 'Workspace Presets'],
        ['Reset & Backup · الاستعادة والنسخ', 'الاستعادة والنسخ', 'Reset & Backup'],
        ['Analysis · التحليل', 'التحليل', 'Analysis'],
        ['Editing · التحرير', 'التحرير', 'Editing'],
        ['Mapping · المسح', 'المسح', 'Mapping'],
        ['Sewerage · الصرف الصحي', 'الصرف الصحي', 'Sewerage'],
        ['Water · شبكات التوزيع', 'شبكات المياه', 'Water'],
        ['Language / اللغة', 'اللغة', 'Language'],
        ['اللغة / Language', 'اللغة', 'Language'],
        ['العربية', 'العربية', 'Arabic'],
        ['مساحات · أطوال · Buffer · Heatmap', 'مساحات · أطوال · نطاقات · خرائط حرارية', 'Areas · Lengths · Buffer · Heatmap'],
        ['أساس · صور جوية · طبقاتك الخاصة', 'خرائط أساس · صور جوية · طبقاتك الخاصة', 'Basemaps · Aerial Imagery · Your Own Layers'],

        /* ---------- نافذة تثبيت التطبيق (PWA) ---------- */
        ['تثبيت التطبيق', 'تثبيت التطبيق', 'Install App'],
        ['تثبيت التطبيق على جهازك', 'تثبيت التطبيق على جهازك', 'Install the app on your device'],
        ['تثبيت منصة جغرافية', 'تثبيت منصة جغرافية', 'Install Geo Platform'],
        ['تطبيق ويب تقدمي • يعمل بدون إنترنت', 'تطبيق ويب تقدمي • يعمل بدون إنترنت', 'Progressive Web App • Works offline'],
        ['بدون إنترنت', 'بدون إنترنت', 'Offline'],
        ['أيقونة على جهازك', 'أيقونة على جهازك', 'Icon on your device'],
        ['تشغيل أسرع', 'تشغيل أسرع', 'Faster startup'],
        ['تثبيت الآن', 'تثبيت الآن', 'Install now'],
        ['فتح في Chrome', 'فتح في Chrome', 'Open in Chrome'],
        ['نسخ الرابط', 'نسخ الرابط', 'Copy link'],
        ['إغلاق', 'إغلاق', 'Close'],
        ['تم تثبيت التطبيق بنجاح', 'تم تثبيت التطبيق بنجاح', 'App installed successfully'],
        ['لم يكتمل التثبيت — جرّب من قائمة المتصفح', 'لم يكتمل التثبيت — جرّب من قائمة المتصفح', 'Installation did not complete — try from the browser menu'],
        ['تم نسخ الرابط — افتحه في المتصفح', 'تم نسخ الرابط — افتحه في المتصفح', 'Link copied — open it in the browser'],
        ['سيظهر مربع تأكيد من المتصفح — اضغط «تثبيت»', 'سيظهر مربع تأكيد من المتصفح — اضغط «تثبيت»', 'A browser confirmation will appear — tap “Install”'],
        ['منصة جغرافية • متصفح داخلي', 'منصة جغرافية • متصفح داخلي', 'Geo Platform • in-app browser'],
        ['سطح المكتب', 'سطح المكتب', 'Desktop'],
        ['افتح في المتصفح', 'افتح في المتصفح', 'Open in browser'],
        ['فتح في المتصفح', 'فتح في المتصفح', 'Open in browser'],
        ['أنت تفتح الرابط الآن داخل', 'أنت تفتح الرابط الآن داخل', 'You are opening the link inside'],
        ['— هذا المتصفح الداخلي لا يسمح بتثبيت التطبيقات.', '— هذا المتصفح الداخلي لا يسمح بتثبيت التطبيقات.', '— this in-app browser does not allow installing apps.'],
        ['اضغط زر القائمة', 'اضغط زر القائمة', 'Tap the menu button'],
        ['في أعلى الشاشة أو أسفلها.', 'في أعلى الشاشة أو أسفلها.', 'at the top or bottom of the screen.'],
        ['اختر', 'اختر', 'Choose'],
        ['بعد فتح الرابط في المتصفح اضغط', 'بعد فتح الرابط في المتصفح اضغط', 'After opening the link in the browser, tap'],
        ['مرة أخرى.', 'مرة أخرى', 'again.'],
        ['افتح الرابط في متصفح', 'افتح الرابط في متصفح', 'Open the link in'],
        ['(وليس داخل تطبيق آخر).', '(وليس داخل تطبيق آخر).', '(not inside another app).'],
        ['اضغط زر المشاركة', 'اضغط زر المشاركة', 'Tap the share button'],
        ['في شريط Safari.', 'في شريط Safari.', 'in the Safari toolbar.'],
        ['إضافة إلى الشاشة الرئيسية', 'إضافة إلى الشاشة الرئيسية', 'Add to Home Screen'],
        ['وسيظهر التطبيق كأيقونة على جهازك.', 'وسيظهر التطبيق كأيقونة على جهازك.', 'and the app will appear as an icon on your device.'],
        ['اضغط قائمة', 'اضغط قائمة', 'Tap the menu'],
        ['أعلى يمين المتصفح.', 'أعلى يمين المتصفح.', 'at the top right of the browser.'],
        ['أو', 'أو', 'or'],
        ['أكّد الضغط على', 'أكّد الضغط على', 'Confirm by tapping'],
        ['اضغط أيقونة', 'اضغط أيقونة', 'Click the'],
        ['في شريط العنوان.', 'في شريط العنوان.', 'in the address bar.'],
        ['على الكمبيوتر.', 'على الكمبيوتر.', 'on your computer.'],
        ['أو من القائمة', 'أو من القائمة', 'Or from the menu'],
        ['— Install app.', '— Install app.', '— Install app.'],
        ['ليعمل التطبيق في نافذة مستقلة.', 'ليعمل التطبيق في نافذة مستقلة.', 'so the app runs in a standalone window.'],
        ['إضافة', 'إضافة', 'Add'],
        ['تثبيت', 'تثبيت', 'Install'],
        ['التثبيت', 'التثبيت', 'Install'],
        ['أكّد', 'أكّد', 'Confirm']
    ];

    /* ---------- قواعد للرسائل الرقمية المتغيرة ---------- */
    var RULES_AR = [
        { re: /^(\d[\d,.]*)\s*(layer|layers)$/i, rep: '$1 طبقة' },
        { re: /^(\d[\d,.]*)\s*(feature|features)$/i, rep: '$1 عنصر' },
        { re: /^(\d[\d,.]*)\s*(point|points)$/i, rep: '$1 نقطة' },
        { re: /^(\d[\d,.]*)\s*(line|lines)$/i, rep: '$1 خط' },
        { re: /^(\d[\d,.]*)\s*(polygon|polygons)$/i, rep: '$1 مضلع' },
        { re: /^Vector:\s*(.+)$/i, rep: 'متجهة: $1' },
        { re: /^Checked:\s*(.+)$/i, rep: 'فحص: $1' },
        { re: /^FA fallback:\s*(.+)$/i, rep: 'احتياط FA: $1' },
        { re: /^([\d.,]+)\s*m$/i, rep: '$1 م' },
        { re: /^([\d.,]+)\s*m²$/i, rep: '$1 م²' },
        { re: /^([\d.,]+)\s*km$/i, rep: '$1 كم' },
        { re: /^([\d.,]+)\s*km²$/i, rep: '$1 كم²' },
        { re: /^([\d.,]+)\s*ft$/i, rep: '$1 قدم' },
        { re: /^([\d.,]+)\s*ft²$/i, rep: '$1 قدم²' },
        { re: /^([\d.,]+)\s*(acres?|ac)$/i, rep: '$1 فدان' },
        { re: /^([\d.,]+)\s*(mi|miles?)$/i, rep: '$1 ميل' },
        { re: /^([\d.,]+)\s*px$/i, rep: '$1 بكسل' },
        { re: /^(\d+)\s*×\s*(\d+)\s*px$/i, rep: '$1×$2 بكسل' },
        { re: /^\((\d[\d,.]*)\s*elements?\)$/i, rep: '($1 عنصر)' },
        { re: /^Desktop\s*•\s*(.+)$/i, rep: 'سطح المكتب • $1' },
        { re: /^Geo Platform\s*•\s*in-app browser$/i, rep: 'منصة جغرافية • متصفح داخلي' },
        { re: /^(\d+)\s+\(max — highest resolution\)$/i, rep: '$1  (الأقصى — الأعلى دقة)' },
        { re: /^Style applied:\s*(.+)$/i, rep: 'تم تطبيق النمط: $1' },
        { re: /^Features ready for export:\s*(.+)$/i, rep: 'عدد المعالم الجاهزة للتصدير: $1' },
        { re: /^Module opened:\s*(.+)$/i, rep: 'تم فتح الوحدة: $1' },
        { re: /^Buffer created \((.+)\)$/i, rep: 'تم إنشاء النطاق ($1)' },
        { re: /^Found\s+(.+)$/i, rep: 'تم العثور على $1' },
        { re: /^(.+)\s+matching feature\(s\)$/i, rep: 'معالم مطابقة: $1' },
        { re: /^Exported\s+(.+)$/i, rep: 'تم التصدير: $1' }
    ];
    var RULES_EN = [
        { re: /^(\d[\d,.]*)\s*طبقة$/, rep: '$1 layers' },
        { re: /^(\d[\d,.]*)\s*عنصر$/, rep: '$1 features' },
        { re: /^(\d[\d,.]*)\s*نقطة$/, rep: '$1 points' },
        { re: /^(\d[\d,.]*)\s*خط$/, rep: '$1 lines' },
        { re: /^(\d[\d,.]*)\s*مضلع$/, rep: '$1 polygons' },
        { re: /^متجهة:\s*(.+)$/, rep: 'Vector: $1' },
        { re: /^فحص:\s*(.+)$/, rep: 'Checked: $1' },
        { re: /^احتياط FA:\s*(.+)$/, rep: 'FA fallback: $1' },
        { re: /^([\d.,]+)\s*م$/, rep: '$1 m' },
        { re: /^([\d.,]+)\s*م²$/, rep: '$1 m²' },
        { re: /^([\d.,]+)\s*كم$/, rep: '$1 km' },
        { re: /^([\d.,]+)\s*كم²$/, rep: '$1 km²' },
        { re: /^([\d.,]+)\s*قدم$/, rep: '$1 ft' },
        { re: /^([\d.,]+)\s*قدم²$/, rep: '$1 ft²' },
        { re: /^([\d.,]+)\s*فدان$/, rep: '$1 acres' },
        { re: /^([\d.,]+)\s*ميل$/, rep: '$1 mi' },
        { re: /^([\d.,]+)\s*بكسل$/, rep: '$1 px' },
        { re: /^(\d+)\s*×\s*(\d+)\s*بكسل$/, rep: '$1×$2 px' },
        { re: /^\((\d[\d,.]*)\s*عنصر\)$/, rep: '($1 features)' },
        { re: /^سطح المكتب\s*•\s*(.+)$/, rep: 'Desktop • $1' },
        { re: /^منصة جغرافية\s*•\s*متصفح داخلي$/, rep: 'Geo Platform • in-app browser' },
        { re: /^(\d+)\s+\(الأقصى — الأعلى دقة\)$/, rep: '$1  (max — highest resolution)' },
        { re: /^تم تطبيق النمط:\s*(.+)$/, rep: 'Style applied: $1' },
        { re: /^عدد المعالم الجاهزة للتصدير:\s*(.+)$/, rep: 'Features ready for export: $1' },
        { re: /^المعالم الجاهزة للتصدير:\s*(.+)$/, rep: 'Features ready for export: $1' },
        { re: /^تم فتح الوحدة:\s*(.+)$/, rep: 'Module opened: $1' },
        { re: /^تم إنشاء النطاق \((.+)\)$/, rep: 'Buffer created ($1)' },
        { re: /^تم العثور على\s+(.+)$/, rep: 'Found $1' },
        { re: /^معالم مطابقة:\s*(.+)$/, rep: '$1 matching feature(s)' },
        { re: /^تم التصدير:\s*(.+)$/, rep: 'Exported $1' }
    ];

    /* ---------- بناء الخرائط ---------- */
    var toAR = Object.create(null);
    var toEN = Object.create(null);

    function addPair(src, ar, en) {
        if (!src) { return; }
        if (ar) { toAR[src] = ar; }
        if (en) { toEN[src] = en; }
    }
    PAIRS.forEach(function (p) {
        var ar = p[0], en = p[1];
        if (!ar || !en) { return; }
        if (ar !== en) {
            toAR[en] = ar;
            toEN[ar] = en;
        }
    });
    MIXED.forEach(function (m) {
        var src = m[0], ar = m[1], en = m[2];
        addPair(src, ar, en);
        addPair(ar, ar, en);
        addPair(en, ar, en);
    });

    function translateCore(core, lang) {
        var map = lang === AR ? toAR : toEN;
        if (core in map) { return map[core]; }
        var rules = lang === AR ? RULES_AR : RULES_EN;
        for (var i = 0; i < rules.length; i++) {
            if (rules[i].re.test(core)) {
                return core.replace(rules[i].re, rules[i].rep);
            }
        }
        return null;
    }

    function translateString(raw, lang) {
        if (raw == null) { return raw; }
        var text = String(raw);
        if (!text) { return text; }
        var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
        if (!m) { return text; }
        var core = m[2];
        if (!core) { return text; }
        var norm = core.replace(/\s+/g, ' ');
        var out = translateCore(norm, lang);
        if (out == null) { return text; }
        return m[1] + out + m[3];
    }

    /* ---------- عناصر/سمات مستثناة ---------- */
    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
    var ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'data-cc-tip'];

    function isSkippedElement(el) {
        if (!el || el.nodeType !== 1) { return false; }
        if (SKIP_TAGS[el.tagName]) { return true; }
        if (el.id === 'map') { return true; }
        if (el.getAttribute && el.getAttribute('data-no-lang') === '1') { return true; }
        if (el.getAttribute && el.getAttribute('translate') === 'no') { return true; }
        return false;
    }
    function ancestorSkipped(node) {
        var p = node && node.parentNode;
        while (p && p !== document.body) {
            if (isSkippedElement(p)) { return true; }
            p = p.parentNode;
        }
        return false;
    }

    function translateTextNode(node) {
        if (!node || node.nodeType !== 3) { return; }
        var val = node.nodeValue;
        if (!val || !val.replace(/\s+/g, '')) { return; }
        if (node.__gisLangBusy) { return; }
        if (ancestorSkipped(node)) { return; }
        var out = translateString(val, current);
        if (out !== val) {
            node.__gisLangBusy = true;
            node.nodeValue = out;
            node.__gisLangBusy = false;
        }
    }

    function translateAttrs(el) {
        if (!el || el.nodeType !== 1 || !el.getAttribute) { return; }
        for (var i = 0; i < ATTRS.length; i++) {
            var name = ATTRS[i];
            var val = el.getAttribute(name);
            if (!val) { continue; }
            var out = translateString(val, current);
            if (out !== val) { el.setAttribute(name, out); }
        }
    }

    function walk(el, skipped) {
        if (!el) { return; }
        if (el.nodeType === 3) { translateTextNode(el); return; }
        if (el.nodeType !== 1) { return; }
        var skip = skipped || isSkippedElement(el);
        if (!skip) { translateAttrs(el); }
        for (var c = el.firstChild; c; c = c.nextSibling) {
            if (c.nodeType === 3) { if (!skip) { translateTextNode(c); } }
            else if (c.nodeType === 1) { walk(c, skip); }
        }
    }

    function translateBody() {
        if (!document.body) { return; }
        walk(document.body, false);
        if (document.title) { document.title = translateString(document.title, current); }
    }

    /* ---------- مراقبة DOM ---------- */
    var observer = null;
    var queue = [];
    var scheduled = false;

    function flush() {
        scheduled = false;
        var items = queue;
        queue = [];
        for (var i = 0; i < items.length; i++) {
            var n = items[i];
            if (!n || !n.parentNode) { continue; }
            if (n.nodeType === 3) { translateTextNode(n); }
            else if (n.nodeType === 1) { walk(n, ancestorSkipped(n)); }
        }
    }
    function schedule() {
        if (scheduled) { return; }
        scheduled = true;
        setTimeout(flush, 24);
    }

    function startObserver() {
        if (observer || !document.body || typeof MutationObserver === 'undefined') { return; }
        observer = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];
                if (m.type === 'childList') {
                    for (var j = 0; j < m.addedNodes.length; j++) { queue.push(m.addedNodes[j]); }
                } else if (m.type === 'characterData') {
                    queue.push(m.target);
                } else if (m.type === 'attributes' && m.target) {
                    queue.push(m.target);
                }
            }
            if (queue.length) { schedule(); }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRS
        });
    }

    /* ---------- الاتجاه واللغة ---------- */
    function paintDirection(lang) {
        var html = document.documentElement;
        html.setAttribute('lang', lang === AR ? 'ar' : 'en');
        html.setAttribute('dir', lang === AR ? 'rtl' : 'ltr');
        if (document.body) {
            document.body.classList.toggle('lang-ar', lang === AR);
            document.body.classList.toggle('lang-en', lang === EN);
        }
    }

    function apply(lang) {
        current = (lang === EN) ? EN : AR;
        paintDirection(current);
        if (document.body) { translateBody(); }
        /* مزامنة قائمة اختيار اللغة في الإعدادات */
        try {
            var sel = document.getElementById('setLang');
            if (sel) { sel.value = current; }
        } catch (_) {}
        try {
            window.dispatchEvent(new CustomEvent('gis:lang', { detail: { lang: current } }));
        } catch (_) {
            try { document.dispatchEvent(new Event('gis:lang')); } catch (__) {}
        }
        if (window.GIS && typeof window.GIS.emit === 'function') {
            try { window.GIS.emit('lang', { lang: current }); } catch (_) {}
        }
    }

    function save(lang) {
        try { localStorage.setItem(KEY, lang); } catch (_) {}
    }
    function read() {
        try {
            var v = localStorage.getItem(KEY);
            if (v === AR || v === EN) { return v; }
        } catch (_) {}
        return AR;
    }

    /* ---------- تعريب رسائل المتصفح ---------- */
    function patchDialogs() {
        if (window.__gisLangDialogs) { return; }
        window.__gisLangDialogs = true;
        var nativeConfirm = window.confirm;
        var nativeAlert = window.alert;
        var nativePrompt = window.prompt;
        window.confirm = function (msg) {
            return nativeConfirm.call(window, translateString(String(msg == null ? '' : msg), current));
        };
        window.alert = function (msg) {
            return nativeAlert.call(window, translateString(String(msg == null ? '' : msg), current));
        };
        window.prompt = function (msg, def) {
            return nativePrompt.call(window, translateString(String(msg == null ? '' : msg), current), def);
        };
    }

    /* ---------- CSS للاتجاه الإنجليزي ---------- */
    function injectStyles() {
        if (document.getElementById('gis-lang-style')) { return; }
        var css = [
            'html[dir="ltr"] .geo-suggest-item,',
            'html[dir="ltr"] .geo-suggest-empty,',
            'html[dir="ltr"] .advtoc-menu button,',
            'html[dir="ltr"] .data-table-wrap th,',
            'html[dir="ltr"] #loginScreen label,',
            'html[dir="ltr"] .tab-header h4,',
            'html[dir="ltr"] .gis-mod-card { text-align:left; }',
            'html[dir="ltr"] .fp { direction:ltr; text-align:left; }',
            'html[dir="ltr"] .advtoc-head-actions,',
            'html[dir="ltr"] .advtoc-group-head .g-count,',
            'html[dir="ltr"] .advtoc-group-head .g-actions,',
            'html[dir="ltr"] .side-head .sh-actions { margin-right:0; margin-left:auto; }',
            'html[dir="rtl"] .gis-mod-card { text-align:right; }'
        ].join('');
        var s = document.createElement('style');
        s.id = 'gis-lang-style';
        s.textContent = css;
        document.head.appendChild(s);
    }

    /* ---------- الواجهة العامة ---------- */
    window.GisLang = {
        KEY: KEY,
        get: function () { return current; },
        set: function (lang) {
            apply(lang);
            save(current);
            return current;
        },
        apply: apply,
        t: function (ar, en) { return current === AR ? ar : en; },
        translate: function (text) { return translateString(text, current); },
        onChange: function (fn) {
            if (typeof fn !== 'function') { return; }
            window.addEventListener('gis:lang', function (e) { fn(e && e.detail ? e.detail.lang : current); });
        },
        refresh: function () { translateBody(); }
    };

    /* ---------- التهيئة ---------- */
    current = read();
    paintDirection(current);
    patchDialogs();

    function boot() {
        injectStyles();
        translateBody();
        startObserver();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
