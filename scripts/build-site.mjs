// scripts/build-site.mjs — مولّد موقع ثابت لـ ai.skakh.com (بدون أي اعتماديات)
// الاستخدام: node scripts/build-site.mjs   → ينتج مجلد dist/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://ai.skakh.com';
const NAME = 'سِياق';
const TAGLINE = 'مرجع المطوّر العربي للذكاء الاصطناعي';
const REPO = 'https://github.com/khly500/suyaq-reference';
const NOW = new Date().toISOString().slice(0, 10);

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), ctx);
const DATA = ctx.window.DATA;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = s.replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };

// slug لكل تصنيف
const CATS = {
  'برمجة': 'programming', 'كتابة': 'writing', 'لهجات': 'dialects', 'بيانات': 'data',
  'تعليم': 'education', 'أعمال': 'business', 'تسويق': 'marketing', 'بحث': 'research',
  'معالجة النص': 'text-processing', 'أرقام وتواريخ': 'numbers-dates',
  'ملفات وبيانات': 'files-data', 'أدوات مساعدة': 'utilities',
};
const slugOf = (c) => CATS[c] || encodeURIComponent(c);

DATA.forEach((d) => {
  d.desc = d.desc || (d.type === 'prompt' ? d.body.split('\n')[0] : `${d.lang} · ${d.title}`);
  d.url = `/p/${d.id}/`;
  d.kind = d.type === 'prompt' ? 'برومبت' : `كود ${d.lang}`;
});
const ids = new Set(); DATA.forEach((d) => { if (ids.has(d.id)) throw new Error('معرّف مكرر: ' + d.id); ids.add(d.id); });

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
<meta name="theme-color" content="#09090b">
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
  { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, alternateName: 'Suyaq', url: SITE + '/', inLanguage: 'ar', description: homeDesc, publisher: { '@type': 'Person', name: 'Khalil Alshamardal' } },
  { '@context': 'https://schema.org', '@type': 'CollectionPage', name: homeTitle, url: SITE + '/', inLanguage: 'ar', hasPart: DATA.slice(0, 20).map((d) => ({ '@type': 'CreativeWork', name: d.title, url: SITE + d.url })) },
];
app = app.replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*<title>[\s\S]*?<meta name="description"[^>]*>/, head({ title: homeTitle, description: homeDesc, path: '/', ld: homeLd }));
app = app.replace('href="https://github.com/khly500/suyaq-ai"', `href="${REPO}"`);
app = app.replace('<div class="logo"><div class="mark">س</div>سِياق</div>', `<h1 class="logo" style="position:relative"><span class="mark">س</span>${NAME}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"> — ${TAGLINE}</span></h1>`);
const index = `<noscript><main style="padding:24px;max-width:860px;margin:auto;overflow:auto;height:100vh"><h2>${NAME} — ${TAGLINE}</h2><p>${esc(homeDesc)}</p>${catNames.map((c) => `<h3><a href="/c/${slugOf(c)}/">${esc(c)}</a></h3><ul>${byCat[c].map((d) => `<li><a href="${d.url}">${esc(d.title)}</a></li>`).join('')}</ul>`).join('')}</main></noscript>\n<nav aria-label="فهرس المكتبة" hidden>${DATA.map((d) => `<a href="${d.url}">${esc(d.title)}</a>`).join(' ')}</nav>\n`;
app = app.replace('<script src="data.js"></script>', index + '<script src="/data.js"></script>');
write('index.html', app);
fs.copyFileSync(path.join(ROOT, 'data.js'), path.join(DIST, 'data.js'));

// ---------- قالب الصفحات الفرعية ----------
const CSS = `:root{--bg:#09090b;--p1:#0f0f12;--p2:#151518;--bd:rgba(255,255,255,.09);--tx:#ececef;--mut:#9a9aa3;--ac:#4ade9e;--gold:#d6b872;--mono:'JetBrains Mono',ui-monospace,Consolas,monospace}
*{box-sizing:border-box;margin:0}body{font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;background:radial-gradient(900px 380px at 75% -8%,rgba(74,222,158,.07),transparent),var(--bg);color:var(--tx);line-height:1.8;font-size:16px}
a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}
header{display:flex;gap:16px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--bd)}header .logo{font-weight:700;font-size:18px;color:var(--tx);display:flex;gap:10px;align-items:center}
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
<header><a class="logo" href="/"><span class="mark">س</span>${NAME}</a><span class="sp"></span><a href="/">المكتبة</a><a href="${REPO}" rel="noopener">GitHub</a></header>
<main>
${body}
</main>
<footer>${NAME} — ${TAGLINE} · مجاني ومفتوح المصدر (MIT) · <a href="${REPO}" rel="noopener">GitHub</a> · <a href="/rss.xml">RSS</a></footer>
</body>
</html>`;

