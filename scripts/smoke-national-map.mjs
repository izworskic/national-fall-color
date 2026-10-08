/* Browser acceptance smoke run after npm test and generation.
   Local HTTP, real bundled Leaflet, 390px Chromium, no paid map token. */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";
import {createRequire} from "node:module";
const {regions}=createRequire(import.meta.url)("../lib/national-region-catalog.js");
const {viewingSpots}=createRequire(import.meta.url)("../lib/national-regional-viewing-spots.js");

const root=path.resolve("public");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json",".css":"text/css; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".jpg":"image/jpeg"};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    let target=path.resolve(root,"."+decodeURIComponent(url.pathname));
    if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403).end();return;}
    let stat=await fs.stat(target);
    if(stat.isDirectory())target=path.join(target,"index.html");
    const body=await fs.readFile(target);
    res.writeHead(200,{"content-type":types[path.extname(target)]||"application/octet-stream","cache-control":"no-store"}).end(body);
  }catch{res.writeHead(404,{"content-type":"text/plain"}).end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const address=server.address(),base="http://127.0.0.1:"+address.port;
let browser;
try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  // Do not accept "markers rendered" as proof that the actual street map works.
  // Exercise CARTO with real network tiles and assert the Michigan key is sent.
  const online=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const liveMap=await online.newPage();
  const tileResponses=[];
  liveMap.on("response",response=>{
    if(response.url().includes("basemaps.cartocdn.com/rastertiles/voyager/"))
      tileResponses.push({url:response.url(),status:response.status(),type:response.headers()["content-type"]||""});
  });
  await liveMap.goto(base+"/fall-color/national/",{waitUntil:"domcontentloaded"});
  await liveMap.waitForSelector('img.leaflet-tile-loaded[src*="basemaps.cartocdn.com"]',{timeout:18000});
  assert.ok(tileResponses.some(t=>t.status===200&&t.type.includes("image/")&&t.url.includes("?key=cb1_")),
    "CARTO must return a real keyed image tile, not just render empty overlay markers");
  assert.equal(await liveMap.locator("[data-region-marker]").count(),15);
  assert.match(await liveMap.locator("#national-basemap-status").innerText(),/CARTO Voyager/);
  // Test the manual selector with working tiles, separately from the outage test.
  const realSwitch=liveMap.locator("#national-switch-basemap");
  await realSwitch.click();
  assert.match(await liveMap.locator("#national-basemap-status").innerText(),/OpenStreetMap/);
  await realSwitch.click();
  assert.match(await liveMap.locator("#national-basemap-status").innerText(),/CARTO/);
  // Load the new fractal regional map using actual CARTO image tiles.
  const priorTileResponses=tileResponses.length;
  const regionalErrors=[];
  liveMap.on("pageerror",e=>regionalErrors.push(e.message));
  await liveMap.goto(base+"/fall-color/colorado-aspens/",{waitUntil:"domcontentloaded"});
  await liveMap.waitForTimeout(1200);
  const regionalDiagnose=await liveMap.evaluate(()=>({
    status:document.getElementById("regional-map-status")?.textContent,
    hasLeaflet:typeof window.L,
    hasModel:typeof window.NationalFallMapState,
    pinCount:document.querySelectorAll("[data-regional-drive]").length,
    pinOuter:document.querySelector('[data-regional-drive="1"]')?.outerHTML?.slice(0,350),
    pinRect:(()=>{const p=document.querySelector('[data-regional-drive="1"]');if(!p)return null;const r=p.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y};})(),
    mapRect:(()=>{const p=document.getElementById("regional-map");const r=p.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y};})(),
    mapHTML:document.getElementById("regional-map")?.innerHTML?.slice(0,230),
    mapScripts:[...document.scripts].filter(s=>s.src.includes("map")).map(s=>s.src)
  }));
  console.log("REGIONAL_MAP_DIAG",JSON.stringify({regionalDiagnose,regionalErrors}));
  await liveMap.waitForSelector('[data-regional-drive="1"]',{state:"attached",timeout:5000});
  assert.equal(await liveMap.locator("[data-regional-drive]").count(),4);
  assert.equal(await liveMap.locator("[data-regional-spot]").count(),4,"Colorado gained four relevant viewing locations");
  const coloradoSpot=liveMap.locator('[data-regional-spot-hit="1"]');
  await coloradoSpot.dispatchEvent("click");
  const spotCta=liveMap.locator('.regional-map-popup .regional-map-cta[href="#viewing-1"]').first();
  await spotCta.waitFor({timeout:5000});
  assert.equal(await spotCta.getAttribute("href"),"#viewing-1");

  await liveMap.waitForSelector('img.leaflet-tile-loaded[src*="basemaps.cartocdn.com"]',{timeout:18000});
  assert.ok(tileResponses.slice(priorTileResponses).some(t=>t.status===200&&t.type.includes("image/")&&t.url.includes("?key=cb1_")),
    "regional map must render a real Michigan-keyed CARTO image tile");
  const regionalSwitch=liveMap.locator("#regional-switch-basemap");
  await regionalSwitch.click();
  assert.match(await liveMap.locator("#regional-basemap-status").innerText(),/OpenStreetMap/);
  await regionalSwitch.click();
  assert.match(await liveMap.locator("#regional-basemap-status").innerText(),/CARTO/);
  await liveMap.evaluate(()=>{
    const dates=window.NationalFallMapState.seasonDates(2026);
    const slider=document.getElementById("regional-date-slider");
    slider.value=String(dates.indexOf("2026-09-20"));
    slider.dispatchEvent(new Event("input",{bubbles:true}));
  });
  assert.equal(await liveMap.locator('[data-regional-drive="1"]').getAttribute("data-stage"),"peak");
  await liveMap.evaluate(()=>document.querySelector('[data-regional-drive-hit="1"]').dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window})));
  const driveCta=liveMap.locator('.regional-map-popup .regional-map-cta[href="#drive-1"]').first();
  await driveCta.waitFor({timeout:5000});
  assert.equal(await driveCta.getAttribute("href"),"#drive-1");
  await online.close();

  // Simulate a real outage of both tile providers: region interaction must remain usable.
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  await context.route(/basemaps\.cartocdn\.com|gibs\.earthdata\.nasa\.gov|tile\.openstreetmap\.org/,route=>route.abort());
  const page=await context.newPage();
  await page.clock.install({time:new Date("2026-10-08T12:00:00-04:00")});
  const fallbackRequests=[];
  page.on("request",request=>{if(request.url().includes("tile.openstreetmap.org"))fallbackRequests.push(request.url());});
  await page.goto(base+"/fall-color/national/",{waitUntil:"domcontentloaded"});
  await page.waitForSelector('[data-region-marker="colorado-aspens"]',{timeout:18000});
  assert.equal(await page.locator("[data-region-marker]").count(),15,"all visible 9px markers");
  assert.equal(await page.locator("[data-region-hit]").count(),15,"all marker hit targets");
  // Both providers deliberately blocked: ensure automatic fallback activates.
  assert.equal(await page.locator("#national-switch-basemap").count(),1);
  await page.waitForTimeout(400);
  assert.ok(fallbackRequests.length>0,"automatic OSM fallback requested tiles when CARTO failed");
  assert.match(await page.locator("#national-basemap-status").innerText(),/OpenStreetMap/);
  assert.equal(await page.locator('section[aria-labelledby="region-directory"] .card a').count(),15,"15 fallback links");
  assert.ok((await page.locator("#national-selected-date").innerText()).includes("October 8"),"today in season");
  assert.equal(await page.locator('input#national-date-slider').getAttribute("max"),"98","Sept-Dec coverage");
  const probe=async(iso,id)=>{
    await page.evaluate(iso=>{
      const dates=window.NationalFallMapState.seasonDates(2026);
      const input=document.getElementById("national-date-slider");
      input.value=String(dates.indexOf(iso));
      input.dispatchEvent(new Event("input",{bubbles:true}));
    },iso);
    return page.locator('[data-region-marker="'+id+'"]').getAttribute("data-stage");
  };
  for(const [date,id,stage] of [
    ["2026-09-05","colorado-aspens","approaching"],
    ["2026-09-20","colorado-aspens","peak"],
    ["2026-10-08","new-england","peak"],
    ["2026-11-17","texas-hill-country","peak"],
    ["2026-12-06","texas-hill-country","past"]]){
    assert.equal(await probe(date,id),stage,date+" "+id);
  }
  await page.evaluate(()=>document.querySelector('[data-region-hit="texas-hill-country"]').dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:window})));
  await page.locator(".leaflet-popup-content .map-popup-cta").waitFor({timeout:5000});
  assert.equal(await page.locator(".leaflet-popup-content .map-popup-cta").getAttribute("href"),"/fall-color/texas-hill-country/");
  assert.match(await page.locator(".leaflet-popup-content").innerText(),/Modeled seasonal stage/i);
  const overflow=await page.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,mapWidth:Math.ceil(document.getElementById("national-map").getBoundingClientRect().width)}));
  assert.ok(overflow.pageWidth<=overflow.viewport+1,"390px horizontal overflow "+JSON.stringify(overflow));
  assert.ok(overflow.mapWidth<=390,"map wider than mobile viewport");
  assert.ok((await page.locator("#national-map-fallback").innerText()).includes("Street tiles")||await page.locator("[data-region-marker]").count()===15,
    "blocked tiles leave markers interactive");
  const noJs=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
  const staticPage=await noJs.newPage();
  await staticPage.goto(base+"/fall-color/national/");
  assert.equal(await staticPage.locator('section[aria-labelledby="region-directory"] .card a').count(),15,"no-JS directory");
  await noJs.close();
  // New England should present a rich but navigable distribution of high-interest
  // locations, with a state zoom selector for tightly clustered Vermont/NH sites.
  const ne=await context.newPage();
  await ne.goto(base+"/fall-color/new-england/",{waitUntil:"domcontentloaded"});
  await ne.waitForSelector('[data-regional-spot="1"]',{timeout:12000});
  assert.equal(await ne.locator("[data-regional-spot]").count(),16,"16 additional New England viewing areas");
  assert.equal(await ne.locator("[data-regional-drive]").count(),4,"existing four New England drives retained");
  // Match the Michigan behavior: on the same date northern and coastal
  // destinations should not all have identical colors.
  const neStages=await ne.locator("[data-regional-spot]").evaluateAll(nodes=>nodes.map(n=>n.getAttribute("data-stage")));
  assert.ok(new Set(neStages).size>=3,"New England must show >=3 independent local stages on Oct 8");
  const dix=await ne.locator('[data-regional-spot="4"]').getAttribute("data-stage");
  const camden=await ne.locator('[data-regional-spot="13"]').getAttribute("data-stage");
  assert.notEqual(dix,camden,"Dixville Notch and coastal Camden must not share an identical date-curve");
  await ne.evaluate(()=>{
    const dates=window.NationalFallMapState.seasonDates(2026);
    const slider=document.getElementById("regional-date-slider");
    slider.value=String(dates.indexOf("2026-10-18"));
    slider.dispatchEvent(new Event("input",{bubbles:true}));
  });
  assert.notEqual(await ne.locator('[data-regional-spot="4"]').getAttribute("data-stage"),
    await ne.locator('[data-regional-spot="13"]').getAttribute("data-stage"),
    "north/coast remain distinct as color advances south");

  await ne.locator("#regional-area-picker").selectOption("VT");
  assert.equal(await ne.locator("#regional-area-picker").inputValue(),"VT","state focus works");
  await ne.locator(".regional-spot-directory summary").click();
  await ne.locator('[data-regional-spot-pick="6"]').click();
  const neCta=ne.locator('.regional-map-popup .regional-map-cta[href="#viewing-6"]').first();
  await neCta.waitFor({timeout:5000});
  assert.equal(await neCta.getAttribute("href"),"#viewing-6");
  assert.ok((await ne.locator(".regional-map-popup").innerText()).includes("not a current leaf-color reading here"));
  const neWidth=await ne.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  assert.ok(neWidth[0]<=neWidth[1]+1,"New England expanded map no horizontal overflow");
  await ne.close();
    // Acceptance-gate *every* generated region at the mobile baseline.
  let regionPins=0,viewingPins=0;
  for(const region of regions){
    const rp=await context.newPage();
    await rp.goto(base+"/fall-color/"+region.id+"/",{waitUntil:"domcontentloaded"});
    await rp.waitForSelector('[data-regional-drive="1"]',{timeout:12000});
    const n=await rp.locator("[data-regional-drive]").count();
    assert.equal(n,region.drives.length,region.id+" mapped drive count");
    assert.equal(await rp.locator("[data-regional-drive-hit]").count(),n,region.id+" touch targets");
    assert.ok((await rp.locator("#regional-selected-date").innerText()).includes("Oct 8"),region.id+" initial season date");
    assert.match(await rp.locator("#regional-map-status").innerText(),/modeled typical peak windows/i,region.id+" no invented live data");
    const dimensions=await rp.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
    assert.ok(dimensions[0]<=dimensions[1]+1,region.id+" mobile horizontal overflow "+dimensions.join("/"));
    const spots=await rp.locator("[data-regional-spot]").count();
    assert.equal(spots,viewingSpots[region.id].length,region.id+" researched viewing places");
    assert.equal(await rp.locator("[data-regional-spot-hit]").count(),spots,region.id+" viewing tap targets");
    viewingPins+=spots;
    regionPins+=n;
    await rp.close();
  }
  assert.equal(regionPins,49,"49 drive markers mapped across all 15 regions");
  assert.equal(viewingPins,53,"53 additional research-backed points mapped");
  await context.close();
  // Winter calendar must never silently turn national or local dots green.
  const winter=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true});
  await winter.route(/basemaps\\.cartocdn\\.com|tile\\.openstreetmap\\.org|gibs\\.earthdata\\.nasa\\.gov/,route=>route.abort());
  const review=await winter.newPage();
  await review.clock.install({time:new Date("2027-01-10T10:00:00-05:00")});
  await review.goto(base+"/fall-color/national/",{waitUntil:"domcontentloaded"});
  await review.waitForSelector('[data-region-marker]',{timeout:12000});
  assert.match(await review.locator("#national-map-status").innerText(),/season complete/i);
  assert.equal(await review.locator('[data-region-marker][data-stage="offseason"]').count(),15,"15 off-season national markers");
  await review.locator("#national-preview-next").click();
  assert.match(await review.locator("#national-selected-date").innerText(),/Sep.*2027/i);
  assert.equal(await review.locator('[data-region-marker][data-stage="offseason"]').count(),0,"explicit preview restores fall season model");
  await review.locator("#national-reset-date").click();
  assert.equal(await review.locator('[data-region-marker][data-stage="offseason"]').count(),15,"season status resets all national markers to winter");
  await review.goto(base+"/fall-color/new-england/",{waitUntil:"domcontentloaded"});
  await review.waitForSelector('[data-regional-spot="1"]',{timeout:12000});
  assert.equal(await review.locator('[data-regional-spot][data-stage="offseason"]').count(),16);
  assert.equal(await review.locator('[data-regional-drive][data-stage="offseason"]').count(),4);
  assert.match(await review.locator("#regional-map-status").innerText(),/season complete/i);
  await review.locator("#regional-preview-next").click();
  assert.equal(await review.locator('[data-regional-spot][data-stage="offseason"]').count(),0);
  await review.locator("#regional-reset-date").click();
  assert.equal(await review.locator('[data-regional-spot][data-stage="offseason"]').count(),16);
  const winterWidths=await review.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  assert.ok(winterWidths[0]<=winterWidths[1]+1,"winter controls have no horizontal overflow");
  await winter.close();
  console.log("NATIONAL_MAP_BROWSER_PASS 390px; independent-site-stages=PASS; NE-north-coast-gradient=PASS; regional-maps=15; corridors=49; viewing-locations=53; new-england-spots=16; state-zoom=PASS; spot-popup=PASS; keyed-CARTO-tiles=PASS; switches=PASS; tiles-offline=PASS; no-JS=PASS; winter-gray=PASS; next-fall-preview=PASS; overflow=0");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
