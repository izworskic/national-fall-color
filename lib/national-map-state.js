/* Shared national seasonal stage adapter; broad regional timing only, never leaf percentages.
   Loaded as a browser script and tested by Node. No Michigan API dependency. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  if(root)root.NationalFallMapState=api;
})(typeof globalThis!=="undefined"?globalThis:null,function(){
  "use strict";
  const stages=Object.freeze([
    {id:"green",label:"Still green",color:"#4A6633",evidence:"Modeled seasonal stage"},
    {id:"early",label:"Early change",color:"#5A6B3A",evidence:"Modeled seasonal stage"},
    {id:"gold",label:"Developing gold",color:"#8E6410",evidence:"Modeled seasonal stage"},
    {id:"developed",label:"Color developing",color:"#9E5F13",evidence:"Modeled seasonal stage"},
    {id:"approaching",label:"Approaching typical peak",color:"#9C4E27",evidence:"Modeled seasonal stage"},
    {id:"peak",label:"Within typical peak window",color:"#8E301C",evidence:"Modeled seasonal stage"},
    {id:"past",label:"Past typical peak / leaves down",color:"#75512F",evidence:"Modeled seasonal stage"}
  ]);
  const byStage=Object.fromEntries(stages.map(s=>[s.id,s]));
  const day=86400000;
  function isoFromDoy(year,doy){return new Date(Date.UTC(year,0,doy)).toISOString().slice(0,10);}
  function doyFromIso(iso){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))throw Error("Invalid date");
    const [year,month,date]=iso.split("-").map(Number);
    const ms=Date.UTC(year,month-1,date);
    if(new Date(ms).toISOString().slice(0,10)!==iso)throw Error("Invalid date");
    return Math.floor((ms-Date.UTC(year,0,1))/day)+1;
  }
  function stageFor(region,date){
    if(!region||!Array.isArray(region.peak)||region.peak.length!==2)throw Error("Missing regional peak window");
    const doy=doyFromIso(date);
    const [start,end]=region.peak;
    // Category, not the 0-100 proximity-to-window score of the national API.
    // Explicit chronology prevents pre-peak/post-peak symmetry.
    const id=doy<start-36?"green"
      :doy<start-25?"early"
      :doy<start-17?"gold"
      :doy<start-9?"developed"
      :doy<start?"approaching"
      :doy<=end?"peak":"past";
    return {...byStage[id],phase:doy<start?"pre":doy>end?"post":"window",
      typicalWindow:{from:isoFromDoy(+date.slice(0,4),start),to:isoFromDoy(+date.slice(0,4),end)},
      observedLeafColorPct:null,
      basis:"Editorial typical peak timing; not a current foliage observation"};
  }
  function seasonYear(now){
    const year=now.getFullYear(), month=now.getMonth(),date=now.getDate();
    return month===11&&date>8?year+1:year;
  }
  function seasonDates(year){
    const start=Date.UTC(year,8,1),end=Date.UTC(year,11,8),list=[];
    for(let ms=start;ms<=end;ms+=day)list.push(new Date(ms).toISOString().slice(0,10));
    return list;
  }
  function initialDate(now,dates){
    const local=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
    return dates.includes(local)?local:dates[0];
  }
  function washAlpha(phase){
    return {green:0.055,early:0.07,gold:0.095,developed:0.12,approaching:0.14,peak:0.16,past:0.042}[phase]??0.055;
  }
  return Object.freeze({stages,stageFor,seasonYear,seasonDates,initialDate,isoFromDoy,doyFromIso,washAlpha});
});
