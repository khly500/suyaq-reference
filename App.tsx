import { useEffect, useMemo, useState } from "react";
import { Braces, Check, Copy, Database, FileJson, Gauge, Layers, Search, Sparkles, Terminal } from "lucide-react";

/* ───────── أدوات مشتركة ───────── */
const normalize = (s: string) =>
  s.replace(/[\u064B-\u065F\u0640]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ");

const stem = (w: string) => w.replace(/^(وال|بال|كال|فال|لل|ال|و|ب|ل)/, "");

function useCopy() {
  const [done, setDone] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* المتصفح قد يمنع الوصول للحافظة */ }
    setDone(id);
    setTimeout(() => setDone(null), 1600);
  };
  return { done, copy };
}

function CopyButton({ id, text, label = "نسخ" }: { id: string; text: string; label?: string }) {
  const { done, copy } = useCopy();
  return (
    <button onClick={() => copy(id, text)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
      {done === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      {done === id ? "تم النسخ" : label}
    </button>
  );
}

const panel = "rounded-2xl border border-white/[0.08] bg-[#121216]";

/* ───────── الركيزة 1: أنابيب RAG ───────── */
const SAMPLE_TEXT =
  "تعتمد المكتبات الرقمية في المنطقة العربية على فهرسة آلاف المخطوطات. يواجه البحث التقليدي صعوبة بسبب تعدد صيغ الكلمة الواحدة. يساعد التقطيع الدلالي على الحفاظ على المعنى داخل كل مقطع. يحوّل نموذج التضمين كل مقطع إلى متجه رقمي. عند السؤال يُقارَن متجه السؤال بمتجهات المقاطع لاسترجاع الأقرب معنىً. تُمرَّر المقاطع المسترجعة إلى النموذج اللغوي ليجيب بدقة ومع ذكر المصدر.";

function RagPipeline() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [size, setSize] = useState(120);
  const [query, setQuery] = useState("كيف يتم استرجاع المقاطع الأقرب للسؤال؟");

  const chunks = useMemo(() => {
    const sentences = text.split(/(?<=[.؟!۔\n])\s*/).filter((s) => s.trim());
    const out: string[] = [];
    let cur = "";
    for (const s of sentences) {
      if (cur && (cur + " " + s).length > size) { out.push(cur); cur = s; }
      else cur = cur ? cur + " " + s : s;
    }
    if (cur) out.push(cur);
    return out;
  }, [text, size]);

  const ranked = useMemo(() => {
    const q = new Set(normalize(query).split(/\s+/).filter((w) => w.length > 2).map(stem));
    return chunks
      .map((c, i) => {
        const words = normalize(c).split(/\s+/).filter(Boolean).map(stem);
        const hit = words.filter((w) => q.has(w)).length;
        return { i, c, score: q.size ? Math.min(1, hit / Math.max(2, q.size * 0.6)) : 0 };
      })
      .sort((a, b) => b.score - a.score);
  }, [chunks, query]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${panel} p-5`}>
        <h3 className="mb-1 font-semibold text-white">١. التقطيع الدلالي</h3>
        <p className="mb-3 text-sm text-zinc-400">يُقسَّم النص عند حدود الجمل، فلا ينقطع المعنى في منتصف الفكرة.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0C] p-3 text-sm leading-7 text-zinc-200 focus:border-emerald-400/60 focus:outline-none" aria-label="النص العربي" />
        <label className="mt-3 flex items-center gap-3 text-sm text-zinc-400">
          حجم المقطع
          <input type="range" min={60} max={300} value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1 accent-emerald-400" />
          <span className="w-16 text-left text-zinc-200" dir="ltr">{size} حرف</span>
        </label>
        <div className="mt-4 space-y-2">
          {chunks.map((c, i) => (
            <div key={i} className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04] p-3 text-sm leading-7 text-zinc-300">
              <span className="ml-2 rounded bg-emerald-400/15 px-1.5 py-0.5 text-xs text-emerald-300">مقطع {i + 1}</span>{c}
            </div>
          ))}
        </div>
      </div>
      <div className={`${panel} p-5`}>
        <h3 className="mb-1 font-semibold text-white">٢. البحث المتجهي</h3>
        <p className="mb-3 text-sm text-zinc-400">يُطبَّع النص أولاً (إزالة التشكيل، توحيد الألف والياء والتاء المربوطة، وتجريد البادئات) ثم تُرتَّب المقاطع حسب التطابق. المحاكاة هنا تعتمد على تطابق الجذوع لا على تضمينات حقيقية.</p>
        <div className="relative mb-4">
          <Search size={16} className="pointer-events-none absolute right-3 top-3.5 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0A0C] py-3 pr-10 pl-3 text-sm text-zinc-200 focus:border-emerald-400/60 focus:outline-none" aria-label="سؤال البحث" />
        </div>
        <div className="space-y-2">
          {ranked.map((r, k) => (
            <div key={r.i} className="rounded-lg border border-white/[0.08] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                <span>{k === 0 && r.score > 0 ? "الأقرب · " : ""}مقطع {r.i + 1}</span>
                <span dir="ltr" className="text-emerald-300">{r.score.toFixed(2)}</span>
              </div>
              <div className="mb-2 h-1.5 overflow-hidden rounded bg-white/5"><div className="h-full rounded bg-gradient-to-l from-emerald-400 to-violet-500 transition-all duration-300" style={{ width: `${r.score * 100}%` }} /></div>
              <p className="line-clamp-2 text-sm leading-6 text-zinc-400">{r.c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── الركيزة 2: معايير التقييم ───────── */
type Metric = "context" | "dialect" | "logic";
const METRICS: Record<Metric, { label: string; desc: string }> = {
  context: { label: "الفهم السياقي", desc: "الإجابة عن أسئلة مبنية على نص عربي طويل" },
  dialect: { label: "اللهجات", desc: "الخليجية والمصرية والشامية والمغاربية" },
  logic: { label: "الاستنتاج المنطقي", desc: "الاستدلال على مقدمات مكتوبة بالعربية" },
};
// بيانات توضيحية لعرض الواجهة؛ استبدلها بنتائج تقييمك الفعلي.
const MODELS = [
  { name: "نموذج أ", context: 86, dialect: 71, logic: 82, color: "from-emerald-400 to-emerald-600" },
  { name: "نموذج ب", context: 81, dialect: 78, logic: 74, color: "from-violet-400 to-violet-600" },
  { name: "نموذج ج", context: 74, dialect: 64, logic: 69, color: "from-sky-400 to-sky-600" },
  { name: "نموذج د", context: 68, dialect: 59, logic: 63, color: "from-zinc-400 to-zinc-600" },
];

function Benchmarks() {
  const [m, setM] = useState<Metric>("context");
  const sorted = [...MODELS].sort((a, b) => b[m] - a[m]);
  return (
    <div className={`${panel} p-5`}>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {(Object.keys(METRICS) as Metric[]).map((k) => (
          <button key={k} role="tab" aria-selected={m === k} onClick={() => setM(k)} className={`rounded-lg px-4 py-2 text-sm transition ${m === k ? "bg-white text-black" : "border border-white/10 text-zinc-300 hover:bg-white/5"}`}>{METRICS[k].label}</button>
        ))}
      </div>
      <p className="mb-5 text-sm text-zinc-400">{METRICS[m].desc}</p>
      <div className="space-y-4">
        {sorted.map((x, i) => (
          <div key={x.name} className="flex items-center gap-4">
            <span className="w-20 text-sm text-zinc-300">{x.name}</span>
            <div className="h-8 flex-1 overflow-hidden rounded-lg bg-white/5">
              <div className={`flex h-full items-center rounded-lg bg-gradient-to-l ${x.color} px-3 text-sm font-semibold text-black transition-all duration-500`} style={{ width: `${x[m]}%` }}>{i === 0 ? "الأعلى" : ""}</div>
            </div>
            <span className="w-10 text-left text-sm text-zinc-200" dir="ltr">{x[m]}%</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-zinc-500">الأرقام أعلاه بيانات توضيحية لعرض الواجهة، وليست نتائج تقييم حقيقية.</p>
    </div>
  );
}

/* ───────── الركيزة 3: البيانات المنظمة ───────── */
const SAMPLES = [
  {
    id: "event", label: "فعالية",
    raw: "ينظّم مركز الملك عبدالعزيز الثقافي (إثراء) معرض «حروف وآلات» في الظهران من 1 نوفمبر 2026، والدخول مجاني.",
    json: { "@context": "https://schema.org", "@type": "Event", name: "حروف وآلات", inLanguage: "ar", startDate: "2026-11-01", location: { "@type": "Place", name: "إثراء", address: { "@type": "PostalAddress", addressLocality: "الظهران", addressCountry: "SA" } }, isAccessibleForFree: true },
  },
  {
    id: "article", label: "مقال",
    raw: "كتب خالد الشمري مقالاً بعنوان «لماذا يحتاج الذكاء الاصطناعي إلى بيانات عربية نظيفة؟» ونُشر في 12 أكتوبر 2026.",
    json: { "@context": "https://schema.org", "@type": "Article", headline: "لماذا يحتاج الذكاء الاصطناعي إلى بيانات عربية نظيفة؟", inLanguage: "ar", author: { "@type": "Person", name: "خالد الشمري" }, datePublished: "2026-10-12" },
  },
  {
    id: "product", label: "منتج",
    raw: "ساعة ذكية «نبض» بسعر 899 ريال سعودي، متوفرة في المخزون مع ضمان سنتين.",
    json: { "@context": "https://schema.org", "@type": "Product", name: "ساعة نبض الذكية", offers: { "@type": "Offer", price: 899, priceCurrency: "SAR", availability: "https://schema.org/InStock" }, warranty: { "@type": "WarrantyPromise", durationOfWarranty: { "@type": "QuantitativeValue", value: 2, unitCode: "ANN" } } },
  },
];

function StructuredData() {
  const [id, setId] = useState(SAMPLES[0].id);
  const s = SAMPLES.find((x) => x.id === id)!;
  const out = JSON.stringify(s.json, null, 2);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${panel} p-5`}>
        <div className="mb-4 flex gap-2">
          {SAMPLES.map((x) => (
            <button key={x.id} onClick={() => setId(x.id)} className={`rounded-lg px-3 py-1.5 text-sm ${id === x.id ? "bg-white text-black" : "border border-white/10 text-zinc-300 hover:bg-white/5"}`}>{x.label}</button>
          ))}
        </div>
        <p className="mb-2 text-xs text-zinc-500">نص غير مهيكل</p>
        <p className="rounded-xl border border-white/10 bg-[#0A0A0C] p-4 text-sm leading-8 text-zinc-200">{s.raw}</p>
      </div>
      <div className={`${panel} p-5`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">JSON-LD جاهز للحقن</span>
          <CopyButton id={`jsonld-${id}`} text={out} />
        </div>
        <pre dir="ltr" className="overflow-x-auto rounded-xl border border-white/10 bg-[#0A0A0C] p-4 text-left text-xs leading-6 text-emerald-200">{out}</pre>
      </div>
    </div>
  );
}

/* ───────── الركيزة 4: قوالب الأوامر ───────── */
const TEMPLATES = [
  { id: "sys", title: "مساعد معرفي بمصادر", kind: "System Prompt", body: "أنت مساعد متخصص يجيب بالعربية الفصحى المبسطة.\nاعتمد فقط على السياق المرفق، وإن لم تجد الجواب فيه فقل ذلك صراحة.\nاذكر رقم المقطع الذي استندت إليه بعد كل معلومة.\n\nالسياق:\n{{input}}" },
  { id: "few", title: "تصنيف المشاعر مع لهجات", kind: "Few-Shot", body: "صنّف النص إلى: إيجابي، سلبي، محايد.\n\nالنص: الخدمة كانت واجد حلوة\nالتصنيف: إيجابي\n\nالنص: ما عجبني التوصيل أبداً\nالتصنيف: سلبي\n\nالنص: وصل الطلب يوم الأحد\nالتصنيف: محايد\n\nالنص: {{input}}\nالتصنيف:" },
  { id: "json", title: "استخراج كيانات إلى JSON", kind: "Structured Output", body: "استخرج الأشخاص والمنظمات والأماكن والتواريخ من النص.\nأعد JSON صالحاً فقط، دون شرح، بالمفاتيح: persons, orgs, places, dates.\n\nالنص:\n{{input}}" },
  { id: "cot", title: "استدلال منطقي خطوة بخطوة", kind: "Reasoning", body: "حلّل المسألة التالية على خطوات مرقمة، وتحقق من كل خطوة قبل الانتقال للتالية.\nاختم بسطر يبدأ بـ «الخلاصة:».\n\nالمسألة:\n{{input}}" },
];

function PromptLibrary() {
  const [id, setId] = useState(TEMPLATES[0].id);
  const [input, setInput] = useState("");
  const t = TEMPLATES.find((x) => x.id === id)!;
  const filled = t.body.replace("{{input}}", input || "{{input}}");
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="space-y-2">
        {TEMPLATES.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={`w-full rounded-xl border p-3 text-right transition ${id === x.id ? "border-emerald-400/50 bg-emerald-400/[0.06]" : "border-white/[0.08] bg-[#121216] hover:bg-white/5"}`}>
            <div className="text-sm font-medium text-white">{x.title}</div>
            <div className="mt-1 text-xs text-zinc-500" dir="ltr">{x.kind}</div>
          </button>
        ))}
      </div>
      <div className={`${panel} p-5`}>
        <label className="mb-2 block text-sm text-zinc-400">جرّب القالب بمدخلك</label>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب النص الذي يحل محل {{input}}" className="mb-4 w-full rounded-xl border border-white/10 bg-[#0A0A0C] p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-400/60 focus:outline-none" />
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">المعاينة</span>
          <CopyButton id={`tpl-${id}`} text={filled} label="نسخ القالب" />
        </div>
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0A0A0C] p-4 text-sm leading-7 text-zinc-200">{filled}</pre>
      </div>
    </div>
  );
}

