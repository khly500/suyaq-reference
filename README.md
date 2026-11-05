# سِياق AI | Suyaq AI

**البنية التحتية المعيارية لتطوير الذكاء الاصطناعي في العالم العربي**
*Modular infrastructure for Arabic AI development.*

Live: https://suyaq-ai.k-a-shamardal.workers.dev · Repo: https://github.com/khly500/suyaq-ai

---

## العربية

### المعمارية
واجهة أمامية بملف واحد (`App.tsx`) على React وTypeScript وTailwind CSS، تعمل بالكامل في المتصفح وتُنشر على Cloudflare Workers مع نشر تلقائي عند كل push إلى GitHub. الواجهة RTL أصلاً، وتحقن JSON-LD من نوع `SoftwareApplication`.

| الركيزة | ما تفعله |
|---|---|
| أنابيب RAG | تقطيع عند حدود الجمل، وتضمين محلي (جذوع + n-grams حرفية موزونة + ثنائيات كلمات، 512 بُعداً) وتشابه جيب التمام. تضمين سحابي اختياري عبر Workers AI. |
| معايير التقييم | لوحة تفاعلية بالفرز والتصفية، واستيراد نتائجك بصيغة JSON. |
| البيانات المنظمة | تحويل نص حر إلى JSON-LD (Schema.org) مع نسخ فوري. |
| قوالب الأوامر | System Prompts وFew-Shot قابلة للنسخ والتجربة على مدخلك. |

### حدود صريحة
- **التضمين المحلي معجمي مجزَّأ (hashed lexical)** يتحمل اختلاف صيغ الكلمة، لكنه لا يفهم المرادفات كما يفعل نموذج تضمين مدرَّب. استخدم التضمين السحابي لذلك.
- **أرقام لوحة التقييم الافتراضية عيّنة توضيحية.** استورد نتائج حقيقية منشورة بصيغة JSON، واذكر مصدرها ومنهجيتها. ملاحظة: AraBench معيار لترجمة اللهجات ويُقاس بـ BLEU، وليس معيار دقة للنماذج اللغوية.

### التشغيل
```bash
git clone https://github.com/khly500/suyaq-ai && cd suyaq-ai
npm install          # react, react-dom, lucide-react, tailwindcss, typescript, vite
npm run dev          # تطوير محلي
npm run build        # بناء الإنتاج
npx wrangler deploy  # نشر على Cloudflare
```
أضف في `tailwind.config`: `content: ["./index.html", "./src/**/*.{ts,tsx}"]`.

### التضمين السحابي (اختياري)
المتصفح لا يستطيع استدعاء واجهة Cloudflare الرسمية مباشرة بسبب CORS، ووضع مفتاح الحساب في الواجهة غير آمن. أنشئ Worker وسيطاً:

```ts
export default {
  async fetch(req: Request, env: { AI: Ai }) {
    const cors = { "Access-Control-Allow-Origin": "https://suyaq-ai.k-a-shamardal.workers.dev", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const { text } = (await req.json()) as { text: string[] };
    const result = await env.AI.run("@cf/baai/bge-m3", { text });
    return Response.json({ result }, { headers: cors });
  },
};
```
(فعّل ربط `ai` في `wrangler.toml`) ثم ضع رابطه في خانة التضمين السحابي داخل الواجهة.

### الترخيص
MIT. انظر ملف `LICENSE`.

---

## English

### Architecture
A single-file frontend (`App.tsx`) in React, TypeScript and Tailwind CSS. It runs entirely in the browser and deploys to Cloudflare Workers, auto-deployed on every push to GitHub. Native RTL, with `SoftwareApplication` JSON-LD injected.

| Pillar | What it does |
|---|---|
| RAG pipelines | Sentence-boundary chunking, local embeddings (stems + weighted character n-grams + word bigrams, 512 dims) with cosine similarity. Optional cloud embeddings via Workers AI. |
| Benchmarks | Interactive dashboard with sorting, filtering, and JSON import of your own results. |
| Structured data | Free text to Schema.org JSON-LD with one-click copy. |
| Prompt templates | Copyable system prompts and few-shot templates you can try on your own input. |

### Honest limits
- **Local embeddings are hashed lexical vectors.** They tolerate Arabic morphological variation but do not capture synonymy like a trained model; use cloud embeddings for that.
- **The default benchmark numbers are illustrative samples.** Import real published results as JSON and cite their source and methodology. Note that AraBench is a dialect machine-translation benchmark scored in BLEU, not an LLM accuracy benchmark.

### Run
```bash
git clone https://github.com/khly500/suyaq-ai && cd suyaq-ai
npm install
npm run dev
npm run build
npx wrangler deploy
```
Set Tailwind `content` to `["./index.html", "./src/**/*.{ts,tsx}"]`.

### Cloud embeddings (optional)
Browsers cannot call Cloudflare's REST API directly (CORS), and shipping an account token in the client is unsafe. Deploy the proxy Worker shown above (bind `ai` in `wrangler.toml`) and paste its URL into the cloud-embedding field.

### License
MIT. See `LICENSE`.

```text
MIT License

Copyright (c) 2026 Suyaq AI contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
