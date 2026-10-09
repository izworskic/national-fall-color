/* Build 30 specific destination pages and interlink 15 regional clusters.
 * Run after generate-regional-pages.mjs; leaves Michigan untouched. */
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url),root=process.cwd();
const {guides}=require("../lib/national-destination-guides.js");
const {regions}=require("../lib/national-region-catalog.js");
const {viewingSpots}=require("../lib/national-regional-viewing-spots.js");
const {corridorAnchors}=require("../lib/national-regional-map-places.js");
const {pointTiming}=require("../lib/national-site-timing.js");
const state=require("../lib/national-map-state.js");
const {profiles}=require("../lib/fall-day-decision.js");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const json=v=>JSON.stringify(v).replace(/</g,"\\u003c");
const url=(region,slug)=>"https://chrisizworski.com/fall-color/"+region+"/"+slug+"/";
const regionUrl=region=>"https://chrisizworski.com/fall-color/"+region+"/";
const human=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"long",day:"numeric",timeZone:"UTC"});
const regionById=Object.fromEntries(regions.map(r=>[r.id,r]));
if(guides.length!==30||regions.length!==15)throw Error("Unreviewed destination expansion");
const seen=new Set(),counts={},all=[];
for(const g of guides){
 const region=regionById[g.region],profile=profiles[g.region],canonical=url(g.region,g.slug);
 if(!region||!profile||seen.has(canonical)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug))throw Error("Invalid/duplicate "+canonical);
 seen.add(canonical);counts[g.region]=(counts[g.region]||0)+1;
 const di=region.drives.findIndex(d=>d[0]===g.name);
 const si=(viewingSpots[g.region]||[]).findIndex(d=>d[0]===g.name);
 if((di===-1)===(si===-1))throw Error("No unique mapped point "+g.region+" "+g.name);
 const drive=di!==-1,index=drive?di:si;
 const raw=drive?corridorAnchors[g.region][index]:viewingSpots[g.region][index];
 const lat=raw[drive?0:1],lon=raw[drive?1:2],stateCode=drive?region.states[0]:raw[3];
 const timed=pointTiming(region,drive?"drive":"spot",index);
 if(![lat,lon].every(Number.isFinite)||!timed.timing?.sourceUrl?.startsWith("https://"))throw Error("Invalid map location/timing "+g.slug);
 for(const k of ["experience","plan","caution"])if((g[k]||"").length<90)throw Error("Thin "+k+" "+g.slug);
 if((g.alternative||"").length<55)throw Error("Thin alternative "+g.slug);
 const official=g.officialUrl||timed.timing.sourceUrl;
 if(!/^https:\/\//.test(official))throw Error("No source for "+g.slug);
 const access=profile.accessByName?.[g.name]?.[0]||profile.accessByState?.[stateCode]?.[0]||profile.accessUrl;
 all.push({...g,regionName:region.name,lat,lon,peak:timed.peak,timing:timed.timing,kind:drive?"drive":"spot",index:index+1,official,access});
}
for(const r of regions)if(counts[r.id]!==2)throw Error("Missing local pair "+r.id);
const byRegion=Object.fromEntries(regions.map(r=>[r.id,all.filter(g=>g.region===r.id)]));
// Existing eight city-focused pages already preset the national live decision
// engine. Connect those users to real named places; do NOT duplicate them.
const cityNetwork={
 "stowe-vt":{region:"new-england",name:"Stowe",context:"Stowe is a Vermont mountain base. These are other New England destinations, not necessarily short drives from town."},
 "north-conway-nh":{region:"new-england",name:"North Conway",context:"North Conway is an excellent gateway for the Kancamagus Highway; Acadia is a separate Maine trip, not a same-day nearby stop."},
 "bar-harbor-me":{region:"new-england",name:"Bar Harbor",context:"Bar Harbor connects directly to Acadia's Park Loop Road. The White Mountains are a separate inland fall-color journey."},
 "asheville-nc":{region:"great-smoky-mountains",name:"Asheville",context:"Asheville is a western North Carolina base. The Smokies are a separate destination whose elevation and access need their own checks."},
 "gatlinburg-tn":{region:"great-smoky-mountains",name:"Gatlinburg",context:"Compare a high-elevation Smokies drive with a slower Cades Cove valley visit before choosing your day."},
 "lake-placid-ny":{region:"adirondacks",name:"Lake Placid",context:"Lake Placid offers two very different nearby Adirondack decisions: summit-highway access or a notch-road drive."},
 "breckenridge-co":{region:"colorado-aspens",name:"Breckenridge",context:"These are distinct Colorado aspen trips—not local Breckenridge stops. High-pass surface conditions and advance reservations matter."},
 "shenandoah-va":{region:"shenandoah",name:"Shenandoah / Luray",context:"From the Luray side, compare Skyline Drive's overlooks with the more place-focused Big Meadows outing."}
};
const gatewayForGuide={
 "kancamagus-highway":["north-conway-nh"],
 "acadia-park-loop-road":["bar-harbor-me"],
 "cades-cove":["gatlinburg-tn"],
 "newfound-gap-road":["gatlinburg-tn"],
 "whiteface-memorial-highway":["lake-placid-ny"],
 "wilmington-notch":["lake-placid-ny"],
 "skyline-drive-central":["shenandoah-va"],
 "big-meadows":["shenandoah-va"]
};
const displayNames={
 "maroon-bells-aspen-color":"Maroon Bells / Maroon Creek",
 "lost-maples":"Lost Maples State Natural Area",
 "acadia-park-loop-road":"Acadia National Park Loop Road",
 "cades-cove":"Cades Cove",
 "peninsula-state-park":"Peninsula State Park",
 "skyline-drive-central":"Skyline Drive Central District"
};
// Authoritative NPS-based decisions specific to the two Smokies search intents.
const smokiesBriefings={
 "cades-cove":`<section class="card" aria-labelledby="cades-visit-choice"><span class="label">Cades Cove planning decision</span><h2 id="cades-visit-choice">Is Cades Cove better in early or late October?</h2>
 <p><strong>Usually later than the high ridges.</strong> Cades Cove is a lower-elevation valley, so its hardwood backdrop may develop after the higher portions of Newfound Gap Road. The NPS describes the strongest colors below 4,000 feet as commonly occurring from mid-October into early November; actual timing changes each year.</p>
 <h3>How long is the drive?</h3><p>The Cades Cove Loop Road is 11 miles and one-way. October is one of the park's busiest periods. This is not an 11-mile highway-speed drive: traffic can be slow, especially around wildlife and photo stops. Allow substantial extra time rather than promising a fixed driving duration.</p>
 <h3>When can I drive the loop?</h3><p>NPS lists the loop as generally open sunrise to sunset, weather permitting. Vehicle-free Wednesdays ordinarily run May through September, not all year. Check current schedules, closures and the NPS parking-tag requirements before leaving.</p>
 <p class="muted">Official references: <a href="https://www.nps.gov/grsm/planyourvisit/fallcolor.htm">NPS fall color by elevation</a> · <a href="https://www.nps.gov/grsm/planyourvisit/seasonalroads.htm">NPS seasonal road schedule</a> · <a href="https://www.nps.gov/grsm/planyourvisit/cadescove.htm">Cades Cove</a>. No live road-open status is claimed.</p></section>`,
 "newfound-gap-road":`<section class="card" aria-labelledby="gap-visit-choice"><span class="label">Newfound Gap planning decision</span><h2 id="gap-visit-choice">When is the best time to drive Newfound Gap Road for fall color?</h2>
 <p><strong>Compare the elevation bands, not one park-wide peak date.</strong> Newfound Gap Road (US-441) connects the Gatlinburg and Cherokee sides of the park and climbs toward a high mountain pass. NPS reports upper-elevation autumn color often developing in early to mid-October, while lower wooded valleys commonly follow from mid-October into early November.</p>
 <h3>What makes this drive different from Cades Cove?</h3><p>Newfound Gap Road crosses changing elevations on one route: high overlooks may show color or leaf drop while hardwoods closer to Gatlinburg and Cherokee remain green or are still developing. Cades Cove is a separate lower-valley one-way loop with open fields and historic settings; it is not another segment of US-441.</p>
 <h3>Can I drive it today?</h3><p>Newfound Gap Road is generally a year-round primary park road, <strong>weather permitting</strong>. Fog, ice, storms and other hazards can close it without much notice. Check NPS road closures and forecast conditions immediately before traveling. The Kuwohi summit road has separate seasonal access rules and must not be assumed open because US-441 is open.</p>
 <p class="muted">Official references: <a href="https://www.nps.gov/grsm/planyourvisit/fallcolor.htm">NPS elevation-based color timing</a> · <a href="https://www.nps.gov/grsm/planyourvisit/seasonalroads.htm">NPS seasonal roads</a> · <a href="https://www.nps.gov/grsm/learn/news/autumn-is-in-the-air-in-the-great-smoky-mountains.htm">NPS 2026 autumn visitor advisory</a>. No live traffic or closure status is inferred.</p></section>`
};
const miles=(a,b)=>{
 const rad=Math.PI/180,dl=(b.lat-a.lat)*rad,doLon=(b.lon-a.lon)*rad;
 const q=Math.sin(dl/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(doLon/2)**2;
 return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(q)));
};

