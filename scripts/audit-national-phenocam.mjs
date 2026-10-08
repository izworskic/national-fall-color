// Optional live-data audit: executable in GitHub Actions, not in the page-request path.
// Outputs a report even if the PhenoCam provider is offline; zero sites != zero error.
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {regions}=require("../lib/national-region-catalog");
const {regionEvidence,_test}=require("../lib/phenocam-national");
const wantAll=process.argv.includes("--all");
const chosen=wantAll?regions:regions.slice(0,5);
const now=new Date();
const result={generated_at:now.toISOString(),sample_type:"empirical-provider-coverage-audit",scope:wantAll?"all 15 regions":"tier 1 five regions",
 method:"PhenoCam GCC three-day summaries, rolling-origin greendown midpoint validation, NOT validation against photographed visual color peak",regions:[]};
let rois;
try{rois=await _test.fetchCatalog();result.metadata_available=true;result.catalog_deciduous_rois=rois.length;}
catch(e){rois=null;result.metadata_available=false;result.metadata_error=String(e.message||e);}
for(const region of chosen){
 // Preserve a clear failure state for unavailable data, not an invented season shift.
 const evidence=await regionEvidence(region,{now,catalogProvider:async()=>{if(!rois)throw Error("No metadata");return rois;}});
 result.regions.push({id:region.id,anchor:{lat:region.lat,lon:region.lon},
   status:evidence.status,confidence:evidence.confidence,
   calibration_applied:evidence.calibration_applied,
   selected_camera_count:evidence.cameras.length,
   cameras:evidence.cameras.map(c=>({site:c.site,distance_km:c.distance_km,latest:c.latest,
    history_years:c.history_years,status:c.status,
    historical_greendown_midpoint_doy:c.historical_greendown_midpoint_doy,
    validation:c.validation?{samples:c.validation.samples,baseline_median_abs_error_days:c.validation.baseline_median_abs_error_days,
      calibrated_median_abs_error_days:c.validation.calibrated_median_abs_error_days,
      improved_days:c.validation.improved_days,validation_passed:c.validation.validation_passed}:null}))});
 // Throttle catalog follow-on site reads across regions.
 await new Promise(resolve=>setTimeout(resolve,1100));
}
result.summary={
 region_count:result.regions.length,
 regions_with_eligible_camera:result.regions.filter(x=>x.selected_camera_count>0).length,
 regions_with_validated_canopy_signal:result.regions.filter(x=>x.status==="CALIBRATED").length,
 regions_source_unavailable:result.regions.filter(x=>x.status==="SOURCE_UNAVAILABLE").length,
 caveat:"No results here certify a scenic leaf-color peak forecast. Regional weather/peak predictions are not modified by this audit."
};
const file=path.join(process.cwd(),"artifacts","national-fall-phenocam-audit.json");
fs.mkdirSync(path.dirname(file),{recursive:true});
fs.writeFileSync(file,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result.summary));
console.log("Report saved to "+path.relative(process.cwd(),file));
