# ZYNEX | Digital Solutions

موقع ZYNEX الرسمي ولوحة الإدارة وموظف NEX الذكي. المشروع مبني على Cloudflare Workers + D1 + Groq API، والواجهة عربية RTL ومتجاوبة مع الهاتف.

## هيكل المشروع

```text
ZYNEX/
├── public/
│   ├── index.html
│   ├── about.html
│   ├── services.html
│   ├── projects.html
│   ├── blog.html
│   ├── contact.html
│   ├── admin/dashboard.html
│   ├── css/style.css
│   └── js/{config.js,main.js,nex.js,admin.js}
├── src/
│   ├── worker.js
│   └── modules/{database.js,ai.js,orders.js,authentication.js,admin.js}
├── database/schema.sql
├── wrangler.toml
└── README.md
```

## قبل النشر

1. أنشئ قاعدة D1 باسم `zynex-db` في Cloudflare.
2. افتح `wrangler.toml` واستبدل `REPLACE_WITH_YOUR_D1_DATABASE_ID` بمعرّف قاعدة البيانات الحقيقي.
3. نفّذ محتوى `database/schema.sql` مرة واحدة على قاعدة D1 الجديدة من قسم SQL Console.
4. أضف الأسرار من Cloudflare Worker > Settings > Variables and Secrets:
   - `ADMIN_PASSWORD`: كلمة مرور قوية وفريدة للوحة الإدارة.
   - `GROQ_API_KEY`: مفتاح Groq API.
5. انشر المشروع من مستودع GitHub المتصل بـ Cloudflare Workers أو عبر Wrangler.

**لا تضع مفاتيح Groq أو كلمة مرور الإدارة داخل ملفات JavaScript أو GitHub.**

## تنبيه قاعدة البيانات الموجودة مسبقاً

ملف `schema.sql` يهيئ قاعدة جديدة. إذا كانت قاعدة `zynex-db` القديمة تحتوي على بيانات فعلية، فلا تعِد تشغيل المخطط كاملاً عليها ولا تحذف القاعدة.

قبل استخدام إصدار المشروع مع قاعدة قديمة، افحص الأعمدة:
```sql
PRAGMA table_info(orders);
```
إذا لم يظهر `reference_code`، أضف العمود والفهرس. إذا كان جدول الطلبات يحتوي طلبات قديمة، املأ الرموز القديمة أولاً ثم أنشئ الفهرس:
```sql
ALTER TABLE orders ADD COLUMN reference_code TEXT;
UPDATE orders
SET reference_code = 'ZYN-OLD-' || id || '-' || upper(hex(randomblob(4)))
WHERE reference_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference_code);
```
نفّذ كل أمر مرة واحدة فقط، ولا تنفذ `ALTER TABLE` إذا كان العمود موجوداً بالفعل. قد تحتاج قواعد قديمة ذات أسماء أعمدة مختلفة إلى مواءمة إضافية قبل تشغيل هذا الإصدار.

## المسارات الأساسية

- `GET /api/health` فحص النظام وقاعدة البيانات.
- `POST /api/nex/chat` محادثة NEX.
- `POST /api/orders` إنشاء طلب وإصدار رمز مرجعي.
- `POST /api/orders/update` تعديل طلب بعد التحقق من الرمز والاسم ورقم واتساب.
- `POST /api/orders/cancel` إلغاء طلب بعد التحقق.
- `POST /api/admin/login` تسجيل دخول الإدارة.
- بقية `/api/admin/*` تتطلب جلسة إدارة صالحة.

## رمز الطلب والتحقق

عند إنشاء الطلب يظهر للعميل رمز مثل `ZYN-2026-XXXXXXXXXX`. يلزم الرمز مع الاسم ورقم واتساب المطابقين للتحقق من الطلب. الرمز وحده لا يثبت الملكية. لا تشارك الرمز أو بيانات العميل مع أي شخص.

## لوحة الإدارة

الرابط بعد النشر:
`https://YOUR-DOMAIN/admin/dashboard.html`

تتضمن لوحة الإدارة:
- إحصائيات الطلبات والعملاء والمحادثات والخدمات.
- متابعة الطلبات وتغيير حالتها.
- إدارة الخدمات والأسعار.
- إدارة معرفة NEX.
- إنشاء مهارات NEX وتعديلها وحذفها.
- إدارة إعدادات الشركة وسلوك NEX.
- سجل النشاط.

## حدود الإصدار الحالي

- الطلبات تُحفظ في D1 ويُعرض الرمز المرجعي للعميل.
- نموذج تعديل/إلغاء الطلب متاح من واجهة API؛ يمكن للعميل استخدامه من واجهة NEX في مرحلة واجهة الطلبات التالية، أو عبر دمج نموذج مخصص.
- واجهة إدارة المشاريع والمدونة ليست متصلة بعد بعمليات تحرير كاملة؛ صفحات العرض الحالية تحتوي نماذج محتوى أولية.
- رفع ملفات PDF/Word والصور إلى مكتبة معرفة NEX يحتاج إضافة تخزين ملفات (مثل R2) ومعالجة استخراج المحتوى في مرحلة لاحقة.
- حد الطلبات في هذا الإصدار حماية أولية best-effort عبر D1، وليس بديلاً عن Cloudflare Rate Limiting/WAF عند الإطلاق التجاري.
- لا يوجد تكامل دفع إلكتروني أو ربط واتساب API في هذا الإصدار.

## ملاحظات تجارية

الأسعار الابتدائية المعروضة: Landing Page = 50 USD شهرياً، Website = 100 USD شهرياً، واسم النطاق منفصل. راجع سياسة الاشتراك والعقد قبل النشر العام، ولا تضف شروطاً غير معتمدة.