const css="*{box-sizing:border-box}html{overflow-x:hidden}body{margin:0;background:#f7f2e8;color:#302820;font:16px/1.62 system-ui,-apple-system,Segoe UI,sans-serif;overflow-wrap:anywhere}a{color:#31533d;text-underline-offset:3px}.top{background:#fffaf1;border-bottom:1px solid #d9cdbb}.shell{max-width:890px;margin:0 auto;padding:20px}.top .shell{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between}.top nav{display:flex;flex-wrap:wrap;gap:14px;font-size:13px}main.shell{padding-top:22px;padding-bottom:48px}.crumb{font-size:12px;color:#61564b}.kicker{font-size:11px;letter-spacing:.13em;font-weight:800;color:#87603a;text-transform:uppercase;margin-top:16px}h1,h2,h3{font-family:Georgia,serif;line-height:1.18}h1{font-size:clamp(30px,6vw,48px);margin:9px 0 14px}h2{font-size:25px;margin:28px 0 9px}h3{font-size:18px}.lead{font-size:18px;max-width:790px;color:#51483f}.card{padding:18px;background:#fffdfa;border:1px solid #d9cdbb;border-radius:14px;margin:16px 0}.grid{display:grid;grid-template-columns:1.05fr .95fr;gap:15px}.label{display:block;font-size:11px;letter-spacing:.12em;font-weight:800;color:#786242;text-transform:uppercase}.stage{font:600 23px/1.25 Georgia,serif;color:#31533d;margin:8px 0}.muted{font-size:13px;color:#61564b}.answer{border-left:4px solid #31533d;padding-left:14px}.answer strong{font-size:18px}.controls{display:flex;align-items:center;flex-wrap:wrap;gap:9px}.controls input{font:inherit;max-width:100%;min-height:46px;border:1px solid #b6aa98;border-radius:8px;padding:9px}.controls label{font-weight:700;font-size:13px}.controls button,.links a{display:inline-block;min-height:44px;padding:11px 14px;border-radius:8px;border:1px solid #31533d;background:#31533d;color:white;text-decoration:none;font:700 13px system-ui,sans-serif;cursor:pointer}.controls button[hidden]{display:none}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}.warning{border-left:3px solid #ac6739;background:#fcf3e6;padding:8px 15px}.network{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.network a{padding:14px;border:1px solid #d9cdbb;border-radius:10px;background:#fffdfa;text-decoration:none;font-weight:700;font-size:14px}.network small{display:block;color:#61564b;font-weight:400}footer{border-top:1px solid #d9cdbb;font-size:13px;color:#61564b}:focus-visible{outline:3px solid #9e613a;outline-offset:2px}@media(max-width:650px){.shell{padding-left:15px;padding-right:15px}.grid,.network{grid-template-columns:1fr}.card{padding:15px}h2{font-size:23px}}";
function client(){
 "use strict";
 const el=document.getElementById("guide-timing"),input=document.getElementById("guide-date"),button=document.getElementById("preview-next"),title=document.getElementById("stage-verdict"),reason=document.getElementById("stage-reason"),compare=document.getElementById("comparison-verdict");
 if(!el||!input||!title||!reason)return;
 const guide=JSON.parse(el.textContent),now=new Date(),year=now.getFullYear();
 const local=[year,String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
 const valid=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;
 function describe(peak,doy){
  const [start,end]=peak;
  return doy<start-36?"Still green":doy<start-25?"Early change":doy<start-17?"Developing gold":doy<start-9?"Color developing":doy<start?"Approaching typical peak":doy<=end?"Within typical peak window":doy<=end+5?"Color fading":doy<=end+13?"Late russet color":doy<=end+24?"Mostly bare woodland":"Season complete";
 }
 function render(){
  const date=input.value;if(!valid(date)){title.textContent="Choose a valid date";reason.textContent="Invalid calendar dates are not scored.";return;}
  const dt=new Date(date+"T12:00:00Z"),m=dt.getUTCMonth()+1;
  if(m<9||m===12&&dt.getUTCDate()>8){
    title.textContent="Season complete";
    reason.textContent="Winter has no live leaf reading. Preview a future fall to see the typical seasonal scenario.";
    if(compare)compare.textContent="Season complete. No peak-color recommendation is given for this date.";
    return;
  }
  const doy=Math.floor((dt-Date.UTC(dt.getUTCFullYear(),0,1))/86400000)+1;
  const here=describe(guide.peak,doy),there=describe(guide.other.peak,doy);
  title.textContent=here;
  reason.textContent="Geography-informed seasonal estimate for "+date+"; not a live canopy observation, confirmed road status or guarantee.";
  if(compare)compare.textContent=guide.name+": "+here+". "+guide.other.name+": "+there+". These are separate historical location scenarios, not observed leaf colors or a drive-time comparison.";
 }
 const inFall=local.slice(5)>="09-01"&&local.slice(5)<="12-08";
 input.min=String(Math.max(2026,year-1))+"-09-01";input.max=String(year+1)+"-12-08";
 input.value=inFall?local:(year+1)+"-10-01";button.hidden=inFall;
 button.addEventListener("click",()=>{input.value=String(year+1)+"-10-01";button.hidden=true;render();});
 input.addEventListener("change",render);render();
}
function page(g){
 const r=regionById[g.region],canonical=url(g.region,g.slug),regionLink=regionUrl(g.region);
 const start=human(state.isoFromDoy(2027,g.peak[0])),end=human(state.isoFromDoy(2027,g.peak[1]));
 const window=start+"–"+end;
 const publicName=displayNames[g.slug]||g.name;
 const title=publicName+" Fall Color: Peak Timing and Visit Guide | Chris Izworski";
 const desc=({
  "cades-cove":"Cades Cove fall colors: when valley hardwoods usually peak, how the 11-mile loop works, vehicle-free Wednesdays, traffic and NPS road checks.",
  "newfound-gap-road":"Newfound Gap Road fall colors: compare high and low elevations, typical October peak timing, US-441 road closures and Cades Cove alternatives."
 }[g.slug]||("When to see "+publicName+" fall colors, what makes this place special, access cautions and nearby alternatives in "+r.name+".")).slice(0,155);
 const graph=[
 {"@type":"WebPage","@id":canonical+"#webpage",url:canonical,name:title,description:desc,inLanguage:"en-US",isAccessibleForFree:true,datePublished:"2026-10-08",dateModified:"2026-10-08",author:{"@id":"https://chrisizworski.com/#person"},about:{"@id":canonical+"#place"}},
 {"@type":"Place","@id":canonical+"#place",name:g.name,geo:{"@type":"GeoCoordinates",latitude:g.lat,longitude:g.lon}},
 {"@type":"BreadcrumbList",itemListElement:[
 {"@type":"ListItem",position:1,name:"Fall color",item:"https://chrisizworski.com/fall-color/"},
 {"@type":"ListItem",position:2,name:"U.S. regional fall color",item:"https://chrisizworski.com/fall-color/national/"},
 {"@type":"ListItem",position:3,name:r.name,item:regionLink},
 {"@type":"ListItem",position:4,name:g.name,item:canonical}]}
 ];
 const other=byRegion[g.region].filter(x=>x.slug!==g.slug);
 if(other.length!==1)throw Error("Exactly one paired local destination required "+g.slug);
 const otherWindow=human(state.isoFromDoy(2027,other[0].peak[0]))+"–"+human(state.isoFromDoy(2027,other[0].peak[1]));
 const neighbors=regions.filter(x=>x.id!==g.region).map(x=>({r:x,d:miles(x,r)}))
  .filter(x=>x.d<=250).sort((a,b)=>a.d-b.d).slice(0,2);
 const linked=other.map(x=>'<a href="'+url(x.region,x.slug)+'">'+esc(x.name)+'<small>'+esc(x.experience.split(".")[0])+'.</small></a>').join("")+
  '<a href="'+regionLink+'">Regional fall-color planner<small>Compare all dates, roads and viewing points in '+esc(r.name)+'</small></a>'+
  '<a href="/fall-color/national/">All 15 fall-color regions<small>Statewide and national timing comparison</small></a>'+
  neighbors.map(x=>'<a href="'+regionUrl(x.r.id)+'">'+esc(x.r.name)+'<small>Another regional color timing comparison; travel time not calculated</small></a>').join("");
 const sourceLinks=[
 [g.official,"Destination and visitor reference"],
 [g.timing.sourceUrl,"Regional historical foliage progression"],
 [g.access,"Official road or park access information"],
 ["https://forecast.weather.gov/MapClick.php?lat="+g.lat.toFixed(4)+"&lon="+g.lon.toFixed(4),"NWS current forecast near mapped viewing area"]
 ].map(x=>'<p><a href="'+esc(x[0])+'" rel="noopener noreferrer" target="_blank">'+esc(x[1])+' ↗</a></p>').join("");
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+esc(title)+'</title><meta name="description" content="'+esc(desc)+'"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="author" content="Chris Izworski"><link rel="canonical" href="'+canonical+'">'+
 '<meta property="og:type" content="article"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc)+'"><meta property="og:url" content="'+canonical+'"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(desc)+'">'+
 '<script type="application/ld+json">'+json({"@context":"https://schema.org","@graph":graph})+'</script><style>'+css+'</style></head><body>'+
 '<header class="top"><div class="shell"><a href="/">Chris Izworski</a><nav><a href="/fall-color/">Michigan fall color</a><a href="/fall-color/national/">U.S. map</a><a href="'+regionLink+'">'+esc(r.name)+'</a></nav></div></header>'+
 '<main class="shell"><div class="crumb"><a href="/fall-color/national/">U.S. Fall Color</a> / <a href="'+regionLink+'">'+esc(r.name)+'</a> / '+esc(g.name)+'</div><div class="kicker">Destination fall-color field guide</div>'+
 '<h1>When to see fall color at '+esc(publicName)+'</h1><p class="lead">'+esc(g.experience)+'</p>'+
 '<div class="grid"><section class="card"><span class="label">Typical viewing-area color window · not live</span><div class="stage">'+esc(window)+'</div>'+
 '<p class="muted">Geography-specific approximate seasonal timing based on '+esc(g.timing.area)+'. These are illustrative windows, not measured peak dates or a live point-level leaf report.</p>'+
 '<div class="controls"><label for="guide-date">Check your date</label><input type="date" id="guide-date"><button id="preview-next" type="button" hidden>Preview next fall</button></div>'+
 '<div class="answer" role="status" aria-live="polite"><strong id="stage-verdict">'+esc(g.region==="great-smoky-mountains"?"Typical window: "+window:"Historical timing guide")+'</strong><p id="stage-reason">Select a date above for the season-stage estimate. This is not a live leaf-color reading.</p></div></section>'+
 '<aside class="card"><span class="label">Choose the trip, not just a date</span><h2 style="margin:8px 0">Can I go?</h2><p>A promising fall-color window does not establish road access, park admission, parking or trail safety. Verify official rules and check current weather.</p>'+
 '<div class="links"><a href="'+regionLink+'">Compare the region</a><a href="'+esc(g.access)+'" rel="noopener noreferrer">Verify access ↗</a></div>'+
 '<p class="muted">Map point is an approximate scenic corridor or viewing area, not a parking-lot coordinate or driving route.</p></aside></div>'+
 '<section class="card" aria-labelledby="compare-title"><span class="label">One date, two different landscapes</span><h2 id="compare-title" style="margin:8px 0 4px">Also consider '+esc(displayNames[other[0].slug]||other[0].name)+'</h2>'+
 '<p>Its modeled typical color window: '+esc(otherWindow)+'. Compare both locations on the date selected above—different areas do not all peak together.</p>'+
 '<p id="comparison-verdict" class="muted" aria-live="polite">'+esc(publicName+": "+window+"; "+(displayNames[other[0].slug]||other[0].name)+": "+otherWindow+" (typical historic windows, not observations).")+'</p>'+
 '<p><a href="'+url(other[0].region,other[0].slug)+'">Explore the '+esc(displayNames[other[0].slug]||other[0].name)+' fall-color guide →</a></p></section>'+
 ''+
 '<h2>How to plan the visit</h2><p>'+esc(g.plan)+'</p>'+(smokiesBriefings[g.slug]||'')+
 '<h2>Road, park and safety checks</h2><div class="warning"><p>'+esc(g.caution)+'</p></div>'+
 '<h2>If the color or access does not line up</h2><p>'+esc(g.alternative)+'</p>'+
 '<p>Use the <a href="'+regionLink+'">'+esc(r.name)+' decision planner</a> to compare individual location timing for your date and outing preference. The regional map does not assume that all locations peak together.</p>'+
 '<div data-in-article-ad-break aria-hidden="true"></div>'+
 '<h2>Questions visitors ask</h2><h3>When should I visit '+esc(g.name)+' for fall color?</h3><p>The typical viewing-area range is approximately <strong>'+esc(window)+'</strong>. Weather, elevation, species and wind can shift the actual peak. It is not a confirmed date for this season.</p>'+
 '<h3>Is '+esc(g.name)+' open and accessible?</h3><p>This guide cannot confirm that. Check the current official access notices and site-specific reservation rules before traveling; the NWS weather link does not confirm road or trail availability.</p>'+
 '<h3>What should I see instead?</h3><p>'+esc(g.alternative)+'</p>'+
 '<section class="card"><h2 style="margin-top:0">Sources and current-condition checks</h2>'+sourceLinks+
 '<p class="muted">Source links are provided for independent verification. The modeled season is not presented as an individual sensor or observed leaf percentage.</p></section>'+
 '<section><h2>Explore the local fall-color network</h2><div class="network">'+linked+'</div></section>'+ 
 (gatewayForGuide[g.slug]||[]).map(key=>'<p class="muted"><a href="/national-tools/fall-color/'+key+'/">Also compare the city forecast for '+esc(cityNetwork[key].name)+'</a>. This is a regional context forecast, not a point observation at '+esc(publicName)+'.</p>').join("")+
 '<script type="application/json" id="guide-timing">'+json({peak:g.peak,name:publicName,other:{name:displayNames[other[0].slug]||other[0].name,peak:other[0].peak}})+'</script></main>'+
 '<footer><div class="shell">Researched field guide by <a href="/chris-izworski/">Chris Izworski</a>. <a href="/fall-color/">Michigan’s separate live foliage engine</a> is unchanged.</div></footer>'+
 '<script>('+client.toString()+')();</script></body></html>';
 return html;
}
for(const g of all){
 const dest=path.join(root,"public/fall-color",g.region,g.slug,"index.html");
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,page(g));
}
// Bridge the eight existing, functioning city-intent pages into the region and
// named-destination hierarchy. These links are direct HTML, not JS navigation.
// No new URLs, duplicate pages, redirects or Michigan engine edits.
for(const [slug,city] of Object.entries(cityNetwork)){
 const filename=path.join(root,"public/national-tools/fall-color",slug,"index.html");
 if(!fs.existsSync(filename))throw Error("City page missing "+slug);
 let html=fs.readFileSync(filename,"utf8");
 const region=regionById[city.region],places=byRegion[city.region];
 if(!region||places?.length!==2)throw Error("Unmapped city network "+slug);
 const cards=places.map(g=>'<a href="'+url(g.region,g.slug)+'" style="display:block;border:1px solid #d8ceb9;border-radius:10px;padding:11px 13px;text-decoration:none;background:#fffefb">'+
   '<strong>'+esc(displayNames[g.slug]||g.name)+' fall color</strong><span style="display:block;font-size:12px;margin-top:4px">'+esc(g.plan.split(". ")[0])+'.</span></a>').join("");
 const section='<section class="section" data-fall-city-network="'+esc(slug)+'"><div class="wrap">'+
  '<div style="background:#f8f3e8;border:1px solid #d8ceb9;border-radius:12px;padding:16px">'+
  '<div class="eyebrow">Plan a real fall-color outing</div><h2>Places to see fall color from '+esc(city.name)+'</h2>'+
  '<p>'+esc(city.context)+'</p>'+
  '<p><a href="'+regionUrl(region.id)+'">Compare the '+esc(region.name)+' map and date planner</a></p>'+
  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:10px">'+cards+'</div>'+
  '</div></div></section>';
 const match=html.match(/<section class="section seo-location-context"[\s\S]*?<\/section>/);
 if(!match||html.includes('data-fall-city-network'))throw Error("City insertion anchor ambiguous "+slug);
 html=html.replace(match[0],match[0]+section);
 fs.writeFileSync(filename,html);
}

