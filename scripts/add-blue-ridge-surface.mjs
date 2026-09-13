import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const parentPath = path.join(root, "public/national-tools/fall-color/index.html");
const blueRidgePath = path.join(root, "public/national-tools/fall-color/blue-ridge-parkway/index.html");
const apiPath = path.join(root, "api/blue-ridge-fall-color.js");
const sitemapPath = path.join(root, "public/national-tools/fall-color/sitemap-locations.xml");
const route = "/national-tools/fall-color/blue-ridge-parkway/";
const canonical = `https://chrisizworski.com${route}`;
const apiEndpoint = "https://national-fall-color.vercel.app/api/blue-ridge-fall-color";
const npsRoadUrl = "https://www.nps.gov/blri/planyourvisit/roadclosures.htm";
const npsColorUrl = "https://www.nps.gov/blri/learn/nature/fall-colors.htm";

function replaceIfPresent(text, from, to) {
  return text.includes(from) ? text.replace(from, to) : text;
}

let html = fs.readFileSync(parentPath, "utf8");
html = html.replace(/<section[^>]*data-blue-ridge-feature[\s\S]*?<\/section>/i, "");
const feature = `<section class="section" data-blue-ridge-feature><div class="wrap"><div class="handoff"><div class="eyebrow">Regional decision engine</div><h2>Driving the Blue Ridge Parkway?</h2><p>The Parkway's elevation changes make one regional peak date misleading. The <a href="${route}">Blue Ridge Parkway Fall Color Live</a> corridor tells you whether a foliage trip is worth chasing yet, then compares representative mileposts for the strongest modeled bet now and seven days ahead. Weather, drought, plant observations and NPS road context stay separate.</p></div></div></section>`;
if (!html.includes("</main>")) throw new Error("Fall-color parent main element not found");
html = html.replace("</main>", `${feature}</main>`);
fs.writeFileSync(parentPath, html);

