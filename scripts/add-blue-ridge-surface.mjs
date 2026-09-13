import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const parentPath = path.join(root, "public/national-tools/fall-color/index.html");
const blueRidgePath = path.join(root, "public/national-tools/fall-color/blue-ridge-parkway/index.html");
const sitemapPath = path.join(root, "public/national-tools/fall-color/sitemap-locations.xml");
const route = "/national-tools/fall-color/blue-ridge-parkway/";
const canonical = `https://chrisizworski.com${route}`;
const apiEndpoint = "https://national-fall-color.vercel.app/api/blue-ridge-fall-color";

let html = fs.readFileSync(parentPath, "utf8");
html = html.replace(/<section[^>]*data-blue-ridge-feature[\s\S]*?<\/section>/i, "");
const feature = `<section class="section" data-blue-ridge-feature><div class="wrap"><div class="handoff"><div class="eyebrow">Regional decision engine</div><h2>Driving the Blue Ridge Parkway?</h2><p>The Parkway's elevation changes make one regional peak date misleading. The <a href="${route}">Blue Ridge Parkway Fall Color Live</a> corridor compares representative mileposts to show the best modeled fall-color bet now and the next seven days, with weather, drought, observations and NPS road context kept separate.</p></div></div></section>`;
if (!html.includes("</main>")) throw new Error("Fall-color parent main element not found");
html = html.replace("</main>", `${feature}</main>`);
fs.writeFileSync(parentPath, html);

let blueRidge = fs.readFileSync(blueRidgePath, "utf8");
blueRidge = blueRidge.replace(/fetch\((['"])\/api\/blue-ridge-fall-color\1\)/g, `fetch("${apiEndpoint}")`);
if (!blueRidge.includes(apiEndpoint)) throw new Error("Blue Ridge explicit API contract was not installed");
fs.writeFileSync(blueRidgePath, blueRidge);

if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, "utf8");
  if (!sitemap.includes(canonical)) {
    sitemap = sitemap.replace("</urlset>", `  <url><loc>${canonical}</loc><changefreq>daily</changefreq></url>\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
  }
}

const built = fs.readFileSync(parentPath, "utf8");
if (!built.includes("data-blue-ridge-feature") || !built.includes(route)) throw new Error("Blue Ridge parent handoff was not installed");
console.log("Wired Blue Ridge Parkway corridor surface into the national fall-color hub and explicit API contract.");
