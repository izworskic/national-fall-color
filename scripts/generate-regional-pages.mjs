// Generate evergreen region pages; never touch the established Michigan fall-color tree.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {regions}=require("../lib/national-region-catalog.js");
const {corridorAnchors}=require("../lib/national-regional-map-places.js");
const {viewingSpots}=require("../lib/national-regional-viewing-spots.js");
const {pointTiming,validateCatalog}=require("../lib/national-site-timing.js");
const {profiles:dayProfiles}=require("../lib/fall-day-decision.js");
const root=process.cwd();
const dayPlannerRevision=crypto.createHash("sha256")
  .update(fs.readFileSync(path.join(root,"lib/fall-day-decision.js")))
  .update(fs.readFileSync(path.join(root,"public/fall-color/national/day-planner-ui.js")))
  .digest("hex").slice(0,12);
const regionalMapRevision=crypto.createHash("sha256")
  .update(fs.readFileSync(path.join(root,"lib/national-site-timing.js")))
  .update(fs.readFileSync(path.join(root,"lib/national-map-state.js")))
  .update(fs.readFileSync(path.join(root,"public/fall-color/national/regional-map-ui.js")))
  .digest("hex").slice(0,12);
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
// Read the single shared, pre-generated daily edition; NEVER generate on a visit.
async function dailyBriefing(){
 try{
  const d=await api("https://chrisizworski.com/api/fall-color?view=national-briefings&region="+encodeURIComponent(area));
  if(!d||!d.briefing||d.method!=="AI-generated model summary")return;
  set("daily-editorial-text",d.briefing);
  set("daily-editorial-updated","Published "+safeLocal(d.updated)+" · AI interpretation of modeled timing and NWS weather, not an observed leaf report.");
  const panel=document.getElementById("daily-editorial");
  if(panel)panel.hidden=false;
 }catch{} // Unavailable notes are hidden, not replaced with invented live descriptions.
}
dailyBriefing();
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
  const credits=document.getElementById("phenocam-source");
  if(credits&&cameras.length){
   const label=document.createElement("span");label.textContent=" · Source sites: ";credits.append(label);
   cameras.filter(x=>x.site).slice(0,2).forEach((x,i)=>{
    if(i){const sep=document.createElement("span");sep.textContent=", ";credits.append(sep);}
    const link=document.createElement("a");
    link.href=(typeof x.site_url==="string"&&x.site_url.startsWith("https://phenocam.nau.edu/"))?x.site_url:"https://phenocam.nau.edu/webcam/";
    link.textContent=x.site;link.rel="noopener noreferrer";
    credits.append(link);
   });
  }
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

