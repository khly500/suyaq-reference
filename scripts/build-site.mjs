// scripts/build-site.mjs — مولّد موقع ثابت لـ suyaq.com (بدون أي اعتماديات)
// الاستخدام: node scripts/build-site.mjs   → ينتج مجلد dist/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://suyaq.com';
const NAME = 'سِياق';
const TAGLINE = 'مرجع المطوّر العربي للذكاء الاصطناعي';
const REPO = 'https://github.com/khly500/suyaq-reference';
const NOW = new Date().toISOString().slice(0, 10);

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), ctx);
const DATA = ctx.window.DATA; const REMOVED = ctx.window.REMOVED || {}; const SUGGEST = REPO + '/issues/new?template=prompt_suggestion.yml';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = s.replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };

// slug لكل تصنيف
const CATS = {
'برمجة': 'programming', 'كتابة': 'writing', 'لهجات': 'dialects', 'بيانات': 'data',
'تعليم': 'education', 'أعمال': 'business', 'تسويق': 'marketing', 'بحث': 'research',
'معالجة النص': 'text-processing', 'أرقام وتواريخ': 'numbers-dates',
'ملفات وبيانات': 'files-data', 'أدوات مساعدة': 'utilities', 'ذكاء اصطناعي': 'ai',
'عقار': 'real-estate', 'سياحة وتراث': 'tourism-heritage', 'محتوى سريع': 'fast-content', 'خدمة عملاء': 'customer-service',
};
const slugOf = (c) => CATS[c] || encodeURIComponent(c);

DATA.forEach((d) => {
d.desc = d.desc || (d.type === 'prompt' ? ((b) => { const ls = b.split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean); return (ls.find((x) => !/^أنت /.test(x)) || ls[0]).replace(/«?[{][{](.+?)[}][}]»?/g, '«$1»'); })(d.body).split('\n')[0] : `${d.lang} · ${d.title}`);
if (d.desc.length > 160) d.desc = d.desc.slice(0, 157).replace(/\s+\S*$/, '') + '…';
d.url = `/p/${d.id}/`;
d.kind = d.type === 'prompt' ? 'برومبت' : `كود ${d.lang}`;
});
const GEN = ['كن محدداً: كلما زادت التفاصيل في طلبك تحسّنت النتيجة.', 'جرّب البرومبت على مثال صغير قبل استخدامه في عمل حقيقي.', 'عدّل الصياغة بما يناسبك، وأعد المحاولة إن لم تعجبك النتيجة.', 'راجع الناتج بنفسك قبل الاعتماد عليه.']; const TIPS = { 'برمجة': ['اذكر لغة البرمجة وإصدارها وسياق المشروع.', 'الصق رسالة الخطأ كاملة مع الكود المتعلق بها.', 'اطلب شرح الحل قبل الكود إن أردت أن تفهمه.', 'شغّل الاختبارات وراجع الكود قبل اعتماده.'], 'كتابة': ['حدّد الجمهور والنبرة والطول في طلبك.', 'أعطِ النموذج مثالاً على أسلوبك إن وجد.', 'اطلب نسخة ثانية بنبرة مختلفة للمقارنة.', 'راجع النص بنفسك قبل نشره أو إرساله.'], 'لهجات': ['حدّد اللهجة بدقة، مثل السعودية البيضاء، لا العامية بشكل عام.', 'اطلب شرح الكلمات التي بُدّلت لتفهم سبب اختيارها.', 'اعرض النتيجة على متحدث من اللهجة نفسها للتأكد.'], 'بيانات': ['اذكر نوع قاعدة البيانات وبنية الجداول.', 'جرّب على عيّنة صغيرة قبل التشغيل على البيانات الكاملة.', 'لا ترسل بيانات حساسة أو شخصية إلى النموذج.'], 'تعليم': ['حدّد المرحلة الدراسية أو مستوى المتعلّم.', 'اطلب أمثلة من حياة المتعلّم اليومية.', 'تحقق من صحة المعلومات من مصدر موثوق.'], 'أعمال': ['اذكر المجال والجمهور والهدف المطلوب بدقة.', 'لا تضع معلومات سرية أو بيانات عملاء في الطلب.', 'عدّل النتيجة لتناسب هوية شركتك ونبرتها.'], 'تسويق': ['حدّد المنصة والجمهور والميزانية.', 'اطلب عدة أفكار ثم اختر الأنسب وطوّره.', 'اختبر الرسالة على جمهور صغير قبل التوسع.'], 'بحث': ['اطلب من النموذج ذكر مصادره ثم تحقق منها بنفسك.', 'قسّم السؤال الكبير إلى أسئلة أصغر.', 'لا تعتمد على الأرقام والتواريخ دون التأكد منها.'] }; const apiEx2 = (k, b) => { const NL = String.fromCharCode(10); const vs = [...new Set([...b.matchAll(/[{][{](.+?)[}][}]/g)].map((m) => m[1]))]; const pre = ['prompt = ' + JSON.stringify(b)].concat(vs.length ? ['values = {' + vs.map((v) => JSON.stringify(v) + ': "..."').join(', ') + '}  # املأ القيم قبل التشغيل', 'for key, val in values.items():', '    prompt = prompt.replace("{{" + key + "}}", val)'] : []); const imp = k === 'openai' ? ['from openai import OpenAI'] : k === 'claude' ? ['import anthropic'] : ['from google import genai']; const call = k === 'openai' ? ['client = OpenAI()  # المفتاح من OPENAI_API_KEY', 'res = client.chat.completions.create(', '    model="gpt-6-luna",', '    messages=[{"role": "user", "content": prompt}],', ')', 'print(res.choices[0].message.content)'] : k === 'claude' ? ['client = anthropic.Anthropic()  # المفتاح من ANTHROPIC_API_KEY', 'msg = client.messages.create(', '    model="claude-sonnet-5-5",', '    max_tokens=2048,  # الحد الأقصى لطول الرد', '    messages=[{"role": "user", "content": prompt}],', ')', 'print(msg.content[0].text)'] : ['client = genai.Client()  # المفتاح من GEMINI_API_KEY', 'res = client.models.generate_content(', '    model="gemini-3.8-flash",', '    contents=prompt,', ')', 'print(res.text)']; return imp.concat([''], pre, [''], call).join(NL); }; const ids = new Set(); DATA.forEach((d) => { if (ids.has(d.id)) throw new Error('معرّف مكرر: ' + d.id); ids.add(d.id); });

