const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {regions}=require("../lib/national-region-catalog");
const {corridorAnchors}=require("../lib/national-regional-map-places");
const {viewingSpots}=require("../lib/national-regional-viewing-spots");
const M=require("../lib/national-map-state");

test("every regional page has an individual map with the exact existing drives",()=>{
  assert.equal(regions.length,15);
  let total=0;
  const ids=new Set(regions.map(r=>r.id));
  assert.deepEqual(Object.keys(corridorAnchors).sort(),Array.from(ids).sort());
  for(const r of regions){
    const anchors=corridorAnchors[r.id];
    assert.equal(anchors.length,r.drives.length,"missing drive anchor "+r.id);
    assert.ok(anchors.length>=3);
    const html=fs.readFileSync("public/fall-color/"+r.id+"/index.html","utf8");
    const body=html.match(/<script type="application\/json" id="regional-map-data">([^<]+)<\/script>/);
    assert.ok(body,"embedded map data: "+r.id);
    const data=JSON.parse(body[1]);
    assert.equal(data.id,r.id);
    assert.deepEqual(data.peak,r.peak);
    assert.equal(data.drives.length,anchors.length);
    assert.ok(html.includes('id="regional-map"'),r.id);
    assert.ok(html.includes('id="regional-date-slider"'),r.id);
    assert.ok(html.includes('id="regional-switch-basemap"'),r.id);
    assert.ok(html.includes('id="regional-map-status"'),r.id);
    assert.ok(html.includes('id="regional-map-fallback"'),r.id);
    assert.ok(html.includes('href="https://chrisizworski.com/fall-color/'+r.id+'/"'),r.id);
    assert.ok(html.includes('href="/fall-color/national/"'),r.id);
    assert.ok(html.indexOf('id="regional-map"')<html.indexOf('id="drive-1"'),"map before drive details: "+r.id);
    assert.ok(html.includes("leaflet/leaflet.css"),r.id);
    const revState=html.match(/\/national-tools\/fall-color\/national-map\/map-state\.js\?v=([a-f\d]{12})/);
    const revUi=html.match(/\/national-tools\/fall-color\/national-map\/regional-map-ui\.js\?v=([a-f\d]{12})/);
    assert.ok(revState&&revUi,"versioned shared scripts: "+r.id);
    assert.equal(revState[1],revUi[1]);
    data.drives.forEach((d,i)=>{
      assert.equal(d.index,i+1);
      assert.equal(d.name,r.drives[i][0]);
      assert.equal(d.corridor,r.drives[i][1]);
      assert.equal(d.tip,r.drives[i][2]);
      assert.ok(Number.isFinite(d.lat)&&d.lat>=25&&d.lat<=49.5,r.id+" "+d.name);
      assert.ok(Number.isFinite(d.lon)&&d.lon<=-66&&d.lon>=-125,r.id+" "+d.name);
      assert.ok(Math.abs(d.lat-r.lat)<4&&Math.abs(d.lon-r.lon)<5,
        "corridor anchor too far from its parent region: "+r.id+" "+d.name);
      assert.ok(typeof d.vicinity==="string"&&d.vicinity.length>10);
      assert.ok(html.includes('id="drive-'+(i+1)+'"'));
      total++;
    });
    assert.ok(html.includes("not measured leaf color"));
    assert.ok(html.includes('name="robots" content="index,follow,max-image-preview:large"'));
    assert.ok(html.includes('rel="canonical"'));
  }
  assert.equal(total,49,"all 49 canonical scenic drives mapped");
  const expectedRegions=Object.keys(viewingSpots).sort();
  assert.deepEqual(expectedRegions,Array.from(ids).sort(),"all region decisions have researched localities");
  let added=0;
  for(const region of regions){
    const p="public/fall-color/"+region.id+"/index.html";
    const html=fs.readFileSync(p,"utf8");
    const encoded=html.split('<script type="application/json" id="regional-map-data">')[1]?.split("</script>")[0];
    assert.ok(encoded,"embedded map JSON "+region.id);
    const embedded=JSON.parse(encoded);
    const spots=embedded.spots;
    assert.equal(spots.length,viewingSpots[region.id].length);
    assert.ok(html.includes('class="regional-spot-directory"'),"static locality directory "+region.id);
    assert.ok(html.includes('Viewing area'),"spot legend "+region.id);
    assert.ok(html.includes("regional-spot-pick"),"map-to-place chooser "+region.id);
    const names=new Set();
    spots.forEach((spot,i)=>{
      assert.equal(spot.index,i+1);
      assert.ok(!names.has(spot.name.toLowerCase()),"duplicate name "+region.id);
      names.add(spot.name.toLowerCase());
      assert.ok(region.states.includes(spot.state),"outside catalog states "+region.id);
      assert.ok(Number.isFinite(spot.lat)&&Number.isFinite(spot.lon),"finite coordinates "+region.id);
      assert.ok(Math.abs(spot.lat-region.lat)<4.5&&Math.abs(spot.lon-region.lon)<5,"coordinate outside region "+spot.name);
      assert.ok(spot.sourceUrl.startsWith("https://"),"source link "+spot.name);
      assert.ok(spot.reason&&spot.reason.length>15,"decision-relevant context "+spot.name);
    });
    added+=spots.length;
  }
  assert.equal(viewingSpots["new-england"].length,16);
  assert.equal(added,53,"source-reviewed 53 locality anchors across 15 regions");

});
test("regional map keeps the tested Michigan colors and an evidence-safe seasonal basis",()=>{
  assert.equal(M.stages.length,7);
  const ui=fs.readFileSync("public/fall-color/national/regional-map-ui.js","utf8");
  const asset=fs.readFileSync("public/national-tools/fall-color/national-map/regional-map-ui.js","utf8");
  assert.equal(ui,asset);
  assert.match(ui,/NationalFallMapState/);
  assert.match(ui,/state\.stageFor\(data,selected\)/);
  assert.match(ui,/not an observed reading for this individual drive/i);
  assert.match(ui,/NOT a route trace/i);
  assert.match(ui,/map\.setView\(\[data\.lat,data\.lon\],7\)/,"Leaflet view must initialize before marker SVG attachment");
  assert.match(ui,/radius:9/);
  assert.match(ui,/radius:18/);
  assert.match(ui,/26000,16000,9000/);
  assert.match(ui,/\?key=cb1_2y8f_1_1ee5e3a872c91d0ebf5d7b88/);
  assert.match(ui,/tile\.openstreetmap\.org/);
  assert.match(ui,/CARTO did not load/);
  assert.match(ui,/popupopen/);
  assert.match(ui,/data-regional-spot/);
  assert.match(ui,/spotPopup/);
  assert.match(ui,/Viewing locations/);
  assert.match(ui,/areaPicker\.addEventListener\("change"/);
  assert.match(ui,/All dots use the same regional timing model/);

  assert.match(ui,/regional-date-slider/);
  assert.doesNotMatch(ui,/mapbox|access_token|pk\./i);
  for(const r of regions){
    const s=M.stageFor(r,"2026-10-08");
    assert.equal(s.observedLeafColorPct,null);
  }
});
