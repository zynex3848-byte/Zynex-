# ZYNEX + NEX — مشروع Worker واحد وملفات مسطحة

## ترتيب الملفات
جميع الملفات المطلوبة موجودة مباشرة في المجلد الرئيسي، دون مجلد public أو أي مجلد فرعي:
- index.html
- index.css
- index.js
- worker.js
- wrangler.toml
- nex-knowledge.txt

## النشر
1. استبدل ملفات المستودع القديم بهذه الملفات الستة، واجعلها في جذر المستودع مباشرة.
2. تأكد أن إعداد Cloudflare Worker متصل بهذا المستودع وأن ملف الإعداد هو wrangler.toml.
3. احتفظ بالسر الموجود في Cloudflare باسم GROQ_API_KEY. لا تضع قيمة السر داخل GitHub.
4. أعد النشر.
5. افتح رابط workers.dev نفسه؛ يجب أن تظهر صفحة ZYNEX من index.html.

## ملاحظات
- واجهة الموقع وواجهة NEX تعملان من نفس Worker والرابط.
- يستدعي index.js واجهة المحادثة عبر المسار النسبي /api/nex/chat.
- ملفات worker.js وnex-knowledge.txt وwrangler.toml وREADME_AR.md محجوبة عن زوار الموقع.
- لا تحتاج إلى Cloudflare Pages.
