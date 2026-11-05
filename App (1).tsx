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

const STOP = new Set(["في", "من", "على", "الى", "عن", "ما", "هل", "كيف", "ان", "هذا", "هذه", "ذلك", "التي", "الذي", "هو", "هي", "كل", "مع", "او", "ثم", "عند", "قد", "لا"]);
const DIM = 512;
const fnv = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** تضمين محلي: جذوع + n-grams حرفية موزونة (2-4) + ثنائيات كلمات، مجزأة إلى 512 بُعداً. */
function embedLocal(text: string): number[] {
  const v = new Array<number>(DIM).fill(0);
  const words = normalize(text).split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
  for (const w of words) {
    const p = `<${w}>`;
    for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= p.length; i++) v[fnv(p.slice(i, i + n)) % DIM] += n / 4;
    v[fnv("w:" + w) % DIM] += 1.5;
  }
  for (let i = 0; i < words.length - 1; i++) v[fnv(`b:${words[i]}_${words[i + 1]}`) % DIM] += 1;
  return v.map((x) => Math.log1p(x));
}

const cosine = (a: number[], b: number[]) => {
  let d = 0, x = 0, y = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; }
  return x && y ? d / Math.sqrt(x * y) : 0;
};

async function embedCloud(url: string, token: string, texts: string[]): Promise<number[][]> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ text: texts }) });
  if (!r.ok) throw new Error(`رمز الاستجابة ${r.status}`);
  const j = await r.json();
  const d = j?.result?.data ?? j?.data;
  if (!Array.isArray(d) || d.length !== texts.length) throw new Error("صيغة الاستجابة غير متوقعة");
  return d as number[][];
}