const write = (rel, content) => {
const f = path.join(DIST, rel);
fs.mkdirSync(path.dirname(f), { recursive: true });
fs.writeFileSync(f, content, 'utf8');
};

const head = ({ title, description, path: p, type = 'website', ld = [] }) => `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${p}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<meta name="theme-color" content="#0d1117">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${NAME}" href="/rss.xml">
<meta property="og:site_name" content="${NAME}">
<meta property="og:locale" content="ar_AR">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${p}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/og.png">
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}`;

// ---------- الصفحة الرئيسية: التطبيق الحالي + SEO + فهرس مقروء للزواحف ----------
const byCat = {};
DATA.forEach((d) => (byCat[d.cat] ||= []).push(d));
const catNames = Object.keys(byCat);

let app = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/^\uFEFF/, '');
const homeTitle = `${NAME} — ${TAGLINE}`;
const homeDesc = `${DATA.length} برومبتاً وكوداً عربياً جاهزاً للنسخ والتجربة: مراجعة كود، تلخيص، لهجات، SQL، معالجة النص العربي وأكثر. مجاناً ومفتوح المصدر.`;
const homeLd = [
{ '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, alternateName: ['Suyaq', 'سياق', 'سياق AI'], url: SITE + '/', inLanguage: 'ar', description: homeDesc, publisher: { '@type': 'Person', name: 'Khalil Alshamardal' } },
{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: homeTitle, url: SITE + '/', inLanguage: 'ar', hasPart: DATA.slice(0, 20).map((d) => ({ '@type': 'CreativeWork', name: d.title, url: SITE + d.url })) },
];
app = app.replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*<title>[\s\S]*?<meta name="description"[^>]*>/, head({ title: homeTitle, description: homeDesc, path: '/', ld: homeLd }));
app = app.replace('href="https://github.com/khly500/suyaq-ai"', `href="${REPO}"`);
app = app.replace('<div class="logo"><div class="mark">س</div>سِياق</div>', `<div class="logo"><div class="mark" aria-hidden="true">س</div>${NAME}</div>`);
const index = `<noscript><main style="padding:24px;max-width:860px;margin:auto;overflow:auto;height:100vh"><h2>${NAME} — ${TAGLINE}</h2><p>${esc(homeDesc)}</p>${catNames.map((c) => `<h3><a href="/c/${slugOf(c)}/">${esc(c)}</a></h3><ul>${byCat[c].map((d) => `<li><a href="${d.url}">${esc(d.title)}</a></li>`).join('')}</ul>`).join('')}</main></noscript>\n<nav aria-label="فهرس المكتبة" hidden>${DATA.map((d) => `<a href="${d.url}">${esc(d.title)}</a>`).join(' ')}</nav>\n`;
app = app.replace('<script src="data.js"></script>', index + '<script src="/data.js?v=' + DATA.length + '-' + fs.statSync(path.join(ROOT, 'data.js')).size + '"></script>');
write('index.html', app);
fs.copyFileSync(path.join(ROOT, 'data.js'), path.join(DIST, 'data.js'));