// ---------- صفحة لكل عنصر ----------
for (const d of DATA) {
  const related = DATA.filter((x) => x.cat === d.cat && x.id !== d.id).slice(0, 6);
  const isP = d.type === 'prompt';
  const vars = isP ? [...new Set([...d.body.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]))] : [];
  const title = `${d.title} — ${isP ? 'برومبت عربي جاهز' : `كود ${d.lang} جاهز`} | ${NAME}`;
  const description = clip(`${d.title}: ${isP ? 'برومبت عربي جاهز للنسخ والتجربة. ' : `كود ${d.lang} جاهز للنسخ. `}${d.desc}`, 158);
  const ld = [
    { '@context': 'https://schema.org', '@type': isP ? 'CreativeWork' : 'SoftwareSourceCode', name: d.title, description: d.desc, inLanguage: 'ar', url: SITE + d.url, genre: d.cat, ...(isP ? { text: d.body } : { programmingLanguage: d.lang, codeSampleType: 'snippet', text: d.body }), isPartOf: { '@type': 'WebSite', name: NAME, url: SITE + '/' }, author: { '@type': 'Person', name: 'Khalil Alshamardal' }, license: 'https://opensource.org/licenses/MIT' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: NAME, item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: d.cat, item: `${SITE}/c/${slugOf(d.cat)}/` },
      { '@type': 'ListItem', position: 3, name: d.title, item: SITE + d.url } ] },
  ];
  const body = `<div class="crumb"><a href="/">${NAME}</a> / <a href="/c/${slugOf(d.cat)}/">${esc(d.cat)}</a></div>
<h1>${esc(d.title)}</h1>
<div><span class="pill">${esc(d.kind)}</span><span class="pill">${esc(d.cat)}</span></div>
<p class="lead">${esc(d.desc)}</p>
<pre id="body" class="${isP ? 'ar' : ''}"><code>${esc(d.body)}</code></pre>
<button class="btn pri" id="cp" type="button">نسخ</button><a class="btn" href="/#${d.id}">جرّبه في المكتبة التفاعلية</a>
${vars.length ? `<h2>المتغيرات</h2><p class="lead">يحتوي على: ${vars.map((v) => `<code>{{${esc(v)}}}</code>`).join('، ')} — استبدلها بمدخلاتك.</p>` : ''}
<h2>المزيد من ${esc(d.cat)}</h2><ul class="l">${related.map((r) => `<li><a href="${r.url}">${esc(r.title)}</a><small>${esc(r.kind)}</small></li>`).join('')}</ul>
<script>document.getElementById('cp').onclick=function(){var t=document.getElementById('body').innerText,b=this;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='تم النسخ ✓'}).catch(function(){var r=document.createRange();r.selectNodeContents(document.getElementById('body'));var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='حدّد النص وانسخه'});setTimeout(function(){b.textContent='نسخ'},1800)}</script>`;
  write(`p/${d.id}/index.html`, page({ title, description, path: d.url, type: 'article', ld, body }));
}

// ---------- صفحات التصنيفات ----------
for (const c of catNames) {
  const list = byCat[c];
  const p = `/c/${slugOf(c)}/`;
  const title = `${c} — برومبتات وأكواد عربية جاهزة | ${NAME}`;
  const description = clip(`${list.length} عنصراً في تصنيف «${c}»: ${list.slice(0, 4).map((d) => d.title).join('، ')} وغيرها، جاهزة للنسخ.`, 158);
  const ld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: c, url: SITE + p, inLanguage: 'ar', mainEntity: { '@type': 'ItemList', itemListElement: list.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + d.url, name: d.title })) } }];
  write(`c/${slugOf(c)}/index.html`, page({ title, description, path: p, ld, body: `<div class="crumb"><a href="/">${NAME}</a></div><h1>${esc(c)}</h1><p class="lead">${esc(description)}</p><ul class="l">${list.map((d) => `<li><a href="${d.url}">${esc(d.title)}</a><small>${esc(d.kind)} — ${esc(clip(d.desc, 110))}</small></li>`).join('')}</ul>` }));
}

// ---------- ملفات الزواحف ----------
const urls = ['/', ...catNames.map((c) => `/c/${slugOf(c)}/`), ...DATA.map((d) => d.url)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${NOW}</lastmod><priority>${u === '/' ? '1.0' : u.startsWith('/c/') ? '0.7' : '0.6'}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${NAME} — ${TAGLINE}</title><link>${SITE}/</link><description>${esc(homeDesc)}</description><language>ar</language>\n${DATA.slice(0, 50).map((d) => `<item><title>${esc(d.title)}</title><link>${SITE}${d.url}</link><guid>${SITE}${d.url}</guid><description>${esc(d.desc)}</description><category>${esc(d.cat)}</category></item>`).join('\n')}\n</channel></rss>\n`);
write('404.html', page({ title: `الصفحة غير موجودة | ${NAME}`, description: 'الصفحة المطلوبة غير موجودة.', path: '/404.html', body: `<h1>الصفحة غير موجودة</h1><p class="lead">ربما تغيّر الرابط. <a href="/">ارجع إلى المكتبة</a>.</p>` }).replace('content="index,follow,max-snippet:-1,max-image-preview:large"', 'content="noindex"'));
for (const f of ['favicon.svg', 'site.webmanifest']) {
  const src = path.join(ROOT, 'public', f);
  if (fs.existsSync(src)) write(f, fs.readFileSync(src, 'utf8').replace(/^\uFEFF/, ''));
}
fs.copyFileSync(path.join(ROOT, 'public', 'og.png'), path.join(DIST, 'og.png'));
write('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/p/*\n  Cache-Control: public, max-age=3600\n`);
console.log(`✅ ${DATA.length} عنصر → ${DATA.length} صفحة + ${catNames.length} تصنيف + sitemap/robots/rss/404 → dist/`);
