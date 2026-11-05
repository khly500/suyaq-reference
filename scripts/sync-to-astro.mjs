// scripts/sync-to-astro.mjs
import fs from 'fs'; import path from 'path';
const S=path.resolve('../data.js'), T=path.resolve('../astro-project/src/data/prompts.js');
function parse(c){ const m=c.match(/window\.DATA\s*=\s*(\[[\s\S]*?\]);/); if(!m) throw new Error('DATA not found'); return Function('return '+m[1])(); }
function tf(it){ const b={id:it.id,type:it.type,cat:it.cat,title:it.title,body:it.body,description:it.desc||''}; if(it.type==='prompt'){ const vs=[...it.body.matchAll(/\{\{(\w+)\}\}/g)].map(m=>m[1]); return {...b,variables:[...new Set(vs)]}; } return {...b,lang:it.lang,file:it.file}; }
function gen(data){ const t=data.map(tf); return // auto-generated from data.js — DO NOT EDIT MANUALLY
export const CATEGORIES=['برمجة','كتابة','لهجات','بيانات','تعليم','أعمال','تسويق','بحث','ترجمة','معالجة بيانات','عربية'];
export const CODE_LANGUAGES=['Python','JavaScript','TypeScript','SQL','Bash','Regex','Markdown','JSON','YAML','Dockerfile'];
export const PROMPTS=;
export function getPromptById(id){return PROMPTS.find(p=>p.id===id);}
export function getPromptsByCategory(c){return PROMPTS.filter(p=>p.cat===c);}
export function getPromptsByType(t){return PROMPTS.filter(p=>p.type===t);}
export function searchPrompts(q){const n=q.toLowerCase().trim(); if(!n) return PROMPTS; return PROMPTS.filter(p=>p.title.toLowerCase().includes(n)||p.description.toLowerCase().includes(n)||p.cat.toLowerCase().includes(n)||p.body.toLowerCase().includes(n)||(p.lang&&p.lang.toLowerCase().includes(n)));}
export function getAllCategories(){return [...new Set(PROMPTS.map(p=>p.cat))].sort();}
export function getAllTags(){return [...new Set(PROMPTS.flatMap(p=>p.variables||[]))].sort();}; }
console.log('🔄 مزامنة البيانات...'); const d=parse(fs.readFileSync(S,'utf-8')); fs.writeFileSync(T,gen(d),'utf-8'); console.log(✅  عنصر — برومبتات: ، أكواد: );
