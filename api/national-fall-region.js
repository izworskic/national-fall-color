// NOAA/NWS-powered decision layer. Does NOT claim NWS observes leaf color.
// Reuses the Michigan concept of a seasonal curve and weekend decision while
// separating modeled timing from actual leaf reports and forecast weather.
const {byId,regions}=require("../lib/national-region-catalog");
const UA="ChrisIzworskiFallColor/1.0 (https://chrisizworski.com/contact/)";
const headers={"accept":"application/geo+json","user-agent":UA};

function partsInZone(now,tz) {
  const v=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"}).formatToParts(now).map(x=>[x.type,x.value]));
  return {year:+v.year,month:+v.month,day:+v.day,date:`${v.year}-${v.month}-${v.day}`};
}
function dayOfYear(y,m,d) {return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/86400000)+1;}
function dateFromDoy(y,d) {return new Date(Date.UTC(y,0,d)).toISOString().slice(0,10);}
function saturday(tz,now) {
  // Find the next Saturday in the region's own civil calendar.
  const p=partsInZone(now,tz);
  const base=new Date(Date.UTC(p.year,p.month-1,p.day));
  const delta=(6-base.getUTCDay()+7)%7;
  base.setUTCDate(base.getUTCDate()+delta);
  return base.toISOString().slice(0,10);
}
function timing(region,isoDate) {
  const [y,m,d]=isoDate.split("-").map(Number);
  const today=dayOfYear(y,m,d),[start,end]=region.peak;
  const width=Math.max(5,end-start),mid=(start+end)/2;
  // This is a proximity-to-traditional-window INDEX, not % colored leaves.
  const distance=today<start?start-today:today>end?today-end:0;
  const index=distance===0?100:Math.max(0,Math.round(100-distance*5));
  const state=today<start-21?"Before the traditional season":today<start?"Approaching the traditional window":today<=end?"Within the traditional window":today<=end+12?"Past the traditional window":"Well past the traditional window";
  return {status:state,planning_index_pct:index,days_to_window:today<start?start-today:0,typical_window:{from:dateFromDoy(y,start),to:dateFromDoy(y,end)},window_width_days:width,center_offset_days:Math.round(today-mid),basis:"Editorial approximate regional fall-color timing, not a live observation",observed_leaf_color_pct:null};
}
function safeNwsUrl(url) {
  try {const u=new URL(url);return u.protocol==="https:"&&u.hostname==="api.weather.gov"?u.href:null;}catch{return null;}
}
async function getJson(url) {
  const target=safeNwsUrl(url);
  if(!target)throw Error("NWS forecast address invalid");
  const response=await fetch(target,{headers,signal:AbortSignal.timeout(7500)});
  if(!response.ok)throw Error("NWS unavailable: "+response.status);
  return response.json();
}
function summaryPeriods(periods) {
  return (Array.isArray(periods)?periods:[]).slice(0,16).filter(x=>x&&x.startTime).map(p=>({
    start:p.startTime,name:p.name||"",isDaytime:p.isDaytime===true,
    shortForecast:p.shortForecast||null,temperature:Number.isFinite(p.temperature)?p.temperature:null,
    temperatureUnit:p.temperatureUnit||"F",
    precipitationProbability:Number.isFinite(p.probabilityOfPrecipitation?.value)?Math.round(p.probabilityOfPrecipitation.value):null,
    windSpeed:p.windSpeed||null
  }));
}
async function nws(region) {
  const p=await getJson(`https://api.weather.gov/points/${region.lat.toFixed(4)},${region.lon.toFixed(4)}`);
  const forecastUrl=safeNwsUrl(p?.properties?.forecast);
  if(!forecastUrl)throw Error("NWS grid forecast mapping absent");
  const f=await getJson(forecastUrl);
  const periods=summaryPeriods(f?.properties?.periods);
  if(!periods.length)throw Error("NWS forecast returned no periods");
  return {issued_at:f?.properties?.updateTime||f?.properties?.generatedAt||null,time_zone:p?.properties?.timeZone||region.tz,periods,grid_url:forecastUrl};
}
function weekendWeather(weather,weekendDate) {
  if(!weather)return null;
  const periods=weather.periods.filter(p=>p.start.slice(0,10)===weekendDate);
  if(!periods.length)return null;
  const pops=periods.map(p=>p.precipitationProbability).filter(Number.isFinite);
  const daytime=periods.find(p=>p.isDaytime)||periods[0];
  return {day:weekendDate,forecast:daytime.shortForecast,precipitation_risk_pct:pops.length?Math.max(...pops):null,temperature:daytime.temperature,temperature_unit:daytime.temperatureUnit,wind:daytime.windSpeed,source:"NWS forecast; broad regional anchor only"};
}
function verdict(t,weather) {
  if(t.planning_index_pct<40)return {grade:"PLAN AHEAD",text:"Well outside the usual regional color window. Choose a later date or check current local reports."};
  if(!weather)return {grade:"COLOR WINDOW ONLY",text:"Seasonal timing is informative, but the NWS weekend forecast is unavailable. Recheck before travel."};
  const wet=weather.precipitation_risk_pct;
  if(t.planning_index_pct>=90&&wet!=null&&wet>=65)return {grade:"WEATHER CAUTION",text:"Traditional color timing is favorable, but NWS predicts a high chance of precipitation at the regional anchor."};
  if(t.planning_index_pct>=90)return {grade:"PROMISING TIMING",text:"The selected weekend sits inside the broad traditional color window. Verify local observed color and road access before leaving."};
  return {grade:"CONDITIONAL",text:"Color timing is approaching or fading. Compare elevation and recent observations before committing."};
}
async function compute(region,now=new Date(),weatherFetcher=nws) {
  const local=partsInZone(now,region.tz);
  const sat=saturday(region.tz,now);
  const nowTiming=timing(region,local.date);
  const weekendTiming=timing(region,sat);
  const forecast=await weatherFetcher(region).catch(()=>null);
  const upcoming=weekendWeather(forecast,sat);
  return {
    schema_version:1,updated_at:now.toISOString(),region:{id:region.id,name:region.name,states:region.states,lat:region.lat,lon:region.lon,time_zone:region.tz,forest_type:region.type,why:region.why},
    status:forecast?"NWS_FORECAST_AVAILABLE":"CLIMATOLOGY_ONLY",
    today:nowTiming,this_weekend:{date:sat,timing:weekendTiming,weather:upcoming,verdict:verdict(weekendTiming,upcoming)},
    nws_forecast:forecast,drives:region.drives.map(([name,area,note])=>({name,area,note,live_road_status:"NOT_CHECKED"})),
    observation_status:"NOT_IN_THIS_FEED",
    methodology:{
      current_color:"No satellite or observer-based current canopy-color percent is asserted.",
      timing:"Broad editorial climatological windows; seasonal proximity score is not a percent of canopy colored or observed foliage.",
      weather:"Official NWS seven-day forecast for one regional anchor, not each road or elevation.",
      current_observations:"Nearby USA-NPN colored-leaf observations are accessed separately; volunteer data may be sparse.",
      access:"Roads, park reservations and closures are not live-monitored by this endpoint."
    },
    sources:[{name:"National Weather Service API",url:"https://www.weather.gov/documentation/services-web-api"},{name:"USA-NPN observations",url:"https://www.usanpn.org/data/observational"},{name:"Michigan model lineage",url:"https://chrisizworski.com/fall-color/"}]
  };
}
module.exports=async function(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("X-Robots-Tag","noindex, nofollow");
  res.setHeader("Cache-Control","public, s-maxage=10800, stale-while-revalidate=21600");
  if(!["GET","HEAD"].includes(req.method))return res.status(405).json({error:"GET only"});
  const id=String(req.query?.region||"");
  if(id==="catalog")return res.status(200).json({regions:regions.map(x=>({id:x.id,name:x.name,states:x.states}))});
  if(!Object.hasOwn(byId,id))return res.status(400).json({error:"Unknown region",valid_regions:regions.map(x=>x.id)});
  const result=await compute(byId[id]);
  return res.status(200).json(result);
};
module.exports._test={dayOfYear,dateFromDoy,partsInZone,saturday,timing,summaryPeriods,weekendWeather,verdict,compute,safeNwsUrl};
