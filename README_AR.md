# ZYNEX Website + NEX

## ملفات المشروع
- `index.html` — الصفحة الرئيسية الكاملة، وهو الاسم الذي يبحث عنه Cloudflare Pages تلقائياً.
- `index.css` — تنسيق الموقع وواجهة NEX.
- `index.js` — تشغيل واجهة NEX والاتصال بالخلفية.
- `worker.js` — خلفية NEX الآمنة التي تتصل بـ Groq.
- `nex-knowledge.txt` — قاعدة المعرفة الوحيدة التي يعتمد عليها NEX.
- `wrangler.toml` — إعداد نشر Worker وتضمين ملف TXT.

## نشر الموقع على Cloudflare Pages
ارفع الملفات `index.html` و`index.css` و`index.js` إلى المشروع/المجلد الرئيسي في Pages. يجب أن يكون اسم الصفحة `index.html` بحروف صغيرة تماماً. لا ترفع `worker.js` باعتباره صفحة الموقع؛ فهو خدمة خلفية مستقلة.

## ربط NEX
1. انشر Worker من الملفات `worker.js` و`nex-knowledge.txt` و`wrangler.toml` باستخدام إعدادات Cloudflare Worker/Wrangler.
2. في إعدادات Worker أضف Secret باسم `GROQ_API_KEY` وضع قيمة مفتاح Groq فيه. لا تضع المفتاح في ملفات الموقع.
3. في `wrangler.toml` غيّر `ALLOWED_ORIGIN` إلى عنوان موقع Pages الفعلي، مثل `https://example.pages.dev`، دون `/` في النهاية.
4. في `index.js` غيّر `API_URL` إلى رابط Worker الفعلي مع المسار `/api/nex/chat`.
5. احفظ التعديلات وأعد نشر الموقع والـ Worker.

## ملاحظات مهمة
- الصفحة الرئيسية تعمل كواجهة موقع حتى قبل ربط NEX، لكن المحادثة لن تحصل على إجابات AI قبل نشر Worker ووضع رابط API ومفتاح Groq.
- تأكد من أن اسم ملف TXT مطابق تماماً `nex-knowledge.txt` وأن قاعدة المعرفة تحتوي رابط خدمة العملاء الصحيح.
- الموديل مضبوط على `openai/gpt-oss-120b`؛ يجب أن يكون متاحاً في حساب Groq عند النشر.
- الدومين غير مشمول في أسعار الاشتراكات كما هو موضح في محتوى الصفحة.
