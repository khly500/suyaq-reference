export type BenchmarkCategory = 'all' | 'coding' | 'reasoning' | 'msa';

export interface BenchmarkModel {
  id: string;
  name: string;
  version: string;
  provider: string;
  contextWindow: string;
  msaAccuracy: number; // دقة الفصحى المعيارية (%)
  codeGeneration: number; // توليد الأكواد والتعريب البرمجي (%)
  longContext: number; // استخلاص السياق الطويل (%)
  logicalReasoning: number; // التحليل المنطقي والاستنتاج (%)
  latencyMs: number; // سرعة الاستجابة (مللي ثانية للرمز الأول TTFT)
  tokensPerSec: number; // رمز/ثانية
  overallScore: number; // المؤشر الكلي
  strengths: BenchmarkCategory[];
  evaluationNotes: string;
  morphologicalPrecision: number;
  hallucinationRate: number;
}

export interface EngineeredPrompt {
  id: string;
  title: string;
  category: string;
  categoryId: 'extraction' | 'coding' | 'academic' | 'compliance';
  targetModel: string;
  tokenCount: number;
  tokenEfficiency: string;
  temperature: string;
  description: string;
  systemPrompt: string;
  sampleInput: string;
  expectedOutputFormat: string;
}

export interface SchemaTemplate {
  id: string;
  tabLabel: string;
  title: string;
  schemaType: string;
  geoImpactScore: string;
  targetUseCase: string;
  description: string;
  technicalNotes: string[];
  jsonLdCode: string;
}

export const BENCHMARK_MODELS: BenchmarkModel[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    version: '20241022-v2',
    provider: 'Anthropic',
    contextWindow: '200K رمز',
    msaAccuracy: 96.4,
    codeGeneration: 95.8,
    longContext: 94.2,
    logicalReasoning: 96.1,
    latencyMs: 410,
    tokensPerSec: 84,
    overallScore: 95.5,
    strengths: ['coding', 'reasoning', 'msa'],
    evaluationNotes:
      'يتفوق في ضبط التراكيب النحوية المعيارية وتوليد الشيفرات البرمجية الموثقة بالعربية مع التزام صارم بمخططات JSON المعقدة دون انحراف أسلوبي.',
    morphologicalPrecision: 97.1,
    hallucinationRate: 1.8,
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    version: '002-Stable',
    provider: 'Google DeepMind',
    contextWindow: '2M رمز',
    msaAccuracy: 95.2,
    codeGeneration: 92.6,
    longContext: 98.7,
    logicalReasoning: 94.8,
    latencyMs: 460,
    tokensPerSec: 79,
    overallScore: 95.1,
    strengths: ['reasoning', 'msa'],
    evaluationNotes:
      'المرجع الأول في استخلاص الإبر البيانية (Needle-in-a-Haystack) من الوثائق القانونية والمالية العربية الضخمة التي تتجاوز 500 ألف كلمة.',
    morphologicalPrecision: 95.9,
    hallucinationRate: 2.1,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    version: '2024-11-20',
    provider: 'OpenAI',
    contextWindow: '128K رمز',
    msaAccuracy: 93.8,
    codeGeneration: 93.4,
    longContext: 91.5,
    logicalReasoning: 93.9,
    latencyMs: 320,
    tokensPerSec: 108,
    overallScore: 92.9,
    strengths: ['coding', 'reasoning'],
    evaluationNotes:
      'يوفر توازناً عالياً بين زمن الاستجابة المنخفض (TTFT) ودقة التحويل بين الصيغ البرمجية والتعريب التقني لواجهات المستخدم.',
    morphologicalPrecision: 93.4,
    hallucinationRate: 2.9,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    version: '671B-MoE',
    provider: 'DeepSeek',
    contextWindow: '128K رمز',
    msaAccuracy: 90.6,
    codeGeneration: 94.9,
    longContext: 89.8,
    logicalReasoning: 95.3,
    latencyMs: 540,
    tokensPerSec: 68,
    overallScore: 91.8,
    strengths: ['coding', 'reasoning'],
    evaluationNotes:
      'أداء استثنائي في الخوارزميات وتصحيح الأخطاء البرمجية والاستنتاج الرياضي باللغة العربية بتكلفة تشغيلية منخفضة لكل مليون رمز.',
    morphologicalPrecision: 89.7,
    hallucinationRate: 3.4,
  },
  {
    id: 'allam-34b',
    name: 'ALLaM',
    version: '34B-Instruct',
    provider: 'SDAIA / سدايا',
    contextWindow: '32K رمز',
    msaAccuracy: 97.2,
    codeGeneration: 83.4,
    longContext: 86.9,
    logicalReasoning: 88.7,
    latencyMs: 285,
    tokensPerSec: 115,
    overallScore: 89.2,
    strengths: ['msa'],
    evaluationNotes:
      'أعلى دقة مسجلة في سلامة الصياغة العربية الفصيحة، وفهم السياق التشريعي والثقافي العربي، وتجنب الركاكة الناتجة عن الترجمة الحرفية.',
    morphologicalPrecision: 98.4,
    hallucinationRate: 2.2,
  },
];

