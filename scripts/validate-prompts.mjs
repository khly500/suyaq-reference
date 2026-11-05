// scripts/validate-prompts.mjs
import fs from 'fs'; import path from 'path';
const DATA_PATH = path.resolve('../data.js');
const CATEGORIES = ['برمجة','كتابة','لهجات','بيانات','تعليم','أعمال','تسويق','بحث','ترجمة','معالجة بيانات','عربية'];
const CODE_LANGS = ['Python','JavaScript','TypeScript','SQL','Bash','Regex','Markdown','JSON','YAML','Dockerfile'];
function loadData(){ const c=fs.readFileSync(DATA_PATH,'utf-8'); const m=c.match(/window\.DATA\s*=\s*(\[[\s\S]*?\]);/); if(!m) throw new Error('DATA not found'); return eval('('+m[1]+')'); }
function validate(){ const data=loadData(); const e=[]; const w=[]; const ids=new Set();
console.log(🔍 فحص  عنصر...\n);
data.forEach((it,i)=>{ const p=[# ];
if(ids.has(it.id)) e.push(${p} معرف مكرر: ); ids.add(it.id);
if(!it.type) e.push(${p} type مفقود); if(!it.cat) e.push(${p} cat مفقود); if(!it.title) e.push(${p} title مفقود); if(!it.body) e.push(${p} body مفقود);
if(it.type&&!['prompt','code'].includes(it.type)) e.push(${p} type غير صالح: );
if(it.cat&&!CATEGORIES.includes(it.cat)) e.push(${p} تصنيف غير معتمد: );
if(it.type==='code'){ if(!it.lang) e.push(${p} lang مفقود); else if(!CODE_LANGS.includes(it.lang)) w.push(${p} لغة غير قياسية: ); if(!it.file) w.push(${p} file مفقود); }
if(it.type==='prompt'&&it.body){ const vs=[...it.body.matchAll(/\{\{(\w+)\}\}/g)].map(m=>m[1]); if(!vs.length) w.push(${p} لا متغيرات); else{ vs.forEach(v=>{ if(!/^[a-z_][a-z0-9_]*$/.test(v)) w.push(${p} متغير  يجب أن يكون snake_case); }); const d=vs.filter((v,i)=>vs.indexOf(v)!==i); if(d.length) w.push(${p} متغيرات مكررة: ); } }
if(it.title&&it.title.length>60) w.push(${p} عنوان طويل ()); });
if(e.length){ console.error('❌ أخطاء:'); e.forEach(x=>console.error('  -',x)); } else { console.log('✅ لا أخطاء'); }
if(w.length){ console.warn('\n⚠️ تحذيرات:'); w.forEach(x=>console.warn('  -',x)); }
console.log(\n📊  عنصر،  خطأ،  تحذير); if(e.length) process.exit(1); }
validate();
