import { FormEvent, useState } from "react";
import {
  ArrowLeft, ArrowUpLeft, ArrowUpRight, Braces, Check, ChevronDown,
  CircleHelp, Code2, Database, FileSearch, Github, Layers3, Menu,
  Network, Search, ShieldCheck, Sparkles, Workflow, X, Zap
} from "lucide-react";

type Match = {
  id?: string; score?: number; text?: string; source?: string;
  page?: number | string; url?: string;
};
type ApiResponse = {
  status?: string; answer?: string; error?: string;
  retrieval?: { method?: string; count?: number }; matches?: Match[];
};

const samples = [
  "كيف أبحث عن صيغ الكلمة العربية المختلفة؟",
  "ما أفضل طريقة لفهرسة مخطوط عربي؟",
  "كيف أتأكد أن إجابة الذكاء الاصطناعي موثّقة؟"
];

const demoMatches: Match[] = [
  {
    id: "demo-1", score: 0.823, source: "دليل المعالجة العربية.pdf", page: 12,
    text: "يمكن إنشاء نسخة مطبّعة مخصصة للبحث مع الاحتفاظ بالنص الأصلي للعرض والاستشهاد. ينبغي ضبط التطبيع بحسب المجال حتى لا تتغير أسماء الأعلام والمصطلحات."
  },
  {
    id: "demo-2", score: 0.716, source: "ملاحظات بناء RAG.md", page: 4,
    text: "يساعد الجمع بين الاسترجاع المعجمي والبحث المتجهي في العثور على الصيغ المتقاربة دلاليًا والعبارات التي تتطابق حرفيًا، ثم يعاد ترتيب النتائج قبل توليد الإجابة."
  },
  {
    id: "demo-3", score: 0.641, source: "اختبارات البحث العربي.pdf", page: 8,
    text: "ينبغي قياس جودة الاسترجاع بمقاييس مثل Recall@k وMRR أو nDCG، وفحص صحة الاستشهادات بصورة مستقلة عن جودة صياغة الإجابة."
  }
];

function apiUrl() {
  return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SUYAQ_API_URL?.trim();
}

