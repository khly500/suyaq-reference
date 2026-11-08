// تشغيل المقياس: node bench/run.mjs --provider openai|anthropic|gemini|mock --model <اسم> [--out results/x.json]
// المفاتيح من متغيرات البيئة فقط: OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY (لا تُحفظ في أي ملف).
import fs from 'node:fs';
import vm from 'node:vm';
import { TASKS } from './tasks.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const provider = arg('provider', 'mock');
const model = arg('model', provider);
const out = arg('out', `bench/results/${provider}-${model}.json`.replace(/[^\w./-]/g, '_'));
const REPEAT = +arg('repeat', 1);

const SYSTEM = 'أنت مبرمج JavaScript. أجب بالكود فقط داخل كتلة ```js واحدة، بدون شرح، وبدون استخدام مكتبات خارجية.';

async function ask(prompt) {
  if (provider === 'mock') { const t = TASKS.find((x) => x.prompt === prompt); return '```js\n' + t.ref + '\n```'; }
  const key = process.env[{ openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY' }[provider]];
  if (!key) throw new Error('المفتاح غير موجود في متغيرات البيئة');
  let r, j;
  if (provider === 'openai') {
    r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }) });
    j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300)); return j.choices[0].message.content;
  }
  if (provider === 'anthropic') {
    r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 2048, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }) });
    j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300)); return j.content.map((c) => c.text || '').join('');
  }
  if (provider === 'gemini') {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }] }) });
    j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300)); return (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  }
  throw new Error('مزوّد غير معروف');
}

const extract = (txt) => { const m = txt.match(/```(?:js|javascript)?\s*\n([\s\S]*?)```/); return (m ? m[1] : txt).trim(); };
const hydrate = (v) => (v && typeof v === 'object' && v.$date ? new Date(v.$date) : v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b) || (Number.isNaN(a) && Number.isNaN(b));

export function gradeCode(task, code) {
  // ملاحظة أمان: vm ليس عزلاً كاملاً؛ شغّل المقياس في مجلد/جهاز لا تهتم بملفاته.
  const ctx = vm.createContext({ Buffer, Intl, console: { log() {} } });
  try { vm.runInContext(code, ctx, { timeout: 2000 }); } catch (e) { return { pass: 0, total: task.tests.length, error: 'تعذّر تشغيل الكود: ' + e.message }; }
  let fn; try { fn = vm.runInContext(task.fn, ctx); } catch { return { pass: 0, total: task.tests.length, error: `الدالة ${task.fn} غير موجودة` }; }
  if (typeof fn !== 'function') return { pass: 0, total: task.tests.length, error: `الدالة ${task.fn} غير موجودة` };
  let pass = 0; const fails = [];
  for (const [args, exp] of task.tests) {
    try {
      const got = vm.runInContext('(f,a)=>f(...a)', ctx, { timeout: 2000 })(fn, args.map(hydrate));
      if (exp && exp.$throws) { fails.push({ args, exp: 'يرمي خطأ', got }); continue; }
      if (same(got, exp)) pass++; else fails.push({ args, exp, got });
    } catch (e) { if (exp && exp.$throws) pass++; else fails.push({ args, exp, error: e.message }); }
  }
  return { pass, total: task.tests.length, fails: fails.slice(0, 3) };
}

const results = [];
for (const task of TASKS) {
  const runs = [];
  for (let i = 0; i < REPEAT; i++) {
    let g;
    try { g = gradeCode(task, extract(await ask(task.prompt))); } catch (e) { g = { pass: 0, total: task.tests.length, error: 'فشل الطلب: ' + e.message }; }
    runs.push(g);
  }
  const ok = runs.filter((r) => r.pass === r.total).length;
  results.push({ id: task.id, cat: task.cat, passRuns: ok, runs: REPEAT, detail: runs[0] });
  console.log((ok === REPEAT ? '✅' : ok ? '🟡' : '❌') + ' ' + task.id + (runs[0].error ? ' — ' + runs[0].error : ''));
}
const solved = results.filter((r) => r.passRuns === r.runs).length;
const summary = { provider, model, date: new Date().toISOString(), repeat: REPEAT, solved, total: TASKS.length, results };
if (provider !== 'mock' || arg('save')) { fs.mkdirSync('bench/results', { recursive: true }); fs.writeFileSync(out, JSON.stringify(summary, null, 2)); }
console.log(`\n${provider}/${model}: ${solved}/${TASKS.length} مهمة محلولة كاملة`);
