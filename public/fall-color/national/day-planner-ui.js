/* A practical choice layer above the existing foliage map. No invented route times or live leaf percentages. */
(function(){
"use strict";
const node=document.getElementById("regional-map-data"),form=document.getElementById("fall-day-form");
const model=window.FallDayDecision,state=window.NationalFallMapState;
if(!node||!form||!model||!state)return;
let map;try{map=JSON.parse(node.textContent);}catch{return;}
const profile=model.profiles[map.id];if(!profile)return;
const dateEl=document.getElementById("fall-day-date"),startEl=document.getElementById("fall-day-start");
const styleEl=document.getElementById("fall-day-style"),lengthEl=document.getElementById("fall-day-length");
const results=document.getElementById("fall-day-results"),caption=document.getElementById("fall-day-caption");
const locationButton=document.getElementById("fall-day-geolocate"),originNote=document.getElementById("fall-day-origin-note");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const human=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});
const now=new Date(),today=localDate(now),thisSeason=state.seasonDates(state.seasonYear(now));
const initial=thisSeason.includes(today)?today:(now.getMonth()>=8?state.seasonDates(now.getFullYear()+1)[0]:state.seasonDates(now.getFullYear())[0]);
dateEl.min=state.seasonDates(Math.max(2026,now.getFullYear()-1))[0];
dateEl.max=state.seasonDates(now.getFullYear()+1).at(-1);
dateEl.value=initial;
startEl.innerHTML='<option value="">Compare the whole region (no starting point)</option>'+
  profile.starts.map((p,i)=>'<option value="'+i+'">'+esc(p[0])+'</option>').join("");
