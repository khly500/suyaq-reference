// فحص جودة الموقع بعد البناء: يفشل (رمز خروج 1) عند أي مشكلة تمنع نشر نسخة معطوبة.
import fs from 'node:fs';
import path from 'node:path';

const D = 'dist';
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    fs.statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(D);

const html = files.filter((f) => f.endsWith('.html'));
const exists = (u) => {
  u = u.split('#')[0].split('?')[0];
  if (!u.startsWith('/')) return true;
  const p = path.join(D, decodeURIComponent(u));
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  return fs.existsSync(path.join(p, 'index.html'));
};

const errors = [];
const warns = [];
const titles = {};

for (const f of html) {
  const s = fs.readFileSync(f, 'utf8');
  const is404 = f === path.join(D, '404.html');
  for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|#|data:|tel:)/.test(u)) continue;
    if (!exists(u)) errors.push(`رابط مكسور: ${f} -> ${u}`);
  }
  const t = (s.match(/<title>(.*?)<\/title>/s) || [])[1];
  if (!t) errors.push(`بلا عنوان: ${f}`);
  else (titles[t] = titles[t] || []).push(f);
  const d = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!d && !is404) errors.push(`بلا وصف: ${f}`);
  else if (d) {
    const len = d.replace(/&quot;|&amp;|&lt;|&gt;|&#39;/g, 'x').length;
    if (len > 170) warns.push(`وصف طويل (${len}): ${f}`);
  }
  if (!is404 && !/rel="canonical"/.test(s)) errors.push(`بلا canonical: ${f}`);
  if (!is404 && f !== path.join(D, 'index.html') && !/<h1/.test(s)) errors.push(`بلا h1: ${f}`);
  for (const m of s.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(m[1]); } catch { errors.push(`JSON-LD غير صالح: ${f}`); }
  }
}

for (const [t, v] of Object.entries(titles)) {
  if (v.length > 1) errors.push(`عنوان مكرر «${t}» في ${v.length} صفحات`);
}

// sitemap
const smPath = path.join(D, 'sitemap.xml');
if (!fs.existsSync(smPath)) errors.push('sitemap.xml غير موجود');
else {
  const sm = fs.readFileSync(smPath, 'utf8');
  const urls = [...sm.matchAll(/<loc>https:\/\/ai\.skakh\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (urls.length < 100) errors.push(`عدد روابط sitemap غير منطقي: ${urls.length}`);
  for (const u of urls) if (!exists(u)) errors.push(`sitemap يشير لصفحة غير موجودة: ${u}`);
}

// ملفات أساسية
for (const must of ['index.html', '404.html', 'data.js', 'robots.txt', '_headers', '_redirects', 'api/v1/snippets.json']) {
  if (!fs.existsSync(path.join(D, must))) errors.push(`ملف أساسي مفقود: ${must}`);
}

// حدود منصة Cloudflare Pages: 20,000 ملف و25MB للملف
if (files.length > 15000) errors.push(`عدد الملفات (${files.length}) يقترب من حد Cloudflare Pages (20000)`);
for (const f of files) if (fs.statSync(f).size > 20 * 1024 * 1024) errors.push(`ملف كبير جداً: ${f}`);

// المحتوى: لا قوالب غير مستبدلة ولا undefined ظاهرة في الصفحات
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8');
  if (/>\s*undefined\s*</.test(s) || /\[object Object\]/.test(s)) errors.push(`قيمة غير معرّفة ظاهرة في الصفحة: ${f}`);
}

console.log(`صفحات HTML: ${html.length} · ملفات: ${files.length} · تحذيرات: ${warns.length} · أخطاء: ${errors.length}`);
warns.slice(0, 20).forEach((w) => console.log('  تحذير:', w));
if (errors.length) {
  errors.slice(0, 50).forEach((e) => console.error('  خطأ:', e));
  process.exit(1);
}
console.log('الفحص نجح ✓');