const regionalMapStyles=String.raw`
/* Scaled Michigan map: national map -> region -> curated scenic corridors. */
.regional-map-shell{background:#fffdf8;border:1px solid #d6cab5;border-radius:15px;padding:14px;min-width:0;max-width:100%;overflow:hidden}
.regional-map-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px}
.regional-map-head h2{margin:4px 0 7px}
.regional-map-head p{font-size:14px;margin:0 0 12px;max-width:660px}
.regional-map-source{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
#regional-switch-basemap{min-height:44px;border:1px solid #b7a98e;border-radius:8px;background:#eee7d7;padding:9px 12px;font-weight:700;color:#304b38;cursor:pointer}
#regional-switch-basemap:focus-visible,#regional-date-slider:focus-visible{outline:3px solid #9c4e27;outline-offset:2px}
#regional-switch-basemap:disabled{opacity:.55}
#regional-basemap-status{color:#625e54;font-size:12px;max-width:280px}
#regional-map{height:clamp(350px,48vw,495px);width:100%;max-width:100%;min-width:0;background:#d9dfd5;border:1px solid #ddd2be;border-radius:10px;z-index:0}
.regional-map-controls{padding:13px 2px 5px}
.regional-map-date-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:9px}
#regional-selected-date{font-size:16px;font-weight:800}
#regional-reset-date{min-height:44px;padding:8px 13px;border:1px solid #baad94;border-radius:8px;background:#e8e0d1;color:#2b3026;cursor:pointer}
#regional-reset-date:disabled{opacity:.45;cursor:default}
#regional-preview-next{min-height:44px;border:1px solid #8e6844;background:#f7ede0;color:#513b2b;font:700 13px system-ui,sans-serif;border-radius:8px;padding:10px 13px;cursor:pointer;margin:7px 0}
#regional-preview-next[hidden]{display:none}
#regional-preview-next:focus-visible{outline:3px solid #9c4e27;outline-offset:2px}

#regional-date-slider{display:block;width:100%;max-width:100%;min-height:34px;margin:11px 0 4px;accent-color:#9c4e27}
.regional-map-date-ends{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#686358}
.regional-map-meta{font-size:12px;line-height:1.55;color:#625c50;margin:9px 0 0}
.regional-map-shell .leaflet-popup-content-wrapper{border-radius:11px;max-width:calc(100vw - 65px)}
.regional-map-shell .leaflet-popup-content{margin:12px;max-width:calc(100vw - 92px)!important}
.regional-map-popup{font-size:13px;line-height:1.45;overflow-wrap:anywhere;max-width:100%}
.regional-map-popup strong{display:block;font-size:16px;line-height:1.25}
.regional-map-popup p{margin:7px 0}
.regional-map-stage{display:block;font-weight:800;margin:6px 0}
.regional-map-cta{display:block;text-align:center;padding:10px 12px;background:#355a3b;border-radius:8px;min-height:44px;color:white!important;text-decoration:none;font-weight:750}
.regional-map-shell .leaflet-control-layers{font-size:12px}
.regional-location-key{display:flex;gap:13px;flex-wrap:wrap;padding:10px 3px 0;font-size:12px;color:#514d45}
.regional-location-key span{display:inline-flex;align-items:center;gap:5px}
.regional-location-key i{display:inline-block;background:#9c4e27;flex-shrink:0}
.regional-location-key .key-drive{width:15px;height:15px;border:2px solid #fff;outline:1px solid #776e62;border-radius:50%}
.regional-location-key .key-spot{width:11px;height:11px;border:2px solid #fff;outline:1px solid #776e62;border-radius:50%}
.regional-focus{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:8px 3px 0}
.regional-focus:empty{display:none}
.regional-focus label{font-weight:700;font-size:13px}
#regional-area-picker{font:inherit;max-width:100%;min-height:44px;border:1px solid #baa98c;border-radius:8px;background:#fff;padding:8px}
.regional-spot-directory{margin:14px 2px 4px;border-top:1px solid #d6cab5;padding-top:12px}
.regional-spot-directory summary{font-weight:750;cursor:pointer;padding:6px 0;font-size:14px}
.regional-spot-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.regional-spot-item{border:1px solid #e2dbce;border-radius:10px;padding:10px;min-width:0;font-size:12px;line-height:1.45}
.regional-spot-item button{border:0;background:none;padding:2px 0;font:700 14px/1.35 system-ui,sans-serif;text-align:left;color:#30533c;text-decoration:underline;cursor:pointer}
.regional-spot-item span{display:block;color:#5f5a50;padding:3px 0}
.regional-spot-item a{font-size:11px}
.regional-spot-item:target{outline:3px solid #9c4e27;outline-offset:2px}
.card:target{outline:3px solid #9c4e27;outline-offset:3px}
@media(max-width:700px){.regional-map-shell{padding:9px;border-radius:12px}#regional-map{height:365px}.regional-map-head h2{font-size:24px}.regional-spot-grid{grid-template-columns:minmax(0,1fr)}}
`;
function regionalMapSection(r){
  const points=corridorAnchors[r.id];
  if(!Array.isArray(points)||points.length!==r.drives.length)
    throw new Error("Missing corridor map anchors for "+r.id);
  validateCatalog(regions,viewingSpots);
  const candidates=viewingSpots[r.id]||[];
  // Every extra dot needs a unique label, a geographically plausible area,
  // and an HTTPS destination reference. Never create orphan catalog markers.
  const seen=new Set();
  const spots=candidates.map((x,i)=>{
    const [name,lat,lon,state,reason,sourceUrl]=x;
    if(!name||seen.has(name.toLowerCase())||!r.states.includes(state)||
       !Number.isFinite(lat)||lat<25||lat>49.5||!Number.isFinite(lon)||lon<-125||lon>-66||
       !reason||!/^https:\/\//.test(sourceUrl))
      throw new Error("Invalid viewing-location entry: "+r.id+" "+i);
    seen.add(name.toLowerCase());
    return {index:i+1,name,lat,lon,state,reason,sourceUrl,...pointTiming(r,"spot",i)};
  });
  const payload={id:r.id,name:r.name,lat:r.lat,lon:r.lon,peak:r.peak,spots,
    drives:r.drives.map((d,i)=>({
      index:i+1,name:d[0],corridor:d[1],tip:d[2],lat:points[i][0],lon:points[i][1],
      vicinity:points[i][2],...pointTiming(r,"drive",i)
    }))};
  for(const d of payload.drives){
    if(!Number.isFinite(d.lat)||!Number.isFinite(d.lon)||!d.vicinity)
      throw new Error("Invalid scenic corridor access anchor "+r.id+" drive "+d.index);
  }
  const focusStates=[...new Set(spots.map(x=>x.state))];
  const focus=focusStates.length>1?`<label for="regional-area-picker">Zoom to area</label>
    <select id="regional-area-picker"><option value="all">All locations</option>${focusStates.map(code=>`<option value="${esc(code)}">${esc(code)}</option>`).join("")}</select>`:"";
  const spotCards=spots.map(x=>`<article class="regional-spot-item" id="viewing-${x.index}">
    <button type="button" data-regional-spot-pick="${x.index}" aria-label="Show ${esc(x.name)} on map">${esc(x.name)}</button>
    <span>${esc(x.state)} · ${esc(x.reason)}</span>
    <a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener noreferrer">Regional source ↗</a>
    </article>`).join("");
  return `<section class="section regional-map-shell" aria-labelledby="regional-map-heading">
    <div class="regional-map-head"><div><div class="kicker">Zoom into this region</div>
    <h2 id="regional-map-heading">Explore ${esc(r.name.replace(/ Fall Color$/,""))} on the map</h2>
    <p>Michigan-style regional color progression: each area now has its own typical seasonal timing. Compare scenic drives and viewing areas on a date, then tap a dot to see its estimated window and geographic basis.</p></div>
    <div class="regional-map-source"><button type="button" id="regional-switch-basemap">Use OpenStreetMap instead</button>
    <span id="regional-basemap-status" role="status" aria-live="polite">CARTO Voyager streets</span></div></div>
    <p class="regional-map-meta" id="regional-local-model-note">Estimated seasonal progression · local topography and historic regional patterns, not live foliage readings</p>
    <div id="regional-map" role="region" aria-label="Interactive map of ${r.drives.length} fall foliage scenic drives near ${esc(r.name)}"></div>
    <div class="regional-location-key"><span><i class="key-drive"></i> Scenic-drive corridor</span><span><i class="key-spot"></i> Viewing area</span></div>
    <div class="regional-focus">${focus}</div>
    <div class="regional-map-controls"><div class="regional-map-date-row">
    <label for="regional-date-slider" id="regional-selected-date">Choose a fall date</label>
    <button type="button" id="regional-reset-date">Today</button></div>
    <button type="button" id="regional-preview-next" hidden>Preview next fall</button>
    <input type="range" id="regional-date-slider" min="0" max="98" value="0" step="1" aria-label="Preview regional fall foliage seasonal stage">
    <div class="regional-map-date-ends"><span>September 1</span><span>December 8</span></div>
    <p class="regional-map-meta" id="regional-map-status" role="status" aria-live="polite">Loading historical seasonal stage…</p>
    <p class="regional-map-meta" id="regional-map-fallback">These color differences are <strong>geography-informed typical seasonal scenarios</strong>, not measured leaf color or a live site forecast. Map points are approximate access areas, not driving directions. Weather, species, elevation and storms can shift the outcome.</p>
    </div>
    <details class="regional-spot-directory"><summary>${spots.length} additional foliage viewing locations · tap to explore</summary>
      <p class="regional-map-meta">Locations are approximate viewing areas, not parking or routing coordinates. Their displayed timing bands vary by landscape, but remain illustrative historical planning guidance, not live observations.</p>
      <div class="regional-spot-grid">${spotCards}</div>
    </details>
    <script type="application/json" id="regional-map-data">${json(payload)}</script></section>`;
}

const dayPlannerStyles=String.raw`
/* Decision-first, mobile-first: not a directory and not a second map. */
.fall-day-shell{background:#fbf5e9;border:1px solid #cbb895;border-radius:16px;padding:18px;min-width:0;max-width:100%;overflow:hidden}
.fall-day-shell h2{margin:5px 0 8px}.fall-day-shell .lede{font-size:14px;margin:0 0 12px}
.fall-day-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:10px;row-gap:10px;align-items:end}
.fall-day-field{min-width:0}.fall-day-field label{display:block;font-size:12px;font-weight:800;margin-bottom:5px;color:#5a4730}
.fall-day-field input,.fall-day-field select{font:inherit;font-size:14px;width:100%;min-height:46px;max-width:100%;border:1px solid #b6a68b;border-radius:8px;background:#fffefa;padding:9px;color:#292820}
.fall-day-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:10px}
.fall-day-actions button,.day-result-links button{font:700 13px system-ui,sans-serif;min-height:44px;padding:9px 13px;border-radius:9px;border:1px solid #365741;background:#365741;color:#fff;cursor:pointer}
#fall-day-geolocate{background:#fffbf3;color:#365741}
.fall-day-actions button:focus-visible,.day-result-links button:focus-visible,.fall-day-field :focus-visible{outline:3px solid #b57937;outline-offset:2px}
#fall-day-origin-note{font-size:12px;color:#665d4d;margin:9px 0}
#fall-day-caption{font-size:14px;font-weight:650;color:#344e3a;margin:14px 0 10px}
.day-verdict{padding:12px;background:#eef0e5;border-left:4px solid #456b48;border-radius:8px;margin:0 0 12px}
.day-verdict strong{display:block;font:700 19px/1.3 Georgia,serif}.day-verdict p{margin:4px 0 0;font-size:13px}
.day-results-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.day-result{padding:13px;background:#fffefa;border:1px solid #d6cbb5;border-radius:12px;min-width:0}
.day-result-head{display:flex;align-items:flex-start;gap:8px}.day-result-head strong{display:block;font-size:16px;line-height:1.3}
.day-result-head .day-rank{display:grid;place-items:center;flex-shrink:0;width:25px;height:25px;background:#365741;color:white;border-radius:100%;font-size:12px;font-weight:800}
.day-result-sub{display:block;font-size:12px;margin-top:3px;color:#6e552d}
.day-result p{font-size:13px;line-height:1.5;margin:9px 0}.day-result .day-distance{color:#596354}
.day-result .day-access{color:#824d30;font-weight:650}
.day-result-links{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}
.day-result-links a{font-size:12px;font-weight:600;overflow-wrap:anywhere}
.day-result-links button{background:#f5f1e6;color:#365741}
.day-evidence,.day-no-results{font-size:12px;line-height:1.55;color:#5e5c50;margin:12px 0 0}
@media(max-width:880px){.fall-day-form{grid-template-columns:repeat(2,minmax(0,1fr))}.day-results-grid{grid-template-columns:1fr}}
@media(max-width:480px){.fall-day-shell{padding:13px}.fall-day-form{grid-template-columns:minmax(0,1fr)}}
`;
function dayPlannerSection(r){
 if(!dayProfiles[r.id])return "";
 return `<section class="section fall-day-shell" aria-labelledby="fall-day-heading">
 <div class="kicker">Plan the day · regional decision tool</div>
 <h2 id="fall-day-heading">Where should you go for fall color?</h2>
 <p class="lede">Pick a fall date, starting town and outing style. ${esc(r.why)} Recommendations compare each mapped place’s typical timing, not measured live leaf color.</p>
 <form id="fall-day-form" class="fall-day-form">
 <div class="fall-day-field"><label for="fall-day-date">Your date</label><input type="date" id="fall-day-date" required></div>
 <div class="fall-day-field"><label for="fall-day-start">Starting from</label><select id="fall-day-start"><option value="">Compare the whole region</option></select></div>
 <div class="fall-day-field"><label for="fall-day-style">Your kind of day</label><select id="fall-day-style"><option value="drive">Scenic drive</option><option value="photo">Photographs & viewpoints</option><option value="relaxed">Villages & easygoing outings</option></select></div>
 <div class="fall-day-field"><label for="fall-day-length">Available time</label><select id="fall-day-length"><option value="short">A few hours</option><option value="half" selected>Half day</option><option value="day">Full day</option></select></div>
 </form>
 <div class="fall-day-actions"><button id="fall-day-submit" type="submit" form="fall-day-form">Find my best color day →</button><button id="fall-day-geolocate" type="button">Use my location</button></div>
 <p id="fall-day-origin-note">Only a straight-line proximity filter. No road travel time or actual route has been calculated.</p>
 <div id="fall-day-caption" role="status" aria-live="polite">Comparing the mapped locations…</div>
 <div id="fall-day-results"></div>
 </section>`;
}
function page(r){
 const isSmokies=r.id==="great-smoky-mountains";
 // Keep this in-season landing page current without changing the other 14 regional pages.
 const yearTag=isSmokies?String(new Date().getUTCFullYear()):"2027";
 const smokiesAdvice=isSmokies?`<section class="section" aria-labelledby="smokies-elevation-guide">
 <div class="kicker">Choose your elevation before choosing your date</div>
 <h2 id="smokies-elevation-guide">Smokies fall color: Cades Cove or Newfound Gap?</h2>
 <p>Fall colors do not peak simultaneously throughout Great Smoky Mountains National Park. The National Park Service explains that color usually starts at higher elevations and moves into lower valleys. High-elevation areas above 4,000 feet often change in early to mid-October; strong colors below 4,000 feet more commonly arrive from mid-October into early November. These are broad historic patterns, not confirmed live colors for any specific day.</p>
 <div class="grid"><article class="card"><h3><a href="/fall-color/great-smoky-mountains/newfound-gap-road/">Newfound Gap Road · high-elevation comparison</a></h3><p>Follow US-441 between Gatlinburg and Cherokee for changing tree species and elevation. It is the more flexible choice when higher slopes are ahead of the valleys. Fog, weather, parking and temporary closures may affect the drive.</p><p><a href="https://www.nps.gov/grsm/planyourvisit/seasonalroads.htm">Verify official NPS road access ↗</a></p></article><article class="card"><h3><a href="/fall-color/great-smoky-mountains/cades-cove/">Cades Cove · lower valley color</a></h3><p>Choose the 11-mile one-way loop for open fields, historic buildings and hardwood-covered ridges. The lower valley may develop its strongest autumn color later than the mountain passes. Allow extra time for October traffic.</p><p><a href="https://www.nps.gov/grsm/planyourvisit/cadescove.htm">Check Cades Cove operating information ↗</a></p></article></div>
 <p class="source">Elevation guidance: <a href="https://www.nps.gov/grsm/planyourvisit/fallcolor.htm">NPS fall color</a>. Crowd and parking guidance: <a href="https://www.nps.gov/grsm/learn/news/autumn-is-in-the-air-in-the-great-smoky-mountains.htm">NPS September 10, 2026 visitor release</a>. This page does not verify today's road openings or identify exact peak dates.</p>
 </section>`:"";
 const canonical=url(r.id);
 const idx=regions.indexOf(r);
 const neighbors=[regions[(idx+regions.length-1)%regions.length],regions[(idx+1)%regions.length]];
 const schema={"@context":"https://schema.org","@graph":[
 {"@type":"WebPage","@id":canonical+"#webpage",url:canonical,name:r.name+" "+yearTag+" | When to Go, Best Drives & Weekend Outlook",description:r.why,isPartOf:{"@id":"https://chrisizworski.com/#website"},author:{"@id":"https://chrisizworski.com/#person"},datePublished:"2026-10-08",dateModified:isSmokies?"2026-10-09":"2026-10-08"},
 {"@type":"BreadcrumbList",itemListElement:[
 {"@type":"ListItem",position:1,name:"Fall Color",item:"https://chrisizworski.com/fall-color/"},
 {"@type":"ListItem",position:2,name:"U.S. regions",item:url("national")},
 {"@type":"ListItem",position:3,name:r.name,item:canonical}]}
 ]};
 const drives=r.drives.map((d,i)=>`<article class="card" id="drive-${i+1}"><div class="number">DRIVE ${i+1}</div><h3>${esc(d[0])}</h3><div class="muted">${esc(d[1])}</div><p>${esc(d[2])}</p></article>`).join("");
 return `<!doctype html><html lang="en" data-region="${r.id}" data-lat="${r.lat}" data-lon="${r.lon}" data-tz="${r.tz}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(r.name)} ${yearTag} | Peak Timing, Best Drives & Weekend Forecast</title><meta name="description" content="${isSmokies?"Great Smoky Mountains fall colors "+yearTag+": compare Newfound Gap and Cades Cove peak timing by elevation, scenic drives, NPS road checks and weekend forecasts.":esc(r.name)+" 2027: typical peak timing, "+r.drives.length+" scenic drives, official NWS weekend weather and nearby foliage observations. Plan the right weekend."}"><link rel="canonical" href="${canonical}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="author" content="Chris Izworski"><meta property="og:type" content="website"><meta property="og:title" content="${esc(r.name)} ${yearTag} | Fall Color Weekend Planner"><meta property="og:description" content="${esc(r.why)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${json(schema)}</script><link rel="stylesheet" href="/national-tools/fall-color/national-map/leaflet/leaflet.css"><style>${css}${regionalMapStyles}${dayProfiles[r.id]?dayPlannerStyles:""}</style></head><body><header class="top"><div class="inner"><a class="brand" href="/">Chris Izworski</a><nav><a href="/fall-color/">Michigan color</a><a href="/fall-color/national/">National regions</a><a href="/national-tools/">All tools</a></nav></div></header><main class="inner"><div class="hero"><div class="breadcrumb"><a href="/fall-color/">Fall Color</a> / <a href="/fall-color/national/">National</a> / ${esc(r.name)}</div><div class="kicker">${yearTag} fall foliage decision guide</div><h1>When to see fall color in ${esc(r.name.replace(/ Fall Color$/,""))}</h1><p class="lede">${esc(r.why)}</p></div>${smokiesAdvice}<div class="grid" aria-label="Fall color decision"><section class="card"><div class="label">Typical planning window · not a live leaf reading</div><div class="big">${esc(fmt(r.peak[0]))}–${esc(fmt(r.peak[1]))}</div><p>Approximate historical planning range. Actual peak depends on species, elevation, drought, temperature, and storms.</p><div class="label" style="margin-top:14px">Seasonal timing index</div><div class="big" id="timing-index">${isSmokies?"Historical timing estimate":"Calculating…"}</div><div class="meter"><i id="timing-bar"></i></div><p id="season-status" class="muted">${isSmokies?"Use the seasonal window and destination comparison above while the date-specific model loads.":"Checking the seasonal curve…"}</p><p class="footnotes">The 0–100 score means proximity to a broad seasonal timing window. It does <strong>not</strong> mean percent of leaves colored.</p></section><section class="card"><div class="label">This Saturday · trip decision</div><div class="big" id="weekend-date">${isSmokies?"Forecast not yet checked":"Checking date…"}</div><div class="status" id="weekend-grade">${isSmokies?"Verify current conditions":"Checking…"}</div><p id="weekend-verdict">${isSmokies?"Compare elevation and dates above. Live NWS weather and the date-specific trip verdict will appear when the feed responds.":"Loading the weekend decision."}</p><p class="muted" id="weekend-weather">Checking the official NWS forecast…</p><p class="source" id="forecast-state"></p></section></div><section class="section" id="daily-editorial" hidden><h2>Today's regional fall-color briefing</h2><div class="card"><p id="daily-editorial-text"></p><p class="source" id="daily-editorial-updated"></p></div></section>${dayPlannerSection(r)}${regionalMapSection(r)}<section class="section"><h2>Historical satellite autumn timing</h2><div class="card"><div class="status" id="satellite-status">Checking USA-NPN historical greendown…</div><p id="satellite-detail">The satellite record measures the typical midpoint of landscape greenness decline; it is not a measured date of colorful foliage peak.</p><p class="source"><a href="https://www.usanpn.org/data/maps/land_surface_phenology">Source: USA National Phenology Network satellite phenology</a></p></div></section><section class="section"><h2>PhenoCam canopy timing: historical validation</h2><div class="card"><div class="status" id="phenocam-status">Checking nearby calibrated forest cameras…</div><p id="phenocam-detail">Historical camera greendown trends are evaluated out of sample before an offset can be displayed. This does not alter the scenic peak forecast.</p><p class="source" id="phenocam-source"><a href="https://phenocam.nau.edu/webcam/">PhenoCam Network</a> · CC BY 4.0 · <a href="https://zenodo.org/records/14854980">Fair Use and attribution</a><p class="footnotes">Data used in this research were provided by the PhenoCam Network. We thank the PhenoCam Network collaborators, including site PIs and technicians, for publicly sharing the data; site credits are linked alongside the readings.</p></p></div></section><section class="section"><h2>Current ground observations</h2><div class="card"><div class="status" id="observed-status">Checking USA-NPN volunteer observations…</div><p id="observed-detail">Recent local leaf-color observations can corroborate season progression, but do not represent a forest-wide percentage.</p><p class="source"><a href="https://www.usanpn.org/data/observational">Source: USA National Phenology Network</a></p></div></section><section class="section"><h2>Best ${r.drives.length} fall color drives</h2><p>Select a corridor, then compare elevation and check official access notices before setting out. Drive names and descriptions are route guidance, not live road condition reports.</p><div class="grid">${drives}</div><p class="warn"><strong>Access not verified:</strong> Park entrances, shuttles, reservations, seasonal road closures and trail access must be checked with the responsible agency. NWS weather cannot confirm roads are open.</p></section><section class="section"><h2>NWS forecast near the regional anchor</h2><p>Forecast samples one representative location (${r.lat.toFixed(2)}°, ${r.lon.toFixed(2)}°). Mountain passes and coastlines may have very different weather. This is <strong>weather information, not a live foliage measurement</strong>.</p><p class="updated" id="forecast-updated">Checking official forecast…</p><div class="grid" id="forecast-days"></div><p class="source"><a href="https://www.weather.gov/documentation/services-web-api">Source: National Weather Service API</a></p></section><section class="section"><h2>Where to go next</h2><div class="navlinks"><a href="${url("national")}">All 15 regions</a>${neighbors.map(x=>`<a href="${url(x.id)}">${esc(x.name)}</a>`).join("")}<a href="/fall-color/">Michigan fall color engine</a></div></section><section class="section"><h2>How this outlook works</h2><p>The regional seasonal model shares the basic approach of the <a href="/fall-color/">Michigan fall color tools</a>: timing first, weather as a trip-planning input. The national weather feed uses NWS data; current colored-leaf reports, when available, come from volunteer observations at nearby sites. Neither source measures a regional leaf-color percentage. The broad seasonal window is editorial planning guidance and should be checked against local reports.</p></section></main><footer class="footer"><div class="inner">Built by <a href="/chris-izworski/">Chris Izworski</a> · <a href="/fall-color/national/">U.S. fall color guides</a> · <a href="/national-tools/">National outdoor tools</a></div></footer><script>${js}</script><script defer src="/national-tools/fall-color/national-map/leaflet/leaflet.js"></script><script defer src="/national-tools/fall-color/national-map/map-state.js?v=${regionalMapRevision}"></script><script defer src="/national-tools/fall-color/national-map/regional-map-ui.js?v=${regionalMapRevision}"></script>${dayProfiles[r.id] ? '<script defer src="/national-tools/fall-color/national-map/day-decision.js?v='+dayPlannerRevision+'"></script><script defer src="/national-tools/fall-color/national-map/day-planner-ui.js?v='+dayPlannerRevision+'"></script>' : ""}</body></html>`;
}
for(const r of regions){
 const p=path.join(root,"public/fall-color",r.id,"index.html");
 fs.mkdirSync(path.dirname(p),{recursive:true});
 fs.writeFileSync(p,page(r));
}
// Version client assets by their source bytes so browsers cannot retain a
// pre-CARTO-key map script after a production deployment.
const mapAssetRevision=crypto.createHash("sha256")
  .update(fs.readFileSync(path.join(root,"lib/national-map-state.js")))
  .update(fs.readFileSync(path.join(root,"public/fall-color/national/map-ui.js")))
  .digest("hex").slice(0,12);
const mapRegions=regions.map(r=>({id:r.id,name:r.name,lat:r.lat,lon:r.lon,peak:r.peak}));
const mapStyles=String.raw`
/* National interactive map: Michigan-inspired circles, restrained washes, and phone-first layout. */
.national-map-shell{background:#fffdf8;border:1px solid #d6cab5;border-radius:16px;padding:14px;min-width:0;max-width:100%;overflow:hidden}
.national-map-intro{display:flex;align-items:baseline;gap:12px;justify-content:space-between;flex-wrap:wrap}
.national-map-intro h2{margin:0 0 9px}
.national-map-intro p{font-size:14px;margin:0 0 12px}
.national-basemap-actions{display:flex;align-items:flex-start;flex-direction:column;gap:3px;flex-shrink:0}
#national-switch-basemap{border:1px solid #b7a98e;border-radius:8px;background:#eee7d7;color:#2d3c2e;min-height:44px;padding:9px 13px;font-weight:700;font-size:13px;cursor:pointer}
#national-switch-basemap:focus-visible{outline:3px solid #9c4e27;outline-offset:3px}
#national-switch-basemap:disabled{opacity:.5}
#national-basemap-status{font-size:12px;color:#605b4e;max-width:250px}

#national-map{height:clamp(360px,53vw,510px);width:100%;max-width:100%;background:#d9dfd5;border:1px solid #ddd2be;border-radius:10px;z-index:0}
.national-map-controls{padding:15px 3px 8px;min-width:0}
.national-map-date-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
#national-selected-date{font-weight:750;font-size:17px}
#national-reset-date{background:#e8e0d1;border:1px solid #baad94;border-radius:8px;min-height:44px;padding:8px 13px;color:#2b3026;font-weight:700;cursor:pointer}
#national-reset-date:disabled{opacity:.45;cursor:default}
#national-preview-next{min-height:44px;padding:9px 13px;margin:6px 0 2px;border:1px solid #8e6844;border-radius:8px;background:#f7ede0;color:#513b2b;font-weight:700;cursor:pointer}
#national-preview-next[hidden]{display:none}
#national-preview-next:focus-visible{outline:3px solid #9c4e27;outline-offset:2px}
#national-date-slider{display:block;width:100%;max-width:100%;margin:12px 0 4px;accent-color:#9c4e27;min-height:34px;cursor:pointer}
.national-date-ends{display:flex;justify-content:space-between;font-size:12px;color:#6a6458}
.national-map-legend{display:flex;flex-wrap:wrap;gap:7px 13px;margin:14px 0 8px}
.national-map-legend span{display:inline-flex;gap:6px;align-items:center;font-size:12px;color:#444139}
.national-map-legend i{display:inline-block;width:13px;height:13px;border-radius:50%;border:1px solid #fff;box-shadow:0 0 0 1px #b7ae9e}
.national-map-footnote,#national-map-status,#national-map-fallback{font-size:13px;color:#615a4e;line-height:1.55;margin:8px 0 0}
#national-color-now{font-size:14px;margin:13px 0 3px}
.national-map-shell .leaflet-popup-content-wrapper{border-radius:11px;max-width:calc(100vw - 65px)}
.national-map-shell .leaflet-popup-content{margin:12px;max-width:calc(100vw - 92px)!important}
.national-map-shell .map-popup{max-width:100%;min-width:0;overflow-wrap:anywhere;font-size:13px;line-height:1.45;color:#2a2c26}
.map-popup strong{display:block;font-size:16px;line-height:1.25}
.map-popup-stage{display:block;font-weight:800;margin:6px 0}
.map-popup p{margin:7px 0;line-height:1.45}
.map-popup-cta{display:block;border-radius:8px;background:#355a3b;color:white!important;text-decoration:none;padding:11px 12px;min-height:44px;font-size:14px;font-weight:750;text-align:center;margin-top:10px}
.national-map-shell .leaflet-control-layers{font-size:12px}
.national-hub .directory-title{margin:26px 0 12px}
@media(max-width:700px){
 .national-hub .grid{grid-template-columns:minmax(0,1fr)}
 .national-map-shell{padding:9px;border-radius:12px}
 #national-map{height:365px}
 .national-map-intro h2{font-size:24px}
 .national-map-legend{gap:7px 10px}
 .national-map-legend span{font-size:11px}
}
`;
const mapSection=`<section class="section national-map-shell" aria-labelledby="national-map-heading">
<div class="national-map-intro"><div><div class="kicker">Explore the changing season</div><h2 id="national-map-heading">U.S. Fall Color Map</h2>
<p>Move the date to preview broad seasonal color across 15 regions. Tap a circle to plan your trip.</p></div><div class="national-basemap-actions"><button type="button" id="national-switch-basemap">Use OpenStreetMap instead</button><span role="status" aria-live="polite" id="national-basemap-status">CARTO Voyager street map</span></div></div>
<div id="national-map" role="region" aria-label="Map of 15 United States fall foliage regions"></div>
<div class="national-map-controls">
<div class="national-map-date-row"><label for="national-date-slider" id="national-selected-date">Select a fall date</label><button id="national-reset-date" type="button">Today</button></div>
<button id="national-preview-next" type="button" hidden>Preview next fall</button>
<input type="range" id="national-date-slider" min="0" max="98" value="0" step="1" aria-label="Preview fall foliage by date">
<div class="national-date-ends"><span>September 1</span><span>December 8 · Texas and late-season color</span></div>
<div class="national-map-legend" aria-label="Foliage stage legend">
<span><i style="background:#4A6633"></i>Green</span><span><i style="background:#5A6B3A"></i>Early</span>
<span><i style="background:#8E6410"></i>Developing gold</span><span><i style="background:#9E5F13"></i>More developed</span>
<span><i style="background:#9C4E27"></i>Approaching peak</span><span><i style="background:#8E301C"></i>Typical peak</span>
<span><i style="background:#75512F"></i>Past peak</span></div>
<p id="national-map-status" role="status" aria-live="polite">Seasonal stages are historical planning estimates, not observed foliage percentages.</p>
<p id="national-color-now" aria-live="polite">Use the directory below for regional planning.</p>
<p id="national-map-fallback">If the basemap does not load, the color markers and all region links remain available.</p>
<p class="national-map-footnote">Colored areas are small illustrative washes around regional anchors, not uniform foliage coverage. Each region has varied elevations and species. NWS is a weather forecast, not a leaf-color observation. <a href="/fall-color/">View Michigan’s detailed live map</a>.</p>
</div><script type="application/json" id="national-map-regions">${json(mapRegions)}</script></section>`;
const cards=regions.map((r,i)=>`<article class="card"><div class="kicker">Region ${i+1}</div><h2><a href="${url(r.id)}">${esc(r.name)}</a></h2><p>${esc(r.why)}</p><p class="source">Typical planning window: ${fmt(r.peak[0])}–${fmt(r.peak[1])}</p><p>${r.drives.slice(0,2).map(x=>esc(x[0])).join(" · ")}</p></article>`).join("");
const hub=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2027 U.S. Fall Color: 15 Regions, Scenic Drives & Weekend Outlooks</title><meta name="description" content="Plan fall color trips in 15 U.S. regions for 2027. Compare typical peak windows, scenic drives, NWS forecasts and local leaf observations."><link rel="canonical" href="${url("national")}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="author" content="Chris Izworski"><meta property="og:title" content="2027 U.S. Fall Color: 15 Regional Guides"><meta property="og:url" content="${url("national")}"><meta name="twitter:card" content="summary_large_image"><meta property="og:description" content="Explore U.S. foliage stages on an interactive map; move the date and plan a scenic weekend across 15 regions."><meta name="twitter:description" content="Explore interactive U.S. fall color by date across 15 regions."><script type="application/ld+json">${json({"@context":"https://schema.org","@type":"CollectionPage",url:url("national"),name:"U.S. Fall Color 2027",author:{"@id":"https://chrisizworski.com/#person"},datePublished:"2026-10-08",hasPart:regions.map(r=>({"@type":"WebPage",url:url(r.id),name:r.name}))})}</script><link rel="stylesheet" href="/national-tools/fall-color/national-map/leaflet/leaflet.css"><style>${css}${mapStyles}</style></head><body><header class="top"><div class="inner"><a class="brand" href="/">Chris Izworski</a><nav><a href="/fall-color/">Michigan color</a><a href="/national-tools/">National tools</a></nav></div></header><main class="inner national-hub"><div class="hero"><div class="breadcrumb"><a href="/fall-color/">Fall Color</a> / National</div><div class="kicker">2027 trip planning</div><h1>Fall color across the United States: where to go and when</h1><p class="lede">Choose one of 15 regions to see broad peak-season guidance, scenic-drive options, official National Weather Service weekend weather and available local foliage observations.</p><div class="warn">Seasonal timing is a planning estimate, not a measurement of current leaf color. NWS forecasts cover weather, not foliage. Check road access and local reports before travel.</div></div>${mapSection}<section class="section" aria-labelledby="region-directory"><h2 class="directory-title" id="region-directory">Plan with the 15 regional guides</h2><div class="grid">${cards}</div></section><section class="section"><h2>Michigan fall color already has a dedicated live engine</h2><p>For the most detailed Upper Peninsula and Lower Peninsula timing, use the <a href="/fall-color/">Michigan Fall Color map and regional guides</a>. The national collection uses a separate forecast layer, preserving the Michigan product.</p></section></main><footer class="footer"><div class="inner">Built by <a href="/chris-izworski/">Chris Izworski</a> · <a href="/national-tools/">National outdoor tools</a></div></footer><script defer src="/national-tools/fall-color/national-map/leaflet/leaflet.js"></script><script defer src="/national-tools/fall-color/national-map/map-state.js?v=${mapAssetRevision}"></script><script defer src="/national-tools/fall-color/national-map/map-ui.js?v=${mapAssetRevision}"></script></body></html>`;
const hp=path.join(root,"public/fall-color/national/index.html");fs.mkdirSync(path.dirname(hp),{recursive:true});fs.writeFileSync(hp,hub);
// Serve first-party assets through the existing national-tools fall-color proxy.
// The main site proxies /fall-color/national/ HTML, but not nested JS/CSS there.
const assetRoot=path.join(root,"public/national-tools/fall-color/national-map");
fs.mkdirSync(assetRoot,{recursive:true});
fs.copyFileSync(path.join(root,"lib/national-map-state.js"),path.join(assetRoot,"map-state.js"));
fs.copyFileSync(path.join(root,"public/fall-color/national/map-ui.js"),path.join(assetRoot,"map-ui.js"));
fs.copyFileSync(path.join(root,"public/fall-color/national/regional-map-ui.js"),path.join(assetRoot,"regional-map-ui.js"));
fs.copyFileSync(path.join(root,"lib/fall-day-decision.js"),path.join(assetRoot,"day-decision.js"));
fs.copyFileSync(path.join(root,"public/fall-color/national/day-planner-ui.js"),path.join(assetRoot,"day-planner-ui.js"));
const leafletDistribution=path.join(root,"node_modules/leaflet/dist");
const leafletOutput=path.join(assetRoot,"leaflet");
fs.mkdirSync(leafletOutput,{recursive:true});
for(const asset of ["leaflet.js","leaflet.css"]) fs.copyFileSync(path.join(leafletDistribution,asset),path.join(leafletOutput,asset));
fs.cpSync(path.join(leafletDistribution,"images"),path.join(leafletOutput,"images"),{recursive:true});
const urls=["national",...regions.map(r=>r.id)];
fs.writeFileSync(path.join(root,"public/fall-color/national-sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(s=>`  <url><loc>${url(s)}</loc><lastmod>${s==="great-smoky-mountains"?"2026-10-09":"2026-10-08"}</lastmod></url>`).join("\n")}\n</urlset>\n`);
const locatorPath=path.join(root,"public/national-tools/fall-color/index.html");
let locator=fs.readFileSync(locatorPath,"utf8");
if(!locator.includes('data-2027-national-regions')){
 if(!locator.includes("</main>"))throw new Error("National fall-color locator has no main element");
 const section='<section data-2027-national-regions class="section"><div class="wrap"><h2>2027 fall-color regional guides</h2><p>For a driving weekend, compare the 15 U.S. regions and their scenic corridors before choosing a city. These regional pages include NWS weather and available ground reports.</p><p><a href="/fall-color/national/">Browse all 15 national fall-color guides</a> · <a href="/fall-color/new-england/">New England</a> · <a href="/fall-color/great-smoky-mountains/">Great Smoky Mountains</a> · <a href="/fall-color/colorado-aspens/">Colorado aspens</a></p></div></section>';
 locator=locator.replace("</main>",section+"</main>");
 fs.writeFileSync(locatorPath,locator);
}
console.log("National foliage pages: "+regions.length+" regions + hub + sitemap");