/* ───────── الصفحة الرئيسية ───────── */
const PILLARS = [
  { id: "rag", label: "أنابيب RAG", icon: Layers, desc: "قطّع نصاً عربياً وابحث فيه كما يفعل خط الاسترجاع الحقيقي.", view: <RagPipeline /> },
  { id: "bench", label: "معايير التقييم", icon: Gauge, desc: "قارن النماذج في الفهم السياقي واللهجات والاستنتاج.", view: <Benchmarks /> },
  { id: "data", label: "البيانات المنظمة", icon: FileJson, desc: "حوّل المحتوى الحر إلى مخططات Schema.org جاهزة.", view: <StructuredData /> },
  { id: "prompts", label: "قوالب الأوامر", icon: Terminal, desc: "قوالب جاهزة للنسخ والتجربة على مدخلاتك.", view: <PromptLibrary /> },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "سِياق AI",
  alternateName: "Suyaq AI",
  inLanguage: "ar",
  applicationCategory: "DeveloperApplication",
  description: "البنية التحتية المعيارية لتطوير الذكاء الاصطناعي في العالم العربي",
  url: "https://suyaq-ai.k-a-shamardal.workers.dev",
};

export default function App() {
  const [tab, setTab] = useState(PILLARS[0].id);
  const active = PILLARS.find((p) => p.id === tab)!;

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.title = "سِياق AI | البنية التحتية للذكاء الاصطناعي العربي";
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify(JSON_LD);
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#0A0A0C] text-zinc-200" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Cairo', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
        @keyframes suyaq-glow{0%,100%{opacity:.55}50%{opacity:.9}}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`}</style>

      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0A0A0C]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-violet-500 text-black"><Braces size={18} /></span>
            <span className="text-lg font-bold text-white">سِياق <span className="text-zinc-500" dir="ltr">AI</span></span>
          </div>
          <a href="https://github.com/khly500/suyaq-ai" className="rounded-lg border border-white/10 px-3.5 py-1.5 text-sm text-zinc-300 hover:bg-white/5">GitHub</a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-3xl rounded-full bg-gradient-to-l from-emerald-500/25 to-violet-600/25 blur-3xl" style={{ animation: "suyaq-glow 6s ease-in-out infinite" }} />
        <div className="relative mx-auto max-w-4xl px-5 pb-12 pt-20 text-center">
          <h1 className="text-4xl font-bold leading-[1.35] text-white md:text-6xl">البنية التحتية المعيارية<br />لتطوير الذكاء الاصطناعي بالعربية</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">أدوات مفتوحة للاسترجاع والتقييم والبيانات والأوامر، مصممة لخصائص اللغة العربية من أول حرف.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#workspace" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200">جرّب المنصة</a>
            <a href="https://github.com/khly500/suyaq-ai" className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-200 hover:bg-white/5">تصفّح المستودع</a>
          </div>
        </div>
      </section>

      <main id="workspace" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="tablist">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.id} role="tab" aria-selected={tab === p.id} onClick={() => setTab(p.id)} className={`rounded-2xl border p-4 text-right transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${tab === p.id ? "border-emerald-400/50 bg-gradient-to-br from-emerald-400/[0.08] to-violet-500/[0.08]" : "border-white/[0.08] bg-[#121216] hover:bg-white/[0.04]"}`}>
                <Icon size={20} className={tab === p.id ? "text-emerald-300" : "text-zinc-500"} />
                <div className="mt-3 font-semibold text-white">{p.label}</div>
                <div className="mt-1 text-sm leading-6 text-zinc-400">{p.desc}</div>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" key={active.id}>{active.view}</div>
      </main>

      <footer className="border-t border-white/[0.08] py-8 text-center text-sm text-zinc-500">
        <span className="inline-flex items-center gap-2"><Sparkles size={14} /> سِياق AI — مفتوح المصدر ومبني للعالم العربي</span>
      </footer>
    </div>
  );
}
