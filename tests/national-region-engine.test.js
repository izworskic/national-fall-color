const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {regions,byId}=require("../lib/national-region-catalog");
const api=require("../api/national-fall-region");
const {timing,saturday,dayOfYear,compute,summaryPeriods,safeNwsUrl}=api._test;

test("exactly 15 unique regions, correct time zones and 3+ drives",()=>{
 assert.equal(regions.length,15);
 assert.equal(new Set(regions.map(x=>x.id)).size,15);
 for(const r of regions){
  assert.ok(byId[r.id]===r);
  assert.ok(r.drives.length>=3&&r.drives.length<=5);
  assert.ok(r.peak[0]<r.peak[1]&&r.peak[0]>240&&r.peak[1]<335);
  assert.doesNotThrow(()=>new Intl.DateTimeFormat("en-US",{timeZone:r.tz}));
 }
});
test("leaf percentage stays unobserved: index is strictly seasonal timing",()=>{
 for(const r of regions){
  const t=timing(r,"2027-10-08");
  assert.equal(t.observed_leaf_color_pct,null);
  assert.ok(t.planning_index_pct>=0&&t.planning_index_pct<=100);
  assert.match(t.basis,/not a live observation/);
 }
});
test("weekend date uses region's timezone at UTC boundary",()=>{
 const date=new Date("2027-10-09T02:30:00Z"); // Friday night in New York, not Saturday
 assert.equal(saturday("America/New_York",date),"2027-10-09");
 assert.equal(dayOfYear(2028,3,1),61); // leap-year support
});
test("degraded weather remains honest, usable and access unverified",async()=>{
 const r=byId["colorado-aspens"];
 const result=await compute(r,new Date("2027-09-20T15:00:00Z"),async()=>{throw Error("NWS offline")});
 assert.equal(result.status,"CLIMATOLOGY_ONLY");
 assert.equal(result.today.observed_leaf_color_pct,null);
 assert.equal(result.observation_status,"NOT_IN_THIS_FEED");
 assert.ok(result.drives.every(d=>d.live_road_status==="NOT_CHECKED"));
 assert.equal(result.this_weekend.weather,null);
});
test("NWS rejects foreign or insecure metadata URLs",()=>{
 assert.equal(safeNwsUrl("https://evil.example/redirect"),null);
 assert.equal(safeNwsUrl("http://api.weather.gov/gridpoints/BOU/1,1/forecast"),null);
 assert.ok(safeNwsUrl("https://api.weather.gov/gridpoints/BOU/1,1/forecast"));
});
test("NWS precipitation absent is NOT zero percent",()=>{
 const x=summaryPeriods([{startTime:"2027-10-08T12:00:00-04:00",name:"Friday",temperature:51,probabilityOfPrecipitation:{value:null}}]);
 assert.equal(x[0].precipitationProbability,null);
});
test("generator produces canonical indexable distinct pages and sitemap",()=>{
 for(const r of regions){
  const p=path.join("public","fall-color",r.id,"index.html");
  assert.ok(fs.existsSync(p),p);
  const s=fs.readFileSync(p,"utf8");
  assert.ok(s.includes('<link rel="canonical" href="https://chrisizworski.com/fall-color/'+r.id+'/">'));
  assert.ok(s.includes("api/national-fall-region"));
  assert.ok(s.includes("api/national-fall-observations"));
  assert.ok(s.includes("api/national-fall-color"));
  assert.ok(s.includes("Historical satellite autumn timing"));
  assert.ok(s.includes("not interchangeable with the visual peak-color date"));
  assert.ok(!/<meta name="robots" content="noindex/.test(s));
 }
 const sitemap=fs.readFileSync("public/fall-color/national-sitemap.xml","utf8");
 assert.equal((sitemap.match(/<url><loc>/g)||[]).length,16);
 const existingLocator=fs.readFileSync("public/national-tools/fall-color/index.html","utf8");
 assert.ok(existingLocator.includes("data-2027-national-regions"));
 assert.ok(existingLocator.includes("/fall-color/national/"));
});
