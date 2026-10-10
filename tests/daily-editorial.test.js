const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const path=require("node:path");
const regionGenerator=fs.readFileSync(path.join(__dirname,"../scripts/generate-regional-pages.mjs"),"utf8");
const destinationGenerator=fs.readFileSync(path.join(__dirname,"../scripts/generate-destination-pages.mjs"),"utf8");
const {regions}=require("../lib/national-region-catalog");
test("region and destination pages read the same central cached daily briefing",()=>{
 for(const src of [regionGenerator,destinationGenerator]){
   assert.match(src,/https:\/\/chrisizworski\.com\/api\/fall-color\?view=national-briefings&region=/);
   assert.doesNotMatch(src,/api\.anthropic\.com|ANTHROPIC_API_KEY_FALL_COLOR/);
   assert.match(src,/id="daily-editorial" class="card" hidden|id="daily-editorial" hidden/);
 }
});
test("all 15 regional pages show a daily note ONLY when a cached edition is available",()=>{
 for(const r of regions){
  const p=path.join(__dirname,"../public/fall-color",r.id,"index.html");
  assert.ok(fs.existsSync(p),p);
  const html=fs.readFileSync(p,"utf8");
  assert.match(html,/id="daily-editorial"/);
  assert.match(html,/dailyBriefing\(\)/);
  assert.match(html,/method!=="AI-generated model summary"/);
 }
});
