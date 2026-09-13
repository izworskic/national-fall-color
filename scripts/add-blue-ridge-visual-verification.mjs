import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "public/national-tools/fall-color/blue-ridge-parkway/index.html");
const visualEndpoint = "https://national-fall-color.vercel.app/api/blue-ridge-visual-verification";

let html = fs.readFileSync(pagePath, "utf8");
html = html.replace(/<section class="section visual-verification"[\s\S]*?<\/section>\s*/i, "");
html = html.replace(/<script data-blue-ridge-visual-script>[\s\S]*?<\/script>\s*/i, "");

html = html.replace(
  '<meta name="description" content="See whether Blue Ridge Parkway fall color is worth the trip yet, the strongest corridor now, the next elevation band, 7-day outlook, weather stress and NPS road context.">',
  '<meta name="description" content="See whether Blue Ridge Parkway fall color is worth the trip yet, the strongest drive now, live camera phenology evidence, 7-day outlook, weather stress and NPS road context.">',
);

const visualSection = `<section class="section visual-verification" data-visual-verification="true"><div class="wrap">
<div class="eyebrow">Current-season visual verification</div>
<h2>What do the cameras say now?</h2>
<p class="section-intro">The timing model tells us where color should be moving. This layer checks current visual evidence without pretending every webcam can be scraped or every image means the same thing. PhenoCam greenness is machine-analyzed; other corridor cameras stay link-only unless their use terms allow more.</p>
<div class="visual-grid">
<article class="panel visual-primary">
<div class="visual-kicker">Automated camera evidence</div>
<h3 id="visual-camera-name">Checking PhenoCam…</h3>
<div id="visual-stage" class="visual-stage loading">Loading current canopy signal</div>
<div class="visual-metrics">
<div><strong id="visual-loss">—</strong><span>green loss vs summer</span></div>
<div><strong id="visual-trend">—</strong><span>7-day GCC change</span></div>
<div><strong id="visual-date">—</strong><span>latest camera data</span></div>
<div><strong id="visual-distance">—</strong><span>from current pick</span></div>
</div>
<p id="visual-reconcile" class="visual-reconcile">Waiting for the current corridor recommendation.</p>
<p class="visual-fine">GCC is a fixed-camera canopy-greenness measure, not a percent-peak score. Lighting and view composition can matter.</p>
</article>
<article class="panel satellite-panel">
<div class="visual-kicker">Satellite cross-check</div>
<h3 id="satellite-head">Checking latest Sentinel-2 pass…</h3>
<p id="satellite-detail">Looking for a recent low-to-moderate-cloud acquisition near the current modeled drive.</p>
<p class="visual-fine">For now this is acquisition/freshness metadata only. Satellite pixels do not change the foliage recommendation until spectral processing is calibrated against camera evidence.</p>
</article>
</div>
<div class="camera-strip-head"><div><h3>Nearby live views</h3><p>Open the nearest corridor cameras yourself before a long drive. We link to the source rather than republishing third-party feeds.</p></div><a href="https://www.blueridgeparkway.org/plan-your-parkway-trip/stories-guides/fall-color-on-the-parkway/" target="_blank" rel="noopener">Parkway camera guide ↗</a></div>
<div id="visual-camera-links" class="visual-camera-links"><div class="camera-link skeleton">Loading nearby camera links…</div></div>
<div id="visual-updated" class="updated"></div>
</div></section>`;

const nextSection = '<section class="section"><div class="wrap">\n<h2>What changes over the next 7 days?</h2>';
if (!html.includes(nextSection)) throw new Error("Blue Ridge next-week section anchor missing");
html = html.replace(nextSection, `${visualSection}\n\n${nextSection}`);