function RagPipeline() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [size, setSize] = useState(120);
  const [query, setQuery] = useState("كيف يتم استرجاع المقاطع الأقرب للسؤال؟");
  const [cloud, setCloud] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [cloudScores, setCloudScores] = useState<number[] | null>(null);
  const [status, setStatus] = useState("");

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

  const localScores = useMemo(() => { const q = embedLocal(query); return chunks.map((c) => cosine(q, embedLocal(c))); }, [chunks, query]);

  useEffect(() => {
    setCloudScores(null);
    if (!cloud || !url.trim() || !query.trim() || !chunks.length) { setStatus(""); return; }
    setStatus("جارٍ التضمين السحابي…");
    const id = setTimeout(async () => {
      try {
        const vs = await embedCloud(url.trim(), token.trim(), [query, ...chunks]);
        setCloudScores(chunks.map((_, i) => cosine(vs[0], vs[i + 1])));
        setStatus("التضمين السحابي يعمل");
      } catch (e) {
        setStatus(`تعذّر الاتصال (${(e as Error).message}). تُعرض النتائج المحلية. قد يكون السبب CORS، والحل في README.`);
      }
    }, 700);
    return () => clearTimeout(id);
  }, [cloud, url, token, query, chunks]);

  const scores = cloudScores ?? localScores;
  const ranked = chunks.map((c, i) => ({ i, c, score: Math.max(0, scores[i] ?? 0) })).sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score || 1;

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
        <p className="mb-3 text-sm text-zinc-400">المحرك المحلي يبني متجهاً من جذوع الكلمات وn-grams حرفية موزونة ثم يقيس تشابه جيب التمام. هو تضمين معجمي مجزَّأ يتحمل اختلاف الصيغ، وليس نموذجاً دلالياً مدرَّباً.</p>
        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute right-3 top-3.5 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A0A0C] py-3 pr-10 pl-3 text-sm text-zinc-200 focus:border-emerald-400/60 focus:outline-none" aria-label="سؤال البحث" />
        </div>
        <details className="mb-4 rounded-xl border border-white/10 p-3 text-sm" open={cloud}>
          <summary className="flex cursor-pointer items-center gap-2 text-zinc-300"><Database size={14} /> تضمين سحابي اختياري (Cloudflare Workers AI)</summary>
          <label className="mt-3 flex items-center gap-2 text-zinc-400"><input type="checkbox" checked={cloud} onChange={(e) => setCloud(e.target.checked)} className="accent-emerald-400" /> تفعيل التضمين السحابي</label>
          <input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-worker.workers.dev/embed" className="mt-2 w-full rounded-lg border border-white/10 bg-[#0A0A0C] p-2 text-left text-xs text-zinc-200 focus:outline-none" aria-label="رابط نقطة التضمين" />
          <input dir="ltr" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token (اختياري)" className="mt-2 w-full rounded-lg border border-white/10 bg-[#0A0A0C] p-2 text-left text-xs text-zinc-200 focus:outline-none" aria-label="مفتاح الوصول" />
          <p className="mt-2 text-xs leading-6 text-zinc-500">المفتاح يبقى في ذاكرة الصفحة فقط ولا يُحفظ. لا تضع مفتاح حسابك في متصفح عام؛ الأسلم أن يمر الطلب عبر Worker خاص بك.</p>
          {status && <p className="mt-1 text-xs text-amber-300" role="status">{status}</p>}
        </details>
        <div className="space-y-2">
          {ranked.map((r, k) => (
            <div key={r.i} className="rounded-lg border border-white/[0.08] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                <span>{k === 0 && r.score > 0 ? "الأقرب · " : ""}مقطع {r.i + 1}</span>
                <span dir="ltr" className="text-emerald-300">{r.score.toFixed(3)}</span>
              </div>
              <div className="mb-2 h-1.5 overflow-hidden rounded bg-white/5"><div className="h-full rounded bg-gradient-to-l from-emerald-400 to-violet-500 transition-all duration-300" style={{ width: `${(r.score / top) * 100}%` }} /></div>
              <p className="line-clamp-2 text-sm leading-6 text-zinc-400">{r.c}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── الركيزة 2: معايير التقييم ───────── */
type Row = { name: string; params: string; scores: Record<string, number> };
const BENCHES = [
  { id: "oall", label: "OALL", desc: "المتصدر المفتوح للنماذج العربية: متوسط دقة عبر مهام فهم واستدلال ومعرفة." },
  { id: "mmlu", label: "ArabicMMLU", desc: "أسئلة اختيار من متعدد في مواد دراسية ومعرفية بالعربية." },
  { id: "dialect", label: "AraBench", desc: "ترجمة اللهجات العربية إلى الفصحى، ويُقاس بـ BLEU وهو مقياس ترجمة لا دقة." },
];
// بيانات توضيحية لعرض الواجهة فقط، وليست قياسات حقيقية. استبدلها عبر زر الاستيراد بنتائجك المنشورة.
const SAMPLE_ROWS: Row[] = [
  { name: "نموذج أ (عيّنة)", params: "70B", scores: { oall: 70, mmlu: 68, dialect: 31 } },
  { name: "نموذج ب (عيّنة)", params: "32B", scores: { oall: 64, mmlu: 61, dialect: 34 } },
  { name: "نموذج ج (عيّنة)", params: "9B", scores: { oall: 55, mmlu: 52, dialect: 27 } },
  { name: "نموذج د (عيّنة)", params: "3B", scores: { oall: 44, mmlu: 41, dialect: 22 } },
];

function parseRows(raw: string): Row[] {
  const j = JSON.parse(raw);
  if (!Array.isArray(j) || !j.length) throw new Error("يجب أن يكون JSON مصفوفة غير فارغة");
  return j.map((r, i) => {
    if (typeof r?.name !== "string" || typeof r?.scores !== "object") throw new Error(`الصف ${i + 1}: يلزم name وscores`);
    const scores: Record<string, number> = {};
    for (const b of BENCHES) { const v = Number(r.scores[b.id]); if (Number.isFinite(v)) scores[b.id] = v; }
    return { name: r.name, params: String(r.params ?? "-"), scores };
  });
}

function Benchmarks() {
  const [rows, setRows] = useState<Row[]>(SAMPLE_ROWS);
  const [isSample, setIsSample] = useState(true);
  const [sort, setSort] = useState("oall");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const [min, setMin] = useState(0);
  const [raw, setRaw] = useState("");
  const [err, setErr] = useState("");
  const b = BENCHES.find((x) => x.id === sort)!;
  const shown = rows
    .filter((r) => r.name.includes(q) && (r.scores[sort] ?? 0) >= min)
    .sort((x, y) => ((x.scores[sort] ?? -1) - (y.scores[sort] ?? -1)) * (asc ? 1 : -1));
  const apply = () => { try { setRows(parseRows(raw)); setIsSample(false); setErr(""); } catch (e) { setErr((e as Error).message); } };
  return (
    <div className={`${panel} p-5`}>
      {isSample && <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/[0.07] p-3 text-sm leading-7 text-amber-200" role="note">الأرقام المعروضة عيّنة توضيحية وليست قياسات حقيقية. الصق نتائجك المنشورة من OALL أو غيره في خانة الاستيراد أسفل اللوحة لتحل محلها.</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="المعيار">
        {BENCHES.map((x) => (
          <button key={x.id} role="tab" aria-selected={sort === x.id} onClick={() => setSort(x.id)} className={`rounded-lg px-4 py-2 text-sm ${sort === x.id ? "bg-white text-black" : "border border-white/10 text-zinc-300 hover:bg-white/5"}`}>{x.label}</button>
        ))}
        <button onClick={() => setAsc(!asc)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5">{asc ? "ترتيب تصاعدي" : "ترتيب تنازلي"}</button>
      </div>
      <p className="mb-4 text-sm leading-7 text-zinc-400">{b.desc}</p>
      <div className="mb-5 flex flex-wrap gap-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم النموذج" aria-label="تصفية بالاسم" className="rounded-lg border border-white/10 bg-[#0A0A0C] px-3 py-2 text-sm focus:outline-none" />
        <label className="flex items-center gap-2 text-sm text-zinc-400">الحد الأدنى
          <input type="range" min={0} max={100} value={min} onChange={(e) => setMin(+e.target.value)} className="accent-emerald-400" />
          <span dir="ltr" className="w-8 text-zinc-200">{min}</span>
        </label>
      </div>
      <div className="space-y-3">
        {shown.length === 0 && <p className="text-sm text-zinc-500">لا نماذج تطابق التصفية. خفّض الحد الأدنى أو امسح البحث.</p>}
        {shown.map((r) => {
          const v = r.scores[sort];
          return (
            <div key={r.name} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-zinc-300">{r.name} <span className="text-xs text-zinc-600" dir="ltr">{r.params}</span></span>
              <div className="h-7 flex-1 overflow-hidden rounded-lg bg-white/5"><div className="h-full rounded-lg bg-gradient-to-l from-emerald-400 to-violet-500 transition-all duration-500" style={{ width: `${Math.min(100, v ?? 0)}%` }} /></div>
              <span className="w-12 text-left text-sm text-zinc-200" dir="ltr">{v === undefined ? "-" : v.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <details className="mt-6 rounded-xl border border-white/10 p-3 text-sm">
        <summary className="cursor-pointer text-zinc-300">استيراد نتائج (JSON)</summary>
        <textarea dir="ltr" value={raw} onChange={(e) => setRaw(e.target.value)} rows={5} placeholder={'[{"name":"Model","params":"7B","scores":{"oall":61.2,"mmlu":58.4,"dialect":29.5}}]'} className="mt-3 w-full rounded-lg border border-white/10 bg-[#0A0A0C] p-3 text-left text-xs text-zinc-200 focus:outline-none" aria-label="JSON النتائج" />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={apply} className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-black">تطبيق</button>
          <button onClick={() => { setRows(SAMPLE_ROWS); setIsSample(true); }} className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-zinc-300">العودة للعيّنة</button>
          {err && <span className="text-xs text-red-300" role="alert">{err}</span>}
        </div>
      </details>
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

/* ───────── عرض حي في الواجهة الرئيسية ───────── */
const STAGES = [
  { t: "سؤال المستخدم", d: "ما شروط تجديد السجل التجاري؟" },
  { t: "تطبيع عربي", d: "تجديد، سجل، تجاري، شروط" },
  { t: "استرجاع متجهي", d: "٣ مقاطع، أعلاها تطابقاً ٠٫٩١" },
  { t: "إجابة بمصدرها", d: "الشروط ثلاثة [المقطع ١، ٣]" },
];

function LiveDemo() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(STAGES.length - 1); return; }
    const id = setInterval(() => setN((x) => (x + 1) % (STAGES.length + 1)), 1700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={`${panel} mx-auto mt-14 max-w-3xl p-5 text-right`} aria-label="مثال حي على خط الاسترجاع">
      <ol className="space-y-3">
        {STAGES.map((st, i) => (
          <li key={st.t} className={`flex items-center gap-4 rounded-xl border p-3.5 transition-all duration-500 ${i < n ? "border-emerald-400/40 bg-emerald-400/[0.06] opacity-100" : "border-white/[0.06] opacity-40"}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${i < n ? "bg-emerald-400 text-black" : "bg-white/10 text-zinc-400"}`}>{i < n ? <Check size={14} /> : i + 1}</span>
            <div><div className="text-sm font-semibold text-white">{st.t}</div><div className="text-sm text-zinc-400">{st.d}</div></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const PRINCIPLES = [
  { t: "عربية من الأساس", d: "التطبيع والتقطيع والتقييم مبنية على خصائص اللغة، لا مترجمة من الإنجليزية." },
  { t: "معيارية وقابلة للتركيب", d: "كل ركيزة تعمل وحدها، وتتكامل مع غيرها عبر مخططات قياسية." },
  { t: "مفتوحة وقابلة للتحقق", d: "الكود والبيانات ونتائج التقييم متاحة للمراجعة والمساهمة." },
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
  const initial = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const [tab, setTab] = useState(PILLARS.some((p) => p.id === initial) ? initial : PILLARS[0].id);
  const select = (id: string) => { setTab(id); history.replaceState(null, "", `#${id}`); };
  const onKeys = (e: React.KeyboardEvent) => {
    const i = PILLARS.findIndex((p) => p.id === tab);
    const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0; // RTL: اليسار = التالي
    if (!step) return;
    e.preventDefault();
    const next = PILLARS[(i + step + PILLARS.length) % PILLARS.length].id;
    select(next);
    document.getElementById(`tab-${next}`)?.focus();
  };
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
    <>
    <a href="#workspace" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black">تخطي إلى المنصة</a>
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
          <LiveDemo />
        </div>
      </section>

      <section className="mx-auto mb-16 grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {PRINCIPLES.map((x) => (
          <div key={x.t} className="border-r-2 border-emerald-400/60 pr-4">
            <h2 className="font-semibold text-white">{x.t}</h2>
            <p className="mt-1.5 text-sm leading-7 text-zinc-400">{x.d}</p>
          </div>
        ))}
      </section>

      <main id="workspace" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="ركائز المنصة" onKeyDown={onKeys}>
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <button key={p.id} id={`tab-${p.id}`} role="tab" aria-selected={tab === p.id} aria-controls="panel" tabIndex={tab === p.id ? 0 : -1} onClick={() => select(p.id)} className={`rounded-2xl border p-4 text-right transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${tab === p.id ? "border-emerald-400/50 bg-gradient-to-br from-emerald-400/[0.08] to-violet-500/[0.08]" : "border-white/[0.08] bg-[#121216] hover:bg-white/[0.04]"}`}>
                <Icon size={20} className={tab === p.id ? "text-emerald-300" : "text-zinc-500"} />
                <div className="mt-3 font-semibold text-white">{p.label}</div>
                <div className="mt-1 text-sm leading-6 text-zinc-400">{p.desc}</div>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id="panel" aria-labelledby={`tab-${active.id}`} key={active.id}>{active.view}</div>
      </main>

      <footer className="border-t border-white/[0.08] py-8 text-center text-sm text-zinc-500">
        <span className="inline-flex items-center gap-2"><Sparkles size={14} /> سِياق AI — مفتوح المصدر ومبني للعالم العربي</span>
      </footer>
    </div>
    </>
  );
}
