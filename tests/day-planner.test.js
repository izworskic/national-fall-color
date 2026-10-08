const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const day=require("../lib/fall-day-decision.js"),state=require("../lib/national-map-state.js");
const {regions}=require("../lib/national-region-catalog.js");
const pilots=["new-england","great-smoky-mountains","colorado-aspens"];
const maps=Object.fromEntries(pilots.map(id=>{
 const html=fs.readFileSync("public/fall-color/"+id+"/index.html","utf8");
 return [id,JSON.parse(html.split('<script type="application/json" id="regional-map-data">')[1].split("</script>")[0])];
}));
test("the decision-first interface ships only to the three researched pilots",()=>{
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
test("every pilot returns real mapped locations with independent timing, evidence, map links",()=>{
 for(const id of pilots){
  const map=maps[id],config=day.profiles[id];
  assert.ok(config.starts.length>=4);
  assert.ok(config.accessUrl.startsWith("https://"));
  for(const type of ["drive","photo","relaxed"]){
   const out=day.rank(map,{date:id==="colorado-aspens"?"2026-09-24":"2026-10-08",style:type,length:"day"},state);
   assert.ok(out.length>=1,id+" "+type+" has actual candidates");
   assert.ok(out.length<=3);
   assert.ok(out.every(x=>[...map.drives,...map.spots].some(p=>p.name===x.name)));
   assert.ok(out.every(x=>x.stage.observedLeafColorPct===null));
   assert.ok(out.every(x=>typeof x.sourceUrl==="string"&&x.sourceUrl.startsWith("https://")));
   assert.ok(out.every(x=>x.accessUrl.startsWith("https://")));
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