export default function App() {
  const endpoint = apiUrl();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [answer, setAnswer] = useState("");
  const [method, setMethod] = useState("Hybrid Search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runSearch(value = query) {
    const clean = value.trim();
    if (!clean || loading) return;
    setQuery(clean); setLoading(true); setError(""); setMatches([]); setAnswer(""); setSearched(true);
    try {
      if (!endpoint) {
        await new Promise((r) => setTimeout(r, 500));
        setMatches(demoMatches);
        setMethod("Demo · بيانات توضيحية");
        setAnswer("هذه تجربة واجهة فقط. النتائج أدناه ثابتة لتوضيح طريقة العرض، وليست ناتجة عن فهرس حقيقي. اربط VITE_SUYAQ_API_URL بخدمة Worker مفعّلة لتشغيل الاسترجاع الفعلي.");
        return;
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean, topK: 5 })
      });
      const data = await response.json().catch(() => ({})) as ApiResponse;
      if (!response.ok) throw new Error(data.error || `تعذر تنفيذ الطلب (${response.status})`);
      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setAnswer(data.answer || "");
      setMethod(data.retrieval?.method || "API");
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
    } finally { setLoading(false); }
  }

  function submit(e: FormEvent) { e.preventDefault(); void runSearch(); }

  async function copyQuery() {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true); window.setTimeout(() => setCopied(false), 1600);
    } catch { setError("تعذر النسخ في هذا المتصفح."); }
  }

  return (
    <div className="app-shell" dir="rtl">
      <div className="announcement">
        <span className="announcement-dot" /> مشروع مفتوح لبناء أدوات ذكاء اصطناعي تفهم العربية
        <a href="#lab">جرّب المختبر <ArrowLeft size={14}/></a>
      </div>

      <header className="site-header">
        <a className="brand" href="#home" aria-label="سياق AI الصفحة الرئيسية">
          <span className="brand-mark"><Braces size={25}/></span>
          <span className="brand-word">سِياق<span>AI</span></span>
        </a>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a href="#platform" onClick={() => setMenuOpen(false)}>المنصة</a>
          <a href="#architecture" onClick={() => setMenuOpen(false)}>المعمارية</a>
          <a href="#lab" onClick={() => setMenuOpen(false)}>مختبر البحث</a>
          <a href="#roadmap" onClick={() => setMenuOpen(false)}>خارطة الطريق</a>
        </nav>
        <div className="header-actions">
          <a className="github-link" href="https://github.com/" target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a>
          <a className="header-cta" href="#lab">جرّب المنصة <ArrowUpLeft size={16}/></a>
        </div>
        <button className="mobile-menu" aria-label="فتح القائمة" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X/> : <Menu/>}
        </button>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-glow glow-a"/><div className="hero-glow glow-b"/>
          <div className="hero-content">
            <div className="hero-pill"><Sparkles size={15}/> البنية التحتية للذكاء الاصطناعي العربي</div>
            <h1>من أول حرف، نبني<br/><span>ذكاءً يفهم العربية.</span></h1>
            <p className="hero-copy">
              أدوات مفتوحة ومعيارية للتقطيع الدلالي، وفهرسة الوثائق، والاسترجاع الذكي —
              مصممة من الأساس لخصائص اللغة العربية.
            </p>
            <div className="hero-buttons">
              <a href="#lab" className="button button-light">جرّب البحث العربي <ArrowUpLeft size={17}/></a>
              <a href="#architecture" className="button button-dark"><Code2 size={17}/> استكشف المعمارية</a>
            </div>
            <div className="hero-note"><span className="green-check"><Check size={12}/></span> بنية معيارية <i/> واجهات API <i/> مصادر قابلة للتتبع</div>
          </div>
          <div className="hero-visual" aria-label="رسم توضيحي لتدفق الاسترجاع">
            <div className="visual-top"><span><i/> SUYAQ / RETRIEVAL PIPELINE</span><span className="visual-live">SYSTEM OVERVIEW</span></div>
            <div className="visual-query"><Search size={17}/><span>البحث في المعرفة العربية...</span><kbd>⌘ K</kbd></div>
            <div className="visual-flow">
              <div className="flow-node"><div className="node-icon cyan"><FileSearch size={19}/></div><b>تحليل السؤال</b><small>Arabic Query</small></div>
              <div className="flow-line"><span/></div>
              <div className="flow-node"><div className="node-icon purple"><Network size={19}/></div><b>استرجاع هجين</b><small>Hybrid Retrieval</small></div>
              <div className="flow-line"><span/></div>
              <div className="flow-node"><div className="node-icon green"><Layers3 size={19}/></div><b>مقاطع موثّقة</b><small>Ranked Chunks</small></div>
            </div>
            <div className="visual-results">
              <div className="visual-result-head"><span>مقاطع مسترجعة</span><span className="tiny-tag">PREVIEW</span></div>
              <div className="mini-result"><span className="mini-number">01</span><div><b>المعالجة الصرفية العربية</b><small>مصدر: Arabic NLP Handbook</small></div><strong>0.92</strong></div>
              <div className="mini-result"><span className="mini-number">02</span><div><b>الفهرسة الدلالية للوثائق</b><small>مصدر: Retrieval Notes</small></div><strong>0.84</strong></div>
              <div className="mini-result"><span className="mini-number">03</span><div><b>استرجاع السياق من النصوص</b><small>مصدر: RAG Guide</small></div><strong>0.78</strong></div>
              <div className="visual-disclaimer">رسم توضيحي — الدرجات ليست نتائج حية.</div>
            </div>
            <div className="floating-chip chip-one"><span className="chip-dot"/> Arabic-first</div>
            <div className="floating-chip chip-two"><Zap size={14}/> RAG Ready</div>
          </div>
          <div className="hero-bottom"><span>مبني للمطورين والباحثين</span><div/><span>من البيانات إلى الإجابة الموثوقة</span><div/><span>قابل للتوسّع</span></div>
        </section>

        <section className="metrics" id="platform">
          <div className="metric"><span className="metric-icon"><Workflow size={19}/></span><div><b>معمارية معيارية</b><small>مكونات مستقلة وقابلة للاستبدال</small></div></div>
          <div className="metric"><span className="metric-icon"><Search size={19}/></span><div><b>بحث عربي أذكى</b><small>فهم للصيغ والسياق لا التطابق فقط</small></div></div>
          <div className="metric"><span className="metric-icon"><ShieldCheck size={19}/></span><div><b>مصادر قابلة للتتبع</b><small>إظهار المقطع والوثيقة والصفحة</small></div></div>
          <div className="metric"><span className="metric-icon"><Code2 size={19}/></span><div><b>مصمم للمطورين</b><small>واجهات API وخيارات تكامل واضحة</small></div></div>
        </section>

        <section className="section" id="architecture">
          <div className="section-heading">
            <div><span className="section-label">المعمارية</span><h2>كل مرحلة، لها دور واضح.</h2></div>
            <p>مسار قابل للفحص والتطوير من إدخال الوثيقة إلى إجابة مدعومة بمصدر.</p>
          </div>
          <div className="architecture-grid">
            <article className="architecture-card"><div className="card-top"><span className="card-icon icon-cyan"><FileSearch size={21}/></span><span className="card-index">01 / INGEST</span></div><h3>إدخال الوثائق</h3><p>استخراج النص والصفحات والبيانات الوصفية من الملفات، مع مسار OCR للمستندات المصوّرة.</p><div className="card-tags"><span>PDF</span><span>TXT</span><span>OCR</span></div></article>
            <article className="architecture-card"><div className="card-top"><span className="card-icon icon-purple"><Braces size={21}/></span><span className="card-index">02 / ARABIC NLP</span></div><h3>تهيئة النص العربي</h3><p>تطبيع مضبوط للبحث، مع الاحتفاظ بالنص الأصلي وعدم طمس الفروق المهمة بين الكلمات.</p><div className="card-tags"><span>Normalization</span><span>Chunking</span></div></article>
            <article className="architecture-card"><div className="card-top"><span className="card-icon icon-green"><Database size={21}/></span><span className="card-index">03 / RETRIEVE</span></div><h3>الفهرسة والاسترجاع</h3><p>تصميم يدعم الجمع بين البحث المعجمي والمتجهي وإعادة ترتيب المقاطع حسب صلتها بالسؤال.</p><div className="card-tags"><span>BM25</span><span>Vector Search</span><span>Reranking</span></div></article>
            <article className="architecture-card"><div className="card-top"><span className="card-icon icon-orange"><ShieldCheck size={21}/></span><span className="card-index">04 / GENERATE</span></div><h3>إجابة مع الاستشهادات</h3><p>توليد إجابة تستند إلى السياق المسترجع، مع روابط للمصادر وإظهار واضح عند نقص الأدلة.</p><div className="card-tags"><span>Grounded Answers</span><span>Citations</span></div></article>
          </div>
        </section>

        <section className="lab-section" id="lab">
          <div className="section-heading lab-heading">
            <div><span className="section-label">مختبر تفاعلي</span><h2>جرّب الاسترجاع بنفسك.</h2></div>
            <p>اكتب استعلامًا عربيًا، ثم افحص المقاطع والدرجات والمصادر التي يعيدها المحرك.</p>
          </div>
          <div className="lab-card">
            <div className="lab-card-header"><div className="lab-title"><span className="lab-icon"><Search size={20}/></span><div><b>Arabic Retrieval Playground</b><small>مختبر الاسترجاع العربي</small></div></div><span className={`connection-status ${endpoint ? "connected" : ""}`}><i/>{endpoint ? "API مضبوط" : "وضع تجريبي"}</span></div>
            {!endpoint && <div className="demo-notice"><CircleHelp size={16}/><span><b>هذه معاينة فقط.</b> النتائج ثابتة للتوضيح، وليست مستخرجة من قاعدة بيانات فعلية.</span></div>}
            <form className="query-form" onSubmit={submit}>
              <label htmlFor="search-query">ما الذي تريد البحث عنه؟</label>
              <textarea id="search-query" value={query} onChange={e => setQuery(e.target.value)} maxLength={2000} rows={3} placeholder="مثال: كيف أتعامل مع اختلاف صيغ الكلمة العربية في البحث؟"/>
              <div className="query-controls"><span>{query.length} / 2000</span><div><button type="button" className="copy-button" onClick={copyQuery} disabled={!query}>{copied ? <Check size={15}/> : <Code2 size={15}/>} {copied ? "تم النسخ" : "نسخ الاستعلام"}</button><button className="button button-light search-button" disabled={!query.trim() || loading}>{loading ? <span className="spinner"/> : <Search size={16}/>} {loading ? "جارٍ البحث..." : "ابدأ الاسترجاع"}</button></div></div>
            </form>
            <div className="sample-queries"><span>أو جرّب:</span>{samples.map(s => <button key={s} type="button" disabled={loading} onClick={() => void runSearch(s)}>{s}<ArrowUpLeft size={13}/></button>)}</div>
            {error && <div className="error-box" role="alert">{error}</div>}
            {loading && <div className="loading-box"><span className="spinner large-spinner"/> جارٍ الاتصال بمحرك البحث...</div>}
            {searched && !loading && !error && <div className="search-results" aria-live="polite">
              <div className="results-toolbar"><div><span className="section-label">نتائج الاسترجاع</span><h3>المقاطع المطابقة</h3></div><span className="method-badge">{method}</span></div>
              {answer && <div className="answer-box"><b><Sparkles size={15}/> ملاحظة النظام</b><p>{answer}</p></div>}
              {!matches.length ? <div className="no-results">لا توجد مقاطع مسترجعة. جرّب سؤالًا آخر أو تحقق من فهرسة الوثائق.</div> :
                <div className="result-stack">{matches.map((m, i) => <article className="retrieved-chunk" key={m.id || `${m.source}-${i}`}>
                  <div className="chunk-top"><span className="chunk-number">مقطع {String(i+1).padStart(2,"0")}</span><span className="score">درجة الصلة <b>{typeof m.score === "number" ? m.score.toFixed(3) : "—"}</b></span></div>
                  <p>{m.text || "لم يُرجع الخادم نص المقطع."}</p>
                  <div className="chunk-source"><span><FileSearch size={14}/>{m.source || "مصدر غير محدد"}</span>{m.page != null && <span>صفحة {m.page}</span>}{m.url && <a href={m.url} target="_blank" rel="noreferrer">فتح المصدر <ArrowUpLeft size={13}/></a>}</div>
                </article>)}</div>}
              <p className="score-disclaimer">تنبيه: درجة الصلة ليست نسبة ثقة في صحة الإجابة. تفسيرها يعتمد على نموذج التضمين أو خوارزمية الترتيب المستخدمة.</p>
            </div>}
          </div>
        </section>

        <section className="section roadmap-section" id="roadmap">
          <div className="section-heading"><div><span className="section-label">خارطة الطريق</span><h2>من نموذج أولي إلى منصة.</h2></div><p>مراحل عملية لبناء منتج يمكن الاعتماد عليه وتوسيعه بأمان.</p></div>
          <div className="roadmap">
            <div className="roadmap-item active"><span className="roadmap-dot"/><div><span>المرحلة 01 · الآن</span><h3>واجهة وتجربة الاسترجاع</h3><p>واجهة عربية، عقد API واضح، وإظهار المقاطع والمصادر وحالات النظام.</p></div><span className="roadmap-state">البداية</span></div>
            <div className="roadmap-item"><span className="roadmap-dot"/><div><span>المرحلة 02</span><h3>خط معالجة الوثائق</h3><p>رفع ملفات، استخراج النص، تقطيع واعٍ بالصفحات، وفهرسة قابلة لإعادة البناء.</p></div></div>
            <div className="roadmap-item"><span className="roadmap-dot"/><div><span>المرحلة 03</span><h3>بحث هجين وتقييم</h3><p>دمج البحث المعجمي والمتجهي، إعادة الترتيب، ومجموعة اختبارات عربية.</p></div></div>
            <div className="roadmap-item"><span className="roadmap-dot"/><div><span>المرحلة 04</span><h3>منصة SaaS آمنة</h3><p>حسابات ومساحات عمل، عزل البيانات، حصص استخدام، مراقبة وفوترة.</p></div></div>
          </div>
        </section>

        <section className="closing-cta">
          <div className="closing-orb"><Braces size={31}/></div><span className="section-label">ابدأ البناء</span><h2>العربية تستحق بنية تحتية صُممت لها.</h2><p>ابدأ بالواجهة، ثم اربط محركك، ووسّع كل طبقة حسب احتياجك.</p><a className="button button-light" href="#lab">جرّب مختبر البحث <ArrowLeft size={16}/></a>
        </section>
      </main>

      <footer className="site-footer"><a className="brand" href="#home"><span className="brand-mark"><Braces size={21}/></span><span className="brand-word">سِياق<span>AI</span></span></a><p>بنية مفتوحة لبناء أنظمة تفهم العربية.</p><span className="footer-copy">© {new Date().getFullYear()} Suyaq AI · واجهة أولية قابلة للتطوير</span></footer>
    </div>
  );
}
