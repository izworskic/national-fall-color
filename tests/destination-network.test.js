const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const path=require("node:path"),vm=require("node:vm");
const {guides}=require("../lib/national-destination-guides.js");
const {regions}=require("../lib/national-region-catalog.js");
const {pointTiming}=require("../lib/national-site-timing.js");
const {viewingSpots}=require("../lib/national-regional-viewing-spots.js");
const regionById=Object.fromEntries(regions.map(r=>[r.id,r]));
const root=path.join(__dirname,"..","public","fall-color");
const href=g=>"https://chrisizworski.com/fall-color/"+g.region+"/"+g.slug+"/";
const read=g=>fs.readFileSync(path.join(root,g.region,g.slug,"index.html"),"utf8");
test("all 15 regional networks have exactly two unique named destinations with mapped evidence",()=>{
 assert.equal(regions.length,15);assert.equal(guides.length,30);
 assert.equal(new Set(guides.map(href)).size,30,"all canonical pages are distinct");
 const pairs=Object.groupBy?Object.groupBy(guides,x=>x.region):guides.reduce((m,x)=>(m[x.region]??=[]).push(x),{});
 for(const r of regions){
  assert.equal(pairs[r.id]?.length,2,r.id+" local pages");
  for(const g of pairs[r.id]){
   const drive=r.drives.findIndex(x=>x[0]===g.name);
   const spot=(viewingSpots[r.id]||[]).findIndex(x=>x[0]===g.name);
   assert.ok((drive>=0)!==(spot>=0),r.id+" "+g.name+" maps to precisely one real pin");
   const timing=pointTiming(r,drive>=0?"drive":"spot",Math.max(drive,spot));
   assert.equal(timing.timing.confidence,"illustrative");
   assert.ok(/^https:\/\//.test(timing.timing.sourceUrl));
   assert.ok(g.experience.length>=90&&g.plan.length>=90&&g.caution.length>=90&&g.alternative.length>=55,"substantial tailored copy");
   assert.ok(/^https:\/\//.test(g.officialUrl));
  }
 }
});
test("30 canonical destination pages publish real place identity, map timing, official access checks and network links",()=>{
 for(const g of guides){
  const h=read(g),canonical=href(g),other=guides.find(x=>x.region===g.region&&x.slug!==g.slug);
  const title=h.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title&&title.includes("Fall Color"),g.slug+" unique SEO title");
  assert.ok(h.includes('<link rel="canonical" href="'+canonical+'">'),g.slug+" canonical");
  assert.ok(h.includes('<meta name="robots" content="index,follow,max-image-preview:large">'),g.slug+" indexable");
  assert.ok(h.includes('href="'+href(other)+'"'),g.slug+" companion article link");
  assert.ok(h.includes('href="https://chrisizworski.com/fall-color/'+g.region+'/"'),g.slug+" region parent backlink");
  for(const x of ["When to see fall color at","How to plan the visit","Road, park and safety checks","Questions visitors ask","Check your date","NWS current forecast","Geography-specific approximate seasonal timing","not a live canopy observation"]){
    assert.ok(h.includes(x),g.slug+" required content: "+x);
  }
  const escapeText=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  assert.ok(h.includes(escapeText(g.experience))&&h.includes(escapeText(g.plan))&&h.includes(escapeText(g.caution)),g.slug+" genuinely place-specific visitor content");
  assert.ok(h.includes('id="guide-timing"')&&h.includes('id="guide-date"')&&h.includes('id="stage-verdict"'),g.slug+" working date controls");
  assert.ok(h.includes('application/ld+json'),g.slug+" schema");
  const schema=JSON.parse(h.split('<script type="application/ld+json">')[1].split("</script>")[0]);
  const graph=schema["@graph"];assert.equal(graph.find(x=>x["@type"]==="WebPage").url,canonical);
  assert.equal(graph.find(x=>x["@type"]==="Place").name,g.name);
  assert.equal(graph.find(x=>x["@type"]==="BreadcrumbList").itemListElement.length,4);
  assert.equal(JSON.parse(h.split('<script type="application/json" id="guide-timing">')[1].split("</script>")[0]).peak.length,2);
  const script=h.match(/<script>\((function client\(\)[\s\S]*?)\)\(\);<\/script>/)?.[1];
  assert.ok(script,g.slug+" date engine");
  assert.doesNotThrow(()=>new vm.Script("("+script+")();"),g.slug+" JS syntax");
 }
});
test("all 15 regions and the U.S. hub form a crawlable two-level topical network",()=>{
 for(const r of regions){
  const html=fs.readFileSync(path.join(root,r.id,"index.html"),"utf8");
  assert.ok(html.includes('data-destination-network'),r.id+" has visible destination network");
  const payload=JSON.parse(html.split('<script type="application/json" id="regional-map-data">')[1].split("</script>")[0]);
  for(const g of guides.filter(x=>x.region===r.id)){
   const canonical=href(g);
   assert.ok(html.includes(canonical),g.slug+" region link");
   const match=[...payload.drives,...payload.spots].find(x=>x.name===g.name);
   assert.equal(match.guideUrl,canonical,g.slug+" referenced directly from map marker");
  }
 }
 const hub=fs.readFileSync(path.join(root,"national","index.html"),"utf8");
 assert.ok(hub.includes("30 named fall-color places to explore"));
 for(const g of guides)assert.ok(hub.includes(href(g)),g.slug+" national hub backlink");
 const sitemap=fs.readFileSync(path.join(root,"destinations-sitemap.xml"),"utf8");
 assert.equal((sitemap.match(/<loc>/g)||[]).length,30);
 for(const g of guides)assert.ok(sitemap.includes("<loc>"+href(g)+"</loc>"));
});
test("Michigan paths and existing location pages are not generated or replaced",()=>{
 assert.ok(!guides.some(x=>x.region==="michigan"));
 assert.ok(!guides.some(x=>x.slug==="tunnel-of-trees-fall-color"));
 const regionalMap=fs.readFileSync(path.join(root,"national","regional-map-ui.js"),"utf8");
 assert.ok(regionalMap.includes("Detailed fall color guide"));
});
