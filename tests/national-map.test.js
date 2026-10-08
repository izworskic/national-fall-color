const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm");
const {regions}=require("../lib/national-region-catalog");
const M=require("../lib/national-map-state");
const htmlPath="public/fall-color/national/index.html";
const statePath="public/national-tools/fall-color/national-map/map-state.js";
const uiPath="public/fall-color/national/map-ui.js";
const getHub=()=>fs.readFileSync(htmlPath,"utf8");

test("national map builds 15 geolocated, uniquely linked regions from canonical catalog",()=>{
  assert.equal(regions.length,15);
  assert.equal(new Set(regions.map(r=>r.id)).size,15);
  const hub=getHub();
  const encoded=hub.match(/<script type="application\/json" id="national-map-regions">([^<]*)<\/script>/);
  assert.ok(encoded,"catalog JSON embedded in generated national hub");
  const markers=JSON.parse(encoded[1]);
  assert.equal(markers.length,15);
  for(const r of regions){
    const x=markers.find(m=>m.id===r.id);
    assert.deepEqual(x,{id:r.id,name:r.name,lat:r.lat,lon:r.lon,peak:r.peak});
    assert.ok(x.lat>=25&&x.lat<=49&&x.lon<=-66&&x.lon>=-125);
    assert.ok(hub.includes('href="https://chrisizworski.com/fall-color/'+r.id+'/?"')===false);
    assert.ok(hub.includes('href="https://chrisizworski.com/fall-color/'+r.id+'/"'));
  }
});
test("chronological stage curve varies Sept-Nov and separates before from after",()=>{
  const probes=[
    ["colorado-aspens","2026-09-05","approaching"],
    ["colorado-aspens","2026-09-20","peak"],
    ["colorado-aspens","2026-10-20","past"],
    ["new-england","2026-10-08","peak"],
    ["new-england","2026-11-12","bare"],
    ["texas-hill-country","2026-09-20","green"],
    ["texas-hill-country","2026-11-17","peak"],
    ["texas-hill-country","2026-12-06","past"]
  ];
  for(const [id,date,expected] of probes){
    const actual=M.stageFor(regions.find(r=>r.id===id),date);
    assert.equal(actual.id,expected,id+" "+date);
    assert.equal(actual.observedLeafColorPct,null);
    assert.match(actual.basis,/not a current foliage observation/);
  }
  for(const r of regions){
    const year=2026;
    assert.notEqual(M.stageFor(r,M.isoFromDoy(year,r.peak[0]-10)).id,
      M.stageFor(r,M.isoFromDoy(year,r.peak[1]+10)).id);
  }
});
test("Michigan palette retained with progressive autumn fade and subdued winter",()=>{
  assert.deepEqual(M.stages.slice(0,6).map(s=>s.color),["#4A6633","#5A6B3A","#8E6410","#9E5F13","#9C4E27","#8E301C"]);
  assert.deepEqual(M.stages.slice(6).map(s=>s.id),["fading","past","bare","offseason"]);
  assert.ok(M.washAlpha("peak")<=.20);
  assert.ok(M.washAlpha("past")<M.washAlpha("peak"));
  const ui=fs.readFileSync(uiPath,"utf8");
  assert.match(ui,/radius:9/);
  assert.match(ui,/ringRadii=\[112000,67000,32000\]/);
  assert.match(ui,/radius:18/);
  assert.match(ui,/L\.control\.layers/);
  assert.match(ui,/rastertiles\/voyager\//);
  assert.match(ui,/\?key=/,"CARTO raster tiles require a browser-side basemap key");
  assert.match(ui,/cb1_2y8f_1_1ee5e3a872c91d0ebf5d7b88/,"Use exactly the existing Michigan browser key");
  assert.match(ui,/tile\.openstreetmap\.org/,"Independent backup provider");
  assert.match(ui,/cartoErrors>=3/,"Fails over when CARTO tiles error");
  assert.match(ui,/CARTO street tiles did not load/,"Fails over on stalled tile requests");

  assert.doesNotMatch(ui,/mapbox|access_token|pk\./i);
});
test("today or forthcoming season date slider spans western aspens and late Texas",()=>{
  const dates=M.seasonDates(2026);
  assert.equal(dates[0],"2026-09-01");
  assert.equal(dates[dates.length-1],"2026-12-08");
  assert.equal(dates.length,99);
  assert.equal(M.initialDate(new Date(2026,9,8,10),dates),"2026-10-08");
  assert.equal(M.initialDate(new Date(2026,5,1,10),dates),"2026-09-01");
  assert.equal(M.seasonYear(new Date(2026,11,20,12)),2026);
  assert.equal(M.seasonYear(new Date(2027,0,10,12)),2026);
  assert.equal(M.seasonYear(new Date(2027,8,10,12)),2027);
  assert.equal(M.initialDate(new Date(2026,11,20,12),M.seasonDates(2027)),"2027-09-01");
  assert.equal(M.doyFromIso("2028-03-01"),61);
  assert.throws(()=>M.doyFromIso("2026-09-31"));
});
test("page has fallback directory, slider, popups, on-demand weather and analytics build contract",()=>{
  const hub=getHub(),ui=fs.readFileSync(uiPath,"utf8");
  assert.ok(hub.indexOf('id="national-map"')<hub.indexOf('id="region-directory"'));
  assert.match(hub,/<link rel="canonical" href="https:\/\/chrisizworski.com\/fall-color\/national\/">/);
  for(const id of ["national-date-slider","national-reset-date","national-selected-date","national-map-fallback","national-map-status","national-map-regions"])assert.ok(hub.includes('id="'+id+'"'));
  assert.ok(hub.includes("map-state.js")&&hub.includes("map-ui.js"));
  const stateRevision=hub.match(/\/national-tools\/fall-color\/national-map\/map-state\.js\?v=([0-9a-f]{12})/);
  const uiRevision=hub.match(/\/national-tools\/fall-color\/national-map\/map-ui\.js\?v=([0-9a-f]{12})/);
  assert.ok(stateRevision&&uiRevision,"Map code served under versioned URLs to bypass stale browser/CDN cache");
  assert.equal(stateRevision[1],uiRevision[1]);

  assert.ok(hub.includes('id="national-switch-basemap"'));
  assert.ok(hub.includes('id="national-basemap-status"'));

  assert.ok(fs.existsSync(statePath));
  assert.ok(fs.existsSync("public/national-tools/fall-color/national-map/map-ui.js"));
  assert.ok(fs.existsSync("public/national-tools/fall-color/national-map/leaflet/leaflet.js"));
  assert.ok(hub.includes("/national-tools/fall-color/national-map/leaflet/leaflet.css"));
  assert.equal(fs.readFileSync(statePath,"utf8"),fs.readFileSync("lib/national-map-state.js","utf8"));
  assert.match(ui,/addEventListener\("input"/);
  assert.match(ui,/setStyle\(/);
  assert.match(ui,/popupopen/);
  assert.match(ui,/api\/national-fall-region\?region=/);
  assert.doesNotMatch(ui,/api\/national-fall-observations\?/);
  assert.match(ui,/NWS weekend weather/);
  assert.match(ui,/forecast this far ahead/);
  assert.match(hub,/max-width:calc\(100vw - 92px\)/);
  assert.match(hub,/@media\(max-width:700px\)/);
  assert.match(hub,/grid-template-columns:minmax\(0,1fr\)/);
  assert.match(hub,/min-width:0;max-width:100%;overflow:hidden/);
  assert.match(fs.readFileSync("scripts/inject-ga4.mjs","utf8"),/adsense/i);
  assert.ok(!/<meta name="robots" content="noindex/.test(hub));
});
test("a blocked Leaflet script leaves a usable page instead of crashing",()=>{
  const js=fs.readFileSync(uiPath,"utf8");
  const state={textContent:"",listeners:[],attributes:{}};
  const elements={
    "national-map":{},
    "national-date-slider":{value:0,addEventListener:(name,fn)=>state.listeners.push(name),setAttribute:(k,v)=>state.attributes[k]=v},
    "national-map-regions":{textContent:JSON.stringify(regions.map(({id,name,lat,lon,peak})=>({id,name,lat,lon,peak})))},
    "national-map-status":{textContent:""},
    "national-map-fallback":{textContent:""},
    "national-selected-date":{textContent:""},
    "national-reset-date":{addEventListener:()=>{}}
  };
  vm.runInNewContext(js,{window:{NationalFallMapState:M},document:{getElementById:k=>elements[k]||null},Date,Intl,Map,JSON},{timeout:2000});
  assert.match(elements["national-map-status"].textContent,/map unavailable/i);
  assert.match(elements["national-map-fallback"].textContent,/region directory/i);
  assert.deepEqual(state.listeners,["input"]);
});