export const ENGINEERED_PROMPTS: EngineeredPrompt[] = [
  {
    id: 'arabic-legal-json-extractor',
    title: 'مستخلص JSON الصارم للنصوص القانونية والتعاقدية',
    category: 'استخلاص البيانات المهيكلة',
    categoryId: 'extraction',
    targetModel: 'Optimized for Gemini 1.5 Pro',
    tokenCount: 342,
    tokenEfficiency: 'وفورات 38% في الرموز',
    temperature: '0.0',
    description:
      'توجيه هندسي مضبوط لاستخراج الالتزامات التعاقدية، الأطراف، التواريخ الهجرية والميلادية، والغرامات المالية من العقود العربية إلى كائن JSON مطابق للمخطط دون أي نص تخاطبي إضافي.',
    systemPrompt: `<system_role>
أنت محلل عقود قانونية ومُهندس استخلاص بيانات مهيكل (Strict JSON Parser) متخصص في الأنظمة التشريعية والتجارية العربية.
</system_role>

<operational_constraints>
1. يُمنع منعاً باتاً إرفاق أي مقدمات، شروحات، أو علامات تنسيق Markdown خارج كائن JSON الخام.
2. إذا كانت المعلومة غير منصوص عليها صراحةً في المتن، عيّن القيمة إلى null ولا تفترض أو تستنتج بيانات غير موجودة.
3. وحّد جميع المبالغ المالية إلى أرقام عشرية قياسية (Float) مع فصل رمز العملة في حقل مستقل وفق معيار ISO 4217.
4. احتفظ بالنص القانوني المقتبس في حقل "verbatim_clause" بالفصحى المطابقة للأصل دون تصرف.
</operational_constraints>

<output_schema>
{
  "contract_metadata": {
    "document_type": "string",
    "jurisdiction": "string | null",
    "effective_date_gregorian": "YYYY-MM-DD | null",
    "effective_date_hijri": "YYYY-MM-DD | null"
  },
  "parties": [
    { "role": "الطرف الأول | الطرف الثاني", "legal_name": "string", "registration_id": "string | null" }
  ],
  "financial_obligations": [
    { "description": "string", "amount": 0.0, "currency": "SAR | AED | EGP | USD", "due_condition": "string" }
  ],
  "penalty_clauses": [
    { "trigger_event": "string", "liability_cap": "string | null", "verbatim_clause": "string" }
  ],
  "risk_flags": ["string"]
}
</output_schema>`,
    sampleInput:
      'حُرر هذا العقد في مدينة الرياض بتاريخ 1446/04/12هـ الموافق 2024/10/15م بين شركة النظم المتقدمة (سجل تجاري 1010998877) والطرف الثاني مؤسسة الأفق، وتبلغ قيمة التوريد 450,000 ريال سعودي تُدفع على ثلاث دفعات، مع غرامة تأخير قدرها 1% عن كل أسبوع تأخير بحد أقصى 10% من إجمالي العقد.',
    expectedOutputFormat: 'JSON Object (Strict Schema Validation)',
  },
  {
    id: 'msa-code-reviewer-refactor',
    title: 'مُراجع الشيفرة البرمجية وإعادة الهيكلة بالفصحى المعيارية',
    category: 'الهندسة البرمجية والتعريب',
    categoryId: 'coding',
    targetModel: 'Optimized for Claude 3.5 Sonnet',
    tokenCount: 386,
    tokenEfficiency: 'وفورات 41% في الرموز',
    temperature: '0.1',
    description:
      'توجيه مخصص لمراجعة الشيفرات البرمجية (TypeScript / Python / Go) واكتشاف الثغرات الأمنية واختناقات الأداء، مع تقديم التقرير الهندسي والتوثيق الداخلي بلغة عربية فصيحة ومعيارية.',
    systemPrompt: `<system_role>
أنت كبير مهندسي البرمجيات وأمن التطبيقات (Principal Staff Engineer). مهمتك إجراء مراجعة معمّقة للشيفرة البرمجية (Code Review) وإعادة هيكلتها وفق معايير الإنتاج القياسية.
</system_role>

<linguistic_standard>
- استخدم اللغة العربية الفصحى المعيارية الرصينة في جميع الشروحات والتعليقات التوضيحية.
- أبقِ المصطلحات البرمجية القياسية وأسماء المتغيرات والدوال باللغة الإنجليزية داخل أقواس رمزية مثل \`AbortController\` و \`Idempotency Key\`.
- تجنب الترجمة الحرفية الركيكة؛ استعمل المصطلحات الهندسية المعتمدة (مثل: "التزامن غير المتزامن"، "حقن الاستعلامات"، "التعقيد الزمني").
</linguistic_standard>

<review_protocol>
قسّم مخرجاتك حصراً إلى الأقسام الأربعة التالية:
1. [تحليل المخاطر والأداء]: قائمة مرقمة بالثغرات الأمنية (OWASP) أو تسرب الذاكرة مع تحديد رقم السطر ومستوى الخطورة (حرج / مرتفع / متوسط).
2. [التعقيد الخوارزمي]: حساب التعقيد الزمني (Time Complexity) والمكاني (Space Complexity) قبل التعديل وبعده بصيغة Big-O.
3. [الشيفرة المُحسَّنة]: الشيفرة الكاملة بعد إعادة الهيكلة، معززة بتوثيق JSDoc/Docstring عربي فصيح ومختصر.
4. [اختبارات التحقق]: حالتا اختبار حرجتان (Edge Cases) لضمان استقرار الدالة تحت الضغط.
</review_protocol>`,
    sampleInput:
      'async function fetchUserOrders(userId: string) { const res = await db.query(`SELECT * FROM orders WHERE user_id = "${userId}"`); return res.rows.map(r => JSON.parse(r.metadata)); }',
    expectedOutputFormat: 'Markdown Technical Audit + Refactored Code Block',
  },
  {
    id: 'academic-summarizer-zero-hallucination',
    title: 'المُلخِّص الأكاديمي والبحثي الخالي من الهلوسة (RAG-Grounded)',
    category: 'البحث العلمي والتحليل',
    categoryId: 'academic',
    targetModel: 'Optimized for Gemini 1.5 Pro',
    tokenCount: 318,
    tokenEfficiency: 'وفورات 34% في الرموز',
    temperature: '0.0',
    description:
      'توجيه صارم لتلخيص الأوراق البحثية والتقارير الاقتصادية العربية مع إسناد كل ادعاء أو رقم إحصائي إلى موضعه الأصلي في النص، ومنع الاستنتاجات غير المسندة.',
    systemPrompt: `<system_role>
أنت باحث أكاديمي ومُدقّق معرفي صارم (Epistemic Fact-Grounded Synthesizer). مهمتك تلخيص الدراسات والأوراق العلمية العربية بدقة منهجية خالية تماماً من الهلوسة أو الإضافات الخارجية.
</system_role>

<grounding_rules>
1. الاعتماد الحصري على النص المرفق: لا تستدعِ أي معلومة من ذاكرتك التدريبية حتى لو كانت حقيقة علمية معروفة ما لم ترد في النص المصدر.
2. الإسناد الإلزامي: أرفق بعد كل نتيجة إحصائية أو استنتاج علامة اقتباس مرجعية تشير إلى رقم الفقرة في المصدر بصيغة [فقرة: X].
3. الفصل المنهجي: ميّز بوضوح بين "النتائج التجريبية المثبتة في الورقة" وبين "فرضيات المؤلفين وتوصياتهم".
4. الصياغة المعيارية: اكتب بلغة عربية أكاديمية رصينة وموجزة، وتجنب عبارات الحشو والإنشاء البلاغي.
</grounding_rules>

<synthesis_structure>
- الملخص التنفيذي المركز (لا يتجاوز 80 كلمة).
- المنهجية وحجم العينة وبيئة الاختبار [مع الإسناد].
- النتائج الكمية والقياسات الأساسية (تُعرض في نقاط محددة بأرقامها الدقيقة).
- حدود الدراسة والقيود المنهجية المذكورة في النص (إن وجدت، وإلا اكتب: "لم يتطرق المصدر لقيود منهجية").
</synthesis_structure>`,
    sampleInput:
      'تقرير بحثي مكون من 24 صفحة حول كفاءة نماذج المحولات اللغوية في تحليل النصوص التراثية والحديثة ومعدلات الخطأ في الإعراب الآلي.',
    expectedOutputFormat: 'Grounded Academic Summary with Paragraph Citations',
  },
  {
    id: 'dialect-to-msa-corpus-normalizer',
    title: 'مُوحِّد اللهجات العربية إلى الفصحى المعيارية للبيانات التدريبية',
    category: 'معالجة اللغات الطبيعية (NLP)',
    categoryId: 'extraction',
    targetModel: 'Optimized for ALLaM / Claude 3.5',
    tokenCount: 295,
    tokenEfficiency: 'وفورات 44% في الرموز',
    temperature: '0.1',
    description:
      'تحويل المدخلات العامية متعدّدة اللهجات (الخليجية، الشامية، المصرية، المغاربية) إلى عربية فصحى معيارية مع الحفاظ التام على القصد الدلالي ونبرة المتحدث لأغراض بناء مجموعات بيانات Fine-Tuning.',
    systemPrompt: `<system_role>
أنت محرك تطبيع لغوي عربي (Arabic Morpho-Syntactic Normalizer) مخصص لمعالجة بيانات تدريب النماذج اللغوية وواجهات خدمة العملاء الذكية.
</system_role>

<normalization_rules>
1. حوّل النص المدخل من اللهجة المحلية أو العربية الهجينة (Arabizi / Code-Switched) إلى اللغة العربية الفصحى المعيارية المعاصرة.
2. حافظ على القصد التداولي (Pragmatic Intent) ودرجة الاستعجال أو النبرة الشعورية للمستخدم دون تكلّف معجمي قديم.
3. احتفظ بالكيانات المسماة (Named Entities)، أرقام الطلبات، والرموز التقنية كما هي دون تغيير.
4. أخرج النتيجة في كائن JSON يتضمن النص الأصلي، اللهجة المكتشفة، النص الفصيح المعياري، وقائمة الكيانات المستخرجة.
</normalization_rules>

<output_schema>
{
  "detected_dialect": "GULF | LEVANTINE | EGYPTIAN | MAGHREBI | MIXED_MSA",
  "normalized_msa": "string",
  "intent_classification": "string",
  "preserved_entities": ["string"],
  "confidence_score": 0.99
}
</output_schema>`,
    sampleInput:
      'يا جماعة السيرفر صارله ساعتين يطلع خطأ 502 Bad Gateway لما نرسل الـ payload من تطبيق الآيفون، نبي حل سريع الله يعافيكم!',
    expectedOutputFormat: 'JSON Object (Dialect Classification + MSA Output)',
  },
  {
    id: 'arabic-rag-sql-synthesizer',
    title: 'مُولِّد استعلامات SQL المهيكل لقواعد البيانات العربية (Text-to-SQL)',
    category: 'الهندسة البرمجية والتعريب',
    categoryId: 'coding',
    targetModel: 'Optimized for DeepSeek-V3 / Claude 3.5',
    tokenCount: 364,
    tokenEfficiency: 'وفورات 39% في الرموز',
    temperature: '0.0',
    description:
      'تحويل الأسئلة التحليلية باللغة العربية إلى استعلامات PostgreSQL آمنة وعالية الكفاءة، مع معالجة التطبيع الإملائي للألف والهمزات والتاء المربوطة في حقول البحث النصي.',
    systemPrompt: `<system_role>
أنت مهندس قواعد بيانات (PostgreSQL Query Architect) متخصص في تحويل الاستفسارات العربية الطبيعية إلى استعلامات SQL تحليلية عالية الأداء.
</system_role>

<arabic_sql_rules>
1. استخدم استعلامات القراءة فقط (SELECT / CTEs) ويُحظر توليد أي أوامر تعديل أو حذف (DROP, DELETE, UPDATE, INSERT).
2. عند البحث في الأعمدة النصية العربية، طبّق تطبيع الحروف (توحيد أ/إ/آ إلى ا، و ه/ة) باستخدام تعابير قياسية أو دوال التطبيع لتفادي فقدان النتائج بسبب اختلاف الرسم الإملائي.
3. استخدم دائماً المعاملات المربوطة (Parameterized Placeholders مثل $1, $2) لمنع ثغرات SQL Injection.
4. أرفق شرحاً تقنياً موجزاً من سطر واحد يوضح الفهارس (Indexes) المقترحة لتسريع الاستعلام.
</arabic_sql_rules>

<output_schema>
{
  "sql_query": "string",
  "bound_parameters": ["string | number"],
  "arabic_normalization_applied": true,
  "recommended_index": "string"
}
</output_schema>`,
    sampleInput:
      'اعرض أعلى 10 عملاء من شركات القطاع المالي في مدينة الرياض من حيث إجمالي قيمة الفواتير المسددة خلال الربع الثالث من عام 2026.',
    expectedOutputFormat: 'JSON Object with Parameterized PostgreSQL Query',
  },
  {
    id: 'arabic-financial-compliance-auditor',
    title: 'محلل الامتثال المالي والتنظيمي للنشرات العربية',
    category: 'الامتثال والحوكمة التقنية',
    categoryId: 'compliance',
    targetModel: 'Optimized for Claude 3.5 Sonnet',
    tokenCount: 350,
    tokenEfficiency: 'وفورات 36% في الرموز',
    temperature: '0.0',
    description:
      'فحص مسودات الإفصاحات التقنية والمالية العربية للتحقق من توافقها مع متطلبات حوكمة البيانات، الإفصاح عن المخاطر، وخلوها من الصياغات المضللة أو غير المحددة كمياً.',
    systemPrompt: `<system_role>
أنت مدقق امتثال تنظيمي ومالي (Regulatory & Data Governance Auditor) مختص بمراجعة الإفصاحات التقنية والمالية الصادرة باللغة العربية.
</system_role>

<audit_criteria>
1. رصد العبارات الترويجية الفضفاضة غير المسندة بأرقام قياسية (مثل "الأسرع عالمياً"، "دقة مطلقة 100%") وتصنيفها كمخالفات إفصاح.
2. التحقق من وضوح سياسة الاحتفاظ بالبيانات السيادية ومقر الاستضافة السحابية داخل النطاق الجغرافي المعتمد.
3. اقتراح صياغة بديلة معيارية ورصينة لكل فقرة تحتوي على غموض تنظيمي أو التباس قانوني.
</audit_criteria>

<output_schema>
{
  "compliance_status": "PASS | REQUIRES_REVISION | NON_COMPLIANT",
  "identified_gaps": [
    {
      "severity": "HIGH | MEDIUM | LOW",
      "original_excerpt": "string",
      "regulatory_issue": "string",
      "recommended_msa_revision": "string"
    }
  ]
}
</output_schema>`,
    sampleInput:
      'تضمن منصتنا السحابية حماية كاملة بنسبة 100% لجميع بيانات العملاء المالية مع معالجة فورية في خوادمنا العالمية دون أي تأخير.',
    expectedOutputFormat: 'JSON Compliance Audit Report',
  },
];

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: 'tech-article-api-doc',
    tabLabel: 'توثيق المقالات التقنية (TechArticle)',
    title: 'مخطط JSON-LD للمقالات الهندسية وتوثيق الواجهات البرمجية العربية',
    schemaType: 'Schema.org / TechArticle + SoftwareSourceCode',
    geoImpactScore: '+42% ظهور في الاقتباسات التوليدية (GEO)',
    targetUseCase: 'مدونات الهندسة البرمجية، بوابات المطورين (Developer Portals)، وتوثيق حزم SDK العربية',
    description:
      'يُمكّن محركات البحث التوليدية (Google AI Overviews, Perplexity, SearchGPT) من فهم البنية التقنية للمقال، مستوى التخصص، المتطلبات البرمجية، وترميز اللغة العربية المعيارية بدقة.',
    technicalNotes: [
      'يحدد صراحةً "inLanguage": "ar" مع ترميز الاتجاه والمصطلحات التقنية المرتبطة بـ Wikidata لرفع الموثوقية الدلالية.',
      'يدمج كائنات about و mentions لربط المحتوى العربي بالمفاهيم الهندسية القياسية (LLM, RAG, JSON-LD).',
      'يتضمن حقل proficiencyLevel لتوجيه محركات الاسترجاع نحو شريحة المطورين ومهندسي النظم.',
    ],
    jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": "https://suyaq.ai/docs/arabic-llm-structured-outputs#article",
  "headline": "الدليل الهندسي لضبط المخرجات المهيكلة (Structured Outputs) في النماذج اللغوية العربية",
  "alternativeHeadline": "Engineering Strict JSON Schemas for Arabic LLMs in Production",
  "inLanguage": "ar",
  "proficiencyLevel": "Expert",
  "dependencies": "TypeScript 5.x, OpenAI / Anthropic / Google GenAI SDK, Zod Schema",
  "datePublished": "2026-10-01T08:00:00+03:00",
  "dateModified": "2026-10-14T14:30:00+03:00",
  "author": {
    "@type": "Organization",
    "name": "مختبر سِياق لهندسة الذكاء الاصطناعي | Suyaq AI Labs",
    "url": "https://suyaq.ai"
  },
  "publisher": {
    "@type": "Organization",
    "name": "سِياق AI | Suyaq AI",
    "logo": {
      "@type": "ImageObject",
      "url": "https://suyaq.ai/assets/logo-mark.svg"
    }
  },
  "about": [
    {
      "@type": "DefinedTerm",
      "name": "النماذج اللغوية الكبيرة",
      "alternateName": "Large Language Models (LLMs)",
      "sameAs": "https://www.wikidata.org/wiki/Q115305900"
    },
    {
      "@type": "DefinedTerm",
      "name": "الفصحى المعيارية الحديثة",
      "alternateName": "Modern Standard Arabic (MSA)",
      "sameAs": "https://www.wikidata.org/wiki/Q56467"
    }
  ],
  "citation": [
    "https://suyaq.ai/benchmarks/arabic-llm-leaderboard-2026"
  ],
  "isAccessibleForFree": true
}`,
  },
  {
    id: 'arabic-ai-dataset-corpus',
    tabLabel: 'مجموعات البيانات القياسية (Dataset)',
    title: 'مخطط توصيف مجموعات البيانات العربية ومعايير التقييم (AI Benchmark Dataset)',
    schemaType: 'Schema.org / Dataset (Google Dataset Search & GEO)',
    geoImpactScore: '+58% فهرسة في فهارس البيانات البحثية',
    targetUseCase: 'مجموعات بيانات التدريب (Corpora)، معايير التقييم (Benchmarks)، ومستودعات HuggingFace / GitHub العربية',
    description:
      'قالب معياري لتوصيف مجموعات البيانات العربية بحيث تتعرف عليها زواحف البحث العلمي ومحركات التوليد كمصدر مرجعي أولي (Primary Empirical Source) مع توثيق الرخصة وطريقة القياس.',
    technicalNotes: [
      'يوثق منهجية القياس داخل حقل measurementTechnique لتعزيز الاستشهاد التلقائي في التقارير المؤتمتة.',
      'يحدد متغيرات القياس (variableMeasured) باللغتين العربية والإنجليزية لضمان التوافق عبر اللغات (Cross-Lingual Retrieval).',
      'يدعم ربط توزيعات البيانات (DataDownload) بصيغ Parquet و JSONL مباشرة.',
    ],
    jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "@id": "https://suyaq.ai/datasets/suyaq-msa-eval-v1#dataset",
  "name": "مؤشر سِياق المعياري لتقييم النماذج اللغوية في الفصحى والبرمجة (Suyaq-MSA-Eval v1.0)",
  "alternateName": "Suyaq Arabic LLM Practical Evaluation Benchmark v1.0",
  "description": "مجموعة بيانات معيارية تضم 12,400 مهمة هندسية ولغوية محكمة لقياس دقة النماذج اللغوية في الفصحى المعيارية، توليد الشيفرات البرمجية، واستخلاص السياق الطويل.",
  "inLanguage": "ar",
  "version": "1.0.0",
  "license": "https://creativecommons.org/licenses/by-sa/4.0/",
  "creator": {
    "@type": "Organization",
    "name": "سِياق AI | Suyaq AI",
    "url": "https://suyaq.ai"
  },
  "measurementTechnique": "Automated deterministic AST evaluation + blind human linguistic adjudication in Modern Standard Arabic",
  "variableMeasured": [
    "Arabic Morpho-Syntactic Accuracy (دقة التركيب النحوي والصرفي)",
    "Arabic Code Generation Pass@1 (نجاح توليد الشيفرة من المحاولة الأولى)",
    "Long-Context Needle Retrieval at 128K Tokens (استخلاص السياق الطويل)",
    "Time-to-First-Token Latency in ms (زمن الاستجابة الأول)"
  ],
  "distribution": [
    {
      "@type": "DataDownload",
      "encodingFormat": "application/jsonl",
      "contentUrl": "https://api.suyaq.ai/v1/datasets/suyaq-msa-eval-v1.jsonl",
      "contentSize": "148 MB"
    }
  ]
}`,
  },
  {
    id: 'software-sdk-application',
    tabLabel: 'الحزم والواجهات البرمجية (SoftwareApplication)',
    title: 'مخطط توصيف الحزم البرمجية وواجهات الوكلاء الذكيين (AI Agent & SDK Schema)',
    schemaType: 'Schema.org / SoftwareApplication + WebAPI',
    geoImpactScore: '+37% دقة في توصيات أدوات المطورين',
    targetUseCase: 'حزم npm / PyPI العربية، واجهات برمجة التطبيقات (REST / gRPC APIs)، ومنصات SaaS للمطورين',
    description:
      'يُبرز المواصفات التشغيلية للواجهة البرمجية، زمن الاستجابة، البنية السحابية، ونظام التراخيص ليظهر بدقة عند بحث المطورين عن حلول برمجية تدعم اللغة العربية.',
    technicalNotes: [
      'يربط تطبيق الويب بوثائق OpenAPI 3.1 عبر حقل documentation لتسهيل استهلاك الوكلاء الآليين (AI Agents) للواجهة.',
      'يوضح متطلبات التشغيل والمنصات المدعومة دون تضخم في حجم الحزمة.',
    ],
    jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://suyaq.ai/#platform",
  "name": "منصة سِياق AI الهندسية | Suyaq AI Developer Platform",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "AI Benchmarking & Prompt Engineering Infrastructure",
  "operatingSystem": "Cloudflare Edge, Google Cloud Run, Linux, macOS, Windows",
  "softwareVersion": "1.0.0-beta",
  "inLanguage": ["ar", "en"],
  "url": "https://suyaq.ai",
  "documentation": "https://suyaq.ai/api/openapi.json",
  "featureList": [
    "مؤشر الأداء المعياري للنماذج اللغوية في العربية الفصحى",
    "مستودع التوجيهات الهندسية المُحكمة (System Prompts Vault)",
    "قوالب البيانات المهيكلة وتحسين محركات التوليد (GEO & JSON-LD)"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD",
    "description": "وصول مفتوح للمطورين والباحثين عبر الواجهة القياسية"
  }
}`,
  },
  {
    id: 'geo-citation-faq-schema',
    tabLabel: 'إجابات المحركات التوليدية (GEO FAQPage)',
    title: 'مخطط التحسين لمحركات التوليد والاقتباس المباشر (Generative Engine Optimization)',
    schemaType: 'Schema.org / FAQPage (Optimized for RAG Grounding)',
    geoImpactScore: '+64% أولوية استرجاع في أنظمة RAG',
    targetUseCase: 'صفحات التوثيق المرجعي، المقارنات المعيارية بين النماذج، والأدلة الهندسية',
    description:
      'مصمم خصيصاً ليتوافق مع خوارزميات التقطيع الدلالي (Semantic Chunking) في محركات البحث التوليدية، مما يضمن اقتباس الإجابات التقنية بأرقامها الدقيقة ونسبتها إلى منصتك.',
    technicalNotes: [
      'تُصاغ كل إجابة في فقرة مستقلة ذاتية الاكتفاء (Self-Contained Semantic Chunk) تتراوح بين 45 و75 كلمة.',
      'تتضمن الإجابات مقاييس كمية صريحة وأسماء نماذج محددة لرفع درجة الكثافة المعلوماتية (Information Density Score).',
    ],
    jsonLdCode: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://suyaq.ai/benchmarks#geo-faq",
  "inLanguage": "ar",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "ما هو النموذج اللغوي الأعلى دقة في صياغة اللغة العربية الفصحى المعيارية؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "وفق مؤشر سِياق المعياري (v1.0)، يحقق نموذج ALLaM (34B) أعلى دقة في سلامة الصياغة العربية الفصيحة بنسبة 97.2%، يليه نموذج Claude 3.5 Sonnet بنسبة 96.4% ثم Gemini 1.5 Pro بنسبة 95.2%. ويُعزى تفوق ALLaM في الفصحى إلى تدريبه المعمق على المتون العربية التشريعية والأدبية الأصيلة."
      }
    },
    {
      "@type": "Question",
      "name": "أي نموذج يتفوق في توليد الأكواد البرمجية واستخلاص السياق الطويل باللغة العربية؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "يتصدر نموذج Claude 3.5 Sonnet مهام توليد الشيفرة البرمجية والتعريب التقني بدقة 95.8% يليه DeepSeek-V3 بنسبة 94.9%. أما في مهام استخلاص السياق الطويل من الوثائق العربية التي تتجاوز 500 ألف كلمة، فيحقق Gemini 1.5 Pro المرتبة الأولى بدقة استرجاع تبلغ 98.7% بفضل نافذة سياق تصل إلى مليوني رمز."
      }
    }
  ]
}`,
  },
];
