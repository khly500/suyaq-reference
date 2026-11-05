// auto-generated from data.js — DO NOT EDIT MANUALLY
export const CATEGORIES=['برمجة','كتابة','لهجات','بيانات','تعليم','أعمال','تسويق','بحث','ترجمة','معالجة بيانات','عربية'];
export const CODE_LANGUAGES=['Python','JavaScript','TypeScript','SQL','Bash','Regex','Markdown','JSON','YAML','Dockerfile'];
export const PROMPTS=[];
export function getPromptById(id){return PROMPTS.find(p=>p.id===id);}
export function getPromptsByCategory(c){return PROMPTS.filter(p=>p.cat===c);}
export function getPromptsByType(t){return PROMPTS.filter(p=>p.type===t);}
export function searchPrompts(q){const n=q.toLowerCase().trim(); if(!n) return PROMPTS; return PROMPTS.filter(p=>p.title.toLowerCase().includes(n)||p.description.toLowerCase().includes(n)||p.cat.toLowerCase().includes(n)||p.body.toLowerCase().includes(n)||(p.lang&&p.lang.toLowerCase().includes(n)));}
export function getAllCategories(){return [...new Set(PROMPTS.map(p=>p.cat))].sort();}
export function getAllTags(){return [...new Set(PROMPTS.flatMap(p=>p.variables||[]))].sort();}
