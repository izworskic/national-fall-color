/* Browser acceptance smoke run after npm test and generation.
   Local HTTP, real bundled Leaflet, 390px Chromium, no paid map token. */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

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
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  await context.route(/basemaps\.cartocdn\.com|gibs\.earthdata\.nasa\.gov/,route=>route.abort());
  const page=await context.newPage();
  await page.clock.install({time:new Date("2026-10-08T12:00:00-04:00")});
  await page.goto(base+"/fall-color/national/",{waitUntil:"domcontentloaded"});
  await page.waitForSelector('[data-region-marker="colorado-aspens"]',{timeout:18000});
  assert.equal(await page.locator("[data-region-marker]").count(),15,"all visible 9px markers");
  assert.equal(await page.locator("[data-region-hit]").count(),15,"all marker hit targets");
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
  await context.close();
  console.log("NATIONAL_MAP_BROWSER_PASS 390px; markers=15; dates=5; popup=PASS; tiles-offline=PASS; no-JS=PASS; overflow=0");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
