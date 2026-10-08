const test=require("node:test");
const assert=require("node:assert/strict");
const {regions}=require("../lib/national-region-catalog.js");
const {viewingSpots}=require("../lib/national-regional-viewing-spots.js");
const {pointTiming,validateCatalog,siteProfiles}=require("../lib/national-site-timing.js");
const state=require("../lib/national-map-state.js");
const fs=require("node:fs");
const byId=Object.fromEntries(regions.map(r=>[r.id,r]));
test("all 102 individual map points have distinct, supported geographic timing profiles",()=>{
  assert.doesNotThrow(()=>validateCatalog(regions,viewingSpots));
  let checked=0;
  for(const r of regions){
    const html=fs.readFileSync("public/fall-color/"+r.id+"/index.html","utf8");
    const encoded=html.split('<script type="application/json" id="regional-map-data">')[1]?.split("</script>")[0];
    assert.ok(encoded,r.id);
    const map=JSON.parse(encoded);
    assert.equal(map.drives.length,r.drives.length);
    assert.equal(map.spots.length,viewingSpots[r.id].length);
    for(const [kind,points] of [["drive",map.drives],["spot",map.spots]]){
      points.forEach((point,index)=>{
        const t=pointTiming(r,kind,index);
        assert.deepEqual(point.peak,t.peak);
        assert.deepEqual(point.timing,t.timing);
        assert.ok(point.timing.sourceUrl.startsWith("https://"));
        assert.equal(point.timing.confidence,"illustrative");
        assert.equal(state.stageFor(point,"2026-10-08").observedLeafColorPct,null);
        assert.match(point.timing.basis,/not observed live foliage/i);
        checked++;
      });
    }
    const shifts=new Set(Object.values(siteProfiles[r.id].zones).map(p=>p.shift));
    assert.ok(shifts.size>=2,r.id+" has more than one geographic timing band");
    assert.match(html,/Estimated seasonal progression/);
    assert.match(html,/geography-informed typical seasonal scenarios/);
  }
  assert.equal(checked,102);
});
test("New England is a real north/south coast/mountain gradient on identical dates",()=>{
  const r=byId["new-england"],map=JSON.parse(
    fs.readFileSync("public/fall-color/new-england/index.html","utf8")
      .split('<script type="application/json" id="regional-map-data">')[1].split("</script>")[0]);
  const get=name=>map.spots.find(s=>s.name===name);
  const dix=get("Dixville Notch"),camden=get("Camden Hills"),
    franconia=get("Franconia Notch"),meredith=get("Meredith / Lake Winnipesaukee");
  for(const p of [dix,camden,franconia,meredith])assert.ok(p);
  assert.ok(dix.peak[1]<franconia.peak[0]+5);
  assert.ok(franconia.peak[0]<meredith.peak[0]);
  assert.ok(meredith.peak[0]<camden.peak[0]);
  for(const date of ["2026-09-27","2026-10-08","2026-10-18"]){
    const ids=[dix,franconia,meredith,camden].map(s=>state.stageFor(s,date).id);
    assert.ok(new Set(ids).size>=2,date+" differentiates foliage map colors");
  }
  const fall=state.stageFor(dix,"2026-10-08");
  const coastal=state.stageFor(camden,"2026-10-08");
  assert.equal(fall.id,"past");
  assert.notEqual(coastal.id,fall.id);
  assert.notDeepEqual(fall.typicalWindow,coastal.typicalWindow);
});
test("higher Smoky Mountain ridges precede valleys and lakeshore MN follows interior ridges",()=>{
  const gr=byId["great-smoky-mountains"];
  const high=pointTiming(gr,"spot",0),low=pointTiming(gr,"spot",1);
  assert.ok(high.peak[1]<low.peak[0],"elevational progression");
  const mn=byId["north-shore-superior"];
  const inland=pointTiming(mn,"drive",1),lake=pointTiming(mn,"spot",0);
  assert.ok(inland.peak[0]<lake.peak[0],"Lake Superior moderation");
});
test("per-site Leaflet rendering binds independent stages and source-labeled popups",()=>{
  const js=fs.readFileSync("public/fall-color/national/regional-map-ui.js","utf8");
  assert.match(js,/state\.stageFor\(point,selected\)/);
  assert.match(js,/siteStage\(r\.drive\)/);
  assert.match(js,/siteStage\(r\.place\)/);
  assert.match(js,/siteStage\(d\)/);
  assert.match(js,/siteStage\(place\)/);
  assert.match(js,/r\.washes\.forEach/);
  assert.match(js,/not an observed reading for this individual drive/);
  assert.match(js,/not a current leaf-color reading here/);
  assert.match(js,/sourceUrl/);
  assert.doesNotMatch(js,/observedLeafColorPct\s*:\s*[1-9]/);
});
