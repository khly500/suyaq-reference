import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Search,
  Download,
  Code2,
  SlidersHorizontal,
  FileJson,
  ChevronLeft,
} from 'lucide-react';
import {
  BENCHMARK_MODELS,
  ENGINEERED_PROMPTS,
  SCHEMA_TEMPLATES,
  BenchmarkCategory,
  BenchmarkModel,
} from './data/suyaqData';
import { ApiDocsModal } from './components/ApiDocsModal';

type SortField =
  | 'overallScore'
  | 'msaAccuracy'
  | 'codeGeneration'
  | 'longContext'
  | 'latencyMs';

export default function App() {
  // Navigation & API Docs Drawer state
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);

  // Pillar 1: Leaderboard State
  const [selectedCategory, setSelectedCategory] = useState<BenchmarkCategory>('all');
  const [sortField, setSortField] = useState<SortField>('overallScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [modelSearch, setModelSearch] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>(BENCHMARK_MODELS[0].id);
  const [copiedLeaderboardJson, setCopiedLeaderboardJson] = useState(false);

  // Pillar 2: Prompts Vault State
  const [promptFilter, setPromptFilter] = useState<string>('all');
  const [promptSearch, setPromptSearch] = useState<string>('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [expandedPromptSampleId, setExpandedPromptSampleId] = useState<string | null>(null);

  // Pillar 3: Schema & GEO Templates State
  const [activeSchemaTabId, setActiveSchemaTabId] = useState<string>(SCHEMA_TEMPLATES[0].id);
  const [copiedSchemaId, setCopiedSchemaId] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string>('https://suyaq.ai');
  const [customOrgName, setCustomOrgName] = useState<string>('سِياق AI | Suyaq AI');

  // When category filter changes, adjust primary sort metric automatically to match developer intent
  const handleCategoryChange = (category: BenchmarkCategory) => {
    setSelectedCategory(category);
    if (category === 'coding') {
      setSortField('codeGeneration');
      setSortDirection('desc');
    } else if (category === 'msa') {
      setSortField('msaAccuracy');
      setSortDirection('desc');
    } else if (category === 'reasoning') {
      setSortField('longContext');
      setSortDirection('desc');
    } else {
      setSortField('overallScore');
      setSortDirection('desc');
    }
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      // For latency, lower is faster so default to ascending when clicked first
      setSortDirection(field === 'latencyMs' ? 'asc' : 'desc');
    }
  };

  // Compute dynamic score depending on selected category filter + sort
  const filteredAndSortedModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();
    const list = BENCHMARK_MODELS.filter((model) => {
      const matchesSearch =
        !query ||
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.version.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;
      return model.strengths.includes(selectedCategory);
    });

    return [...list].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });
  }, [selectedCategory, sortField, sortDirection, modelSearch]);

  const inspectedModel: BenchmarkModel = useMemo(() => {
    return (
      BENCHMARK_MODELS.find((m) => m.id === selectedModelId) ||
      filteredAndSortedModels[0] ||
      BENCHMARK_MODELS[0]
    );
  }, [selectedModelId, filteredAndSortedModels]);

  // Filter prompts in Pillar 2
  const filteredPrompts = useMemo(() => {
    const q = promptSearch.trim().toLowerCase();
    return ENGINEERED_PROMPTS.filter((item) => {
      const matchesCategory = promptFilter === 'all' || item.categoryId === promptFilter;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.targetModel.toLowerCase().includes(q) ||
        item.systemPrompt.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [promptFilter, promptSearch]);

  // Active Schema Template in Pillar 3 with live domain/organization injection
  const activeSchema = useMemo(() => {
    const found =
      SCHEMA_TEMPLATES.find((t) => t.id === activeSchemaTabId) || SCHEMA_TEMPLATES[0];
    const cleanDomain = customDomain.trim().replace(/\/+$/, '') || 'https://suyaq.ai';
    const cleanOrg = customOrgName.trim() || 'سِياق AI | Suyaq AI';
    const customizedCode = found.jsonLdCode
      .replace(/https:\/\/suyaq\.ai/g, cleanDomain)
      .replace(/سِياق AI \| Suyaq AI/g, cleanOrg);

    return {
      ...found,
      customizedCode,
    };
  }, [activeSchemaTabId, customDomain, customOrgName]);

  const handleCopyPrompt = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => {
      setCopiedPromptId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleCopySchema = (id: string, jsonText: string) => {
    navigator.clipboard.writeText(jsonText);
    setCopiedSchemaId(id);
    setTimeout(() => {
      setCopiedSchemaId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleDownloadSchema = (id: string, jsonText: string) => {
    const blob = new Blob([jsonText], { type: 'application/ld+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.schema.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLeaderboardJson = () => {
    const exportPayload = JSON.stringify(filteredAndSortedModels, null, 2);
    navigator.clipboard.writeText(exportPayload);
    setCopiedLeaderboardJson(true);
    setTimeout(() => setCopiedLeaderboardJson(false), 2000);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600 inline-block mr-1.5" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-400 inline-block mr-1.5" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-400 inline-block mr-1.5" />
    );
  };

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#0a0a0c] text-[#f4f4f6] flex flex-col">
      {/* 1. Header & Navigation — Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#1e1e24] bg-[#0a0a0c]/95 backdrop-blur-xs">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
          >
            سِياق AI | Suyaq AI
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400"
          >
            <a
              href="#leaderboard"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-emerald-400"
            >
              مؤشر الأداء المعياري
            </a>
            <a
              href="#prompts"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-emerald-400"
            >
              مستودع التوجيهات الهندسية
            </a>
            <a
              href="#schemas"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-emerald-400"
            >
              قوالب البيانات المهيكلة
            </a>
            <a
              href="#methodology"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-emerald-400"
            >
              منهجية القياس
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setIsApiDocsOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-[#0a0a0c] bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              توثيق الواجهة (API Docs)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="border-b border-[#1e1e24] bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.06)_0%,_rgba(10,10,12,0)_70%)]">
          <div className="max-w-[1360px] mx-auto px-6 pt-14 pb-12 lg:pt-20 lg:pb-16">
            {/* Unboxed Metadata Kicker (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400 mb-5">
              <span className="text-emerald-400 font-medium">الإصدار المرجعي v1.0 Beta</span>
              <span aria-hidden="true">·</span>
              <span>مُحدّث للربع الرابع 2026</span>
              <span aria-hidden="true">·</span>
              <span>قياس تجريبي محكم للفصحى المعيارية والبرمجة</span>
            </div>

            {/* Split Hero Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  <h1
                    className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white leading-[1.22]"
                    style={{ textWrap: 'balance' }}
                  >
                    البنية المعيارية لمطوري الذكاء الاصطناعي في العالم العربي
                  </h1>

                  <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl font-normal">
                    منصة هندسية مرجعية تجمع بين القياس التجريبي الصارم لأداء النماذج اللغوية في{' '}
                    <span className="text-white font-medium">العربية الفصحى المعيارية</span>،
                    ومستودع التوجيهات البرمجية المحكمة للإنتاج، وقوالب البيانات المهيكلة{' '}
                    <span className="font-mono text-cyan-300 text-sm">JSON-LD / GEO</span> لتعظيم
                    موثوقية الاسترجاع الدلالي.
                  </p>
                </div>

                {/* Single Primary Focal CTA + Secondary Text Links */}
                <div className="pt-2 flex flex-wrap items-center gap-5">
                  <a
                    href="#leaderboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-400 text-[#0a0a0c] hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>استكشاف مؤشر الأداء المعياري</span>
                    <ChevronLeft className="w-4 h-4" />
                  </a>
                  <a
                    href="#prompts"
                    className="text-sm font-medium text-zinc-300 hover:text-emerald-400 underline underline-offset-8 decoration-[#1e1e24] hover:decoration-emerald-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    تصفح مستودع التوجيهات الهندسية
                  </a>
                  <a
                    href="#schemas"
                    className="text-sm font-medium text-zinc-300 hover:text-cyan-400 underline underline-offset-8 decoration-[#1e1e24] hover:decoration-cyan-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    قوالب JSON-LD و GEO
                  </a>
                </div>
              </div>

              {/* Right Column: Live Benchmark Terminal Snapshot */}
              <div className="lg:col-span-5 flex flex-col justify-between border border-[#1e1e24] bg-[#0e0e12] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e24] bg-[#121218]">
                  <span className="text-xs font-mono text-zinc-400" dir="ltr">
                    suyaq-eval-cli — benchmark_manifest.json
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400" dir="ltr">
                    AST + MSA Verified
                  </span>
                </div>
                <pre
                  className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed flex-1"
                  dir="ltr"
                >
                  <code>{`{
  "suite": "suyaq-arabic-core-v1.0",
  "evaluation_protocol": {
    "msa_syntax_check": "strict_fusha_grammar",
    "code_sandbox": "isolated_node22_py312",
    "context_needle": "128k_legal_financial_ar"
  },
  "top_performers": {
    "overall": "Claude 3.5 Sonnet (95.5%)",
    "msa_purity": "ALLaM 34B (97.2%)",
    "long_context": "Gemini 1.5 Pro (98.7%)"
  }
}`}</code>
                </pre>
                <div className="px-4 py-2.5 border-t border-[#1e1e24] bg-[#0a0a0c] flex items-center justify-between text-xs text-zinc-400">
                  <span>بيئة الفحص المعزولة: 12,400 مهمة قياسية</span>
                  <button
                    onClick={() => setIsApiDocsOpen(true)}
                    className="font-mono text-emerald-400 hover:underline cursor-pointer"
                  >
                    عرض مواصفات API ←
                  </button>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Quick Stats Bar */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#1e1e24] rounded-lg bg-[#0d0d11] divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#1e1e24]">
              <div className="p-5">
                <div className="text-xs text-zinc-400 mb-1.5">
                  النماذج المختبرة (Models Tested)
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-semibold font-mono text-white tabular-nums">
                    5 نماذج مرجعية
                  </span>
                  <span className="text-xs font-mono text-emerald-400 tabular-nums">
                    12,400 مهمة
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  محدثة دورياً عبر اختبارات عمياء متعددة المراحل
                </div>
              </div>

              <div className="p-5">
                <div className="text-xs text-zinc-400 mb-1.5">
                  التوجيهات المعتمدة (Verified Prompts)
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-semibold font-mono text-white tabular-nums">
                    64 توجيهاً هندسياً
                  </span>
                  <span className="text-xs font-mono text-cyan-400 tabular-nums">
                    -38% رموز
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  مضبوطة للمخرجات المهيكلة ومنع الهلوسة
                </div>
              </div>

              <div className="p-5">
                <div className="text-xs text-zinc-400 mb-1.5">
                  مخططات البيانات (JSON-LD Schemas)
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-semibold font-mono text-white tabular-nums">
                    18 قالباً قياسياً
                  </span>
                  <span className="text-xs font-mono text-emerald-400 tabular-nums">
                    Schema.org v28
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  مهيأة لمحركات البحث التوليدية (GEO) وأنابيب RAG
                </div>
              </div>

              <div className="p-5">
                <div className="text-xs text-zinc-400 mb-1.5">
                  محرك الأتمتة والتشغيل القياسي
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-lg font-semibold font-mono text-white truncate"
                    dir="ltr"
                  >
                    Google Cloud Engine
                  </span>
                  <span className="text-xs font-mono text-cyan-400 tabular-nums" dir="ltr">
                    99.98% SLA
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  تشغيل آلي معزول عبر حاويات Cloud Run الموزعة
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Pillar 1: مؤشر الأداء المعياري العربي (Arabic LLM Practical Leaderboard) */}
        <section id="leaderboard" className="py-16 lg:py-20 border-b border-[#1e1e24]">
          <div className="max-w-[1360px] mx-auto px-6 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs font-mono text-emerald-400">
                  الركيزة الأولى · معيار القياس التجريبي (Suyaq-MSA-Eval v1.0)
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  01. مؤشر الأداء المعياري العربي (Arabic LLM Practical Leaderboard)
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
                  مقارنة كمية محايدة لأداء أبرز النماذج اللغوية العالمية والعربية في مهام الهندسة
                  البرمجية، سلامة الصياغة بالفصحى المعيارية، واستخلاص المعلومات من الوثائق الطويلة.
                  انقر على رؤوس الأعمدة للترتيب التنازلي أو التصاعدي، أو اختر نموذجاً لمعاينة بطاقة
                  التشخيص التفصيلية.
                </p>
              </div>

              {/* Export & Action Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleCopyLeaderboardJson}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#121217] hover:bg-[#191922] border border-[#1e1e24] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedLeaderboardJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم نسخ جدول البيانات (JSON)</span>
                    </>
                  ) : (
                    <>
                      <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                      <span>تصدير البيانات (JSON)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 bg-[#0d0d11] border border-[#1e1e24] rounded-lg">
              {/* Interactive Category Filter Buttons */}
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="tablist"
                aria-label="تصفية المؤشر حسب الفئة"
              >
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'coding', label: 'البرمجة' },
                  { id: 'reasoning', label: 'التحليل المنطقي' },
                  { id: 'msa', label: 'الصياغة الفصيحة' },
                ].map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleCategoryChange(tab.id as BenchmarkCategory)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-emerald-400 text-[#0a0a0c] font-semibold'
                          : 'text-zinc-400 hover:text-white hover:bg-[#15151c]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="ابحث باسم النموذج أو المزوّد..."
                  aria-label="ابحث باسم النموذج أو المزود"
                  className="w-full pr-9 pl-3 py-1.5 text-xs bg-[#0a0a0c] border border-[#1e1e24] rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>

            {/* Interactive Sortable Comparison Table */}
            <div className="border border-[#1e1e24] rounded-lg overflow-hidden bg-[#0d0d11]">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e1e24] bg-[#111117] text-xs font-medium text-zinc-400">
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">#</th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        النموذج (Model Name)
                      </th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        المزوّد (Provider)
                      </th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleSortClick('msaAccuracy')}
                          className={`inline-flex items-center hover:text-white transition-colors cursor-pointer ${
                            sortField === 'msaAccuracy' ? 'text-emerald-400 font-semibold' : ''
                          }`}
                        >
                          <span>دقة الفصحى المعيارية</span>
                          {renderSortIcon('msaAccuracy')}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleSortClick('codeGeneration')}
                          className={`inline-flex items-center hover:text-white transition-colors cursor-pointer ${
                            sortField === 'codeGeneration' ? 'text-emerald-400 font-semibold' : ''
                          }`}
                        >
                          <span>توليد الأكواد والتعريب البرمجي</span>
                          {renderSortIcon('codeGeneration')}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleSortClick('longContext')}
                          className={`inline-flex items-center hover:text-white transition-colors cursor-pointer ${
                            sortField === 'longContext' ? 'text-emerald-400 font-semibold' : ''
                          }`}
                        >
                          <span>استخلاص السياق الطويل</span>
                          {renderSortIcon('longContext')}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleSortClick('latencyMs')}
                          className={`inline-flex items-center hover:text-white transition-colors cursor-pointer ${
                            sortField === 'latencyMs' ? 'text-emerald-400 font-semibold' : ''
                          }`}
                        >
                          <span>سرعة الاستجابة (TTFT)</span>
                          {renderSortIcon('latencyMs')}
                        </button>
                      </th>
                      <th className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleSortClick('overallScore')}
                          className={`inline-flex items-center hover:text-white transition-colors cursor-pointer ${
                            sortField === 'overallScore' ? 'text-emerald-400 font-semibold' : ''
                          }`}
                        >
                          <span>المؤشر الكلي (Overall)</span>
                          {renderSortIcon('overallScore')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e24] text-sm">
                    {filteredAndSortedModels.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-zinc-400">
                          لا توجد نماذج مطابقة لمعايير البحث الحالية.{' '}
                          <button
                            onClick={() => {
                              setModelSearch('');
                              setSelectedCategory('all');
                            }}
                            className="text-emerald-400 underline mr-2 cursor-pointer"
                          >
                            إعادة ضبط الفلاتر
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedModels.map((model, index) => {
                        const isSelected = model.id === inspectedModel.id;
                        return (
                          <tr
                            key={model.id}
                            onClick={() => setSelectedModelId(model.id)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.09]'
                                : 'hover:bg-[#13131a]'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 tabular-nums">
                              0{index + 1}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span className="font-semibold text-white font-mono">
                                  {model.name}
                                </span>
                                <span className="text-xs font-mono text-zinc-500">
                                  {model.version}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap text-xs">
                              {model.provider}
                              <span className="text-zinc-600 mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono text-zinc-400">{model.contextWindow}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-sm font-medium ${
                                    model.msaAccuracy >= 96
                                      ? 'text-emerald-400 font-semibold'
                                      : 'text-zinc-200'
                                  }`}
                                >
                                  {model.msaAccuracy.toFixed(1)}%
                                </span>
                                <div className="w-16 h-1.5 bg-[#1b1b22] rounded-xs overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full bg-emerald-400/80"
                                    style={{ width: `${model.msaAccuracy}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-sm font-medium ${
                                    model.codeGeneration >= 94.5
                                      ? 'text-cyan-400 font-semibold'
                                      : 'text-zinc-200'
                                  }`}
                                >
                                  {model.codeGeneration.toFixed(1)}%
                                </span>
                                <div className="w-16 h-1.5 bg-[#1b1b22] rounded-xs overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full bg-cyan-400/80"
                                    style={{ width: `${model.codeGeneration}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-sm font-medium ${
                                    model.longContext >= 95
                                      ? 'text-emerald-400 font-semibold'
                                      : 'text-zinc-200'
                                  }`}
                                >
                                  {model.longContext.toFixed(1)}%
                                </span>
                                <div className="w-16 h-1.5 bg-[#1b1b22] rounded-xs overflow-hidden hidden sm:block">
                                  <div
                                    className="h-full bg-emerald-400/70"
                                    style={{ width: `${model.longContext}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-zinc-300 tabular-nums whitespace-nowrap">
                              <span className="text-white font-medium">{model.latencyMs}ms</span>
                              <span className="text-zinc-500 mx-1.5">/</span>
                              <span className="text-cyan-400">{model.tokensPerSec} رمز/ث</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <span className="text-base font-bold text-emerald-400">
                                {model.overallScore.toFixed(1)}
                              </span>
                              <span className="text-xs text-zinc-500 mr-1">/ 100</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Interactive Diagnostic Panel for Selected Model */}
              <div className="border-t border-[#1e1e24] bg-[#0a0a0c] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                    <span className="text-emerald-400 font-semibold">
                      التشخيص الهندسي للنموذج المحدد:
                    </span>
                    <span className="text-white font-semibold">{inspectedModel.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{inspectedModel.provider}</span>
                    <span aria-hidden="true">·</span>
                    <span>نافذة السياق: {inspectedModel.contextWindow}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {inspectedModel.evaluationNotes}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#1e1e24]">
                  <div>
                    <div className="text-[11px] text-zinc-400">الاستدلال المنطقي (Reasoning)</div>
                    <div className="text-base font-mono font-semibold text-white tabular-nums">
                      {inspectedModel.logicalReasoning.toFixed(1)}%
                    </div>
                  </div>
                  <div className="h-7 w-[1px] bg-[#1e1e24] hidden sm:block" />
                  <div>
                    <div className="text-[11px] text-zinc-400">الضبط الصرفي والنحوي</div>
                    <div className="text-base font-mono font-semibold text-emerald-400 tabular-nums">
                      {inspectedModel.morphologicalPrecision.toFixed(1)}%
                    </div>
                  </div>
                  <div className="h-7 w-[1px] bg-[#1e1e24] hidden sm:block" />
                  <div>
                    <div className="text-[11px] text-zinc-400">معدل الهلوسة المسجل</div>
                    <div className="text-base font-mono font-semibold text-cyan-400 tabular-nums">
                      {inspectedModel.hallucinationRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Pillar 2: مستودع التوجيهات الهندسية (Engineered System Prompts Vault) */}
        <section id="prompts" className="py-16 lg:py-20 border-b border-[#1e1e24]">
          <div className="max-w-[1360px] mx-auto px-6 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs font-mono text-cyan-400">
                  الركيزة الثانية · توجيهات النظام القياسية للإنتاج (Production System Prompts)
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  02. مستودع التوجيهات الهندسية (Engineered System Prompts Vault)
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
                  مجموعة مختارة من التوجيهات النظامية المهيكلة بلغة عربية فصيحة معيارية، جرى
                  اختبارها لتقليل استهلاك الرموز (Token Efficiency)، وضمان الالتزام الصارم بمخططات
                  المخرجات <span className="font-mono text-zinc-200">JSON Schema</span> ومنع
                  الانحراف الأسلوبي أو الهلوسة.
                </p>
              </div>

              {/* Filter & Search Controls for Prompts */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'جميع التوجيهات (6)' },
                  { id: 'extraction', label: 'استخلاص JSON وNLP' },
                  { id: 'coding', label: 'البرمجة وقواعد البيانات' },
                  { id: 'academic', label: 'البحث الأكاديمي' },
                  { id: 'compliance', label: 'الحوكمة والامتثال' },
                ].map((cat) => {
                  const active = promptFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setPromptFilter(cat.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-cyan-400 text-[#0a0a0c] font-semibold'
                          : 'bg-[#0d0d11] text-zinc-400 border border-[#1e1e24] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search bar for Prompts */}
            <div className="relative max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={promptSearch}
                onChange={(e) => setPromptSearch(e.target.value)}
                placeholder="ابحث في التوجيهات الهندسية (مثل: JSON، SQL، عقود، تلخيص)..."
                aria-label="ابحث في التوجيهات الهندسية"
                className="w-full pr-9 pl-4 py-2 text-xs bg-[#0d0d11] border border-[#1e1e24] rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Prompts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPrompts.map((prompt) => {
                const isCopied = copiedPromptId === prompt.id;
                const isSampleExpanded = expandedPromptSampleId === prompt.id;

                return (
                  <article
                    key={prompt.id}
                    className="border border-[#1e1e24] rounded-lg bg-[#0d0d11] flex flex-col justify-between overflow-hidden"
                  >
                    {/* Card Top Content */}
                    <div className="p-6 space-y-4">
                      {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex flex-wrap items-center gap-2 text-zinc-400">
                          <span className="text-emerald-400 font-medium">{prompt.targetModel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{prompt.category}</span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400 tabular-nums">
                          <span>{prompt.tokenCount} رمز</span>
                          <span aria-hidden="true" className="text-zinc-600">
                            ·
                          </span>
                          <span>{prompt.tokenEfficiency}</span>
                        </div>
                      </div>

                      {/* Card Title & Description */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white leading-snug">
                          {prompt.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                          {prompt.description}
                        </p>
                      </div>

                      {/* Syntax-Highlighted System Prompt Code Box */}
                      <div className="border border-[#1e1e24] rounded-md bg-[#08080a] overflow-hidden">
                        <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1e1e24] bg-[#101015] text-[11px] font-mono text-zinc-400">
                          <span dir="ltr">
                            system_prompt.xml · temp={prompt.temperature}
                          </span>
                          <span className="text-zinc-500" dir="ltr">
                            {prompt.expectedOutputFormat}
                          </span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap">
                          <code>{prompt.systemPrompt}</code>
                        </pre>
                      </div>

                      {/* Optional Expandable Sample Input Preview */}
                      {isSampleExpanded && (
                        <div className="p-3.5 rounded-md bg-[#111117] border border-[#1e1e24] space-y-1.5 text-xs">
                          <div className="font-mono text-cyan-400">
                            مثال مدخلات الاختبار (Sample User Input):
                          </div>
                          <p className="text-zinc-300 font-mono leading-relaxed">
                            {prompt.sampleInput}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-6 py-3.5 border-t border-[#1e1e24] bg-[#0a0a0c] flex items-center justify-between gap-4">
                      <button
                        onClick={() =>
                          setExpandedPromptSampleId(isSampleExpanded ? null : prompt.id)
                        }
                        className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isSampleExpanded ? 'إخفاء عينة الاختبار' : 'معاينة مدخل تجريبي'}
                      </button>

                      <button
                        onClick={() => handleCopyPrompt(prompt.id, prompt.systemPrompt)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isCopied
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-emerald-400 text-[#0a0a0c] hover:bg-emerald-300'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم نسخ التوجيه بنجاح</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ التوجيه (Copy Prompt)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Pillar 3: قوالب البيانات المهيكلة (Schema & GEO Templates) */}
        <section id="schemas" className="py-16 lg:py-20 border-b border-[#1e1e24]">
          <div className="max-w-[1360px] mx-auto px-6 space-y-8">
            {/* Section Header */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-emerald-400">
                الركيزة الثالثة · تحسين محركات التوليد والبيانات المرابطة (JSON-LD &amp; GEO)
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                03. قوالب البيانات المهيكلة (Schema &amp; GEO Templates)
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
                قوالب <span className="font-mono text-zinc-200">JSON-LD</span> قياسية مصممة للمواقع
                التقنية العربية ومجموعات بيانات الذكاء الاصطناعي، لضمان الفهم الدلالي الكامل من قِبل
                محركات البحث التوليدية (Generative Engines) وربط الكيانات العربية بمعرفات{' '}
                <span className="font-mono text-zinc-200">Wikidata</span> القياسية.
              </p>
            </div>

            {/* Interactive Tab Switcher + Live Customizer */}
            <div className="border border-[#1e1e24] rounded-lg bg-[#0d0d11] overflow-hidden">
              {/* Top Tab Bar */}
              <div
                className="flex flex-wrap items-center gap-1 p-2 border-b border-[#1e1e24] bg-[#0a0a0c]"
                role="tablist"
                aria-label="قوالب البيانات المهيكلة"
              >
                {SCHEMA_TEMPLATES.map((tmpl) => {
                  const isActive = tmpl.id === activeSchemaTabId;
                  return (
                    <button
                      key={tmpl.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveSchemaTabId(tmpl.id)}
                      className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#16161f] text-emerald-400 border border-emerald-500/30 font-semibold'
                          : 'text-zinc-400 hover:text-white hover:bg-[#121218] border border-transparent'
                      }`}
                    >
                      {tmpl.tabLabel}
                    </button>
                  );
                })}
              </div>

              {/* Template Workspace Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Right Column (in RTL): Metadata, Technical Notes & Live Field Customizer */}
                <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-l border-[#1e1e24] flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                      <span className="text-cyan-400" dir="ltr">
                        {activeSchema.schemaType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">{activeSchema.geoImpactScore}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white leading-snug">
                      {activeSchema.title}
                    </h3>

                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {activeSchema.description}
                    </p>

                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-semibold text-zinc-200">
                        الضوابط الهندسية لتحسين الظهور التوليدي (GEO Specs):
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed list-disc pr-4">
                        {activeSchema.technicalNotes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Interactive Live Parameter Customizer */}
                  <div className="pt-5 border-t border-[#1e1e24] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تخصيص فوري لحقول المخطط (Live Schema Binding)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="schema-domain-input"
                          className="block text-[11px] text-zinc-400 mb-1"
                        >
                          النطاق الأساسي (Canonical Domain)
                        </label>
                        <input
                          id="schema-domain-input"
                          type="text"
                          dir="ltr"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono bg-[#0a0a0c] border border-[#1e1e24] rounded-md text-emerald-300 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="schema-org-input"
                          className="block text-[11px] text-zinc-400 mb-1"
                        >
                          اسم الجهة الناشرة (Publisher Name)
                        </label>
                        <input
                          id="schema-org-input"
                          type="text"
                          value={customOrgName}
                          onChange={(e) => setCustomOrgName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-[#0a0a0c] border border-[#1e1e24] rounded-md text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Column (in RTL): Clean JSON-LD Code Block & Actions */}
                <div className="lg:col-span-7 bg-[#08080a] flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#1e1e24] bg-[#101016]">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-300" dir="ltr">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <span>&lt;script type="application/ld+json"&gt;</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleDownloadSchema(activeSchema.id, activeSchema.customizedCode)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#16161f] border border-[#1e1e24] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>تنزيل .jsonld</span>
                      </button>

                      <button
                        onClick={() =>
                          handleCopySchema(activeSchema.id, activeSchema.customizedCode)
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          copiedSchemaId === activeSchema.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-emerald-400 text-[#0a0a0c] hover:bg-emerald-300'
                        }`}
                      >
                        {copiedSchemaId === activeSchema.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم نسخ الكود</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ JSON-LD</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <pre
                    className="p-5 text-xs font-mono text-emerald-300/95 overflow-x-auto leading-relaxed flex-1"
                    dir="ltr"
                  >
                    <code>{activeSchema.customizedCode}</code>
                  </pre>

                  <div className="px-5 py-3 border-t border-[#1e1e24] bg-[#0a0a0c] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>حالة التحقق الدلالي: متوافق مع معيار Schema.org Draft 2026</span>
                    <span className="font-mono text-cyan-400" dir="ltr">
                      UTF-8 · Arabic Normalized
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology & Evaluation Protocol Section */}
        <section id="methodology" className="py-14 border-b border-[#1e1e24] bg-[#0c0c10]">
          <div className="max-w-[1360px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 border border-[#1e1e24] rounded-lg bg-[#0a0a0c] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span>01. منهجية الفصحى المعيارية</span>
                  <span>MSA Syntax &amp; Morphology</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  التحقق النحوي والصرفي الخالي من الركاكة
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  تُفحص المخرجات عبر محلل صرفي ونحوي آلي متبوعاً بتحكيم لغوي أعمى لرصد أخطاء التعدية،
                  الترجمة الحرفية للأنساق الإنجليزية، واضطراب المصطلحات التقنية المعرّبة.
                </p>
              </div>

              <div className="p-6 border border-[#1e1e24] rounded-lg bg-[#0a0a0c] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span>02. بيئة التنفيذ البرمجي</span>
                  <span>AST &amp; Unit Test Sandbox</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  قياس نجاح الكود من المحاولة الأولى (Pass@1)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  تُنفّذ الشيفرات المولدة داخل حاويات معزولة مع اختبارات وحدات (Unit Tests) تشمل
                  معالجة النصوص العربية، التطبيع الإملائي، واستعلامات قواعد البيانات المهيكلة.
                </p>
              </div>

              <div className="p-6 border border-[#1e1e24] rounded-lg bg-[#0a0a0c] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span>03. استرجاع السياق الطويل</span>
                  <span>128K–2M Token Retrieval</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  اختبار الإبر البيانية في المتون القانونية والمالية
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  قياس دقة استخلاص البنود التعاقدية والأرقام المالية الدقيقة المدمجة داخل وثائق
                  عربية تتجاوز 500 ألف كلمة دون فقدان السياق أو اختلاق بنود غير موجودة.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="bg-[#0a0a0c] py-8">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white">سِياق AI | Suyaq AI</span>
            <span aria-hidden="true">·</span>
            <span>البنية المعيارية لمطوري الذكاء الاصطناعي في العالم العربي</span>
          </div>

          <div className="font-mono text-zinc-300 text-xs">
            الواجهة: Cloudflare Edge | المحرك الخلفي: Google Cloud Run
          </div>
        </div>
      </footer>

      {/* Interactive API Docs Modal */}
      <ApiDocsModal isOpen={isApiDocsOpen} onClose={() => setIsApiDocsOpen(false)} />
    </div>
  );
}