const css = `.visual-verification{background:#f5f3ed}.visual-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:14px;margin-top:16px}.visual-primary{border-left:4px solid var(--green)}.visual-kicker{font:700 10.5px/1.2 Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--brown);margin-bottom:5px}.visual-stage{display:inline-block;margin:4px 0 12px;padding:6px 9px;border:1px solid #c9d8c5;background:#f1f6ef;color:var(--green2);border-radius:3px;font:700 12px/1.2 Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em}.visual-stage.loading{border-color:#ded8cd;background:#faf9f6;color:#77736d}.visual-stage.warn{border-color:#dacaa8;background:#faf6ea;color:#7a5520}.visual-stage.late{border-color:#d6c3b8;background:#f8f2ee;color:#74463d}.visual-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:6px 0 12px}.visual-metrics>div{border-top:1px solid #e5dfd4;padding-top:8px}.visual-metrics strong{display:block;font-size:16px;font-weight:400}.visual-metrics span{display:block;margin-top:2px;font:10px/1.3 Arial,sans-serif;text-transform:uppercase;letter-spacing:.03em;color:#7b776f}.visual-reconcile{font-size:14px;margin:10px 0 4px}.visual-fine{font:11.5px/1.45 Arial,sans-serif;color:#7b776f;margin:10px 0 0}.camera-strip-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin:24px 0 10px}.camera-strip-head h3{margin:0}.camera-strip-head p{margin:4px 0 0;color:var(--muted);font-size:13px}.camera-strip-head>a{white-space:nowrap;font:700 11px/1.3 Arial,sans-serif}.visual-camera-links{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.camera-link{display:block;border:1px solid var(--line);background:#fff;border-radius:4px;padding:11px;text-decoration:none;color:var(--ink)}.camera-link:hover{border-color:#9caf98}.camera-link strong{display:block;font-size:15px;font-weight:400}.camera-link small{display:block;margin-top:3px;font:11px/1.4 Arial,sans-serif;color:#77736d}.camera-link .camera-distance{color:var(--green);font-weight:700}.satellite-panel h3{font-size:18px}.satellite-panel p{font-size:13px;color:#605d56}.visual-source-note{margin-top:12px;padding:10px 12px;border-left:3px solid #c9c1b1;background:#fbfaf7;font-size:12px;color:#6d6961}@media(max-width:760px){.visual-grid{grid-template-columns:1fr}.visual-camera-links{grid-template-columns:1fr 1fr}.visual-metrics{grid-template-columns:1fr 1fr}.camera-strip-head{display:block}.camera-strip-head>a{display:inline-block;margin-top:7px}}@media(max-width:430px){.visual-camera-links{grid-template-columns:1fr}}`;
if (!html.includes(".visual-verification{")) html = html.replace("</style>", `${css}\n</style>`);

if (!html.includes("window.__blueRidgeDecision=data")) {
  const marker = " function render(data){";
  if (!html.includes(marker)) throw new Error("Blue Ridge render function anchor missing");
  html = html.replace(marker, `${marker}\n  window.__blueRidgeDecision=data;\n  window.dispatchEvent(new CustomEvent("blue-ridge-decision-ready",{detail:data}));`);
}

