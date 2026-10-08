// National PhenoCam evidence and walk-forward validation. Zero fabricated leaf color percentages.
// Historical validation targets a *camera greendown midpoint*, NOT scenic peak foliage.
const {regions,byId}=require("./national-region-catalog");
const METADATA="https://phenocam.nau.edu/api/roilists/?limit=10000";
const UA="ChrisIzworskiNationalFall/2.1 (+https://chrisizworski.com/fall-color/national/)";
const MAX_NEAR_KM=145,MAX_CAMERAS=2,MAX_AGE_DAYS=10,MAX_SHIFT_DAYS=7;
let catalogCache=null,catalogUntil=0;
const msDay=86400000;
const median=vs=>{const a=vs.filter(Number.isFinite).sort((x,y)=>x-y);const n=a.length;if(!n)return null;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;};
const doy=date=>{const y=Number(date.slice(0,4));return Math.round((Date.parse(date+"T12:00:00Z")-Date.UTC(y,0,1,12))/msDay)+1;};
const days=(a,b)=>Math.round((Date.parse(a+"T12:00:00Z")-Date.parse(b+"T12:00:00Z"))/msDay);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function distanceKm(a,b,c,d){const t=Math.PI/180,dl=(c-a)*t,dd=(d-b)*t;const h=Math.sin(dl/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(dd/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
function safeSummary(s){
 try{
  const u=new URL(String(s||""));
  return u.protocol==="https:"&&u.hostname==="phenocam.nau.edu"&&/^\/data\/archive\/[^/?]+\/ROI\/[^/?]+_DB_\d+_(?:1day|3day)\.csv$/.test(u.pathname)?u.href:null;
 }catch{return null;}
}
async function readUrl(url,{fetcher=fetch,timeout=9000,maxBytes=3000000}={}){
 const r=await fetcher(url,{headers:{accept:"application/json,text/csv;q=0.9","user-agent":UA},signal:AbortSignal.timeout(timeout)});
 if(!r.ok)throw Error("source HTTP "+r.status);
 const type=r.headers?.get?.("content-length");
 if(type&&Number(type)>maxBytes)throw Error("source payload too large");
 const text=await r.text();
 if(text.length>maxBytes)throw Error("source payload too large");
 return text;
}
function normalizeRois(meta){
 const rows=Array.isArray(meta?.results)?meta.results:[];
 return rows.filter(x=>{
  const name=String(x?.roi_name||"");
  const summary=safeSummary(x?.three_day_summary)||safeSummary(x?.one_day_summary);
  return /_DB_\d+$/.test(name)&&summary&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon))&&x.show_data_link!==false;
 }).map(x=>({
  roi:String(x.roi_name),site:String(x.site||""),
  lat:Number(x.lat),lon:Number(x.lon),veg:"deciduous broadleaf",
  source:safeSummary(x.three_day_summary)||safeSummary(x.one_day_summary),
  page:(()=>{try{const v=new URL(String(x.roi_page||""));return v.protocol==="https:"&&v.hostname==="phenocam.nau.edu"?v.href:null;}catch{return null;}})(),
  years:Number(x.site_years)||0,
  latest_metadata:String(x.last_date||"").slice(0,10),
  active:x.active===true||x.active===1||x.active==="true"||x.active==="True"||x.active==="1"
 })).filter(x=>x.site&&x.lat>=24&&x.lat<=50&&x.lon>=-125&&x.lon<=-66);
}
function selectCameras(region,rois){
 // This coverage is ONLY near the regional weather anchor, not the entire region.
 const inRange=rois.map(x=>({...x,distance_km:Math.round(distanceKm(region.lat,region.lon,x.lat,x.lon))}))
  .filter(x=>x.distance_km<=MAX_NEAR_KM)
  .sort((a,b)=>(b.active?1:0)-(a.active?1:0)||a.distance_km-b.distance_km);
 const unique=new Set();
 return inRange.filter(x=>{if(unique.has(x.site))return false;unique.add(x.site);return true;}).slice(0,MAX_CAMERAS);
}
async function fetchCatalog(fetcher=fetch,now=Date.now()){
 if(catalogCache&&catalogUntil>now)return catalogCache;
 // On failure do not cache fabricated coverage. Bounded by caller and edge cache.
 const raw=await readUrl(METADATA,{fetcher,timeout:9000,maxBytes:6000000});
 const meta=JSON.parse(raw),list=normalizeRois(meta);
 if(!list.length)throw Error("No usable metadata rows");
 catalogCache=list;catalogUntil=now+6*3600000;
 return list;
}
function csvFields(line){
 const parts=[];let val="",quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){val+='"';i++;}else quoted=!quoted;}else if(ch===","&&!quoted){parts.push(val.trim());val="";}else val+=ch;}
 parts.push(val.trim());return parts;
}
function parseSeries(csv){
 const lines=String(csv||"").split(/\r?\n/).filter(x=>x.trim()&&!x.startsWith("#"));
 const header=csvFields(lines[0]||"").map(x=>x.trim().toLowerCase());
 const di=header.indexOf("date"),gi=header.indexOf("gcc_90");
 if(di<0||gi<0)throw Error("GCC columns absent");
 const out=[];
 for(const line of lines.slice(1)){
  const cells=csvFields(line),date=String(cells[di]||"").slice(0,10),gcc=Number(cells[gi]);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+"T12:00:00Z"))||!(gcc>.15&&gcc<.6))continue;
  out.push({date,gcc,year:Number(date.slice(0,4)),day:doy(date)});
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)).filter((x,i,a)=>i===0||x.date!==a[i-1].date);
}
function annualProfile(rows,year){
 const yr=rows.filter(x=>x.year===year);
 const summer=yr.filter(x=>x.day>=172&&x.day<=227).map(x=>x.gcc);
 const autumn=yr.filter(x=>x.day>=299&&x.day<=334).map(x=>x.gcc);
 if(summer.length<7||autumn.length<5)return null;
 const high=median(summer),low=median(autumn);
 if(high-low<.018)return null; // low-amplitude/noisy/evergreen canopy excluded
 return {year,high,low,points:yr.filter(x=>x.day>=232&&x.day<=334)};
}
function fraction(p,profile){return clamp((profile.high-p.gcc)/(profile.high-profile.low),0,1);}
function crossing(profile,threshold=.5){
 const pts=profile.points.filter(x=>x.day>=240&&x.day<=320);
 // First sustained crossing; guard against transient weather/image noise.
 for(let i=0;i<pts.length;i++){
  const p=pts[i],f=fraction(p,profile);
  if(f<threshold)continue;
  const next=pts.slice(i,Math.min(i+4,pts.length)).filter(x=>x.day-p.day<=9);
  if(next.length<2||next.filter(x=>fraction(x,profile)>=threshold-.09).length<2)continue;
  const previous=pts.filter(x=>x.day>=p.day-11&&x.day<p.day);
  if(previous.length<2||median(previous.map(x=>fraction(x,profile)))>f-.035)continue;
  return p.day;
 }
 return null;
}
function annualProfiles(rows,nowYear){
 const years=[...new Set(rows.map(x=>x.year))].filter(y=>y>=2001&&y<nowYear).sort((a,b)=>a-b);
 return years.map(y=>{const p=annualProfile(rows,y);return p?{...p,midpoint:crossing(p)}:null;}).filter(p=>p&&p.midpoint!=null);
}
function observedFraction(rows,year,asOf,previousProfiles){
 // Future information prohibited. Use historical autumn floor, target-year summer baseline.
 const points=rows.filter(x=>x.year===year&&x.day<=asOf);
 const summer=points.filter(x=>x.day>=172&&x.day<=227).map(x=>x.gcc);
 const recent=points.filter(x=>x.day>=asOf-5&&x.day>=235).slice(-3);
 const floor=median(previousProfiles.map(x=>x.low));
 const high=median(summer);
 if(summer.length<7||recent.length<2||high==null||floor==null||high-floor<.018)return null;
 if(asOf-recent[recent.length-1].day>6)return null;
 const f=clamp((high-median(recent.map(x=>x.gcc)))/(high-floor),0,1);
 return f>.15&&f<.85?f:null;
}
function historicalCrossingAt(profiles,f){
 const ds=profiles.map(p=>crossing(p,f)).filter(Number.isFinite);
 return ds.length>=3?median(ds):null;
}
function estimateShift(rows,year,asOf,prior){
 const f=observedFraction(rows,year,asOf,prior);
 if(f==null)return null;
 const expected=historicalCrossingAt(prior,f);
 if(expected==null)return null;
 return {shift_days:clamp(Math.round(expected-asOf),-MAX_SHIFT_DAYS,MAX_SHIFT_DAYS),fraction:f};
}
function backtest(profiles,rows){
 // Strict rolling-origin: for each test year, only earlier years train the estimate.
 const runs=[];
 for(let i=3;i<profiles.length;i++){
  const current=profiles[i],prior=profiles.slice(0,i);
  const baseline=Math.round(median(prior.map(p=>p.midpoint)));
  const asOf=baseline-10; // fixed decision horizon (not chosen from target outcome)
  const v=estimateShift(rows,current.year,asOf,prior);
  if(!v)continue;
  const corrected=baseline-v.shift_days;
  runs.push({year:current.year,as_of_day:asOf,observed_midpoint_doy:current.midpoint,
    baseline_prediction_doy:baseline,camera_prediction_doy:corrected,
    baseline_abs_error:Math.abs(baseline-current.midpoint),
    calibrated_abs_error:Math.abs(corrected-current.midpoint)});
 }
 const baselineMAE=median(runs.map(x=>x.baseline_abs_error));
 const calibratedMAE=median(runs.map(x=>x.calibrated_abs_error));
 // Using median abs errors (robust to outliers). This is a canopy proxy, not reported leaf peak.
 const validated=runs.length>=3&&calibratedMAE<=10&&baselineMAE-calibratedMAE>=1;
 return {method:"rolling-origin pseudo-prospective, fixed 10-day lead, withheld year; camera greendown proxy only",
  samples:runs.length,baseline_median_abs_error_days:baselineMAE,
  calibrated_median_abs_error_days:calibratedMAE,
  improved_days:baselineMAE==null?null:Math.round((baselineMAE-calibratedMAE)*10)/10,
  validation_passed:validated,per_year:runs};
}
function cameraEvidence(camera,rows,now=new Date()){
 const thisYear=now.getUTCFullYear(),last=rows.at(-1),age=last?days(now.toISOString().slice(0,10),last.date):null;
 const profiles=annualProfiles(rows,thisYear),validation=backtest(profiles,rows);
 const midpoints=profiles.map(p=>p.midpoint),medianHistorical=median(midpoints);
 const today=doy(now.toISOString().slice(0,10));
 const estimate=age!=null&&age>=0&&age<=MAX_AGE_DAYS&&today>=232&&today<=325&&profiles.length>=4
    ?estimateShift(rows,thisYear,today,profiles):null;
 const status=profiles.length<4?"INSUFFICIENT_HISTORY":age==null||age<0||age>MAX_AGE_DAYS?"SOURCE_STALE":
    !validation.validation_passed?"VALIDATION_FAILED":!estimate?"NO_CURRENT_TRANSITION":"CALIBRATED";
 return {site:camera.site,roi:camera.roi,distance_km:camera.distance_km,site_url:camera.page,series_url:camera.source,
  latest: last?.date||null,age_days:age,history_years:profiles.length,
  historical_greendown_midpoint_doy:medianHistorical,validation,
  status,shift_days:status==="CALIBRATED"?estimate.shift_days:null,
  note:"PhenoCam GCC reflects greenness transition at a fixed deciduous canopy ROI; not observed peak-color percent or directly measured scenic foliage peak."};
}
async function regionEvidence(region,{now=new Date(),catalogProvider=fetchCatalog,seriesReader=readUrl}={}){
 const base={region:region.id,regional_anchor:{lat:region.lat,lon:region.lon},retrieved_at:now.toISOString(),
  scope:"Up to two deciduous camera ROIs within 145 km of the regional anchor; does not cover every destination in the region",
  status:"NO_REPRESENTATIVE_CAMERA",calibration_applied:false,shift_days:null,confidence:"none",
  cameras:[],method:"Rolling-origin historical validation of camera greendown, not measured scenic peak. No regional timing shift is applied until predictive improvement and freshness gates pass.",
  attribution:{provider:"PhenoCam Network",license:"CC BY 4.0",policy:"https://zenodo.org/records/14854980",site_specific_acknowledgment:"Consult each PhenoCam site's metadata acknowledgments before publication of research findings."}};
 let cameraList;
 try{cameraList=selectCameras(region,await catalogProvider());}
 catch{return {...base,status:"SOURCE_UNAVAILABLE"};}
 if(!cameraList.length)return base;
 const results=await Promise.all(cameraList.map(async camera=>{
   try{return cameraEvidence(camera,parseSeries(await seriesReader(camera.source)),now);}
   catch{return {site:camera.site,distance_km:camera.distance_km,series_url:camera.source,status:"SOURCE_UNAVAILABLE",shift_days:null};}
 }));
 const usable=results.filter(x=>x.status==="CALIBRATED"),shift=median(usable.map(x=>x.shift_days));
 const agreement=usable.length>=2&&Math.max(...usable.map(x=>x.shift_days))-Math.min(...usable.map(x=>x.shift_days))<=3;
 return {...base,status:usable.length?"CALIBRATED":results.every(x=>x.status==="SOURCE_UNAVAILABLE")?"SOURCE_UNAVAILABLE":"NO_VALIDATED_CALIBRATION",
  calibration_applied:false, // a canopy proxy is not sufficient to shift a scenic peak window
  shift_days:shift,confidence:usable.length>=2&&agreement?"medium":usable.length?"low":"none",
  cameras:results,method:base.method+" A validated canopy offset is reported as research context only; scenic peak forecast remains unchanged.",
  coverage:{selected_cameras:cameraList.length,validated_cameras:usable.length,agreement}};
}
module.exports={regionEvidence,_test:{normalizeRois,selectCameras,parseSeries,annualProfile,annualProfiles,crossing,estimateShift,backtest,cameraEvidence,safeSummary,fetchCatalog,observedFraction,median,doy,distanceKm}};
