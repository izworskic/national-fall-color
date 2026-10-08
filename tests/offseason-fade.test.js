const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const S=require("../lib/national-map-state.js");
const {regions}=require("../lib/national-region-catalog.js");
const {pointTiming}=require("../lib/national-site-timing.js");
const {viewingSpots}=require("../lib/national-regional-viewing-spots.js");
const day=86400000;
const dateAt=(y,doy)=>new Date(Date.UTC(y,0,doy)).toISOString().slice(0,10);
test("each national site fades peak -> amber -> copper -> bare -> gray, never re-greens in December",()=>{
 let count=0;
 for(const r of regions){
  const samples=[r,...r.drives.map((_,i)=>pointTiming(r,"drive",i)),
    ...viewingSpots[r.id].map((_,i)=>pointTiming(r,"spot",i))];
  for(const entry of samples){
    const p=entry.peak, end=p[1];
    const ids=[end,end+2,end+8,end+18,end+28].map(d=>S.stageFor(entry,dateAt(2026,d)).id);
    assert.deepEqual(ids,["peak","fading","past","bare","offseason"],r.id+" "+p.join(","));
    const colors=ids.map(id=>S.stages.find(s=>s.id===id).color);
    assert.equal(new Set(colors).size,5);
    assert.ok(S.washAlpha("fading")<S.washAlpha("peak"));
    assert.ok(S.washAlpha("past")<S.washAlpha("fading"));
    assert.ok(S.washAlpha("bare")<S.washAlpha("past"));
    assert.ok(S.washAlpha("offseason")<S.washAlpha("bare"));
    assert.equal(S.stageFor(entry,dateAt(2026,end+28)).observedLeafColorPct,null);
    count++;
  }
 }
 assert.equal(count,117,"15 regions + 49 drives + 53 viewing locations");
});
test("winter and spring resolve the last completed autumn, not an automatic green next autumn",()=>{
 const tests=[
  [new Date(2026,11,8,12),2026,true],
  [new Date(2026,11,9,12),2026,false],
  [new Date(2026,11,31,12),2026,false],
  [new Date(2027,0,1,12),2026,false],
  [new Date(2027,4,15,12),2026,false],
  [new Date(2027,7,31,12),2026,false],
  [new Date(2027,8,1,12),2027,true]
 ];
 for(const [now,year,inSeason] of tests){
  assert.equal(S.seasonYear(now),year);
  const dates=S.seasonDates(year),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  assert.equal(dates.includes(today),inSeason);
  if(!inSeason){
   const winter=S.offSeasonStage(regions[0],year);
   assert.equal(winter.id,"offseason");
   assert.match(winter.label,/season complete/i);
   assert.equal(winter.observedLeafColorPct,null);
  }
 }
});
test("all map surfaces provide winter controls and site-specific color fading",()=>{
 const hub=fs.readFileSync("public/fall-color/national/index.html","utf8");
 const national=fs.readFileSync("public/fall-color/national/map-ui.js","utf8");
 const regional=fs.readFileSync("public/fall-color/national/regional-map-ui.js","utf8");
 assert.match(hub,/id="national-preview-next"/);
 assert.match(national,/calendarOffSeason/);
 assert.match(national,/offSeasonStage/);
 assert.match(national,/if\(next\)next\.addEventListener\("click"/);
 assert.match(regional,/calendarOffSeason/);
 assert.match(regional,/offSeasonStage/);
 assert.match(regional,/if\(preview\)preview\.addEventListener\("click"/);
 for(const r of regions){
  const page=fs.readFileSync("public/fall-color/"+r.id+"/index.html","utf8");
  assert.match(page,/id="regional-preview-next"/);
 }
});