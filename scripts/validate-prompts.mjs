// scripts/validate-prompts.mjs — يفحص data.js قبل البناء
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8'), ctx);
const data = ctx.window.DATA;

const errors = [];
const warnings = [];
const ids = new Set();
data.forEach((it, i) => {
  const at = `#${i + 1} (${it.id ?? '؟'})`;
  for (const k of ['id', 'type', 'cat', 'title', 'body']) if (!it[k]) errors.push(`${at}: الحقل ${k} مفقود`);
  if (ids.has(it.id)) errors.push(`${at}: معرّف مكرر`);
  ids.add(it.id);
  if (!/^[a-z0-9-]+$/i.test(String(it.id))) errors.push(`${at}: المعرّف يجب أن يكون حروفاً لاتينية/أرقاماً/شرطة (يدخل في الرابط)`);
  if (!['prompt', 'code'].includes(it.type)) errors.push(`${at}: type غير صالح`);
  if (it.type === 'code' && !it.lang) errors.push(`${at}: lang مفقود`);
  if (it.title && it.title.length > 60) warnings.push(`${at}: العنوان طويل (${it.title.length})`);
  // الحقول التي تظهر كنص عادي: لا وسوم ولا روابط javascript ولا معالجات أحداث (الكود في body مسموح لأنه يُعرض كنص)
  for (const k of ['title', 'cat', 'desc', 'lang']) if (it[k] != null && /<|>|javascript:|\son[a-z]+\s*=/i.test(String(it[k]))) errors.push(`${at}: الحقل ${k} فيه وسوم أو كود غير مسموح`);
  if (it.cat && it.cat.length > 30) errors.push(`${at}: اسم التصنيف طويل`);
});
console.log(`فحص ${data.length} عنصراً…`);
warnings.forEach((w) => console.warn('⚠️', w));
if (errors.length) { errors.forEach((e) => console.error('❌', e)); process.exit(1); }
console.log('✅ لا أخطاء');