let gps=null;
function origin(){
  if(gps)return gps;
  const i=startEl.value===""?-1:Number(startEl.value);
  const p=profile.starts[i];
  return p?{lat:p[1],lon:p[2],label:p[0]}:null;
}
function sourceLink(url,label){
  return typeof url==="string"&&url.startsWith("https://")
    ?'<a href="'+esc(url)+'" rel="noopener noreferrer" target="_blank">'+esc(label)+' ↗</a>':"";
}
function card(p,i){
 const link=sourceLink(p.sourceUrl,"Place and seasonal reference");
 const forecast=sourceLink("https://forecast.weather.gov/MapClick.php?lat="+p.lat.toFixed(3)+"&lon="+p.lon.toFixed(3),"NWS point forecast");
 const access=sourceLink(p.accessUrl,p.accessLabel);
 const namedGuide=(typeof p.guideUrl==="string"&&/^https:\/\/chrisizworski\.com\/fall-color\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(p.guideUrl))
  ?'<a href="'+esc(p.guideUrl)+'" class="day-field-guide">Plan this named fall-color destination →</a>':"";
 const stageText=esc(p.stage.label);
 const label=p.kind==="drive"?"Scenic drive vicinity":"Viewing area";
 const typical=human(p.stage.typicalWindow.from)+"–"+human(p.stage.typicalWindow.to);
 const distance=p.distance===null?"":'<span>Approximately '+Math.round(p.distance)+' straight-line miles from the starting point (not a driving estimate).</span>';
 const caution=p.accessCaution?'<p class="day-access">Access check: '+esc(p.accessCaution)+'</p>':"";
 return '<article class="day-result"><div class="day-result-head"><span class="day-rank">'+(i+1)+'</span><div><strong>'+esc(p.name)+'</strong><span class="day-result-sub">'+esc(label)+' · '+stageText+'</span></div></div>'+
  '<p>Local typical color window: '+esc(typical)+'. '+esc(p.timing?.area||p.reason||"Landscape timing differs across this region")+'.</p>'+
  (distance?'<p class="day-distance">'+distance+'</p>':"")+
  caution+
  '<div class="day-result-links"><button type="button" data-day-focus-kind="'+esc(p.kind)+'" data-day-focus-index="'+p.index+'">Show on map</button>'+
  namedGuide+link+forecast+access+'</div></article>';
}
function render(){
 const date=dateEl.value;
 if(!model.validDate(date)||date<dateEl.min||date>dateEl.max){
   caption.textContent="Choose a valid September–December 8 fall-season date.";
   results.replaceChildren();return;
 }
 const candidates=model.rank(map,{date,style:styleEl.value,length:lengthEl.value,origin:origin()},state);
 const name=origin()?.label||"the whole region";
 const theme={drive:"scenic drives",relaxed:"low-commitment town or lakeside outings",photo:"photography and viewpoints"}[styleEl.value]||"locations";
 if(!candidates.length){
   caption.textContent="No strong modeled match for these choices. Widen the starting area, change your date or choose a longer outing.";
   results.innerHTML='<p class="day-no-results">We will not invent an open road, a nearby peak or a feasible drive. Try another date, location or outing style.</p>';
   return;
 }
 const best=candidates[0],companion=model.companion(best,candidates);
 caption.textContent="For "+human(date)+", "+name+": compare "+theme+". These are geography-based typical timing estimates, not live site readings or confirmed accessibility.";
 results.innerHTML='<div class="day-verdict"><strong>Start by considering '+esc(best.name)+'</strong>'+
   '<p>'+esc(best.stage.label)+'.'+(companion?' A possible second area is '+esc(companion.name)+' (within 30 straight-line miles; confirm a workable road route).':" One stop may make a better day than chasing distant dots.")+'</p></div>'+
   '<div class="day-results-grid">'+candidates.map(card).join("")+'</div>'+
   '<p class="day-evidence">Color stages are illustrative—not observed at each dot. Aerial proximity only; no driving route, traffic, travel time, road opening or trail safety has been verified. NWS links show current point forecasts, <strong>not forecasts for distant trip dates</strong>. Always check official access and any reservation rules before departure.</p>';
 results.querySelectorAll("[data-day-focus-kind]").forEach(button=>button.addEventListener("click",()=>{
   window.dispatchEvent(new CustomEvent("fall-day-focus",{detail:{kind:button.dataset.dayFocusKind,index:Number(button.dataset.dayFocusIndex),date}}));
 }));
}
form.addEventListener("submit",e=>{e.preventDefault();render();window.dispatchEvent(new CustomEvent("fall-day-date",{detail:{date:dateEl.value}}));});
for(const input of [dateEl,startEl,styleEl,lengthEl]){
 input.addEventListener("change",()=>{
   if(input===startEl){gps=null;originNote.textContent="Straight-line distance is for screening only, not driving time.";}
   render();
   if(input===dateEl&&model.validDate(dateEl.value))window.dispatchEvent(new CustomEvent("fall-day-date",{detail:{date:dateEl.value}}));
 });
}
if(locationButton)locationButton.addEventListener("click",()=>{
 if(!navigator.geolocation){originNote.textContent="Location is not supported here; choose a starting town.";return;}
 locationButton.disabled=true;originNote.textContent="Requesting location from this device…";
 navigator.geolocation.getCurrentPosition(position=>{
   gps={lat:position.coords.latitude,lon:position.coords.longitude,label:"your device location"};
   startEl.value="";locationButton.disabled=false;
   originNote.textContent="Location used only in your browser to prioritize nearby options. Distances are straight-line, not road mileage.";
   render();
 },()=>{
   locationButton.disabled=false;originNote.textContent="Location unavailable or permission denied. Choose a town or compare the whole region.";
 },{enableHighAccuracy:false,timeout:9000,maximumAge:1800000});
});
window.addEventListener("fall-region-map-selected",e=>{
 const d=e.detail;if(!d||d.offSeason||!model.validDate(d.date)||d.date===dateEl.value||d.date<dateEl.min||d.date>dateEl.max)return;
 dateEl.value=d.date;render();
});
render();
})();