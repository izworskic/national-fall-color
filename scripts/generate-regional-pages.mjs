// Generate evergreen region pages; never touch the established Michigan fall-color tree.
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {regions}=require("../lib/national-region-catalog.js");
const root=process.cwd();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const json=v=>JSON.stringify(v).replace(/</g,"\\u003c");
const url=s=>`https://chrisizworski.com/fall-color/${s}/`;
const fmt=d=>{const year=2027;return new Date(Date.UTC(year,0,d)).toLocaleDateString("en-US",{month:"long",day:"numeric",timeZone:"UTC"});};
const css=String.raw`
*{box-sizing:border-box}html{overflow-x:hidden}body{margin:0;background:#f7f3ea;color:#292820;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;overflow-wrap:anywhere}a{color:#385b41;text-underline-offset:3px}.top{background:#fffdf8;border-bottom:1px solid #ddd4c3}.inner{max-width:1040px;margin:auto;padding:18px 18px}.top .inner{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}.brand{font-weight:700;text-decoration:none}.top nav{display:flex;gap:16px;flex-wrap:wrap;font-size:13px}.breadcrumb{font-size:13px;color:#625e54;margin-bottom:12px}.hero{padding:32px 0 18px}.kicker{font:700 11px system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#7b623d}h1,h2,h3{font-family:Georgia,serif;line-height:1.15;letter-spacing:-.015em}h1{font-size:clamp(29px,5.5vw,45px);margin:8px 0 12px;max-width:820px}h2{font-size:27px}h3{font-size:19px;margin:0 0 6px}p{max-width:780px}.lede{font-size:17px;color:#514e46;line-height:1.65}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:#fffefb;border:1px solid #ddd4c3;border-radius:14px;padding:18px;min-width:0}.card p{margin:7px 0 0}.number{font:700 12px system-ui,sans-serif;color:#82643a}.muted{color:#686358}.big{font:bold 22px/1.2 Georgia,serif;margin:10px 0 6px}.label{display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6a4e25}.section{margin:28px 0}.footer{border-top:1px solid #ddd4c3;margin-top:42px;padding:25px 0;font-size:13px}.status{font-weight:750;color:#304e33}.warn{background:#f3e9d6;border:1px solid #ddc6a5;border-radius:10px;padding:12px 14px;font-size:13px}.meter{background:#e6e2d8;height:7px;border-radius:9px;overflow:hidden}.meter i{display:block;background:#99713e;width:0;height:100%}.navlinks{display:flex;gap:12px;flex-wrap:wrap}.source{font-size:12px;color:#625c50}.updated{font-size:12px}.pill{font-size:11px;background:#e8eedd;border-radius:20px;padding:5px 9px;color:#35523f}.offline{opacity:.7}.footnotes{font-size:12px;color:#58574c}@media(max-width:700px){.grid{grid-template-columns:1fr}h2{font-size:24px}.hero{padding-top:23px}.card{padding:16px}.inner{padding-left:16px;padding-right:16px}}
`;
const js=String.raw`
(()=>{
"use strict";
const area=document.documentElement.dataset.region;
const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;};
const fmt=s=>{if(!s)return"unknown";const d=new Date(s+"T12:00:00Z");return Number.isNaN(d.getTime())?s:d.toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"});};
const safeLocal=t=>{if(!t)return"unknown";const d=new Date(t);return Number.isNaN(d.getTime())?"unavailable":d.toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"});};
async function api(path){const r=await fetch(path,{headers:{accept:"application/json"}});if(!r.ok)throw Error("Unavailable");return r.json();}
function render(d){
 set("season-status",d.today.status);
 set("timing-index",String(d.today.planning_index_pct)+"/100");
 document.getElementById("timing-bar").style.width=d.today.planning_index_pct+"%";
 set("weekend-date",fmt(d.this_weekend.date));
 set("weekend-grade",d.this_weekend.verdict.grade);
 set("weekend-verdict",d.this_weekend.verdict.text);
 const w=d.this_weekend.weather;
 set("weekend-weather",w?
   [w.forecast,w.precipitation_risk_pct==null?null:"Precipitation chance up to "+w.precipitation_risk_pct+"%",w.temperature==null?null:"Daytime around "+w.temperature+"°"+w.temperature_unit,w.wind].filter(Boolean).join(" · "):
   "No NWS forecast for this Saturday is available.");
 set("forecast-state",d.status==="NWS_FORECAST_AVAILABLE"?"NWS forecast available":"NWS forecast unavailable — historical timing only");
 set("forecast-updated",d.nws_forecast?.issued_at?"Forecast issued "+safeLocal(d.nws_forecast.issued_at):"No current NWS update time");
 const p=(d.nws_forecast?.periods||[]).filter(x=>x.isDaytime).slice(0,4);
 const wrap=document.getElementById("forecast-days");
 wrap.replaceChildren();
 p.forEach(period=>{
   const article=document.createElement("div");article.className="card";
   const a=document.createElement("strong");a.textContent=period.name||fmt(period.start.slice(0,10));
   const b=document.createElement("p");b.textContent=[
      period.shortForecast,period.temperature==null?null:period.temperature+"°"+period.temperatureUnit,
      period.precipitationProbability==null?null:"Precipitation "+period.precipitationProbability+"%"
     ].filter(Boolean).join(" · ");
   article.append(a,b);wrap.append(article);
 });
}
async function run(){
 const d=await api("/api/national-fall-region?region="+encodeURIComponent(area));
 render(d);
}
async function observations(){
 const lat=document.documentElement.dataset.lat,lon=document.documentElement.dataset.lon,tz=document.documentElement.dataset.tz;
 try{
 const d=await api("/api/national-fall-observations?lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lon)+"&tz="+encodeURIComponent(tz));
 const v=d.colored_leaves;
 if(v){set("observed-status",v.label);set("observed-detail",v.detail+" This is a 75-mile volunteer observation radius, not a measurement of forest-wide color.");}
 else set("observed-status","No usable current foliage observation summary");
 }catch{set("observed-status","Local observation feed unavailable");set("observed-detail","Do not infer current foliage from missing observations.");}
}
run().catch(()=>{set("forecast-state","NWS data temporarily unavailable");set("season-status","Seasonal reference only");set("weekend-grade","Live outlook unavailable");set("weekend-verdict","Historical timing and drive references remain below. Check local official sources before traveling.");});
async function historical(){
 const lat=document.documentElement.dataset.lat,lon=document.documentElement.dataset.lon;
 try{
  const d=await api("/api/national-fall-color?lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lon));
  const middle=d.typical_mid_greendown?.date_current_year;
  const window=d.typical_window;
  if(!middle){set("satellite-status","Historical satellite timing unavailable");return;}
  set("satellite-status","Typical satellite mid-greendown: "+fmt(middle));
  set("satellite-detail",(window?.start_date&&window?.end_date?"Historical variability window: "+fmt(window.start_date)+"–"+fmt(window.end_date)+". ":"")+"This is the MODIS 2001–2017 midpoint of canopy greenness decline. It is not live observed leaf color and is not interchangeable with the visual peak-color date.");
 }catch{set("satellite-status","Historical satellite model unavailable");set("satellite-detail","The broad editorial planning window above is still shown; do not treat it as a current observation.");}
}
async function phenocam(){
 try{
  const d=await api("/api/national-fall-phenocam?region="+encodeURIComponent(area));
  const status=d.status||"SOURCE_UNAVAILABLE";
  const cameras=Array.isArray(d.cameras)?d.cameras:[];
  const tested=cameras.filter(x=>x.validation?.samples>0);
  const samples=tested.reduce((s,x)=>s+x.validation.samples,0);
  const best=cameras.find(x=>x.status==="CALIBRATED");
  const names=cameras.map(x=>x.site).filter(Boolean).slice(0,2).join(", ");
  if(best&&Number.isInteger(d.shift_days)){
   const sign=d.shift_days>=0?"+":"";
   set("phenocam-status","Verified local canopy-timing offset: "+sign+d.shift_days+" days ("+d.confidence+" confidence)");
   set("phenocam-detail","Relative to historical local camera greendown, this season appears "+(d.shift_days>0?"ahead":d.shift_days<0?"behind":"near normal")+". "
    +names+". "+samples+" held-out historical seasons evaluated across nearby cameras. No change is made to advertised scenic peak-color dates.");
  }else{
   const explanation=status==="NO_REPRESENTATIVE_CAMERA"?"No suitable deciduous PhenoCam ROI within 145 km of this regional anchor."
    :status==="SOURCE_UNAVAILABLE"?"PhenoCam data or metadata currently unavailable; the seasonal estimate is unchanged."
    :"Nearby camera records did not pass freshness, historical coverage and forecast-validation gates.";
   set("phenocam-status","Camera calibration withheld");
   set("phenocam-detail",explanation+(names?" Sites examined: "+names+".":"")+(samples?" Historical holdouts tested: "+samples+".":"")+" No regional peak dates have been adjusted.");
  }
 }catch{
  set("phenocam-status","PhenoCam research feed unavailable");
  set("phenocam-detail","No camera-based timing adjustment is applied. Historical seasonal guidance remains separate.");
 }
}
historical();
observations();
phenocam();
})();
`;
function page(r){
 const canonical=url(r.id);
 const idx=regions.indexOf(r);
 const neighbors=[regions[(idx+regions.length-1)%regions.length],regions[(idx+1)%regions.length]];
 const schema={"@context":"https://schema.org","@graph":[
 {"@type":"WebPage","@id":canonical+"#webpage",url:canonical,name:r.name+" 2027 | When to Go, Best Drives & Weekend Outlook",description:r.why,isPartOf:{"@id":"https://chrisizworski.com/#website"},author:{"@id":"https://chrisizworski.com/#person"},datePublished:"2026-10-08",dateModified:"2026-10-08"},
 {"@type":"BreadcrumbList",itemListElement:[
 {"@type":"ListItem",position:1,name:"Fall Color",item:"https://chrisizworski.com/fall-color/"},
 {"@type":"ListItem",position:2,name:"U.S. regions",item:url("national")},
 {"@type":"ListItem",position:3,name:r.name,item:canonical}]}
 ]};
 const drives=r.drives.map((d,i)=>`<article class="card"><div class="number">DRIVE ${i+1}</div><h3>${esc(d[0])}</h3><div class="muted">${esc(d[1])}</div><p>${esc(d[2])}</p></article>`).join("");
 return `<!doctype html><html lang="en" data-region="${r.id}" data-lat="${r.lat}" data-lon="${r.lon}" data-tz="${r.tz}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(r.name)} 2027 | Peak Timing, Best Drives & Weekend Forecast</title><meta name="description" content="${esc(r.name)} 2027: typical peak timing, ${r.drives.length} scenic drives, official NWS weekend weather and nearby foliage observations. Plan the right weekend."><link rel="canonical" href="${canonical}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="author" content="Chris Izworski"><meta property="og:type" content="website"><meta property="og:title" content="${esc(r.name)} 2027 | Fall Color Weekend Planner"><meta property="og:description" content="${esc(r.why)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${json(schema)}</script><style>${css}</style></head><body><header class="top"><div class="inner"><a class="brand" href="/">Chris Izworski</a><nav><a href="/fall-color/">Michigan color</a><a href="/fall-color/national/">National regions</a><a href="/national-tools/">All tools</a></nav></div></header><main class="inner"><div class="hero"><div class="breadcrumb"><a href="/fall-color/">Fall Color</a> / <a href="/fall-color/national/">National</a> / ${esc(r.name)}</div><div class="kicker">2027 fall foliage decision guide</div><h1>When to see fall color in ${esc(r.name.replace(/ Fall Color$/,""))}</h1><p class="lede">${esc(r.why)}</p></div><div class="grid" aria-label="Fall color decision"><section class="card"><div class="label">Typical planning window · not a live leaf reading</div><div class="big">${esc(fmt(r.peak[0]))}–${esc(fmt(r.peak[1]))}</div><p>Approximate historical planning range. Actual peak depends on species, elevation, drought, temperature, and storms.</p><div class="label" style="margin-top:14px">Seasonal timing index</div><div class="big" id="timing-index">Calculating…</div><div class="meter"><i id="timing-bar"></i></div><p id="season-status" class="muted">Checking the seasonal curve…</p><p class="footnotes">The 0–100 score means proximity to a broad seasonal timing window. It does <strong>not</strong> mean percent of leaves colored.</p></section><section class="card"><div class="label">This Saturday · trip decision</div><div class="big" id="weekend-date">Checking date…</div><div class="status" id="weekend-grade">Checking…</div><p id="weekend-verdict">Loading the weekend decision.</p><p class="muted" id="weekend-weather">Checking the official NWS forecast…</p><p class="source" id="forecast-state"></p></section></div><section class="section"><h2>Historical satellite autumn timing</h2><div class="card"><div class="status" id="satellite-status">Checking USA-NPN historical greendown…</div><p id="satellite-detail">The satellite record measures the typical midpoint of landscape greenness decline; it is not a measured date of colorful foliage peak.</p><p class="source"><a href="https://www.usanpn.org/data/maps/land_surface_phenology">Source: USA National Phenology Network satellite phenology</a></p></div></section><section class="section"><h2>PhenoCam canopy timing: historical validation</h2><div class="card"><div class="status" id="phenocam-status">Checking nearby calibrated forest cameras…</div><p id="phenocam-detail">Historical camera greendown trends are evaluated out of sample before an offset can be displayed. This does not alter the scenic peak forecast.</p><p class="source" id="phenocam-source"><a href="https://phenocam.nau.edu/webcam/">PhenoCam Network</a> · CC BY 4.0 · <a href="https://zenodo.org/records/14854980">Fair Use and attribution</a></p></div></section><section class="section"><h2>Current ground observations</h2><div class="card"><div class="status" id="observed-status">Checking USA-NPN volunteer observations…</div><p id="observed-detail">Recent local leaf-color observations can corroborate season progression, but do not represent a forest-wide percentage.</p><p class="source"><a href="https://www.usanpn.org/data/observational">Source: USA National Phenology Network</a></p></div></section><section class="section"><h2>Best ${r.drives.length} fall color drives</h2><p>Select a corridor, then compare elevation and check official access notices before setting out. Drive names and descriptions are route guidance, not live road condition reports.</p><div class="grid">${drives}</div><p class="warn"><strong>Access not verified:</strong> Park entrances, shuttles, reservations, seasonal road closures and trail access must be checked with the responsible agency. NWS weather cannot confirm roads are open.</p></section><section class="section"><h2>NWS forecast near the regional anchor</h2><p>Forecast samples one representative location (${r.lat.toFixed(2)}°, ${r.lon.toFixed(2)}°). Mountain passes and coastlines may have very different weather. This is <strong>weather information, not a live foliage measurement</strong>.</p><p class="updated" id="forecast-updated">Checking official forecast…</p><div class="grid" id="forecast-days"></div><p class="source"><a href="https://www.weather.gov/documentation/services-web-api">Source: National Weather Service API</a></p></section><section class="section"><h2>Where to go next</h2><div class="navlinks"><a href="${url("national")}">All 15 regions</a>${neighbors.map(x=>`<a href="${url(x.id)}">${esc(x.name)}</a>`).join("")}<a href="/fall-color/">Michigan fall color engine</a></div></section><section class="section"><h2>How this outlook works</h2><p>The regional seasonal model shares the basic approach of the <a href="/fall-color/">Michigan fall color tools</a>: timing first, weather as a trip-planning input. The national weather feed uses NWS data; current colored-leaf reports, when available, come from volunteer observations at nearby sites. Neither source measures a regional leaf-color percentage. The broad seasonal window is editorial planning guidance and should be checked against local reports.</p></section></main><footer class="footer"><div class="inner">Built by <a href="/chris-izworski/">Chris Izworski</a> · <a href="/fall-color/national/">U.S. fall color guides</a> · <a href="/national-tools/">National outdoor tools</a></div></footer><script>${js}</script></body></html>`;
}
for(const r of regions){
 const p=path.join(root,"public/fall-color",r.id,"index.html");
 fs.mkdirSync(path.dirname(p),{recursive:true});
 fs.writeFileSync(p,page(r));
}
const cards=regions.map((r,i)=>`<article class="card"><div class="kicker">Region ${i+1}</div><h2><a href="${url(r.id)}">${esc(r.name)}</a></h2><p>${esc(r.why)}</p><p class="source">Typical planning window: ${fmt(r.peak[0])}–${fmt(r.peak[1])}</p><p>${r.drives.slice(0,2).map(x=>esc(x[0])).join(" · ")}</p></article>`).join("");
const hub=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2027 U.S. Fall Color: 15 Regions, Scenic Drives & Weekend Outlooks</title><meta name="description" content="Plan fall color trips in 15 U.S. regions for 2027. Compare typical peak windows, scenic drives, NWS forecasts and local leaf observations."><link rel="canonical" href="${url("national")}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="author" content="Chris Izworski"><meta property="og:title" content="2027 U.S. Fall Color: 15 Regional Guides"><meta property="og:url" content="${url("national")}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${json({"@context":"https://schema.org","@type":"CollectionPage",url:url("national"),name:"U.S. Fall Color 2027",author:{"@id":"https://chrisizworski.com/#person"},datePublished:"2026-10-08",hasPart:regions.map(r=>({"@type":"WebPage",url:url(r.id),name:r.name}))})}</script><style>${css}</style></head><body><header class="top"><div class="inner"><a class="brand" href="/">Chris Izworski</a><nav><a href="/fall-color/">Michigan color</a><a href="/national-tools/">National tools</a></nav></div></header><main class="inner"><div class="hero"><div class="breadcrumb"><a href="/fall-color/">Fall Color</a> / National</div><div class="kicker">2027 trip planning</div><h1>Fall color across the United States: where to go and when</h1><p class="lede">Choose one of 15 regions to see broad peak-season guidance, scenic-drive options, official National Weather Service weekend weather and available local foliage observations.</p><div class="warn">Seasonal timing is a planning estimate, not a measurement of current leaf color. NWS forecasts cover weather, not foliage. Check road access and local reports before travel.</div></div><div class="section grid">${cards}</div><section class="section"><h2>Michigan fall color already has a dedicated live engine</h2><p>For the most detailed Upper Peninsula and Lower Peninsula timing, use the <a href="/fall-color/">Michigan Fall Color map and regional guides</a>. The national collection uses a separate forecast layer, preserving the Michigan product.</p></section></main><footer class="footer"><div class="inner">Built by <a href="/chris-izworski/">Chris Izworski</a> · <a href="/national-tools/">National outdoor tools</a></div></footer></body></html>`;
const hp=path.join(root,"public/fall-color/national/index.html");fs.mkdirSync(path.dirname(hp),{recursive:true});fs.writeFileSync(hp,hub);
const urls=["national",...regions.map(r=>r.id)];
fs.writeFileSync(path.join(root,"public/fall-color/national-sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(s=>`  <url><loc>${url(s)}</loc><lastmod>2026-10-08</lastmod></url>`).join("\n")}\n</urlset>\n`);
const locatorPath=path.join(root,"public/national-tools/fall-color/index.html");
let locator=fs.readFileSync(locatorPath,"utf8");
if(!locator.includes('data-2027-national-regions')){
 if(!locator.includes("</main>"))throw new Error("National fall-color locator has no main element");
 const section='<section data-2027-national-regions class="section"><div class="wrap"><h2>2027 fall-color regional guides</h2><p>For a driving weekend, compare the 15 U.S. regions and their scenic corridors before choosing a city. These regional pages include NWS weather and available ground reports.</p><p><a href="/fall-color/national/">Browse all 15 national fall-color guides</a> · <a href="/fall-color/new-england/">New England</a> · <a href="/fall-color/great-smoky-mountains/">Great Smoky Mountains</a> · <a href="/fall-color/colorado-aspens/">Colorado aspens</a></p></div></section>';
 locator=locator.replace("</main>",section+"</main>");
 fs.writeFileSync(locatorPath,locator);
}
console.log("National foliage pages: "+regions.length+" regions + hub + sitemap");