// ---------- قالب الصفحات الفرعية ----------
const CSS = `:root{--bg:#0d1117;--p1:#161b22;--p2:#1c2230;--bd:#30363d;--tx:#f0f3f6;--mut:#9198a1;--ac:#4ade9e;--gold:#d6b872;--mono:'JetBrains Mono',ui-monospace,Consolas,monospace}
*{box-sizing:border-box;margin:0}body{font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;background:var(--bg);color:var(--tx);line-height:1.8;font-size:16px}
a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}main a:not(.btn),footer a{text-decoration:underline;text-underline-offset:3px}
header{display:flex;flex-wrap:wrap;row-gap:6px;gap:16px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--bd)}header .logo{font-weight:700;font-size:18px;color:var(--tx);display:flex;gap:10px;align-items:center}
.mark{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,var(--ac),#1f9d6a);color:#04140c;font-weight:700}
header .sp{flex:1}main{max-width:860px;margin:0 auto;padding:28px 20px 70px}
.crumb{color:var(--mut);font-size:14px;margin-bottom:10px}h1{font-size:28px;line-height:1.4;margin-bottom:8px}h2{font-size:19px;margin:30px 0 10px}
.pill{display:inline-block;border:1px solid var(--bd);border-radius:999px;padding:1px 12px;font-size:13px;color:var(--mut);margin-inline-end:6px}
.lead{color:var(--mut);margin:10px 0 18px}pre{background:var(--p1);border:1px solid var(--bd);border-radius:12px;padding:16px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:var(--mono);font-size:14px;line-height:1.7;direction:auto;text-align:start}
pre.ar{font-family:inherit;font-size:15.5px}.btn{display:inline-flex;gap:8px;border:1px solid var(--bd);background:var(--p2);color:var(--tx);border-radius:10px;padding:8px 16px;font:inherit;cursor:pointer;margin:12px 8px 0 0}.btn.pri{background:var(--ac);color:#04140c;border-color:var(--ac);font-weight:600}
ul.l{list-style:none;padding:0}ul.l li{padding:10px 0;border-bottom:1px solid var(--bd)}ul.l small{color:var(--mut);display:block}footer{border-top:1px solid var(--bd);padding:22px 20px;color:var(--mut);text-align:center;font-size:14px}`;

const FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">';
const page = ({ title, description, path: p, type, ld, body }) => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
${head({ title, description, path: p, type, ld })}
${FONT}
<style>${CSS}</style>
</head>
<body>
<header><a class="logo" href="/"><span class="mark">س</span>${NAME}</a><span class="sp"></span><a href="/">المكتبة</a><a href="/tools/">الأدوات</a><a href="/faq/">الأسئلة</a><a href="${REPO}" rel="noopener">GitHub</a><a href="${SUGGEST}" target="_blank" rel="noopener">اقترح برومبت</a></header>
<main>
${body}
</main>
<footer>${NAME} — ${TAGLINE} · مجاني ومفتوح المصدر (MIT) · <a href="${REPO}" rel="noopener">GitHub</a> · <a href="/rss.xml">RSS</a> · <a href="/tools/">الأدوات</a> · <a href="/faq/">الأسئلة</a> · <a href="/pitfalls/">أخطاء شائعة</a> · <a href="/learn/">تعلّم</a> · <a href="/about/">عن الموقع</a> · <a href="/privacy/">الخصوصية</a> · <a href="/api/">API</a> · <a href="${SUGGEST}" target="_blank" rel="noopener">اقترح برومبت</a></footer>
</body>
</html>`;

// ---------- صفحة لكل عنصر ----------
for (const d of DATA) {
const related = DATA.filter((x) => x.cat === d.cat && x.id !== d.id).slice(0, 6);
const isP = d.type === 'prompt';
const vars = isP ? [...new Set([...d.body.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]))] : [];
const title = d.title.length > 40 ? `${d.title} | ${NAME}` : `${d.title} — ${isP ? 'برومبت عربي جاهز' : `كود ${d.lang} جاهز`} | ${NAME}`;
const description = clip(`${d.title}: ${isP ? 'برومبت عربي جاهز للنسخ والتجربة. ' : `كود ${d.lang} جاهز للنسخ. `}${d.desc}`, 158);
const ld = [
{ '@context': 'https://schema.org', '@type': isP ? 'CreativeWork' : 'SoftwareSourceCode', name: d.title, description: d.desc, inLanguage: 'ar', url: SITE + d.url, genre: d.cat, ...(isP ? { text: d.body } : { programmingLanguage: d.lang, codeSampleType: 'snippet', text: d.body }), isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' }, author: { '@type': 'Person', name: 'Khalil Alshamardal' }, license: 'https://opensource.org/licenses/MIT' },
...(isP ? [{ '@context': 'https://schema.org', '@type': 'HowTo', name: `كيف تستخدم برومبت «${d.title}»`, description: d.desc, inLanguage: 'ar', step: [
{ '@type': 'HowToStep', position: 1, name: 'املأ المتغيرات', text: vars.length ? `أدخل قيم: ${vars.join('، ')}.` : 'راجع نص البرومبت وعدّله حسب حاجتك.' },
{ '@type': 'HowToStep', position: 2, name: 'انسخ البرومبت', text: 'اضغط زر النسخ أو المفتاح C.' },
{ '@type': 'HowToStep', position: 3, name: 'الصقه في نموذج الذكاء الاصطناعي', text: 'الصق النص في ChatGPT أو Claude أو Gemini وأرسله.' } ] }] : []),
{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
{ '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' },
{ '@type': 'ListItem', position: 2, name: d.cat, item: `${SITE}/c/${slugOf(d.cat)}/` },
{ '@type': 'ListItem', position: 3, name: d.title, item: SITE + d.url } ] },
];
const body = `<div class="crumb"><a href="/">${NAME}</a> / <a href="/c/${slugOf(d.cat)}/">${esc(d.cat)}</a></div>
<h1>${esc(d.title)}</h1>
<div><span class="pill">${esc(d.kind)}</span><span class="pill">${esc(d.cat)}</span></div>
<p class="lead">${esc(d.desc)}</p>
${vars.length ? `<h2>املأ المتغيرات</h2><style>.vf{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 18px}.vf label{display:block;font-size:13px;margin-bottom:4px;opacity:.8}.vf textarea{width:100%;box-sizing:border-box;font:inherit;background:transparent;color:inherit;border:1px solid rgba(128,128,128,.4);border-radius:9px;padding:8px 12px}#toast{position:fixed;bottom:26px;left:50%;transform:translate(-50%,12px);background:#17171c;border:1px solid #2a2a33;color:#4ade9e;padding:9px 18px;border-radius:10px;opacity:0;pointer-events:none;transition:.2s}#toast.s{opacity:1;transform:translate(-50%,0)}</style><div class="vf" id="vf">${vars.map((v, i) => `<div><label for="v${i}">${esc(v)}</label><textarea id="v${i}" data-k="${esc(v)}" rows="${v === 'المدخل' ? 4 : 1}" placeholder="…"></textarea></div>`).join('')}</div>` : ''}
<pre id="body" class="${isP ? 'ar' : ''}"${vars.length ? ` data-src="${esc(d.body)}"` : ''}><code>${esc(d.body)}</code></pre><div id="toast" role="status"></div>
<button class="btn pri" id="cp" type="button">نسخ</button><a class="btn" href="/#${d.id}">جرّبه في المكتبة التفاعلية</a>${isP ? '<a class="btn" id="gpt" href="https://chatgpt.com/" target="_blank" rel="noopener">جرّب في ChatGPT</a><a class="btn" id="cl" href="https://claude.ai/new" target="_blank" rel="noopener">جرّب في Claude</a><a class="btn" id="gm" href="https://gemini.google.com/app" target="_blank" rel="noopener">جرّب في Gemini</a>' : ''}<button class="btn" id="sh" type="button">مشاركة</button>
${vars.length ? `<h2>المتغيرات</h2><p class="lead">يحتوي على: ${vars.map((v) => `<code>{{${esc(v)}}}</code>`).join('، ')} — استبدلها بمدخلاتك.</p>` : ''}
${isP ? `<h2>كيف تستخدمه</h2><ol class="lead"><li>املأ المتغيرات إن وجدت، أو عدّل النص ليناسب حاجتك.</li><li>انسخ البرومبت بزر «نسخ».</li><li>الصقه في ChatGPT أو Claude أو Gemini، أو أرسله عبر الـ API.</li><li>راجع الناتج وعدّله قبل استخدامه.</li></ol><h2>نصائح للحصول على نتيجة أفضل</h2><ul class="l">${(TIPS[d.cat] || GEN).map((t) => `<li>${t}</li>`).join('')}</ul><h2>استخدمه عبر الـ API</h2><p class="lead">أمثلة بايثون جاهزة. استبدل قيم المتغيرات قبل التشغيل.</p><h3>OpenAI</h3><pre dir="ltr"><code>${esc(apiEx2('openai', d.body))}</code></pre><h3>Claude</h3><pre dir="ltr"><code>${esc(apiEx2('claude', d.body))}</code></pre><h3>Gemini</h3><pre dir="ltr"><code>${esc(apiEx2('gemini', d.body))}</code></pre>` : ''}<h2>المزيد من ${esc(d.cat)}</h2><ul class="l">${related.map((r) => `<li><a href="${r.url}">${esc(r.title)}</a><small>${esc(r.kind)}</small></li>`).join('')}</ul>
<script>(function(){var B=document.getElementById('body'),C=document.getElementById('cp'),T=document.getElementById('toast');function toast(m){if(!T)return;T.textContent=m;T.className='s';clearTimeout(toast.t);toast.t=setTimeout(function(){T.className=''},1500)}
function cp(){var t=B.innerText;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){C.textContent='تم النسخ ✓';toast('تم النسخ')}).catch(function(){var r=document.createRange();r.selectNodeContents(B);var s=getSelection();s.removeAllRanges();s.addRange(r);C.textContent='حدّد النص وانسخه'});setTimeout(function(){C.textContent='نسخ'},1800)}
C.onclick=cp;var G=document.getElementById('gpt'),K=document.getElementById('cl'),S=document.getElementById('sh');if(G){G.onclick=function(){G.href='https://chatgpt.com/?q='+encodeURIComponent(B.innerText)};K.onclick=function(){K.href='https://claude.ai/new?q='+encodeURIComponent(B.innerText)};var M=document.getElementById('gm');M.onclick=function(){if(navigator.clipboard){navigator.clipboard.writeText(B.innerText);toast('تم نسخ البرومبت، الصقه في Gemini')}}}S.onclick=function(){if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){})}else if(navigator.clipboard){navigator.clipboard.writeText(location.href).then(function(){toast('تم نسخ الرابط')})}};var src=B.getAttribute('data-src');if(src){var vals={};var up=function(){B.firstChild.textContent=src.replace(/[{][{](.+?)[}][}]/g,function(m,k){return vals[k]||m})};document.querySelectorAll('#vf textarea').forEach(function(t){t.oninput=function(){vals[t.getAttribute('data-k')]=t.value;up()}})}
document.addEventListener('keydown',function(e){if(e.key&&e.key.toLowerCase()==='c'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA)$/.test((e.target||{}).tagName||'')&&!String(getSelection())){cp()}})})()</script>`;
write(`p/${d.id}/index.html`, page({ title, description, path: d.url, type: 'article', ld, body }));
}

// ---------- واجهة المطورين: JSON ثابت /api/v1/ ----------
const varsOf = (d) => (d.type === 'prompt' ? [...new Set([...d.body.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]))] : []);
const snip = (d) => ({ id: d.id, title: d.title, description: d.desc, type: d.type, category: d.cat, language: d.type === 'code' ? d.lang : 'ar', content: d.body, variables: varsOf(d), url: SITE + d.url, api: `${SITE}/api/v1/snippets/${d.id}.json`, license: 'MIT' });
for (const d of DATA) write(`api/v1/snippets/${d.id}.json`, JSON.stringify(snip(d), null, 2));
write('api/v1/snippets.json', JSON.stringify({ count: DATA.length, updated: NOW, items: DATA.map((d) => ({ id: d.id, title: d.title, type: d.type, category: d.cat, language: d.type === 'code' ? d.lang : 'ar', api: `${SITE}/api/v1/snippets/${d.id}.json` })) }, null, 2));
const first = DATA.find((d) => d.type === 'prompt') || DATA[0];
const apiBody = `<div class="crumb"><a href="/">${NAME}</a> / API</div>
<h1>واجهة سِياق للمطورين</h1>
<p class="lead">كل برومبت وكود في سِياق متاح كـ JSON نظيف، مجاناً وبدون مفتاح، ويدعم CORS من أي موقع.</p>
<h2>القائمة الكاملة</h2><pre><code>GET ${SITE}/api/v1/snippets.json</code></pre>
<h2>عنصر واحد</h2><pre><code>GET ${SITE}/api/v1/snippets/{id}.json</code></pre>
<h2>مثال</h2><pre><code>curl ${SITE}/api/v1/snippets/${first.id}.json</code></pre>
<pre><code>${esc(JSON.stringify(snip(first), null, 2))}</code></pre>
<h2>الحقول</h2><p class="lead">id، title، description، type (prompt أو code)، category، language، content، variables (مصفوفة أسماء المتغيرات)، url، api، license.</p>
<h2>استبدال المتغيرات</h2><pre><code>fetch('${SITE}/api/v1/snippets/${first.id}.json').then(r => r.json()).then(s => {
const text = s.content.replace(/\\{\\{(.+?)\\}\\}/g, (m, k) => values[k] ?? m);
});</code></pre>
<p class="lead">الترخيص MIT. الشيفرة على <a href="${REPO}" rel="noopener">GitHub</a>.</p>`;
write('api/index.html', page({ title: `واجهة المطورين (API) | ${NAME}`, description: 'JSON مجاني لكل برومبت وكود عربي في سِياق، مع المتغيرات والترخيص، يدعم CORS.', path: '/api/', body: apiBody }));

write('about/index.html', page({ title: `عن الموقع | ${NAME}`, description: 'سِياق مكتبة عربية مجانية ومفتوحة المصدر للبرومبتات والأكواد الجاهزة لمن يعمل مع الذكاء الاصطناعي.', path: '/about/', body: `<div class="crumb"><a href="/">${NAME}</a> / عن الموقع</div><h1>عن سِياق</h1><p class="lead">سِياق مكتبة عربية مجانية للبرومبتات والأكواد الجاهزة لمن يعمل مع الذكاء الاصطناعي. فيه الآن ${DATA.length} عنصراً مرتبة في ${catNames.length} تصنيفاً، وكلها قابلة للنسخ والتجربة مباشرة.</p><h2>لماذا سِياق؟</h2><p class="lead">معظم مراجع البرومبتات بالإنجليزية، ونصوصها العربية قليلة أو مترجمة ترجمة حرفية. هنا كُتبت البرومبتات بالعربية من الأساس، وفيها متغيرات تملؤها وتنسخ النتيجة جاهزة.</p><h2>من وراء الموقع؟</h2><p class="lead">أعدّه خليل الشمردل (Khal!l) ويطوّره باستمرار.</p><h2>شارك</h2><p class="lead">عندك برومبت مفيد؟ <a href="${SUGGEST}" target="_blank" rel="noopener">اقترحه</a> وسأراجعه وأضيفه. والمشروع مفتوح المصدر على <a href="${REPO}" rel="noopener">GitHub</a> برخصة MIT، وله <a href="/api/">واجهة JSON</a> مجانية.</p><h2>تنبيه</h2><p class="lead">البرومبتات نقطة بداية، ونتائج الذكاء الاصطناعي قد تحتوي على أخطاء. راجع الناتج قبل الاعتماد عليه، ولا ترسل بيانات سرية أو شخصية إلى أي نموذج.</p>` })); write('privacy/index.html', page({ title: `سياسة الخصوصية | ${NAME}`, description: 'كيف يتعامل سِياق مع بياناتك: لا حسابات ولا تتبع ولا إعلانات.', path: '/privacy/', body: `<div class="crumb"><a href="/">${NAME}</a> / الخصوصية</div><h1>سياسة الخصوصية</h1><p class="lead">آخر تحديث: ${NOW}.</p><h2>ما الذي نجمعه؟</h2><p class="lead">لا يطلب سِياق حساباً ولا بريداً ولا أي بيانات شخصية، ولا يعرض إعلانات. يستخدم الموقع «تحليلات Cloudflare» (Cloudflare Web Analytics) لقياس عدد الزيارات والصفحات الأكثر زيارة، وهي أداة تحترم الخصوصية: لا تستخدم ملفات الكوكيز ولا تتبّع الأفراد عبر المواقع.</p><h2>ما يُحفظ في متصفحك</h2><p class="lead">المفضلة التي تحفظها تُخزَّن في متصفحك فقط ولا تُرسل إلينا، ويمكنك حذفها بمسح بيانات الموقع من المتصفح.</p><h2>خدمات خارجية</h2><p class="lead">يُحمَّل الخط من Google Fonts، فيصل الطلب إلى خوادم Google وفق سياستها. ويُستضاف الموقع على Cloudflare Pages، وقد تسجّل خوادمها عنوان IP لأغراض التشغيل والأمان. وعند ضغطك «جرّب في ChatGPT» أو «جرّب في Claude» يُفتح موقع الخدمة ويُرسل إليها نص البرومبت الظاهر في الصفحة، وتخضع لسياسة تلك الخدمة. أما زر Gemini فينسخ النص إلى حافظتك فقط ثم يفتح Gemini.</p><h2>اقتراح برومبت</h2><p class="lead">يتم الاقتراح عبر GitHub، وما تكتبه هناك علني ويخضع لسياسة GitHub.</p><h2>التواصل</h2><p class="lead">لأي سؤال افتح طلباً في <a href="${REPO}/issues" rel="noopener">GitHub</a>.</p>` })); // ---------- صفحات التصنيفات ----------
for (const c of catNames) {
const list = byCat[c];
const p = `/c/${slugOf(c)}/`;
const title = `${c} — برومبتات وأكواد عربية جاهزة | ${NAME}`;
const cnt = list.length === 1 ? 'عنصر واحد' : list.length === 2 ? 'عنصران' : list.length <= 10 ? `${list.length} عناصر` : `${list.length} عنصراً`;
const description = clip(`${cnt} في تصنيف «${c}»: ${list.slice(0, 4).map((d) => d.title).join('، ')}${list.length > 4 ? ' وغيرها' : ''}، جاهزة للنسخ.`, 158);
const ld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: c, url: SITE + p, inLanguage: 'ar', mainEntity: { '@type': 'ItemList', itemListElement: list.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + d.url, name: d.title })) } }];
write(`c/${slugOf(c)}/index.html`, page({ title, description, path: p, ld, body: `<div class="crumb"><a href="/">${NAME}</a></div><h1>${esc(c)}</h1><p class="lead">${esc(description)}</p><ul class="l">${list.map((d) => `<li><a href="${d.url}">${esc(d.title)}</a><small>${esc(d.kind)} — ${esc(clip(d.desc, 110))}</small></li>`).join('')}</ul>` }));
}

// ---------- الأدوات والأسئلة ----------
const extraUrls = (await import('./extra-pages.mjs')).default({ page, write, esc, NAME, SITE, SUGGEST, DATA, ROOT });

// ---------- ملفات الزواحف ----------
const urls = ['/', '/api/', '/about/', '/privacy/', ...extraUrls, ...catNames.map((c) => `/c/${slugOf(c)}/`), ...DATA.map((d) => d.url)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${NOW}</lastmod><priority>${u === '/' ? '1.0' : u.startsWith('/c/') ? '0.7' : '0.6'}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${NAME} — ${TAGLINE}</title><link>${SITE}/</link><description>${esc(homeDesc)}</description><language>ar</language>\n${DATA.slice(0, 50).map((d) => `<item><title>${esc(d.title)}</title><link>${SITE}${d.url}</link><guid>${SITE}${d.url}</guid><description>${esc(d.desc)}</description><category>${esc(d.cat)}</category></item>`).join('\n')}\n</channel></rss>\n`);
write('404.html', page({ title: `الصفحة غير موجودة | ${NAME}`, description: 'الصفحة المطلوبة غير موجودة.', path: '/404.html', body: `<h1>الصفحة غير موجودة</h1><p class="lead">ربما تغيّر الرابط. <a href="/">ارجع إلى المكتبة</a>.</p>` }).replace('content="index,follow,max-snippet:-1,max-image-preview:large"', 'content="noindex"'));
for (const f of ['favicon.svg', 'site.webmanifest']) {
const src = path.join(ROOT, 'public', f);
if (fs.existsSync(src)) write(f, fs.readFileSync(src, 'utf8').replace(/^\uFEFF/, ''));
}
fs.copyFileSync(path.join(ROOT, 'public', 'og.png'), path.join(DIST, 'og.png'));
// favicon.ico: ملف ICO يحتوي صورة PNG 32×32 (المصدر نص base64 في public لأن المستودع يُحرَّر نصياً)
{
  const png = Buffer.from(fs.readFileSync(path.join(ROOT, 'public', 'favicon-32.png.b64'), 'utf8').trim(), 'base64');
  const ico = Buffer.alloc(22);
  ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
  ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
  ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(DIST, 'favicon.ico'), Buffer.concat([ico, png]));
}
// security.txt (RFC 9116)
write('.well-known/security.txt', [
  `Contact: ${REPO}/security/advisories/new`,
  `Expires: ${new Date(Date.now() + 300 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z')}`,
  'Preferred-Languages: ar, en',
  `Canonical: ${SITE}/.well-known/security.txt`,
  `Policy: ${REPO}/blob/main/SECURITY.md`,
  '',
].join('\n'));
write('_redirects', Object.entries(REMOVED).flatMap(([a, b]) => ['/p/' + a + ' /p/' + b + '/ 301', '/p/' + a + '/ /p/' + b + '/ 301']).join(String.fromCharCode(10)) + String.fromCharCode(10)); write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n  Strict-Transport-Security: max-age=31536000\n  Cross-Origin-Opener-Policy: same-origin\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'\n/data.js\n  Content-Type: text/javascript; charset=utf-8\n  Cache-Control: public, max-age=0, must-revalidate\n/api/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n/p/*\n  Cache-Control: public, max-age=3600\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n`);
console.log(`✅ ${DATA.length} عنصر → ${DATA.length} صفحة + ${catNames.length} تصنيف + sitemap/robots/rss/404 → dist/`);