const visualScript = `<script data-blue-ridge-visual-script>
(function(){
 const endpoint=${JSON.stringify(visualEndpoint)};
 const $=id=>document.getElementById(id);
 const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","'":"&#39;"}[c]||c));
 const pct=value=>Number.isFinite(Number(value))?(Number(value)>0?"+":"")+Number(value).toFixed(1)+"%":"—";
 const day=value=>value?new Date(value+"T12:00:00Z").toLocaleDateString([],{month:"short",day:"numeric"}):"Unavailable";
 function relation(best,visual){
   const evidence=visual?.automated_camera;
   const signal=evidence?.signal;
   if(!evidence?.available||!signal?.available)return "Automated camera evidence is unavailable, so it does not change the timing recommendation.";
   const camMp=Number(evidence.camera?.milepost),bestMp=Number(best?.milepost),d=Number(best?.timing?.days_from_midpoint);
   const distance=Number.isFinite(camMp)&&Number.isFinite(bestMp)?Math.abs(camMp-bestMp):null;
   if(distance!=null&&distance>60)return "The machine-analyzed PhenoCam is about "+Math.round(distance)+" Parkway mileposts from the current pick. Treat it as regional context, not evidence that overrides this drive.";
   const stage=String(signal.stage||"");
   const visuallyEarly=/summer-like|early transition/i.test(stage);
   const visuallyActive=/transition underway|advanced transition|late transition/i.test(stage);
   if(visuallyEarly&&Number.isFinite(d)&&d>=-8)return "Camera greenness near this part of the Parkway is running greener than historical timing alone would suggest. That is a reason to temper the GO signal, not to invent a new peak date.";
   if(visuallyActive&&Number.isFinite(d)&&d<-8)return "Camera greenness suggests autumn transition is arriving earlier near this part of the Parkway than historical timing alone would imply.";
   return "Camera greenness and historical timing are broadly compatible near this part of the Parkway. The camera remains supporting evidence, not a percent-peak measurement.";
 }
 function stageClass(stage){
   if(/late|leaf-off/i.test(stage||""))return "visual-stage late";
   if(/early|summer/i.test(stage||""))return "visual-stage warn";
   return "visual-stage";
 }
 function cameraCard(cam){
   const distance=cam.distance_mileposts==null?"Corridor view":esc(cam.distance_mileposts)+" mileposts from pick";
   const mode=cam.machine_analysis==="phenocam-gcc"?"Derived GCC analyzed here; image stays at source":"Open source camera/view";
   return '<a class="camera-link" href="'+esc(cam.url)+'" target="_blank" rel="noopener"><strong>'+esc(cam.name)+'</strong><small>MP '+esc(cam.milepost)+' · '+esc(cam.source)+'</small><small class="camera-distance">'+distance+'</small><small>'+mode+' ↗</small></a>';
 }
 function render(visual,data){
   const best=data?.decision?.best_now;
   const evidence=visual?.automated_camera;
   const signal=evidence?.signal;
   if(evidence?.camera)$("visual-camera-name").textContent=evidence.camera.name+" · MP "+evidence.camera.milepost;
   if(evidence?.available&&signal?.available){
     $("visual-stage").className=stageClass(signal.stage);
     $("visual-stage").textContent=signal.stage+" · "+signal.direction;
     $("visual-loss").textContent=pct(signal.green_loss_percent);
     $("visual-trend").textContent=pct(signal.trend_7d_percent);
     $("visual-date").textContent=day(signal.latest_date)+(signal.fresh?" · fresh":" · aging");
     const dist=Math.abs(Number(best?.milepost)-Number(evidence.camera?.milepost));
     $("visual-distance").textContent=Number.isFinite(dist)?Math.round(dist)+" MP":"—";
   }else{
     $("visual-stage").className="visual-stage loading";
     $("visual-stage").textContent="AUTOMATED CAMERA DATA UNAVAILABLE";
     $("visual-loss").textContent="—";$("visual-trend").textContent="—";$("visual-date").textContent="—";$("visual-distance").textContent="—";
   }
   $("visual-reconcile").textContent=relation(best,visual);
   const sat=visual?.satellite;
   if(sat?.available&&sat?.scene_found){
     $("satellite-head").textContent="Recent Sentinel-2 scene found";
     const acquired=sat.acquired_at?new Date(sat.acquired_at).toLocaleDateString([],{month:"short",day:"numeric"}):"date unavailable";
     const cloud=Number.isFinite(Number(sat.cloud_cover_percent))?" · "+Math.round(Number(sat.cloud_cover_percent))+"% scene cloud":"";
     $("satellite-detail").textContent=acquired+cloud+". This confirms recent satellite coverage near the current drive, but spectral foliage analysis is not enabled yet.";
   }else if(sat?.available){
     $("satellite-head").textContent="No recent usable Sentinel-2 scene found";
     $("satellite-detail").textContent=sat.interpretation||"Clouds or catalog timing may be limiting the latest satellite cross-check.";
   }else{
     $("satellite-head").textContent="Satellite catalog temporarily unavailable";
     $("satellite-detail").textContent="The fall-color recommendation continues without substituting a satellite claim.";
   }
   const cameras=Array.isArray(visual?.nearby_cameras)?visual.nearby_cameras:[];
   $("visual-camera-links").innerHTML=cameras.map(cameraCard).join("")||'<div class="camera-link">No camera links available.</div>';
   $("visual-updated").textContent="Visual evidence retrieved "+new Date(visual.retrieved_at).toLocaleString()+" · "+(visual.camera_registry?.machine_analyzable||0)+" machine-analyzable camera source · "+(visual.camera_registry?.total||0)+" corridor camera links registered.";
 }
 async function load(data){
   const best=data?.decision?.best_now;
   if(!best)return;
   const params=new URLSearchParams({lat:String(best.latitude),lon:String(best.longitude),milepost:String(best.milepost)});
   try{
     const response=await fetch(endpoint+"?"+params.toString(),{headers:{accept:"application/json"}});
     if(!response.ok)throw new Error("visual verification returned "+response.status);
     render(await response.json(),data);
   }catch(error){
     $("visual-stage").className="visual-stage loading";
     $("visual-stage").textContent="VISUAL LAYER TEMPORARILY UNAVAILABLE";
     $("visual-reconcile").textContent="The core timing model is still available. No camera or satellite conclusion is substituted while visual verification is unavailable.";
     $("satellite-head").textContent="Visual verification unavailable";
     $("satellite-detail").textContent=String(error?.message||error);
   }
 }
 window.addEventListener("blue-ridge-decision-ready",event=>load(event.detail),{once:true});
 if(window.__blueRidgeDecision)load(window.__blueRidgeDecision);
}());
</script>`;
if (!html.includes("data-blue-ridge-visual-script")) html = html.replace("</body>", `${visualScript}\n</body>`);

fs.writeFileSync(pagePath, html);
const built = fs.readFileSync(pagePath, "utf8");
if (!built.includes('data-visual-verification="true"')) throw new Error("Blue Ridge visual-verification section missing");
if (!built.includes("blue-ridge-visual-verification")) throw new Error("Blue Ridge visual API contract missing");
if (!built.includes("live camera phenology evidence")) throw new Error("Blue Ridge visual search snippet missing");
if (!built.includes("machine-analyzed PhenoCam")) throw new Error("Blue Ridge camera rights/truth boundary missing");
console.log("Wired Blue Ridge current-season visual verification layer.");
