const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const day=require("../lib/fall-day-decision.js"),state=require("../lib/national-map-state.js");
const {regions}=require("../lib/national-region-catalog.js");
const pilots=regions.map(x=>x.id);
const maps=Object.fromEntries(pilots.map(id=>{
 const html=fs.readFileSync("public/fall-color/"+id+"/index.html","utf8");
 return [id,JSON.parse(html.split('<script type="application/json" id="regional-map-data">')[1].split("</script>")[0])];
}));
test("decision-first interface ships to all 15 researched regions",()=>{
 assert.deepEqual(Object.keys(day.profiles).sort(),pilots.slice().sort());
 for(const r of regions){
  const html=fs.readFileSync("public/fall-color/"+r.id+"/index.html","utf8");
  assert.equal(html.includes('id="fall-day-form"'),pilots.includes(r.id),r.id);
  if(!pilots.includes(r.id))continue;
  assert.ok(html.indexOf('id="fall-day-form"')<html.indexOf('id="regional-map"'),r.id+" first-screen utility");
  for(const needle of ['id="fall-day-date"','id="fall-day-start"','id="fall-day-style"','id="fall-day-geolocate"','id="fall-day-length"','id="fall-day-results"','day-planner-ui.js?v=','day-decision.js?v='])assert.ok(html.includes(needle),r.id+" "+needle);
  assert.match(html,/Only a straight-line proximity filter/);
  assert.match(html,/Scenic drive/);
 }
 const assets=["day-decision.js","day-planner-ui.js"];
 for(const file of assets)assert.ok(fs.existsSync("public/national-tools/fall-color/national-map/"+file));
 assert.equal(fs.readFileSync("public/national-tools/fall-color/national-map/day-decision.js","utf8"),fs.readFileSync("lib/fall-day-decision.js","utf8"));
 assert.equal(fs.readFileSync("public/national-tools/fall-color/national-map/day-planner-ui.js","utf8"),fs.readFileSync("public/fall-color/national/day-planner-ui.js","utf8"));
});
test("all 15 regions rank real mapped locations with independent timing, official access links and evidence",()=>{
 for(const id of pilots){
  const map=maps[id],config=day.profiles[id];
  assert.ok(config.starts.length>=4,id+" has local start towns");
  assert.ok(config.accessUrl.startsWith("https://"));
  for(const type of ["drive","photo","relaxed"]){
   const midpoint=Math.round((regions.find(r=>r.id===id).peak[0]+regions.find(r=>r.id===id).peak[1])/2);
   const date=new Date(Date.UTC(2026,0,midpoint)).toISOString().slice(0,10);
   const out=day.rank(map,{date,style:type,length:"day"},state);
   assert.ok(out.length>=1,id+" "+type+" has actual candidates");
   assert.ok(out.length<=3);
   assert.ok(out.every(x=>[...map.drives,...map.spots].some(p=>p.name===x.name)));
   assert.ok(out.every(x=>x.stage.observedLeafColorPct===null));
   assert.ok(out.every(x=>typeof x.sourceUrl==="string"&&x.sourceUrl.startsWith("https://")));
   assert.ok(out.every(x=>x.accessUrl.startsWith("https://")));
  }
 }
});
test("every official agency, name-specific override, start town and easygoing choice is grounded in real region data",()=>{
 for(const r of regions){
  const map=maps[r.id],p=day.profiles[r.id],named=new Set([...map.drives,...map.spots].map(x=>x.name));
  assert.ok(p.relaxed.length>0,r.id+" has a genuine lower-commitment choice");
  for(const name of p.relaxed)assert.ok(named.has(name),r.id+" easygoing option not on map: "+name);
  for(const name of Object.keys(p.cautions||{}))assert.ok(named.has(name),r.id+" unused access caution: "+name);
  for(const [name,ref] of Object.entries(p.accessByName||{})){
   assert.ok(named.has(name),r.id+" name-specific link has a real destination: "+name);
   assert.match(ref[0],/^https:\/\//);
   assert.ok(ref[1].length>8);
  }
  const states=new Set(r.states);
  for(const [state,ref] of Object.entries(p.accessByState||{})){
   assert.ok(states.has(state),r.id+" state-specific link corresponds to a covered state: "+state);
   assert.match(ref[0],/^https:\/\//);
  }
  for(const origin of p.starts){
   assert.equal(origin.length,3,r.id+" origin format");
   assert.ok(Number.isFinite(origin[1])&&Number.isFinite(origin[2]),r.id+" coordinates");
  }
 }
});
test("different New England dates choose different geography rather than one regional score",()=>{
 const a=day.rank(maps["new-england"],{date:"2026-09-28",style:"photo",length:"day"},state);
 const b=day.rank(maps["new-england"],{date:"2026-10-20",style:"photo",length:"day"},state);
 assert.ok(a.length&&b.length);
 assert.notEqual(a[0].name,b[0].name,"geographic foliage season changes which location rises first");
 assert.ok(new Set([...a,...b].map(x=>x.stage.typicalWindow.from)).size>2,"point-specific timing windows");
});
test("short local outing uses aerial proximity only, never invents drive times",()=>{
 const ne=maps["new-england"],p=day.profiles["new-england"].starts[0],origin={lat:p[1],lon:p[2]};
 const short=day.rank(ne,{date:"2026-10-08",style:"drive",length:"short",origin},state);
 const full=day.rank(ne,{date:"2026-10-08",style:"drive",length:"day",origin},state);
 assert.ok(short.length>0&&full.length>=short.length);
 assert.ok(short.every(x=>x.distance<=day.maxAirMiles.short));
 assert.ok(full.every(x=>x.distance<=day.maxAirMiles.day));
 assert.equal(day.airMiles(origin,origin),0);
 assert.equal(day.airMiles(null,origin),null);
 assert.ok(day.companion(full[0],full)===null||full.includes(day.companion(full[0],full)));
});
test("winter and impossible dates do not fabricate a fall-color recommendation",()=>{
 assert.ok(day.validDate("2026-10-08"));
 assert.ok(day.validDate("2027-12-08"));
 for(const date of ["2026-09-31","2026-12-09","2027-01-01","2027-04-01","garbage"])
  assert.equal(day.validDate(date),false,date);
 assert.deepEqual(day.rank(maps["new-england"],{date:"2027-01-01",style:"drive",length:"day"},state),[]);
 assert.deepEqual(day.rank(maps["great-smoky-mountains"],{date:"2026-12-08",style:"drive",length:"day"},state),[]);
});
test("browser labels distinguish forecasts, open-road checks and approximation",()=>{
 const ui=fs.readFileSync("public/fall-color/national/day-planner-ui.js","utf8");
 const map=fs.readFileSync("public/fall-color/national/regional-map-ui.js","utf8");
 for(const x of ["not a driving estimate","not live site readings","not forecasts for distant trip dates","road opening","fall-day-focus","fall-day-date","navigator.geolocation"])assert.ok(ui.includes(x),x);
 assert.match(map,/fall-region-map-selected/);
 assert.match(map,/fall-day-focus/);
 assert.match(map,/fall-day-date/);
 assert.doesNotMatch(ui,/live foliage percentage|open now|traffic is clear|drive time is/i);
});