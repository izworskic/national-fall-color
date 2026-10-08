// Supporting experimental PhenoCam canopy-timing evidence.
// Keep independent from NWS trip decision: failure never blocks the main result.
const {byId}=require("../lib/national-region-catalog");
const {regionEvidence}=require("../lib/phenocam-national");
module.exports=async(req,res)=>{
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("X-Robots-Tag","noindex, nofollow");
 res.setHeader("Cache-Control","public, s-maxage=21600, stale-while-revalidate=21600");
 if(!["GET","HEAD"].includes(req.method))return res.status(405).json({error:"GET or HEAD required"});
 const id=String(req.query?.region||"");
 if(!Object.hasOwn(byId,id))return res.status(400).json({error:"Unknown region"});
 try{return res.status(200).json(await regionEvidence(byId[id]));}
 catch{return res.status(200).json({region:id,status:"SOURCE_UNAVAILABLE",shift_days:null,
  calibration_applied:false,cameras:[],confidence:"none",note:"PhenoCam evidence unavailable; do not alter foliage timing."});}
};
