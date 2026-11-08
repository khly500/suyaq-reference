# مقياس سِياق العملي للمطوّر العربي

20 مهمة برمجية بالعربي (أرقام عربية، جوال/آيبان/هوية سعودية، ضريبة 15%، جمع عربي، تاريخ هجري، JWT…).
التصحيح **آلي بالاختبارات** فقط: لا يوجد نموذج يحكم على نموذج.

## المتطلبات
Node.js 18 أو أحدث.

## التشغيل
المفاتيح تُقرأ من متغيرات البيئة فقط ولا تُحفظ في أي ملف.

```bash
# تحقق من سلامة الاختبارات نفسها (بدون مفاتيح)
node bench/run.mjs --provider mock
```

على Windows (PowerShell):

```powershell
$env:OPENAI_API_KEY = "..."
node bench/run.mjs --provider openai --model <اسم النموذج> --repeat 3

$env:ANTHROPIC_API_KEY = "..."
node bench/run.mjs --provider anthropic --model <اسم النموذج> --repeat 3

$env:GEMINI_API_KEY = "..."
node bench/run.mjs --provider gemini --model <اسم النموذج> --repeat 3
```

على macOS/Linux: `OPENAI_API_KEY=... node bench/run.mjs --provider openai --model <اسم النموذج>`.

النتائج تُحفظ في `bench/results/*.json` (لا تحتوي أي مفتاح). لا تنشر مفاتيحك في أي مكان.

## تنبيهات
- الكود الذي تولّده النماذج يُنفَّذ داخل `vm` بمهلة زمنية، وهو ليس عزلاً كاملاً؛ شغّله في جهاز/مجلد لا تهتم بملفاته.
- المهام كتبها مساعد ذكاء اصطناعي ولم تُراجَع بشرياً بعد؛ المراجعة مرحّب بها عبر Issues.
- 20 مهمة عيّنة صغيرة: النتائج مؤشر وليست حكماً نهائياً.