for(const r of regions){
 const filename=path.join(root,"public/fall-color",r.id,"index.html");
 let html=fs.readFileSync(filename,"utf8");
 const listing='<section class="section" data-destination-network><h2>Special places to see fall color in '+esc(r.name.replace(/ Fall Color$/,""))+'</h2>'+
 '<p>Two named viewing experiences with their own fall timing, access checks, and alternatives.</p><div class="grid">'+
 byRegion[r.id].map(g=>'<article class="card"><div class="kicker">Destination field guide</div><h3><a href="'+url(g.region,g.slug)+'">'+esc(g.name)+'</a></h3><p>'+esc(g.experience)+'</p><p><a href="'+url(g.region,g.slug)+'">When to visit and what to check →</a></p></article>').join("")+'</div></section>';
 const anchor='<section class="section"><h2>Historical satellite autumn timing</h2>';
 if(!html.includes(anchor)||html.includes('data-destination-network'))throw Error("Region insertion anchor mismatch "+r.id);
 html=html.replace(anchor,listing+anchor);
 const rx=/(<script type="application\/json" id="regional-map-data">)([\s\S]*?)(<\/script>)/;
 const old=html.match(rx);if(!old)throw Error("Missing regional map data "+r.id);
 const payload=JSON.parse(old[2]);
 for(const g of byRegion[r.id]){
   const point=(g.kind==="drive"?payload.drives:payload.spots).find(p=>p.name===g.name);
   if(!point)throw Error("Guide missing from map "+g.slug);
   point.guideUrl=url(g.region,g.slug);
 }
 html=html.replace(rx,(_,a,data,b)=>a+json(payload)+b);
 fs.writeFileSync(filename,html);
}
const hubPath=path.join(root,"public/fall-color/national/index.html");
let hub=fs.readFileSync(hubPath,"utf8");
if(!hub.includes("</main>")||hub.includes("data-destination-network"))throw Error("Hub insertion");
const hubSection='<section class="section" data-destination-network><h2>30 named fall-color places to explore</h2>'+
 '<p>Find a special scenic drive, overlook, park, canyon or waterfall. Each place links back to its region and to a practical nearby alternative.</p><div class="grid">'+
 regions.map(r=>'<article class="card"><h3><a href="'+regionUrl(r.id)+'">'+esc(r.name)+'</a></h3><p>'+byRegion[r.id].map(g=>'<a href="'+url(g.region,g.slug)+'">'+esc(g.name)+'</a>').join(' · ')+'</p></article>').join("")+
 '</div></section>';
hub=hub.replace("</main>",hubSection+"</main>");fs.writeFileSync(hubPath,hub);
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
 all.map(g=>'  <url><loc>'+url(g.region,g.slug)+'</loc><lastmod>2026-10-08</lastmod></url>').join("\n")+
 '\n</urlset>\n';
fs.writeFileSync(path.join(root,"public/fall-color/destinations-sitemap.xml"),sitemap);
console.log("DESTINATION_NETWORK_GENERATED 30 destination pages; 15 paired regions; hub, map model and sitemap linked");
