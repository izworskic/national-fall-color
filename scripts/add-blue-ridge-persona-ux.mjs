import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "public/national-tools/fall-color/blue-ridge-parkway/index.html");
let html = fs.readFileSync(pagePath, "utf8");

html = html.replace(/<div class="persona-planner" data-persona-planner="true">[\s\S]*?<\/div>\s*<div id="decision-scope-label"/i, '<div id="decision-scope-label"');
html = html.replace(/<script data-blue-ridge-persona-script>[\s\S]*?<\/script>\s*/i, "");
html = html.replace(/\.persona-planner\{[\s\S]*?\/\* end blue-ridge-persona-css \*\//i, "");

html = html.replace(
  '<p class="lede">Where is the best fall-color bet now, what elevation band is next, and which part of the Parkway is worth the drive over the next seven days?</p>',
  '<p class="lede">Choose the part of the Parkway you can actually reach. We’ll tell you whether a foliage drive is worth it, the strongest stretch to try, what current cameras show, and what may improve over the next week.</p>',
);
html = html.replace(
  '<p class="truthline"><span class="live"><span class="dot" aria-hidden="true"></span>2026 corridor model</span> · The Parkway is too long and too vertically varied for one honest “peak date.” This tool compares representative mileposts instead.</p>',
  '<p class="truthline"><span class="live"><span class="dot" aria-hidden="true"></span>Updated for the 2026 season</span> · There is no single honest Parkway peak date. Higher elevations usually turn first, then color tends to work downslope.</p>',
);

const planner = `<div class="persona-planner" data-persona-planner="true">
  <div class="persona-kicker">Make this useful for your trip</div>
  <h2>Where will you be driving?</h2>
  <p class="persona-intro">A great stretch near Asheville is not useful if you are staying in Virginia. Pick the part of the Parkway you can realistically reach, then choose when you are going.</p>
  <div class="persona-row" role="group" aria-label="Parkway area">
    <span class="persona-label">Parkway area</span>
    <div class="persona-buttons">
      <button type="button" data-focus="all" aria-pressed="true">Entire Parkway</button>
      <button type="button" data-focus="virginia" aria-pressed="false">Virginia</button>
      <button type="button" data-focus="high-country" aria-pressed="false">Boone / Blowing Rock</button>
      <button type="button" data-focus="asheville" aria-pressed="false">Asheville</button>
      <button type="button" data-focus="south" aria-pressed="false">Waynesville / Cherokee</button>
    </div>
  </div>
  <div class="persona-row" role="group" aria-label="Trip timing">
    <span class="persona-label">When</span>
    <div class="persona-buttons persona-buttons-time">
      <button type="button" data-horizon="0" aria-pressed="true">Today</button>
      <button type="button" data-horizon="7" aria-pressed="false">7 days from now</button>
    </div>
  </div>
</div>`;

const decisionAnchor = '<div class="decision-label">Best modeled corridor now</div>';
if (!html.includes(decisionAnchor)) throw new Error("Blue Ridge decision label anchor missing for persona UX");
html = html.replace(decisionAnchor, `${planner}\n<div id="decision-scope-label" class="decision-label">Best drive across the entire Parkway today</div>`);

html = html.replace('<span>historical window</span>', '<span>usual color window</span>');
html = html.replace('<span>elevation band</span>', '<span>elevation</span>');
html = html.replace('<span>evidence coverage</span>', '<span>data depth</span>');
html = html.replace('<span>road context</span>', '<span>road check</span>');
html = html.replace('<div class="why"><h2>Why this is the current pick</h2>', '<div class="why"><h2>Why this drive</h2>');
html = html.replace(
  '<div class="decision-actions" data-decision-actions="true">',
  '<div class="decision-actions" data-decision-actions="true"><a class="button-link secondary camera-jump" href="#live-cameras">See live cameras</a>',
);

html = html.replace('<section class="section visual-verification" data-visual-verification="true">', '<section id="live-cameras" class="section visual-verification" data-visual-verification="true">');
html = html.replace('<div class="eyebrow">Current-season visual verification</div>', '<div class="eyebrow">Live visual check</div>');
html = html.replace('<h2>What do the cameras say now?</h2>', '<h2>See what the leaves look like before you drive</h2>');
html = html.replace(
  '<p class="section-intro">The timing model tells us where color should be moving. This layer checks current visual evidence without pretending every webcam can be scraped or every image means the same thing. PhenoCam greenness is machine-analyzed; other corridor cameras stay link-only unless their use terms allow more.</p>',
  '<p class="section-intro">Use the camera check as your last look before a long drive. We analyze one research camera where the data permit it and link directly to nearby Parkway-area cameras for everything else.</p>',
);
html = html.replace('<div class="visual-kicker">Automated camera evidence</div>', '<div class="visual-kicker">Research camera near this drive</div>');
html = html.replace('<span>green loss vs summer</span>', '<span>change from summer green</span>');
html = html.replace('<span>7-day GCC change</span>', '<span>7-day canopy trend</span>');
html = html.replace('<span>latest camera data</span>', '<span>last camera update</span>');
html = html.replace('<span>from current pick</span>', '<span>distance from this drive</span>');
html = html.replace(
  '<p class="visual-fine">GCC is a fixed-camera canopy-greenness measure, not a percent-peak score. Lighting and view composition can matter.</p>',
  '<details class="technical-inline"><summary>What is this camera signal?</summary><p class="visual-fine">The research camera tracks canopy greenness (GCC) against its own summer baseline. It is a trend signal, not a percent-peak score, and lighting or view composition can affect it.</p></details>',
);
html = html.replace(/<article class="panel satellite-panel">([\s\S]*?)<\/article>/i, '<details class="technical-details"><summary>Satellite coverage and technical cross-check</summary><div class="panel satellite-panel">$1</div></details>');

html = html.replace('<h2>What changes over the next 7 days?</h2>', '<h2>If you can wait a week</h2>');
html = html.replace(
  '<p class="section-intro">Fall color usually works downslope, but geography, species and weather can change the simple rule. The model recalculates the historical match for the same corridor one week ahead.</p>',
  '<p class="section-intro">The best stretch can move quickly in October. Compare today with one week from now for the Parkway area you selected above.</p>',
);
html = html.replace('<div class="panel"><div class="eyebrow">Best modeled bet today</div>', '<div class="panel"><div class="eyebrow">Best drive today</div>');
html = html.replace('<div class="panel"><div class="eyebrow">Best modeled bet +7 days</div>', '<div class="panel"><div class="eyebrow">Best drive in 7 days</div>');
html = html.replace('<h2>The Parkway, north to south</h2>', '<h2>Compare the whole Parkway</h2>');
html = html.replace(
  '<p class="section-intro">These anchors are not separate doorway pages. They are sampling points in one corridor model, chosen to capture meaningful changes in latitude, milepost and elevation.</p>',
  '<p class="section-intro">Use this when you are flexible enough to chase color. The sampling points show how timing changes with latitude and elevation from Virginia to the southern Blue Ridge.</p>',
);
html = html.replace('<h2>Current evidence for the selected corridor</h2>', '<h2>More evidence behind the Parkway-wide model</h2>');
html = html.replace(
  '<p class="section-intro">These signals stay separate on purpose. A monitored plant turning color, a dry U.S. Drought Monitor category, or a cold forecast can inform a trip without pretending to be a measured landscape-wide “percent peak.”</p>',
  '<p class="section-intro">Weather, drought and plant observations help explain why this year may look different from the historical timing. They stay separate from the simple trip call above.</p>',
);
html = html.replace('<h2>How the decision is built</h2>', '<h2>How this works, if you want the details</h2>');

html = html.replace('window.addEventListener("blue-ridge-decision-ready",event=>load(event.detail),{once:true});', 'window.addEventListener("blue-ridge-decision-ready",event=>load(event.detail));');

const css = `.persona-planner{margin:-2px 0 18px;padding:17px;border:1px solid #d8d2c6;background:#f8f6f0;border-radius:6px}.persona-kicker{font:700 10.5px/1.2 Arial,sans-serif;letter-spacing:.075em;text-transform:uppercase;color:var(--brown)}.persona-planner h2{font-size:22px;margin:4px 0 5px}.persona-intro{font-size:14px;color:#625f58;margin:0 0 14px;max-width:760px}.persona-row{display:grid;grid-template-columns:104px 1fr;gap:10px;align-items:start;padding:9px 0;border-top:1px solid #e5dfd3}.persona-label{font:700 11px/1.3 Arial,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#736e65;padding-top:9px}.persona-buttons{display:flex;gap:7px;flex-wrap:wrap}.persona-buttons button{appearance:none;border:1px solid #c8c1b5;background:#fff;color:#34332f;border-radius:999px;padding:8px 11px;font:700 12px/1.2 Arial,sans-serif;cursor:pointer}.persona-buttons button:hover{border-color:#789071}.persona-buttons button[aria-pressed="true"]{background:var(--green);border-color:var(--green);color:#fff}.decision-label{margin-top:4px}.camera-jump{margin-top:7px}.technical-inline{margin-top:9px}.technical-inline summary,.technical-details summary{cursor:pointer;color:var(--green2);font:700 12px/1.4 Arial,sans-serif}.technical-details{grid-column:2;margin:0}.technical-details>.panel{margin-top:8px}.visual-grid{align-items:start}.persona-scope-note{margin:5px 0 0;font:12px/1.45 Arial,sans-serif;color:#77736d}.why p{max-width:850px}.decision-read{font-size:15px}.decision-place{line-height:1.1}@media(max-width:760px){.persona-row{grid-template-columns:1fr;gap:5px}.persona-label{padding-top:0}.persona-buttons{display:grid;grid-template-columns:1fr 1fr}.persona-buttons-time{display:flex}.technical-details{grid-column:1}}@media(max-width:430px){.persona-buttons{grid-template-columns:1fr}.persona-buttons-time{display:grid;grid-template-columns:1fr 1fr}.persona-buttons button{width:100%;text-align:left}.persona-buttons-time button{text-align:center}}/* end blue-ridge-persona-css */`;
if (!html.includes(".persona-planner{")) html = html.replace("</style>", `${css}\n</style>`);

const script = `<script data-blue-ridge-persona-script>
(function(){
 const $=id=>document.getElementById(id);
 const groups={
   all:null,
   virginia:["humpback-rocks","peaks-of-otter","mabry-mill"],
   "high-country":["doughton-park","linville-falls"],
   asheville:["craggy-gardens","mount-pisgah"],
   south:["mount-pisgah","waterrock-knob"]
 };
 const labels={all:"the entire Parkway",virginia:"Virginia","high-country":"Boone / Blowing Rock",asheville:"Asheville",south:"Waynesville / Cherokee"};
 let data=null;
 let focus="all";
 let horizon=0;
 try{const saved=localStorage.getItem("blue-ridge-focus");if(saved&&Object.prototype.hasOwnProperty.call(groups,saved))focus=saved}catch{}
 function fmtDate(value){if(!value)return "—";return new Date(value+"T12:00:00Z").toLocaleDateString([],{month:"short",day:"numeric"})}
 function stageFor(diff){if(diff<-21)return "well before the usual transition";if(diff<-8)return "approaching the usual transition";if(diff<=7)return "inside the usual transition window";if(diff<=18)return "late in the usual transition window";return "typically past the main transition"}
 function scoreFor(station,offset){const base=Number(station?.timing?.days_from_midpoint);if(!Number.isFinite(base))return -9999;const diff=base+offset;const raw=Number(station?.timing?.variability_mad_days);const spread=Number.isFinite(raw)?Math.max(6,Math.min(21,raw)):12;let score=Math.max(0,100-Math.abs(diff)*4);if(Math.abs(diff)<=spread)score=Math.min(100,score+8);if(station?.road?.possible_closure)score-=1000;return score}
 function scoped(){const all=Array.isArray(data?.corridor)?data.corridor:[];const ids=groups[focus];return ids?all.filter(x=>ids.includes(x.id)):all}
 function pick(offset){return scoped().slice().sort((a,b)=>scoreFor(b,offset)-scoreFor(a,offset))[0]||null}
 function drive(best){const all=(data?.corridor||[]).slice().sort((a,b)=>Number(a.milepost)-Number(b.milepost));const i=all.findIndex(x=>x.id===best?.id);if(i<0)return null;const mp=Number(all[i].milepost),prev=i>0?Number(all[i-1].milepost):null,next=i<all.length-1?Number(all[i+1].milepost):null;return{start:Math.round(Math.max(0,Number.isFinite(prev)?(prev+mp)/2:mp-25)),end:Math.round(Math.min(469,Number.isFinite(next)?(mp+next)/2:mp+25))}}
 function verdict(best,offset){const base=Number(best?.timing?.days_from_midpoint);const diff=base+offset;const when=offset?"seven days from now":"today";if(best?.road?.possible_closure)return{level:"blocked",label:"ROAD ISSUE",headline:"Check NPS access before choosing this stretch",detail:"A possible NPS closure overlaps this sampling point. Pick another stretch or confirm the official road status before leaving."};if(!Number.isFinite(diff))return{level:"watch",label:"CHECK",headline:"Not enough timing data for a strong call",detail:"Use the live cameras and official road status before making a foliage-specific drive."};if(diff<-21)return{level:"early",label:"WAIT",headline:"Too early for a foliage-only trip",detail:best.name+" is the strongest option near "+labels[focus]+", but "+when+" it is still about "+Math.abs(Math.round(diff))+" days before its usual mid-transition."};if(diff<-8)return{level:"watch",label:"WATCH",headline:"Color season is getting closer",detail:best.name+" is the best timing match near "+labels[focus]+" "+when+", but it is still about "+Math.abs(Math.round(diff))+" days before its usual midpoint."};if(diff<=7)return{level:"go",label:"GO",headline:"This is a strong historical color window",detail:best.name+" is inside its usual transition window "+when+" and is the strongest timing match among the Parkway points in this area."};if(diff<=18)return{level:"soon",label:"GO SOON",headline:"Still worth a look, but do not wait too long",detail:best.name+" is on the late side of its usual transition window "+when+". Wind and leaf drop matter more now."};return{level:"late",label:"LATE",headline:"The best remaining option is past its usual prime window",detail:best.name+" is still the strongest timing match near "+labels[focus]+", but lower elevations may offer better remaining color."}}
 function timingText(best,offset){const base=Number(best?.timing?.days_from_midpoint);if(!Number.isFinite(base))return "Historical timing is limited for this point.";const diff=base+offset;if(Math.abs(diff)<=2)return "This date is very close to the location’s usual mid-transition.";return diff<0?"This date is about "+Math.abs(Math.round(diff))+" days before the location’s usual mid-transition.":"This date is about "+Math.round(diff)+" days after the location’s usual mid-transition."}
 function depth(best,offset){const original=offset?data?.decision?.best_next_7d:data?.decision?.best_now;return original?.id===best?.id?"Live + historical":"Timing + road"}
 function setPressed(){document.querySelectorAll("[data-focus]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.focus===focus)));document.querySelectorAll("[data-horizon]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.horizon)===horizon)))}
 function nextDetail(best,offset){if(!best)return "—";const diff=Number(best?.timing?.days_from_midpoint)+offset;return "MP "+best.milepost+" · "+Number(best.elevation_ft||0).toLocaleString()+" ft · "+stageFor(diff)}
 function render(){if(!data)return;const best=pick(horizon),today=pick(0),week=pick(7);if(!best)return;setPressed();const call=verdict(best,horizon);$("decision-scope-label").textContent="Best drive near "+labels[focus]+(horizon?" in 7 days":" today");$("trip-verdict").className="trip-verdict "+call.level;$("trip-verdict-label").textContent=call.label;$("trip-verdict-headline").textContent=call.headline;$("best-name").classList.remove("skeleton");$("best-name").textContent=best.name+" · MP "+best.milepost;$("best-read").textContent=call.detail;$("best-window").textContent=best.historical_window?fmtDate(best.historical_window.start)+"–"+fmtDate(best.historical_window.end):"—";$("best-elevation").textContent=Number(best.elevation_ft||0).toLocaleString()+" ft";$("best-confidence").textContent=depth(best,horizon);$("best-road").textContent=best.road?.possible_closure?"Possible closure":"Verify NPS";const seg=drive(best);$("drive-segment").textContent=seg?"Try this stretch: roughly MP "+seg.start+"–"+seg.end+", centered on "+best.name+". Drive some elevation rather than betting on one overlook.":"Use "+best.name+" as the center of the drive and vary elevation around it.";$("why-timing").textContent=timingText(best,horizon);$("why-current").textContent="Use the live cameras below as the final visual check near this stretch before a long drive.";$("why-quality").textContent="Mountain weather and road access can change quickly. The road signal here only flags clearly parsed NPS closures, so verify the official road page before leaving.";$("now-next-name").textContent=today?.name||"—";$("now-next-detail").textContent=nextDetail(today,0);$("seven-name").textContent=week?.name||"—";$("seven-detail").textContent=nextDetail(week,7);if(today&&week){const delta=Number(week.elevation_ft)-Number(today.elevation_ft);$("elevation-story").textContent=Math.abs(delta)<500?"The strongest timing match stays in a similar elevation band for this part of the Parkway.":delta<0?"The strongest timing match shifts downslope by about "+Math.abs(Math.round(delta)).toLocaleString()+" ft over the next week.":"The strongest timing match moves to a different corridor about "+Math.abs(Math.round(delta)).toLocaleString()+" ft higher."}const derived={...data,__personaDerived:true,decision:{...data.decision,best_now:best}};window.__blueRidgeDecision=derived;window.dispatchEvent(new CustomEvent("blue-ridge-decision-ready",{detail:derived}))}
 function bind(){document.querySelectorAll("[data-focus]").forEach(b=>b.addEventListener("click",()=>{focus=b.dataset.focus;try{localStorage.setItem("blue-ridge-focus",focus)}catch{}render()}));document.querySelectorAll("[data-horizon]").forEach(b=>b.addEventListener("click",()=>{horizon=Number(b.dataset.horizon)||0;render()}));setPressed()}
 window.addEventListener("blue-ridge-decision-ready",event=>{if(event.detail?.__personaDerived)return;data=event.detail;setTimeout(render,0)});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
 if(window.__blueRidgeDecision&&!window.__blueRidgeDecision.__personaDerived){data=window.__blueRidgeDecision;setTimeout(render,0)}
}());
</script>`;
html = html.replace("</body>", `${script}\n</body>`);

fs.writeFileSync(pagePath, html);

const built = fs.readFileSync(pagePath, "utf8");
for (const required of [
  'data-persona-planner="true"',
  'data-focus="asheville"',
  'data-focus="high-country"',
  'data-horizon="7"',
  'id="live-cameras"',
  'See what the leaves look like before you drive',
  'Try this stretch:',
  'data-blue-ridge-persona-script',
  'How this works, if you want the details',
]) {
  if (!built.includes(required)) throw new Error(`Blue Ridge persona UX missing: ${required}`);
}
if (built.includes('window.addEventListener("blue-ridge-decision-ready",event=>load(event.detail),{once:true})')) throw new Error("Blue Ridge visual listener still one-shot");
console.log("Wired Blue Ridge persona-first trip planner UX.");
