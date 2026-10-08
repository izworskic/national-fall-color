const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const {byId,regions}=require("../lib/national-region-catalog");
const {regionEvidence,_test:t}=require("../lib/phenocam-national");
const site={site:"unitforest",roi:"unitforest_DB_1000",lat:44.35,lon:-71.30,
 source:"https://phenocam.nau.edu/data/archive/unitforest/ROI/unitforest_DB_1000_3day.csv",years:9,
 latest_metadata:"2026-10-07",active:true};
function fixture(midpoints,through=2026){
 let records=[];
 midpoints.forEach(([year,mid])=>{
  for(let day=171;day<=334;day+=2){
   const date=new Date(Date.UTC(year,0,day)).toISOString().slice(0,10);
   const frac=1/(1+Math.exp(-(day-mid)/7));
   const gcc=.43-.12*frac;
   records.push(date+","+gcc.toFixed(6));
  }
 });
 if(!midpoints.some(x=>x[0]===through)){
  for(let day=171;day<=280;day+=2){
   const date=new Date(Date.UTC(through,0,day)).toISOString().slice(0,10);
   const frac=1/(1+Math.exp(-(day-274)/7));
   records.push(date+","+(.43-.12*frac).toFixed(6));
  }
 }
 return "date,gcc_90\n"+records.join("\n");
}
const historyYears=[2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];
const events=historyYears.map((y,i)=>[y,i<4?280:274]);

test("ROI metadata: deciduous only, whitelist downloads, no fabricated camera",()=>{
 const meta={results:[{...site,roi_name:site.roi,three_day_summary:site.source,show_data_link:true},
  {...site,roi_name:"unitforest_EN_1000",three_day_summary:site.source.replace("_DB_","_EN_")},
  {...site,site:"poison",roi_name:"poison_DB_1000",three_day_summary:"https://evil.example/data.csv"}]};
 const rois=t.normalizeRois(meta);
 assert.equal(rois.length,1);
 assert.equal(rois[0].roi,site.roi);
 assert.equal(t.safeSummary("https://evil.example/data/archive/unitforest/ROI/unitforest_DB_1000_3day.csv"),null);
 assert.equal(t.safeSummary("http://phenocam.nau.edu/data/archive/unitforest/ROI/unitforest_DB_1000_3day.csv"),null);
});
test("only nearby camera ROI, one ROI per site, no site-wide fabricated coverage",()=>{
 const r=byId["new-england"];
 const rois=[site,{...site,roi:"unitforest_DB_2000"}, {...site,site:"coast",lon:-68.26,roi:"coast_DB_1000"}];
 const selected=t.selectCameras(r,rois);
 assert.equal(selected.length,1);
 assert.equal(selected[0].site,"unitforest");
 assert.ok(selected[0].distance_km<145);
});
test("parse PhenoCam CSV and invalid greenness / duplicate dates",()=>{
 const s=t.parseSeries('date,gcc_90\n2025-10-01,0.345\n2025-10-01,0.348\n2025-10-04,-9999\n2025-10-07,0.320\n');
 assert.deepEqual(s.map(x=>x.date),["2025-10-01","2025-10-07"]);
 assert.equal(s[0].gcc,.345);
 assert.throws(()=>t.parseSeries("date,temperature\n2025-10-01,40"),/GCC/);
});
test("historical 50%-senescence proxy computed and strictly pre-2026",()=>{
 const rows=t.parseSeries(fixture(events));
 const years=t.annualProfiles(rows,2026);
 assert.equal(years.length,10);
 assert.equal(years[0].year,2016);
 assert.ok(Math.abs(years[0].midpoint-280)<=4);
 assert.ok(Math.abs(years[8].midpoint-274)<=4);
});
test("backtest is past-only, honors held-out years, and never calls itself peak color",()=>{
 const rows=t.parseSeries(fixture(events));
 const p=t.annualProfiles(rows,2026);
 const b=t.backtest(p,rows);
 assert.ok(b.samples>=3);
 assert.ok(b.per_year.every(v=>v.year>=2019));
 assert.ok(b.per_year.every(v=>v.baseline_abs_error>=0&&v.calibrated_abs_error>=0));
 assert.match(b.method,/greendown proxy only/);
 assert.ok(!JSON.stringify(b).includes("observed_leaf_color_pct"));
});
test("live regional camera offset is report-only; no scenic peak shifted",async()=>{
 const b=await regionEvidence(byId["new-england"],{
   now:new Date("2026-10-07T16:00:00Z"),
   catalogProvider:async()=>[site],
   seriesReader:async()=>fixture(events)
 });
 assert.equal(b.calibration_applied,false);
 assert.ok(["CALIBRATED","NO_VALIDATED_CALIBRATION"].includes(b.status));
 assert.equal(b.cameras.length,1);
 assert.ok(b.cameras[0].validation.samples>=3);
 assert.equal(b.attribution.license,"CC BY 4.0");
});
test("stale live data never moves a forecast even if historical validation passes",async()=>{
 const b=await regionEvidence(byId["new-england"],{
   now:new Date("2026-11-30T16:00:00Z"),
   catalogProvider:async()=>[site],
   seriesReader:async()=>fixture(events)
 });
 assert.equal(b.calibration_applied,false);
 assert.equal(b.shift_days,null);
 assert.notEqual(b.status,"CALIBRATED");
});
test("sparse seasons and missing site selection fail closed",async()=>{
 const sparse=t.cameraEvidence({...site,distance_km:2},t.parseSeries(fixture([[2024,276],[2025,280]])),new Date("2026-10-07T16:00:00Z"));
 assert.equal(sparse.status,"INSUFFICIENT_HISTORY");
 const empty=await regionEvidence(byId["door-county"],{catalogProvider:async()=>[],seriesReader:async()=>{throw Error("no fetch")}});
 assert.equal(empty.status,"NO_REPRESENTATIVE_CAMERA");
 assert.equal(empty.calibration_applied,false);
});
test("third-party metadata outages fail closed without blocking NWS",async()=>{
 const b=await regionEvidence(byId["wasatch"],{catalogProvider:async()=>{throw Error("timeout")}});
 assert.equal(b.status,"SOURCE_UNAVAILABLE");
 assert.equal(b.shift_days,null);
});
test("all generated regional pages independently show measured vs modeled disclaimer and attribution",()=>{
 for(const r of regions){
  const html=fs.readFileSync("public/fall-color/"+r.id+"/index.html","utf8");
  for(const term of ["api/national-fall-phenocam","PhenoCam canopy timing","Fair Use and attribution","does not alter the scenic peak forecast"])
   assert.ok(html.includes(term),r.id+": "+term);
 }
});
