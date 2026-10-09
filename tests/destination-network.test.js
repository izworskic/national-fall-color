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
  assert.ok(h.includes('id="comparison-verdict"')&&h.includes('aria-labelledby="compare-title"'),g.slug+" nearby comparison is visible");
  assert.equal(h.split(escapeText(g.experience)).length-1,1,g.slug+" opening copy not repeated as boilerplate");
  assert.ok(h.includes('application/ld+json'),g.slug+" schema");
  const schema=JSON.parse(h.split('<script type="application/ld+json">')[1].split("</script>")[0]);
  const graph=schema["@graph"];assert.equal(graph.find(x=>x["@type"]==="WebPage").url,canonical);
  assert.equal(graph.find(x=>x["@type"]==="Place").name,g.name);
  assert.equal(graph.find(x=>x["@type"]==="BreadcrumbList").itemListElement.length,4);
  const timing=JSON.parse(h.split('<script type="application/json" id="guide-timing">')[1].split("</script>")[0]);
  assert.equal(timing.peak.length,2);
  assert.equal(timing.other.peak.length,2,g.slug+" pair independent model data");
  assert.equal(timing.other.name,({"maroon-bells-aspen-color":"Maroon Bells / Maroon Creek","lost-maples":"Lost Maples State Natural Area","acadia-park-loop-road":"Acadia National Park Loop Road","cades-cove":"Cades Cove","peninsula-state-park":"Peninsula State Park","skyline-drive-central":"Skyline Drive Central District"}[other.slug]||other.name),g.slug+" real comparison name");
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
test("all eight existing city forecast pages link to region and two named destinations without replacing the preset engine",()=>{
 const cityRegions={
 "stowe-vt":"new-england","north-conway-nh":"new-england","bar-harbor-me":"new-england",
 "asheville-nc":"great-smoky-mountains","gatlinburg-tn":"great-smoky-mountains",
 "lake-placid-ny":"adirondacks","breckenridge-co":"colorado-aspens","shenandoah-va":"shenandoah"
 };
 for(const [slug,region] of Object.entries(cityRegions)){
  const html=fs.readFileSync(path.join(root,"..","national-tools","fall-color",slug,"index.html"),"utf8");
  assert.ok(html.includes('data-fall-city-network="'+slug+'"'),slug+" city has visible named-experience choices");
  assert.ok(html.includes('data-location-preset'),slug+" existing functioning preset kept");
  assert.ok(html.includes('data-seo-location="'+slug+'"'),slug+" city identity retained");
  assert.ok(html.includes('href="https://chrisizworski.com/fall-color/'+region+'/"'),slug+" regional planner");
  for(const g of guides.filter(x=>x.region===region))assert.ok(html.includes(href(g)),slug+" to "+g.slug);
 }
 const generator=fs.readFileSync(path.join(root,"..","..","scripts","generate-destination-pages.mjs"),"utf8");
 assert.match(generator,/x\.d<=250/,"never label geographically unrelated regions nearby");
});
test("destination planner cards expose only first-party named field guides with real map data",()=>{
 const planner=fs.readFileSync(path.join(root,"national","day-planner-ui.js"),"utf8");
 assert.ok(planner.includes("day-field-guide"));
 assert.ok(planner.includes("namedGuide+link+forecast+access"));
 assert.ok(planner.includes("https:\\/\\/chrisizworski"));
});
test("Michigan paths and existing location pages are not generated or replaced",()=>{
 assert.ok(!guides.some(x=>x.region==="michigan"));
 assert.ok(!guides.some(x=>x.slug==="tunnel-of-trees-fall-color"));
 const regionalMap=fs.readFileSync(path.join(root,"national","regional-map-ui.js"),"utf8");
 assert.ok(regionalMap.includes("Detailed fall color guide"));
});


test("Smokies pilot has current-season regional metadata and three genuinely distinct, crawlable decisions",()=>{
 const region=fs.readFileSync(path.join(root,"great-smoky-mountains","index.html"),"utf8");
 const year=String(new Date().getUTCFullYear());
 const regionTitle=region.match(/<title>(.*?)<\\/title>/)?.[1];
 assert.ok(regionTitle?.includes(year),"Smokies year reflects season at generation");
 assert.ok(region.includes("Smokies fall color: Cades Cove or Newfound Gap?"));
 assert.ok(region.includes("NPS fall color"));
 assert.ok(region.includes("mid-October into early November"));
 for(const slug of ["cades-cove","newfound-gap-road"]){
  const g=guides.find(x=>x.slug===slug);
  const html=read(g);
  assert.ok(html.includes('<meta name="description"'));
  assert.ok(html.includes("https://www.nps.gov/grsm/planyourvisit/fallcolor.htm"),slug+" NPS citation");
  assert.ok(html.includes("https://www.nps.gov/grsm/planyourvisit/seasonalroads.htm"),slug+" road check");
  assert.ok(html.includes("Typical window:"),slug+" useful initial HTML with JS disabled");
  assert.ok(!html.includes("Reading typical fall stage…"),slug+" no generic loading placeholder");
  assert.ok(html.includes('href="'+href(guides.find(x=>x.region===g.region&&x.slug!==slug))+'"'),slug+" real paired trip");
 }
 assert.ok(read(guides.find(x=>x.slug==="cades-cove")).includes("vehicle-free Wednesdays"));
 assert.ok(read(guides.find(x=>x.slug==="newfound-gap-road")).includes("weather permitting"));
 const sitemap=fs.readFileSync(path.join(root,"national-sitemap.xml"),"utf8");
 assert.ok(sitemap.includes("https://chrisizworski.com/fall-color/great-smoky-mountains/"));
});
