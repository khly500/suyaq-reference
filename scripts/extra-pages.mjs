// scripts/extra-pages.mjs — صفحات الأدوات والأسئلة الشائعة والأخطاء الشائعة (تُستدعى من build-site.mjs)
import fs from 'node:fs';
import path from 'node:path';

// أوزان التقدير: انحدار خطي على 349 مقطعاً من مكتبة سِياق، مقيسة بالمُرمِّز الفعلي لكل ترميز.
// الترتيب: [حروف عربية، مسافات، أرقام، حروف لاتينية، رموز وتشكيل، أسطر جديدة]
const WEIGHTS = {
  o200k: { w: [0.3283, 0.2752, 0.7816, 0.1593, 0.7042, 0.6328], median: 0.051, p90: 0.161 },
  cl100k: { w: [0.8071, 0.2724, 0.8343, 0.1659, 0.6926, 0.3016], median: 0.045, p90: 0.139 },
};

export default function extra({ page, write, esc, NAME, SITE, SUGGEST, DATA, ROOT }) {
  const urls = [];
  const has = (id) => DATA.some((d) => d.id === id);
  const link = (id, label) => (has(id) ? `<a href="/p/${id}/">${esc(label || DATA.find((d) => d.id === id).title)}</a>` : esc(label || id));
  const crumb = (t) => `<div class="crumb"><a href="/">${NAME}</a> / ${t}</div>`;
  const add = (p, o) => { write(p.replace(/^\//, '') + 'index.html', page({ ...o, path: p })); urls.push(p); };

  // ---------- الأدوات ----------
  add('/tools/', {
    title: `أدوات للمطور العربي | ${NAME}`,
    description: 'أدوات مجانية تعمل في متصفحك بدون إرسال نصك لأي خادم: حاسبة توكنز العربي وتكلفة النماذج وغيرها.',
    body: `${crumb('الأدوات')}<h1>أدوات للمطور العربي</h1><p class="lead">أدوات صغيرة مجانية تعمل داخل متصفحك، ولا يُرسل نصك إلى أي خادم.</p>
<ul class="l"><li><a href="/tools/token-calculator/">حاسبة توكنز العربي والتكلفة</a><small>الصق نصك العربي واعرف كم توكناً يستهلك وكم يكلفك.</small></li></ul>`,
  });

  const wj = JSON.stringify({ o: WEIGHTS.o200k.w, c: WEIGHTS.cl100k.w, po: WEIGHTS.o200k.p90, pc: WEIGHTS.cl100k.p90 });
  add('/tools/token-calculator/', {
    title: `حاسبة توكنز العربي وتكلفة النماذج | ${NAME}`,
    description: 'الصق نصاً عربياً واعرف عدد التوكنز التقريبي وتكلفته في نماذج OpenAI. تعمل في متصفحك دون إرسال نصك لأي خادم.',
    body: `${crumb('<a href="/tools/">الأدوات</a> / حاسبة التوكنز')}<h1>حاسبة توكنز العربي</h1>
<p class="lead">تدفع نماذج الذكاء الاصطناعي بحسب «التوكنز» لا بحسب الكلمات، والنص العربي يستهلك منها أكثر من الإنجليزي بنفس المعنى. الصق نصك واعرف التقدير والتكلفة. كل الحساب يتم في متصفحك.</p>
<style>.tc textarea,.tc input{width:100%;font:inherit;background:var(--p1);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:10px 12px}.tc textarea{min-height:130px;resize:vertical}.tc label{display:block;font-size:14px;color:var(--mut);margin:14px 0 6px}.tc .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}.tc .card{border:1px solid var(--bd);background:var(--p1);border-radius:12px;padding:14px 16px;margin-top:14px}.tc .big{font-size:26px;font-weight:700;font-family:var(--mono)}.tc small{color:var(--mut)}</style>
<div class="tc">
<label for="t">النص العربي</label><textarea id="t" placeholder="اكتب أو الصق نصك هنا…">اكتب لي إعلاناً لشقة في الرياض فيها حوش ومشب وخصوصية عالية، بأسلوب سعودي دافئ.</textarea>
<label for="e">اختياري: ترجمة النص إلى الإنجليزية للمقارنة</label><textarea id="e" placeholder="Paste the English version to compare…"></textarea>
<div class="row"><div class="card"><small>ترميز o200k (عائلة GPT-4o وGPT-4.1)</small><div class="big" id="o">0</div><small id="oR"></small></div><div class="card"><small>ترميز cl100k (GPT-4 وGPT-3.5)</small><div class="big" id="c">0</div><small id="cR"></small></div></div>
<div class="card" id="cmp" hidden><small>نسبة العربي إلى الإنجليزي (o200k)</small><div class="big" id="ratio"></div><small id="ratioN"></small></div>
<h2>التكلفة</h2>
<div class="row"><div><label for="p">سعر المليون توكن إدخال (بالدولار)</label><input id="p" type="number" min="0" step="any" placeholder="خذه من صفحة التسعير الرسمية"></div><div><label for="n">عدد الطلبات</label><input id="n" type="number" min="1" value="1000"></div></div>
<div class="card"><small>تكلفة الإدخال التقريبية بترميز o200k</small><div class="big" id="cost">—</div></div>
</div>
<h2>كيف نحسب؟ وما حدود الدقة؟</h2>
<p class="lead">لا نستطيع تضمين المُرمِّز الكامل لأن حجمه كبير، فنقدّر العدد من تركيب النص (حروف عربية، مسافات، أرقام، حروف لاتينية، رموز، أسطر) بمعادلة مضبوطة على ${349} مقطعاً من مكتبة سِياق مقيسة بالمُرمِّز الفعلي. على مقاطع لم تدخل في الضبط: الخطأ الوسيط ${(WEIGHTS.o200k.median * 100).toFixed(0)}٪ لـ o200k و${(WEIGHTS.cl100k.median * 100).toFixed(0)}٪ لـ cl100k، و90٪ من الحالات ضمن ${(WEIGHTS.o200k.p90 * 100).toFixed(0)}٪ و${(WEIGHTS.cl100k.p90 * 100).toFixed(0)}٪ على الترتيب. الرقم تقدير وليس عدّاً دقيقاً، وتقل دقته في النصوص القصيرة جداً (بضع كلمات).</p>
<h2>قياس دقيق لجملة واحدة</h2>
<p class="lead">الجملة «الذكاء الاصطناعي يغير العالم» (٢٨ حرفاً بالمسافات) تعطي بالمُرمِّز الفعلي ١٠ توكنز في o200k و١٩ في cl100k، وترجمتها «AI is changing the world» تعطي ٥ في الترميزين. أي أن الترميز الأحدث يوفر قرابة النصف على العربي في هذا المثال، وأن الفرق مع الإنجليزي يبقى حاضراً.</p>
<h2>ماذا عن Claude وGemini؟</h2>
<p class="lead">لكل شركة مُرمِّزها الخاص، ولا نملك طريقة دقيقة لحسابه داخل المتصفح، فلا نعرض لهما أرقاماً مخمّنة. استخدم عدّاد التوكنز الرسمي في واجهة كل شركة قبل أن تقدّر ميزانيتك.</p>
<script>(function(){var W=${wj};var $=function(i){return document.getElementById(i)};
function feat(s){var a=0,sp=0,dg=0,la=0,ot=0,nl=0;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i),ch=s[i];if(c>=0x600&&c<=0x6FF){(c>=0x64B&&c<=0x65F||c===0x670)?ot++:a++}else if(ch==='\\n')nl++;else if(/\\s/.test(ch))sp++;else if(c>=48&&c<=57)dg++;else if((c>=65&&c<=90)||(c>=97&&c<=122))la++;else ot++}return [a,sp,dg,la,ot,nl]}
function est(w,s){var f=feat(s),t=0;for(var i=0;i<6;i++)t+=w[i]*f[i];return Math.max(0,Math.round(t))}
var fmt=function(n){return n.toLocaleString('ar-SA-u-nu-latn')};
function run(){var s=$('t').value,e=$('e').value,o=est(W.o,s),c=est(W.c,s);
$('o').textContent=fmt(o);$('c').textContent=fmt(c);
$('oR').textContent=o?'المدى المرجّح: '+fmt(Math.round(o*(1-W.po)))+' إلى '+fmt(Math.round(o*(1+W.po))):'';
$('cR').textContent=c?'المدى المرجّح: '+fmt(Math.round(c*(1-W.pc)))+' إلى '+fmt(Math.round(c*(1+W.pc))):'';
var eo=est(W.o,e);$('cmp').hidden=!(eo&&o);if(eo&&o){$('ratio').textContent='×'+(o/eo).toFixed(1);$('ratioN').textContent='العربي '+fmt(o)+' مقابل الإنجليزي '+fmt(eo)+' (تقديري)'}
var p=parseFloat($('p').value),n=parseFloat($('n').value)||0;$('cost').textContent=(p>=0&&o&&$('p').value!=='')?'$'+(o*n*p/1e6).toFixed(4):'—'}
['t','e','p','n'].forEach(function(i){$(i).addEventListener('input',run)});run()})()</script>`,
  });

  // ---------- الأسئلة الشائعة ----------
  const faq = [
    ['ليش الذكاء الاصطناعي يرد عليّ بفصحى رسمية باردة؟',
      `لأن أغلب النصوص العربية التي تُدرَّب عليها النماذج فصحى مكتوبة، بينما اللهجات قليلة التوثيق. الحل أن تحدد اللهجة والجمهور والنبرة صراحةً في البرومبت، وتعطي النموذج جملة مثال بالأسلوب المطلوب. جرّب ${link('msa-to-saudi')} أو ${link('saudi-reply')} أو ${link('dialect-convert')}.`,
      'لأن أغلب النصوص العربية التي تُدرَّب عليها النماذج فصحى مكتوبة، بينما اللهجات قليلة التوثيق. الحل أن تحدد اللهجة والجمهور والنبرة صراحةً في البرومبت، وتعطي النموذج جملة مثال بالأسلوب المطلوب.'],
    ['كيف أطلب لهجة سعودية بيضاء بدقة؟',
      `اكتب في الطلب: اللهجة المطلوبة (سعودية بيضاء مفهومة في كل المناطق)، والجمهور (عميل متجر مثلاً)، والنبرة (ودودة ومحترمة)، ومثالاً قصيراً من عندك، وما تريد تجنبه (كلمات فصحى ثقيلة أو ألفاظ مناطقية ضيقة). ثم اعرض الناتج على متحدث من اللهجة نفسها. انظر ${link('tone-check')} و${link('slang-gloss')}.`,
      'اكتب في الطلب: اللهجة المطلوبة، والجمهور، والنبرة، ومثالاً قصيراً من عندك، وما تريد تجنبه، ثم اعرض الناتج على متحدث من اللهجة نفسها.'],
    ['ليش النص العربي يكلفني أكثر في الـ API؟',
      'لأن الدفع يتم بحسب التوكنز، والنص العربي يتجزأ عادة إلى توكنز أكثر من الإنجليزي. بالقياس الفعلي، جملة عربية قصيرة أعطت ١٠ توكنز بترميز o200k و١٩ بترميز cl100k، مقابل ٥ لترجمتها الإنجليزية. جرّب نصك في <a href="/tools/token-calculator/">حاسبة التوكنز</a>.',
      'لأن الدفع يتم بحسب التوكنز، والنص العربي يتجزأ عادة إلى توكنز أكثر من الإنجليزي. بالقياس الفعلي، جملة عربية قصيرة أعطت ١٠ توكنز بترميز o200k و١٩ بترميز cl100k، مقابل ٥ لترجمتها الإنجليزية.'],
    ['هل أكتب البرومبت بالعربية أم بالإنجليزية؟',
      'لا توجد إجابة تصلح لكل الحالات. الإنجليزية قد تكلّف توكنز أقل، والعربية أوضح لك وأقرب لما تريد في المخرجات العربية. جرّب الصيغتين على مثال حقيقي من عملك وقارن الجودة والتكلفة معاً قبل أن تقرر.',
      'لا توجد إجابة تصلح لكل الحالات. الإنجليزية قد تكلّف توكنز أقل، والعربية أوضح لك وأقرب لما تريد في المخرجات العربية. جرّب الصيغتين على مثال حقيقي من عملك وقارن الجودة والتكلفة معاً.'],
    ['هل أضع مفتاح الـ API في كود الواجهة الأمامية؟',
      'لا. أي شيء في كود الواجهة يستطيع أي زائر رؤيته واستخدام مفتاحك بدلاً منك وعلى حسابك. اجعل الطلبات تمر عبر خادم خلفي يحتفظ بالمفتاح في متغيرات البيئة، وحدّ من استخدامه وراقب الفواتير.',
      'لا. أي شيء في كود الواجهة يستطيع أي زائر رؤيته واستخدام مفتاحك بدلاً منك وعلى حسابك. اجعل الطلبات تمر عبر خادم خلفي يحتفظ بالمفتاح في متغيرات البيئة.'],
    ['كيف أتعامل مع الأرقام الهندية (٠١٢٣) في تطبيقي؟',
      `الأرقام الهندية تفشل في التحويل والبحث والتحقق إن لم تُطبَّع. حوّلها إلى أرقام غربية قبل المعالجة بـ ${link('c3')}، وأعدها عند العرض بـ ${link('c45')} إن أردت.`,
      'الأرقام الهندية تفشل في التحويل والبحث والتحقق إن لم تُطبَّع. حوّلها إلى أرقام غربية قبل المعالجة، وأعدها عند العرض إن أردت.'],
    ['كيف أبحث في نص عربي وفيه تشكيل أو أشكال مختلفة للألف؟',
      `طبّع النص قبل المقارنة: أزل التشكيل ووحّد الألف (أ إ آ ا) والياء والتاء المربوطة بحسب حاجتك. انظر ${link('c1')} و${link('c8')}.`,
      'طبّع النص قبل المقارنة: أزل التشكيل ووحّد الألف والياء والتاء المربوطة بحسب حاجتك.'],
    ['ملف CSV عربي يظهر بحروف مكسورة في Excel، ما الحل؟',
      `يحتاج Excel أحياناً إلى علامة ترتيب البايت (UTF-8 BOM) ليتعرف على الترميز. شاهد ${link('c32')} و${link('c48')}.`,
      'يحتاج Excel أحياناً إلى علامة ترتيب البايت (UTF-8 BOM) ليتعرف على الترميز.'],
  ];
  add('/faq/', {
    title: `أسئلة شائعة عن الذكاء الاصطناعي بالعربية | ${NAME}`,
    description: 'إجابات عملية عن لهجة النماذج وتكلفة العربي في الـ API وحماية المفاتيح ومعالجة النص العربي، مع روابط لقوالب جاهزة.',
    ld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'ar', mainEntity: faq.map(([q, , plain]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain } })) }],
    body: `${crumb('أسئلة شائعة')}<h1>أسئلة شائعة</h1><p class="lead">أسئلة يطرحها المطور العربي كثيراً عند العمل مع الذكاء الاصطناعي، وإجابات مختصرة تقودك لقالب جاهز.</p>${faq.map(([q, a]) => `<h2>${esc(q)}</h2><p class="lead">${a}</p>`).join('')}`,
  });

  // ---------- أخطاء شائعة ----------
  const pit = [
    ['الأرقام الهندية والغربية', 'نص فيه «١٢٣» لا يطابق «123» في المقارنة والبحث والتحقق.', ['c3', 'c45']],
    ['التشكيل وأشكال الألف', 'كلمتان متطابقتان للقارئ تختلفان في الحاسوب بسبب التشكيل أو الهمزة.', ['c1', 'c8']],
    ['اتجاه النص RTL', 'خلط العربي بالإنجليزي والأرقام يعرض الجملة بترتيب مقلوب.', ['c40', 'c52']],
    ['ترميز CSV في Excel', 'ملف عربي سليم يظهر رموزاً غريبة عند فتحه في Excel.', ['c32', 'c48']],
    ['صيغة الجمع والعدد', 'قواعد العدد في العربية (مفرد، مثنى، جمع) لا تُعالج بجملة شرطية واحدة.', ['c41']],
    ['التاريخ الهجري', 'تحويل التقويم وعرضه يحتاج API مخصصاً لا طرح أيام.', ['c22']],
    ['تنسيق الريال وأرقام الجوال', 'مبالغ وأرقام جوال تُكتب بصيغ مختلفة فتفشل في التحقق.', ['c44', 'c35']],
    ['تكلفة التوكنز', 'العربي يستهلك توكنز أكثر، فتتضخم الفاتورة إن لم تقدّرها.', []],
  ];
  add('/pitfalls/', {
    title: `أخطاء شائعة يقع فيها المطور العربي | ${NAME}`,
    description: 'قائمة بأكثر الأخطاء تكراراً عند معالجة النص العربي والأرقام والتواريخ والاتجاه والتكلفة، مع أكواد جاهزة لكل خطأ.',
    body: `${crumb('أخطاء شائعة')}<h1>أخطاء شائعة يقع فيها المطور العربي</h1><p class="lead">أخطاء صغيرة تتكرر في أغلب المشاريع العربية، ولكل منها كود جاهز في المكتبة.</p>${pit.map(([t, d, ids]) => `<h2>${esc(t)}</h2><p class="lead">${esc(d)}${ids.filter(has).length ? ' الحل: ' + ids.filter(has).map((i) => link(i)).join('، ') + '.' : ' جرّب <a href="/tools/token-calculator/">حاسبة التوكنز</a>.'}</p>`).join('')}`,
  });

  // ---------- تعلّم: قاموس مصطلحات (لا يُضاف مصطلح إلا بمصدر رسمي مقروء) ----------
  const gl = [
    ['النموذج اللغوي (LLM)',
      'برنامج يتوقع الكلمة الجاية (أو جزء منها) بناءً على اللي قبلها. ومن هالتوقع المتكرر يطلع كلامه كله.',
      [['Google — Machine Learning Crash Course: Large language models', 'https://developers.google.cn/machine-learning/crash-course/llm']]],
    ['التوكن (Token)',
      'أصغر قطعة يتعامل معها النموذج: ممكن تكون كلمة أو جزء كلمة أو حرف. في الإنجليزي التوكن الواحد تقريباً ٤ أحرف، أو ثلاثة أرباع كلمة. والنموذج يحسب النص ويحاسبك عليه بالتوكنز، مو بالكلمات.',
      [['Google — Machine Learning Crash Course', 'https://developers.google.cn/machine-learning/crash-course/llm'], ['OpenAI Help — What are tokens and how to count them?', 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them']]],
    ['ليش العربي يكلّف أكثر؟',
      'التقطيع إلى توكنز يختلف من لغة لغة، والنص بلغة غير الإنجليزية ممكن يطلع توكنز أكثر لنفس المعنى، فتكلفة الـAPI تكون أعلى. تقدر تقدّر الفرق بنفسك من <a href="/tools/token-calculator/">حاسبة التوكنز</a>.',
      [['OpenAI Help — What are tokens and how to count them?', 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them']]],
    ['الهلوسة (Hallucination)',
      'لما النموذج يكتب كلام غلط في الوقائع، أو كلام يتعارض مع المعلومات اللي أعطيته. من طرق التخفيف: خلّه يقدر يقول «ما أعرف»، واطلب منه اقتباساً مباشراً من النص، وتحقق من المصادر.',
      [['Anthropic Docs — Reduce hallucinations', 'https://platform.claude.com/docs/claude/docs/minimizing-hallucinations']]],
    ['سير العمل مقابل الوكيل (Workflow / Agent)',
      'في سير العمل خطواتك مكتوبة مسبقاً بالكود والنموذج يمشي عليها. وفي الوكيل النموذج هو اللي يقرر خطواته واستخدامه للأدوات بنفسه. للمهام الواضحة اللي تبي فيها ثبات اختر سير العمل، وللمهام المفتوحة اختر الوكيل. والنصيحة: ابدأ بأبسط حل، ولا تزيد التعقيد إلا لو حسّن النتيجة فعلاً، لأن الوكلاء غالباً أبطأ وأغلى.',
      [['Anthropic — Building effective agents', 'https://www.anthropic.com/research/building-effective-agents']]],
  ];
  add('/learn/', {
    title: `قاموس الذكاء الاصطناعي بالعربي المبسّط | ${NAME}`,
    description: 'شرح مبسّط بالعربي لمصطلحات الذكاء الاصطناعي، كل مصطلح له مصدر رسمي. نضيف مصطلحاً جديداً فقط بعد التأكد من مصدره.',
    body: `${crumb('تعلّم')}<h1>قاموس الذكاء الاصطناعي</h1><p class="lead">شرح مبسّط، وكل تعريف تحته مصدره. ما نضيف مصطلحاً إلا بعد ما نقرأ مصدره الرسمي، والقاموس يكبر مع الوقت.</p>${gl.map(([t, d, src]) => `<h2>${t}</h2><p class="lead">${d}</p><p>المصدر: ${src.map(([n, u]) => `<a href="${u}" rel="noopener" target="_blank">${esc(n)}</a>`).join(' · ')}</p>`).join('')}`,
  });

  // ---------- قبل وبعد: تُنشأ فقط إذا وُجدت أمثلة حقيقية من تشغيل نموذج ----------
  const exFile = path.join(ROOT, 'content', 'examples.json');
  if (fs.existsSync(exFile)) {
    const ex = JSON.parse(fs.readFileSync(exFile, 'utf8')).filter((e) => e.model && e.date && e.prompt && e.before && e.after);
    if (ex.length) {
      add('/compare/', {
        title: `قبل وبعد: الفرق بين الطلب العادي والمهندس ثقافياً | ${NAME}`,
        description: 'أمثلة حقيقية من تشغيل نماذج الذكاء الاصطناعي: نفس الطلب بدون هندسة وبعدها، بنصوص الناتج كما جاءت.',
        body: `${crumb('قبل وبعد')}<h1>قبل وبعد</h1><p class="lead">كل مثال هنا ناتج حقيقي من تشغيل النموذج المذكور، ونصوصه كما جاءت دون تعديل.</p>${ex.map((e) => `<h2>${esc(e.title || e.prompt)}</h2><p class="lead">النموذج: ${esc(e.model)} · التاريخ: ${esc(e.date)}${e.promptId && has(e.promptId) ? ' · البرومبت: ' + link(e.promptId) : ''}</p><h3>قبل (طلب عادي)</h3><pre class="ar">${esc(e.before)}</pre><h3>بعد (برومبت مهندس)</h3><pre class="ar">${esc(e.after)}</pre>`).join('')}`,
      });
    }
  }
  return urls;
}