let blueRidge = fs.readFileSync(blueRidgePath, "utf8");
blueRidge = blueRidge.replace(/fetch\((['"])\/api\/blue-ridge-fall-color\1\)/g, `fetch("${apiEndpoint}")`);
if (!blueRidge.includes(apiEndpoint)) throw new Error("Blue Ridge explicit API contract was not installed");

blueRidge = replaceIfPresent(
  blueRidge,
  "<title>Blue Ridge Parkway Fall Colors 2026: Best Color Now | Chris Izworski</title>",
  "<title>Blue Ridge Parkway Fall Colors 2026: Best Drive Now | Chris Izworski</title>",
);
blueRidge = replaceIfPresent(
  blueRidge,
  '<meta name="description" content="See where fall color is the best bet now along the Blue Ridge Parkway, which elevation band is next, and the best 7-day corridor using phenology, weather, drought and current observations.">',
  '<meta name="description" content="See whether Blue Ridge Parkway fall color is worth the trip yet, the strongest corridor now, the next elevation band, 7-day outlook, weather stress and NPS road context.">',
);
blueRidge = replaceIfPresent(
  blueRidge,
  '<meta property="og:title" content="Blue Ridge Parkway Fall Colors 2026: Best Color Now">',
  '<meta property="og:title" content="Blue Ridge Parkway Fall Colors 2026: Best Drive Now">',
);

if (!blueRidge.includes('id="trip-verdict"')) {
  const label = '<div class="decision-label">Best modeled corridor now</div>';
  const verdict = `${label}\n<div id="trip-verdict" class="trip-verdict watch"><span id="trip-verdict-label">CHECKING</span><strong id="trip-verdict-headline">Is a foliage-specific drive worth it yet?</strong></div>`;
  if (!blueRidge.includes(label)) throw new Error("Blue Ridge decision label anchor missing");
  blueRidge = blueRidge.replace(label, verdict);
}

if (!blueRidge.includes('data-decision-actions="true"')) {
  const updated = '<div id="updated" class="updated"></div>';
  const actions = `${updated}\n<div class="decision-actions" data-decision-actions="true"><a class="button-link" href="${npsRoadUrl}" target="_blank" rel="noopener">Check official Parkway road status</a><a class="button-link secondary" href="${npsColorUrl}" target="_blank" rel="noopener">NPS fall-color guidance</a></div>`;
  if (!blueRidge.includes(updated)) throw new Error("Blue Ridge update anchor missing");
  blueRidge = blueRidge.replace(updated, actions);
}

if (!blueRidge.includes(".trip-verdict{")) {
  const css = `.trip-verdict{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:9px 0 13px;padding:10px 12px;border:1px solid #d8d2c6;border-radius:4px;background:#faf9f6}.trip-verdict span{font:700 10.5px/1 Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;padding:5px 7px;border-radius:3px;background:#ece8df;color:#5d574d}.trip-verdict strong{font-size:17px;font-weight:400}.trip-verdict.go{background:#eef5ec;border-color:#b9cfb6}.trip-verdict.go span{background:#2c5f2d;color:#fff}.trip-verdict.soon{background:#f7f3e8;border-color:#d8c79d}.trip-verdict.soon span{background:#8a6022;color:#fff}.trip-verdict.early,.trip-verdict.late{background:#f7f4ee}.trip-verdict.early span,.trip-verdict.late span{background:#6f6b62;color:#fff}.trip-verdict.blocked{background:#fbf1ef;border-color:#dbbbb5}.trip-verdict.blocked span{background:#8b3a31;color:#fff}.decision-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}.button-link.secondary{background:#fff;color:var(--green)}.button-link.secondary:hover{background:#f1f6ef}.decision-note{font-size:13px;color:#6b675f;margin:10px 0 0}`;
  blueRidge = blueRidge.replace("</style>", `${css}\n</style>`);
}

if (!blueRidge.includes("function tripVerdict(best)")) {
  const marker = " function render(data){";
  const helper = ` function tripVerdict(best){
  const d=Number(best?.timing?.days_from_midpoint);
  const stage=best?.timing?.stage||"historical timing available";
  const place=best?.name||"the best sampled anchor";
  const corridor=best?.corridor||"Blue Ridge Parkway";
  if(best?.road?.possible_closure)return{level:"blocked",label:"ROAD ISSUE",headline:"Do not route here until NPS confirms access",detail:place+" is the strongest timing match, but a possible NPS closure overlaps this anchor. Treat road access as the deciding factor before a foliage trip."};
  if(!Number.isFinite(d))return{level:"watch",label:"WATCH",headline:"Timing confidence is limited",detail:corridor+": "+stage+". This is the strongest sampled match, not proof of peak color."};
  if(d < -21)return{level:"early",label:"TOO EARLY",headline:"Do not make a foliage-only trip yet",detail:place+" is the best sampled anchor today, but it is still "+Math.abs(Math.round(d))+" days before its historical mid-transition. If you are already on the Parkway, this is the best direction to try; otherwise wait."};
  if(d < -8)return{level:"watch",label:"WATCH",headline:"The season is approaching",detail:place+" is the strongest sampled bet, about "+Math.abs(Math.round(d))+" days before its historical mid-transition. A dedicated color trip is becoming reasonable, but this is not a peak-color claim."};
  if(d <= 7)return{level:"go",label:"GO",headline:"Strong historical color window",detail:place+" is inside its strongest historical transition window. Current observations and weather still determine how vivid the drive looks on the ground."};
  if(d <= 18)return{level:"soon",label:"GO SOON",headline:"Late side of the typical transition",detail:place+" is still the strongest sampled option, but it is "+Math.round(d)+" days past its historical midpoint. Wind and leaf drop matter more now, so do not delay solely for a better modeled date."};
  return{level:"late",label:"LATE",headline:"Do not confuse “best available” with peak",detail:place+" is the strongest remaining sampled option, but this anchor is "+Math.round(d)+" days past its historical midpoint. Favor lower elevations or treat the drive as a scenic trip rather than a foliage chase."};
 }
`;
  if (!blueRidge.includes(marker)) throw new Error("Blue Ridge render marker missing");
  blueRidge = blueRidge.replace(marker, helper + marker);
}

if (!blueRidge.includes("const verdict=tripVerdict(best);")) {
  const anchor = "  const current=contextFor(data,best);";
  const insertion = `${anchor}\n  const verdict=tripVerdict(best);\n  $(\"trip-verdict\").className=\"trip-verdict \"+verdict.level;\n  $(\"trip-verdict-label\").textContent=verdict.label;\n  $(\"trip-verdict-headline\").textContent=verdict.headline;`;
  if (!blueRidge.includes(anchor)) throw new Error("Blue Ridge render context anchor missing");
  blueRidge = blueRidge.replace(anchor, insertion);
}

blueRidge = replaceIfPresent(
  blueRidge,
  '  $("best-read").textContent=`${best.corridor}: ${best.timing?.stage||"timing available"}. This is the strongest modeled trip match among the sampled Parkway anchors today.`;',
  '  $("best-read").textContent=verdict.detail;',
);

blueRidge = replaceIfPresent(
  blueRidge,
  '  $("updated").textContent=`Model retrieved ${new Date(data.retrieved_at).toLocaleString()} · Local corridor date ${data.local_date}.`;',
  '  const roadStamp=data.decision?.road_status_updated?` · NPS road page dated ${data.decision.road_status_updated}`:" · NPS road date unavailable";\n  $("updated").textContent=`Model retrieved ${new Date(data.retrieved_at).toLocaleString()} · Local corridor date ${data.local_date}${roadStamp}.`;',
);

fs.writeFileSync(blueRidgePath, blueRidge);

let api = fs.readFileSync(apiPath, "utf8");
const apiLines = api.split("\n");
const roadDateLine = apiLines.findIndex((line) => line.includes("const updated = text.match") && line.includes("current as of"));
if (roadDateLine < 0) throw new Error("Blue Ridge NPS road-status date parser anchor missing");
apiLines[roadDateLine] = '  const updated = text.match(/(?:road status as of|updated|current as of).{0,110}?([A-Z][a-z]+\\s+\\d{1,2},\\s+20\\d{2})/i)?.[1] || null;';
api = apiLines.join("\n");
fs.writeFileSync(apiPath, api);

if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, "utf8");
  if (!sitemap.includes(canonical)) {
    sitemap = sitemap.replace("</urlset>", `  <url><loc>${canonical}</loc><changefreq>daily</changefreq></url>\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
  }
}

const built = fs.readFileSync(parentPath, "utf8");
const builtBlueRidge = fs.readFileSync(blueRidgePath, "utf8");
if (!built.includes("data-blue-ridge-feature") || !built.includes(route)) throw new Error("Blue Ridge parent handoff was not installed");
if (!builtBlueRidge.includes('id="trip-verdict"') || !builtBlueRidge.includes("function tripVerdict(best)")) throw new Error("Blue Ridge trip-verdict hardening was not installed");
if (!builtBlueRidge.includes(npsRoadUrl)) throw new Error("Blue Ridge official road-status action missing");
console.log("Wired Blue Ridge Parkway corridor surface, explicit API contract, trip verdict and road-status hardening.");
