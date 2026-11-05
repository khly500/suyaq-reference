import React, { useState } from 'react';
import { X, Copy, Check, Play, Terminal } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENDPOINTS = [
  {
    id: 'benchmarks',
    method: 'GET',
    path: '/v1/benchmarks/arabic-llm',
    title: 'استرجاع نتائج المؤشر المعياري العربي',
    description:
      'يعيد مصفوفة مرتبة لأحدث قياسات النماذج اللغوية في الفصحى المعيارية، توليد الشيفرة، واستخلاص السياق الطويل مع زمن الاستجابة الفعلي.',
    curlExample: `curl -X GET "https://api.suyaq.ai/v1/benchmarks/arabic-llm?category=all&sort=overallScore" \\
  -H "Authorization: Bearer syq_live_98a7bc65d4e3f210" \\
  -H "Accept-Language: ar-SA" \\
  -H "Content-Type: application/json"`,
    responsePreview: `{
  "version": "v1.0-beta",
  "evaluated_at": "2026-10-14T20:00:00Z",
  "engine": "Google Cloud Run (me-central2)",
  "total_tasks": 12400,
  "leaderboard": [
    {
      "rank": 1,
      "model": "Claude 3.5 Sonnet",
      "provider": "Anthropic",
      "scores": {
        "msa_accuracy": 96.4,
        "arabic_code_gen": 95.8,
        "long_context_128k": 94.2,
        "overall": 95.5
      },
      "latency_ttft_ms": 410
    },
    {
      "rank": 2,
      "model": "Gemini 1.5 Pro",
      "provider": "Google DeepMind",
      "scores": {
        "msa_accuracy": 95.2,
        "arabic_code_gen": 92.6,
        "long_context_128k": 98.7,
        "overall": 95.1
      },
      "latency_ttft_ms": 460
    }
  ]
}`,
  },
  {
    id: 'prompts',
    method: 'POST',
    path: '/v1/prompts/compile',
    title: 'تجميع التوجيه الهندسي مع التحقق من المخطط',
    description:
      'يقوم بحقن المتغيرات الديناميكية داخل قالب التوجيه الهندسي المعتمد وحساب عدد الرموز الفعلي (Token Count) قبل الإرسال إلى النموذج الهدف.',
    curlExample: `curl -X POST "https://api.suyaq.ai/v1/prompts/compile" \\
  -H "Authorization: Bearer syq_live_98a7bc65d4e3f210" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "arabic-legal-json-extractor",
    "target_model": "gemini-1-5-pro",
    "strict_schema": true,
    "variables": {
      "jurisdiction": "المملكة العربية السعودية - نظام المعاملات المدنية"
    }
  }'`,
    responsePreview: `{
  "compiled": true,
  "template_id": "arabic-legal-json-extractor",
  "target_model": "gemini-1-5-pro",
  "estimated_tokens": 342,
  "token_savings_ratio": "38%",
  "schema_validation": "PASS_DRAFT_2020_12"
}`,
  },
  {
    id: 'geo-validate',
    method: 'POST',
    path: '/v1/schemas/validate-geo',
    title: 'فحص توافق JSON-LD مع محركات التوليد (GEO)',
    description:
      'يتحقق من صحة وسوم Schema.org للوثائق العربية ويقيس كثافة الكيانات الدلالية المرتبطة بمعرفات Wikidata لرفع أولوية الاسترجاع في أنظمة RAG.',
    curlExample: `curl -X POST "https://api.suyaq.ai/v1/schemas/validate-geo" \\
  -H "Authorization: Bearer syq_live_98a7bc65d4e3f210" \\
  -H "Content-Type: application/ld+json" \\
  -d '{
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "inLanguage": "ar",
    "headline": "الدليل الهندسي لضبط المخرجات المهيكلة"
  }'`,
    responsePreview: `{
  "valid_json_ld": true,
  "detected_type": "TechArticle",
  "language_tag": "ar (Modern Standard Arabic verified)",
  "geo_readiness_score": 96.8,
  "recommendations": []
}`,
  },
];

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(ENDPOINTS[0].id);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeEndpoint = ENDPOINTS.find((e) => e.id === selectedEndpointId) || ENDPOINTS[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(key);
    setTimeout(() => setCopiedBlock(null), 1800);
  };

  const handleRunTest = () => {
    setIsSimulating(true);
    setSimulatedResponse(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedResponse(activeEndpoint.responsePreview);
    }, 180);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-docs-title"
    >
      <div className="w-full max-w-5xl bg-[#0d0d11] border border-[#1e1e24] rounded-lg overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e24] bg-[#0a0a0c]">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 id="api-docs-title" className="text-base font-semibold text-[#f4f4f6]">
              توثيق الواجهة البرمجية القياسية (Suyaq REST &amp; gRPC API)
            </h2>
            <span className="text-xs text-zinc-400 font-mono" dir="ltr">
              v1.0-beta · OAS 3.1
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-[#16161d] transition-colors cursor-pointer"
            aria-label="إغلاق نافذة التوثيق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Sidebar List of Endpoints */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-l border-[#1e1e24] bg-[#0a0a0c] p-4 space-y-2">
            <div className="text-xs font-medium text-zinc-400 px-2 pb-2">
              نقاط النهاية المتاحة (Endpoints)
            </div>
            {ENDPOINTS.map((ep) => {
              const isSelected = ep.id === selectedEndpointId;
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpointId(ep.id);
                    setSimulatedResponse(null);
                  }}
                  className={`w-full text-right p-3 rounded-md border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#13131a] border-emerald-500/40 text-white'
                      : 'bg-transparent border-transparent text-zinc-400 hover:bg-[#121217] hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-200">{ep.title}</span>
                    <span
                      className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-xs ${
                        ep.method === 'GET'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-cyan-400 bg-cyan-500/10'
                      }`}
                      dir="ltr"
                    >
                      {ep.method}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-zinc-500 truncate" dir="ltr">
                    {ep.path}
                  </div>
                </button>
              );
            })}

            <div className="mt-6 pt-4 border-t border-[#1e1e24] px-2 space-y-2 text-xs text-zinc-400">
              <div className="font-medium text-zinc-300">نقطة الاتصال الأساسية (Base URL)</div>
              <div
                className="font-mono text-[11px] bg-[#121217] border border-[#1e1e24] rounded-sm px-2.5 py-2 text-emerald-300 select-all"
                dir="ltr"
              >
                https://api.suyaq.ai/v1
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                تُخدّم جميع الطلبات عبر شبكة Cloudflare Edge مع توجيه خلفي مباشر إلى عقد Google Cloud Run.
              </p>
            </div>
          </div>

          {/* Endpoint Details & Live Runner */}
          <div className="lg:col-span-8 p-6 space-y-5 bg-[#0d0d11]">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{activeEndpoint.title}</h3>
                <button
                  onClick={handleRunTest}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-emerald-500 text-[#0a0a0c] hover:bg-emerald-400 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 font-semibold"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>تشغيل طلب تجريبي (Run Request)</span>
                </button>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{activeEndpoint.description}</p>
            </div>

            {/* Request cURL Block */}
            <div className="border border-[#1e1e24] rounded-md overflow-hidden bg-[#0a0a0c]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e24] bg-[#111116]">
                <span className="text-xs font-mono text-zinc-400" dir="ltr">
                  cURL Request
                </span>
                <button
                  onClick={() => handleCopy(activeEndpoint.curlExample, 'curl')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {copiedBlock === 'curl' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الأمر</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed"
                dir="ltr"
              >
                <code>{activeEndpoint.curlExample}</code>
              </pre>
            </div>

            {/* Response Preview Block */}
            <div className="border border-[#1e1e24] rounded-md overflow-hidden bg-[#0a0a0c]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e24] bg-[#111116]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-400" dir="ltr">
                    JSON Response (200 OK)
                  </span>
                  {simulatedResponse && (
                    <span className="text-xs font-mono text-emerald-400" dir="ltr">
                      · Executed in 38ms
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(activeEndpoint.responsePreview, 'resp')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {copiedBlock === 'resp' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ المخرجات</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                className="p-4 text-xs font-mono text-emerald-300/95 overflow-x-auto leading-relaxed"
                dir="ltr"
              >
                <code>
                  {isSimulating ? '// جاري الاتصال بمحرك Google Cloud Run...' : activeEndpoint.responsePreview}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
