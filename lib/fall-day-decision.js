/* Shared, source-labeled fall-color day ranker. Timing is illustrative, not observed. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.FallDayDecision=api;})(typeof globalThis!=="undefined"?globalThis:null,function(){
"use strict";
const profiles={
"new-england":{
starts:[["North Conway, NH",44.054,-71.128],["Lincoln, NH",44.045,-71.670],["Stowe, VT",44.465,-72.685],["Burlington, VT",44.477,-73.213],["Portland, ME",43.659,-70.256],["Boston, MA",42.36,-71.059]],
accessUrl:"https://www.fs.usda.gov/alerts/whitemountain/alerts-notices/",accessLabel:"White Mountain National Forest alerts",
relaxed:["North Conway","Meredith / Lake Winnipesaukee","Stowe Village","Woodstock Village","Waitsfield / Mad River Valley","Manchester","Greenville / Moosehead Lake","Bethel / Western Mountains"],
cautions:{"Baxter / Katahdin Gateway":"Verify park entry and seasonal access.","Camden Hills":"Check park and summit-road access.","Franconia Notch":"Parking and congestion can affect your visit."}},
"great-smoky-mountains":{
starts:[["Gatlinburg, TN",35.714,-83.511],["Townsend, TN",35.679,-83.757],["Cherokee, NC",35.477,-83.32],["Asheville, NC",35.595,-82.551],["Knoxville, TN",35.961,-83.92]],
accessUrl:"https://www.nps.gov/grsm/planyourvisit/temproadclose.htm",accessLabel:"NPS current road and trail cautions",
relaxed:["Cades Cove Loop Road","Oconaluftee","Foothills Parkway"],
cautions:{"Kuwohi / Clingmans Dome":"Kuwohi Road is seasonal and may close in hazardous weather.","Roaring Fork Motor Nature Trail":"Seasonal one-way road with vehicle restrictions.","Blue Ridge Parkway southern section":"Verify parkway closures and access.","Cades Cove Loop Road":"Check loop hours, closures and congestion."}},
"colorado-aspens":{
starts:[["Aspen, CO",39.191,-106.818],["Crested Butte, CO",38.869,-106.988],["Estes Park, CO",40.377,-105.522],["Denver, CO",39.74,-104.99],["Telluride, CO",37.937,-107.812]],
accessUrl:"https://www.codot.gov/travel",accessLabel:"CDOT / COtrip conditions",
relaxed:["Telluride","Dallas Divide","Peak to Peak Scenic Byway"],
cautions:{"Independence Pass":"High pass closes seasonally; check CDOT and vehicle restrictions.","Trail Ridge Road / Grand Lake":"High-altitude NPS road subject to snow and seasonal closures.","Guanella Pass":"Verify high pass conditions before travel.","Kebler Pass":"Check unpaved-road and seasonal access.","Maroon Creek Road":"Reservations or shuttles may be required."}}
};
const stagePoints={peak:100,approaching:88,developed:76,fading:67,gold:55,early:34,past:24,green:12,bare:0,offseason:0};
const maxAirMiles={short:75,half:155,day:300};
function airMiles(a,b){
 if(!a||!b||![a.lat,a.lon,b.lat,b.lon].every(Number.isFinite))return null;
 const t=Math.PI/180,dlat=(b.lat-a.lat)*t,dlon=(b.lon-a.lon)*t;
 const q=Math.sin(dlat/2)**2+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dlon/2)**2;
 return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(q)));
}
function allowedStyle(profile,point,style){
 if(style==="drive")return point.kind==="drive";
 if(style==="relaxed")return profile.relaxed.includes(point.name);
 return true; // photo: overlooks, scenic drives and viewing areas, no trails inferred
}
function rank(map,opts,model){
 if(!map||!profiles[map.id]||!model||!validDate(opts.date))return[];
 const profile=profiles[map.id],style=["drive","relaxed","photo"].includes(opts.style)?opts.style:"drive";
 const radius=maxAirMiles[opts.length]||maxAirMiles.half;
 const points=[...(map.drives||[]).map(p=>({...p,kind:"drive"})),...(map.spots||[]).map(p=>({...p,kind:"spot"}))];
 return points.flatMap(point=>{
  if(!Number.isFinite(point.lat)||!Number.isFinite(point.lon)||!Array.isArray(point.peak)||!allowedStyle(profile,point,style))return[];
  const stage=model.stageFor(point,opts.date),value=stagePoints[stage.id]||0;
  if(value<20)return[];
  const distance=opts.origin?airMiles(opts.origin,point):null;
  if(distance!==null&&distance>radius)return[];
  const caution=profile.cautions[point.name]||null;
  const score=value-(distance===null?0:25*distance/radius)-(caution?5:0)+(point.kind==="drive"&&style==="drive"?5:0);
  return [{...point,stage,distance,score,accessCaution:caution,
    accessUrl:profile.accessUrl,accessLabel:profile.accessLabel,
    sourceUrl:point.sourceUrl||point.timing?.sourceUrl||profile.accessUrl}];
 }).sort((a,b)=>b.score-a.score||(a.distance??0)-(b.distance??0)||a.name.localeCompare(b.name)).slice(0,3);
}
function companion(top,results){return top?results.slice(1).find(p=>(airMiles(top,p)??Infinity)<=30)||null:null;}
function validDate(date){
 if(typeof date!=="string"||!/^(20\d\d)-(\d\d)-(\d\d)$/.test(date))return false;
 const d=new Date(date+"T12:00:00Z");if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==date)return false;
 const m=d.getUTCMonth()+1;return m>=9&&(m<=11||m===12&&d.getUTCDate()<=8);
}
return Object.freeze({profiles,stagePoints,maxAirMiles,rank,airMiles,companion,validDate});
});