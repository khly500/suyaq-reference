# سجل التغييرات

## [2.1.0] - 2026-11-08
### مُضاف
- مولّد موقع ثابت بلا اعتماديات (`scripts/build-site.mjs`): صفحة مستقلة لكل برومبت وكود (`/p/<id>/`)، وصفحات تصنيفات (`/c/<slug>/`)، و`sitemap.xml` و`robots.txt` و`rss.xml` و`404.html`.
- وسوم SEO كاملة: canonical وOpen Graph وTwitter وJSON-LD، وصورة مشاركة `og.png`.
- `.github/workflows/ci.yml` للفحص والبناء، وSECURITY.md وCODEOWNERS.
### مُغيّر
- نُقلت قوالب Issue وPR إلى `.github/` ليعمل GitHub بها.
- أُعيد كتابة `package.json` و`validate-prompts.mjs` و`CONTRIBUTING.md` و`README.md`، وأُزيلت علامات BOM.
- رابط GitHub في الموقع صار يشير إلى هذا المستودع.
### مُزال
- مجلد `astro-project/` لأنه كان تالفاً (فقد صيغ `${}` ولا يحوي صفحة رئيسية) ولا يُبنى.

## [2.0.0]
- نسخة Astro (تالفة، استُبدلت في 2.1.0).
